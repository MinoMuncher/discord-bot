import Cache from "file-system-cache";
import { Players } from "../stats";

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

function parseReplays(players: string[], replays: string[]) {
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

let replays = new Set<string>()

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

async function parsePlayer(id: string) {
    const streamResponse = await fetch(`https://ch.tetr.io/api/streams/league_userrecent_${id}`, opts);
    const streamData: any = await streamResponse.json();

    const replayIds: string[] = streamData.data.records.map((record: any) => record.replayid);
    for(const id of replayIds){
        await Bun.sleep(1)
        const replay = await getReplay(id)
        if(replay!=undefined){
            replays.add(replay)
        }
    }

}

async function getTLPlayers(rating: number): Promise<any[]> {
    const response = await fetch(`https://ch.tetr.io/api/users/lists/league?before=${rating}&limit=100`, opts)
    const data: any = await response.json()
    return data.data.users
}

async function scrollTLPlayers(rating: number, max: number = 25000) {
    let totalResponse = []
    let response = await getTLPlayers(rating)
    response = response.filter(x => x.league.rating < max)
    while (response.length > 0) {
        rating = Math.max(...response.map(x => x.league.rating))
        totalResponse.push(...response)
        response = await getTLPlayers(rating)
    }
    return totalResponse
}

const players = await scrollTLPlayers(24701)
const playerIds: string[] = players.map((x: any) => x._id)
let sample = []
for (let i = 0; i < 100; i++) {
    const randomIndex = Math.floor(Math.random() * playerIds.length);
    sample.push(playerIds.splice(randomIndex, 1)[0]);
}
console.log("100 random player sample generated")

for(const id of sample){
    await parsePlayer(id)
    console.log("parsed " + id)
}
let stats = await parseReplays([], [...replays.values()])
console.log(stats)


