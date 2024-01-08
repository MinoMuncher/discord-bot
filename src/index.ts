import { Client, GatewayIntentBits } from "discord.js";
import { getPlayerStats, parseReplayData, getReplayData } from "./replay";
import { generateGraphs } from "./graphs/graph";
import { RateLimiter } from 'discord.js-rate-limiter';
let rateLimiter = new RateLimiter(1, 2000);

function filterString(input: string): string {
  const filteredString = input.replace(/[^a-zA-Z0-9-_]/g, '');
  return filteredString;
}

try{
  const auth = await fetch("https://tetr.io/api/users/authenticate", {
    headers: { "Content-Type": "application/json", "Accept": `application/json` },
    method: "POST",
    body: Buffer.from(JSON.stringify({ "username": Bun.env.TETRIO_USERNAME, "password": Bun.env.TETRIO_PASSWORD }))
  })
  const json : any = await auth.json()

  if(json.token != undefined){
    Bun.env.TETRIO_TOKEN = json.token
  }
}catch(_){
  console.log("TETRIO AUTH FAILED")
  process.exit()
}

const prefix = "!"

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.login(Bun.env.DISCORD_TOKEN);
client.once("ready", () => {
  console.log(`Logged in as ${client.user!.tag}`);
});
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(`${prefix}`)) {
    return
  }
  const msg = message.content.substring(1)
  if (msg.startsWith(`ping`)) {
    message.reply("pong");
    return
  }
  if (msg.startsWith("help")) {
    message.reply("!munch username1 username2 username3...")
    return
  }

  if (rateLimiter.take(message.author.id)) {
      await message.reply(`You are being rate limited, try again later`);
      return;
  }

  if (msg.startsWith("munch") && message.attachments.size > 0) {

    const sent = await message.reply(`\n\ninitializing munching process for ${message.attachments.size} replay file${message.attachments.size == 1 ? "" : "s"}`)
    let content = sent.content
    const cb = async (msg: string) => {
      content = `${content}\n${msg}`
      await sent.edit(content)
    }

    let names = message.content.split(" ")
    names.shift()
    names = names.map(filterString).map(name => name.trim().toLocaleLowerCase()).filter(name => name != "")

    let replays = []

    for (const attachment of message.attachments.values()) {
      if(attachment.size > 2.5e+7){
        await cb("file too big!")
        return
      }
      const url = attachment.url
      try {
        const response = await fetch(url);
        if (!response.ok) {
          await cb(`Error fetching file ${url}`)
          return
        }
        const text = await response.text();
        const replayData = await getReplayData(text)
        replays.push(replayData)

      } catch (error: any) {
        if (error?.message === "csdotnet") {
          await cb(`replay <${url}> failed to be parsed, either the replay is too old or the parser may be out of date`)
        } else {
          await cb("Error fetching files!")
        }
        return
      }
    }

    let stats
    try {
      stats = await parseReplayData(names, replays)
    } catch (_) {
      await cb("Error parsing replays!")
      return
    }

    let graphs
    try {
      graphs = await generateGraphs(stats)
    } catch (e) {
      await cb(`error generating graphs!`)
      return
    }
    await sent.delete()
    let files = graphs.map(buffer => { return { attachment: buffer, name: 'graph.webp' } })
    files.push({ attachment: Buffer.from(JSON.stringify(stats)), name: "rawStats.json" })
    message.reply({ files })
    return
  }
  if (msg.startsWith(`munch`)) {
    let names = message.content.split(" ").map(name => name.trim().toLocaleLowerCase())
    names.shift()
    const pLen = names.length
    names = names.map(filterString).filter(name => name != "")
    if(names.length>10){
      message.reply("the maximum amount of names to search TL is 10")
      return
    }
    if (names.length == 0) {
      if(pLen>0){
        message.reply("the names you included were all invalid!")
      }
      else{
        message.reply("you must include names!")
      }

      return
    }
    else {
      const sent = await message.reply(`initializing munching process for ${names.join(', ')}`)
      let content = sent.content
      const cb = async (msg: string) => {
        content = `${content}\n${msg}`
        await sent.edit(content)
      }
      let stats = await getPlayerStats(names, cb)
      if (stats === undefined) return
      if (Object.values(stats).length == 0) {
        await cb(`empty stat output`)
        return
      }
      let graphs
      try {
        graphs = await generateGraphs(stats)
      } catch (e) {
        await cb(`error generating graphs!`)
        return
      }
      await sent.delete()
      let files = graphs.map(buffer => { return { attachment: buffer, name: 'graph.webp' } })
      files.push({ attachment: Buffer.from(JSON.stringify(stats)), name: "rawStats.json" })
      message.reply({ files })
      return
    }
  }
});