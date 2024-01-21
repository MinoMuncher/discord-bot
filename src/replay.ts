
import { type Players } from './stats'
import net from 'net'
import Cache from "file-system-cache";

const replayDataCache = Cache({
  basePath: "./.replayDataCache",
  hash: "sha1",
  ttl: 60 * 60 * 24
});

const opts = {
  headers: {
    "Authorization": `Bearer ${Bun.env.TETRIO_TOKEN}`,
    "Accept": `application/json`
  }
}

export function parseReplayData(players: string[], replays: string[][], cb: (s: string)=>Promise<void>) {
  return new Promise<[Players, string[]]>((resolve, reject) => {

    let replayResponses : Promise<void>[]= []
    let currentBuffer = ""
    let failed : string[] = []

    const impatient = setTimeout(() => {
      console.log("action parser timed out!")
      return reject()
    }, 1000 * 5 * 60)


    let socket = new net.Socket();
    socket.connect(8081, '127.0.0.1', function () {
      const input = `${players.join(',')}\n${replays.length}\n${replays.map(replay=>replay[1]).join('\n')}\n`
      socket.write(input)
    });

    socket.on('data', function (data) {
      const dataString = data.toString()
      currentBuffer+=dataString
      if(currentBuffer.includes("\n")){
        const split = currentBuffer.split("\n")
        currentBuffer = split[1]
        if(replayResponses.length<replays.length){
          if(split[0].trim()!="success"){
            failed.push(replays[replayResponses.length][0])
          }
          replayResponses.push(cb(`${replays[replayResponses.length][0]}: ${split[0]}`))
        }else{
          let players : Players
          try{
            players = JSON.parse(split[0])
            clearTimeout(impatient)
            Promise.allSettled(replayResponses).finally(()=>{
              resolve([players, failed])
            })
          }catch(_){
            reject()
          }
        }

      }

      /*
      clearTimeout(impatient)
      resolve(dataString)
      socket.destroy(); // kill client after server's response*/
    });

    socket.on('close', function () {
      clearTimeout(impatient)
      reject()
    });

    socket.on('error', function (_){
      console.log('error');
      clearTimeout(impatient)
      reject()
    })
  })
}

export async function getPlayerStats(usernames: string[], games: number, cb: (msg: string) => Promise<void>) : Promise<[Players, string[]]>{
  let replayIds = new Set<string>()
  for (const username of usernames) {
    let userData: any
    try {
      const userResponse = await fetch(`https://ch.tetr.io/api/users/${username}`, opts);
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
      const streamResponse = await fetch(`https://ch.tetr.io/api/streams/league_userrecent_${userData.data.user._id}`, opts);
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
  if (replayIds.size == 0) {
    await cb(`no replays able to be fetched`)
    throw Error()
  }

  let replays = []

  for (const id of replayIds) {
    try {
      const replay = await getReplay(id)
      replays.push([id, replay])
    } catch (error: any) {
      await cb(`replay ${id} failed to download!`)
      throw Error()
    }
  }
  await cb(`downloaded ${replays.length} replays`)

  try {
    const [players, failed] = await parseReplayData(usernames, replays, cb)
    return [players, failed]
  } catch (_) {
    await cb(`error parsing replay data, bad connection with action-parser`)
    throw Error()
  }
}



async function getReplay(id: string): Promise<string> {
  const cachedReplay = await replayDataCache.get(id)
  if (cachedReplay === undefined) {
    const replayResponse = await fetch(`https://tetr.io/api/games/${id}`, opts)
    if (replayResponse.status == 200) {
      const data: any = await replayResponse.json()
      const replayString = JSON.stringify(data.game)
      replayDataCache.set(id, replayString)
      return replayString
    } else {
      throw new Error("fetch error")
    }
  } else {
    return cachedReplay
  }
}