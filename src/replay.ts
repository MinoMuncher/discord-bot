
import { type Players } from './stats'
import { SyncSocket } from './util/tcp'
import { MD5 } from 'bun'

export async function parseReplayData(players: string[], replayIDs: string[], replayStrings: [string, string][], cb: (s: string)=>Promise<void>) : Promise<[Players, string[]]>{
  const socket = await SyncSocket.CreateAsync({port: 8081})
  socket.writeLine(players.join(','))
  let replayResponses = []
  let failed = []

  socket.writeLine(String(replayIDs.length))

  for(let i = 0; i < replayIDs.length; i++){
    socket.writeLine(replayIDs[i])
    const response = await socket.readLine()
    if(response!="success")failed.push(replayIDs[i])
    replayResponses.push(cb(`${replayIDs[i]}: ${response}`))
  }

  socket.writeLine(String(replayStrings.length))

  for(let i = 0; i < replayStrings.length; i++){
    const replay = replayStrings[i][1]
    const hasher = new MD5()
    hasher.update(replay)
    const hash = hasher.digest("hex")
    socket.writeLine(hash)
    const cached = await socket.readLine()
    if(cached=="false"){
      socket.writeLine(replay)
      const response = await socket.readLine()
      if(response!="success")failed.push(replayStrings[i][0])
      replayResponses.push(cb(`${replayStrings[i][0]}: ${response}`))
    }else{
      replayResponses.push(cb(`${replayStrings[i][0]}: success`))
    }
  }
  const stats : Players = JSON.parse(await socket.readLine())
  
  return [stats, failed]
}


export async function getLeagueReplayIds(usernames: string[], games: number, cb: (msg: string) => Promise<void>) : Promise<string[]>{
  let replayIds = new Set<string>()
  for (const username of usernames) {
    let userData: any
    try {
      const userResponse = await fetch(`https://ch.tetr.io/api/users/${username}`);
      userData = await userResponse.json()
    } catch (_) {
      await cb(`error fetching user profile of \`${username}\``)
      throw Error()
    }
    if (!userData.success) {
      await cb(`user \`${username}\` does not exist`)
      throw Error()
    }

    let ids: string[]
    try {
      const streamResponse = await fetch(`https://ch.tetr.io/api/streams/league_userrecent_${userData.data.user._id}`);
      const streamData: any = await streamResponse.json();

      ids = streamData.data.records.map((record: any) => record.replayid);
    } catch (_) {
      await cb(`error fetching TL replay ids of \`${username}\``)
      throw Error()
    }

    let added = 0;

    for (let i = 0; i < Math.min(ids.length, games); i++) {
      added += 1;
      replayIds.add(ids[i])
    }

    await cb(`fetched ${added} TL replays from \`${username}\``)
  }
  if (replayIds.size == 0 && usernames.length>0) {
    await cb(`no replays able to be fetched`)
    throw Error()
  }
  return [...replayIds.values()]
}
