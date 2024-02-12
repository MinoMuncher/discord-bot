import { Client, GatewayIntentBits } from "discord.js";
import { getLeagueReplayIds, parseReplayData } from "./replay";
import { generateGraphs } from "./graphs/graph";
import { RateLimiter } from 'discord.js-rate-limiter';
import argParser from 'yargs-parser'
import { Players } from "./stats";
import { estimateRating } from "./estimate";


const helpText = await Bun.file("src/help.txt").text()

interface ParsedArguments {
  scale: boolean;
  normalize: boolean;
  order: string[];
  league: string[];
  games: number;
}

const defaults: ParsedArguments = {
  scale: false,
  normalize: false,
  order: [],
  league: [],
  games: 10,
};


function parseArgs(args: string) {
  const options = argParser(args, {
    configuration: {
      "greedy-arrays": true
    },
    alias: {
      s: 'scale',
      n: 'normalize',
      o: 'order',
      l: 'league',
      g: 'games',
    },
    number: ['games'],
    default: defaults,
    array: ['order', 'league'],
    boolean: ['scale', 'normalize'],
  });
  return options
}

let rateLimiter = new RateLimiter(1, 2000);

function filterString(input: string): string {
  const filteredString = input.replace(/[^a-zA-Z0-9-_]/g, '');
  return filteredString;
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
  let msg = message.content.substring(1)
  if (msg.startsWith(`ping`)) {
    message.reply(`pong! (${Date.now() - message.createdTimestamp}ms)`);
    return
  }
  if (msg.startsWith("help")) {
    message.reply(helpText)
    return
  }

  if (rateLimiter.take(message.author.id)) {
    await message.reply(`You are being rate limited, try again later`);
    return;
  }
  if (!msg.startsWith("munch")) { return }
  msg = msg.substring(5)
  const args = parseArgs(msg)
  let names = args._.map(a => String(a)).map(a => a.toLowerCase())
  let leagueNames : string[] = args.league.map((a: any)=>String(a)).map((a:string) => a.toLowerCase())

  const order = args.order.map((a: string | number) => String(a).toLowerCase()).map(filterString).filter((a: string) => a != "");
  const sent = await message.reply(`\n\ninitializing munching process for ${message.attachments.size} replay file${message.attachments.size == 1 ? "" : "s"}`)
  let deleted = false
  const cb = async (msg: string) => {
    if(!deleted){
      try{await sent.edit(msg)}catch(_){}
    }
  }

  names = names.map(filterString).filter(name => name != "")


  let replays : [string, string][] = []

  for (const attachment of message.attachments.values()) {
    if (attachment.size > 2.5e+7) {
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
      replays.push([url, text])

    } catch (_) {
      await cb("Error fetching files!")
      return
    }
  }
  if (message.attachments.size == 0) {
    leagueNames = leagueNames.concat(names)
  }

  let replayIds
  try{
    replayIds = await getLeagueReplayIds(leagueNames, args.games, cb)
  }catch(e){
    console.log("error fetching league data: ",e)
    await cb(`error fetching league data`)
    return
  }

  let stats: Players;
  let failed: string[]
  try {
    [stats, failed] = await parseReplayData(leagueNames.concat(names), replayIds, replays, cb)
  } catch (e) {
    console.log("ERROR PARSING REPLAY DATA: ",e)
    await cb(`error parsing replay data`)
    return
  }

  let graphs
  try {
    graphs = await generateGraphs(stats, args.normalize ? "stat" : "average", args.scale, order)
  } catch (e) {
    await cb(`error generating graphs!`)
    return
  }
  deleted = true
  await sent.delete()
  let files = graphs.map(buffer => { return { attachment: buffer, name: 'graph.webp' } })
  files.push({ attachment: Buffer.from(JSON.stringify(stats)), name: "rawStats.json" })
  message.reply({ files, content: generateMessageContent(stats, failed) })
});

function generateMessageContent(players: Players, failed: string[]) {
  let msg = ""
  if (failed.length == 0)msg+= "all replays were parsed\n"
  else `the following replays failed: ${failed.join('\n')}\n`

  for(const [username, stats] of Object.entries(players)){
    const [glicko, tr] = estimateRating(stats)
    msg+=`${username}'s estimated glicko: ${Math.round(glicko)}, tr: ${Math.round(tr)}\n`
  }
  return msg
}
