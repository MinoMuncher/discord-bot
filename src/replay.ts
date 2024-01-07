
import { type Players } from './stats'
import Cache from "file-system-cache";

const replayCache = Cache({
  basePath: "./.replayCache",
  hash: "sha1",
  ttl: 60 * 60 * 24
});


const opts = {
  headers: {
    "Authorization": `Bearer ${Bun.env.TETRIO_TOKEN}`,
    "Accept": `application/json`
  }
}

export function parseReplays(players: string[], replays: string[]) {
  return new Promise<Players>((resolve, reject) => {
    Bun.connect({
      hostname: "127.0.0.1",
      port: 8081,
      socket: {
        data(_socket, data) {
          const raw = data.toString()
          const res = JSON.parse(raw)
          resolve(res)
        },
        open(socket) {
          const input = `${players.join(',')}\n${replays.length}\n${replays.join('\n')}\n`
          let buffer = Buffer.from(input, 'utf8')
          let offset = 0
          while (offset < buffer.byteLength) {
            offset += socket.write(buffer, offset)
          }
          socket.flush()
        },
        close(_) {
          reject()
        },
      },
    });
  })
}

export async function getPlayerStats(usernames: string[], cb: (msg: string) => Promise<void>) {
  let replayIds = new Set<string>()
  for(const username of usernames){
    let count = 0
    try {
      for(const id of await getTLReplayIds(username)){
        replayIds.add(id)
        count+=1
      }
    } catch (_) {
      await cb(`error fetching TL replays from ${username}`)
      return undefined
    }
    await cb(`fetched ${count} TL replays from ${username}`)
  }
  if(replayIds.size == 0){
    await cb(`no replays able to be fetched`)
    return undefined
  }

  let replays = []

  for (const id of replayIds) {
    try{
      const replay = await getReplay(id)
      if (replay != undefined) {
        replays.push(replay)
      }
    }catch(_){
      await cb(`replay ${id} failed to download!`)
    }
  }

  let stats
  try {
    stats = await parseReplays(usernames, replays)
  }catch(_){
    await cb(`error fetching parsing replays`)
    return undefined
  }
  await cb(`finished parsing replays`)
  return stats
}

async function getReplay(id: string): Promise<string | undefined> {
  const cachedReplay = await replayCache.get(id)
  if (cachedReplay === undefined) {
    const replayResponse = await fetch(`https://tetr.io/api/games/${id}`, opts)
    if (replayResponse.status == 200) {
      const data: any = await replayResponse.json()
      const dataString = JSON.stringify(data.game)
      replayCache.set(id, dataString)
      return dataString
    }
  } else {
    return cachedReplay
  }
  return undefined
}

async function getTLReplayIds(username: string) {
  const userResponse = await fetch(`https://ch.tetr.io/api/users/${username}`, opts);
  const userData: any = await userResponse.json();

  const streamResponse = await fetch(`https://ch.tetr.io/api/streams/league_userrecent_${userData.data.user._id}`, opts);
  const streamData: any = await streamResponse.json();

  const replayIds: string[] = streamData.data.records.map((record: any) => record.replayid);

  return replayIds
}