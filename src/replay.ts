
import { type Players } from './stats'
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

export async function getReplayData(replay: string) {
  const response = await fetch("http://127.0.0.1:8080", {
    method: "POST",
    body: replay
  })
  return JSON.stringify(await response.json())
}

export function parseReplayData(players: string[], replays: string[]) {
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
  for (const username of usernames) {
    let userData: any
    try {
      const userResponse = await fetch(`https://ch.tetr.io/api/users/${username}`, opts);
      userData = await userResponse.json()
    } catch (_) {
      await cb(`error fetching user profile of ${username}`)
      return undefined
    }
    if (!userData.success) {
      await cb(`user ${username} does not exist`)
      return undefined
    }

    let ids: string[]
    try {
      const streamResponse = await fetch(`https://ch.tetr.io/api/streams/league_userrecent_${userData.data.user._id}`, opts);
      const streamData: any = await streamResponse.json();

      ids = streamData.data.records.map((record: any) => record.replayid);
    } catch (_) {
      await cb(`error fetching TL replay ids of ${username}`)
      return undefined
    }

    for (const id of ids) {
      replayIds.add(id)
    }

    await cb(`fetched ${ids.length} TL replays from ${username}`)
  }
  if (replayIds.size == 0) {
    await cb(`no replays able to be fetched`)
    return undefined
  }

  let replays = []

  for (const id of replayIds) {
    try {
      const replay = await getReplay(id)
      replays.push(replay)
    } catch (error : any) {
      if (error?.message === "csdotnet") {
        await cb(`replay ${id} failed to be parsed, the parser may be out of date, please report`)
      }else{
        await cb(`replay ${id} failed to download!`)
      }
      return
    }
  }

  let stats
  try {
    stats = await parseReplayData(usernames, replays)
  } catch (_) {
    await cb(`error parsing replay data`)
    return undefined
  }
  await cb(`finished parsing replay data`)
  return stats
}



async function getReplay(id: string): Promise<string> {
  const cachedReplay = await replayDataCache.get(id)
  if (cachedReplay === undefined) {
    const replayResponse = await fetch(`https://tetr.io/api/games/${id}`, opts)
    if (replayResponse.status == 200) {
      const data: any = await replayResponse.json()
      try {
        const replayData = await getReplayData(JSON.stringify(data.game))
        replayDataCache.set(id, replayData)
        return replayData
      }
      catch (_) {
        throw new Error("csdotnet")
      }
    } else {
      throw new Error("fetch error")
    }
  } else {
    return cachedReplay
  }
}