import { Client, GatewayIntentBits } from "discord.js";
import { getPlayerStats, parseReplays } from "./replay";
import { generateGraphs } from "./graphs/graph";
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
    if(!message.content.startsWith(`${prefix}`)){
        return
    }
    const msg = message.content.substring(1)
    if (msg.startsWith(`ping`)) {
      message.reply("pong");
      return
    }
    if(msg.startsWith("help")){
        message.reply("!munch username1 username2 username3...")
        return
    }
    if(msg.startsWith("munch") && message.attachments.size > 0){

      const sent = await message.reply(`\n\ninitializing munching process for ${message.attachments.size} replay file${message.attachments.size==1 ? "" : "s"}`)
      let content = sent.content
      const cb = async (msg: string)=>{
        content = `${content}\n${msg}`
        await sent.edit(content)
      }

      let names = message.content.split(" ")
      names.shift()
      names = names.map(name=>name.trim().toLocaleLowerCase()).filter(name=>name!="")

      let replays = []

      for(const attachment of message.attachments.values()){
        const url = attachment.url
        try{
          const response = await fetch(url);
          if (!response.ok){
            await cb(`Error fetching file ${url}`)
            return
          }
          const text = await response.text();
          replays.push(text)

        }catch(_){
          await cb("Error fetching files!")
          return
        }
      }

      let stats
      try{
        stats = await parseReplays(names, replays)        
      }catch(_){
        await cb("Error parsing replays!")
        return
      }

      let graphs
      try{
          graphs = await generateGraphs(stats)
      }catch(e){
          await cb(`error generating graphs!`)
          return
      }
      await sent.delete()
      let files = graphs.map(buffer=>{return {attachment: buffer, name: 'graph.webp'}})
      files.push({attachment: Buffer.from(JSON.stringify(stats)), name: "rawStats.json"})
      message.reply({files})
      return
    }
    if(msg.startsWith(`munch`)){
        let names = message.content.split(" ")
        names.shift()
        names = names.map(name=>name.trim().toLocaleLowerCase()).filter(name=>name!="")
        if(names.length==0){
            message.reply("you must include names!")
            return
        }
        else{
            const sent = await message.reply(`initializing munching process for ${names.join(', ')}`)
            let content = sent.content
            const cb = async (msg: string)=>{
              content = `${content}\n${msg}`
              await sent.edit(content)
            }
            let stats = await getPlayerStats(names, cb)
            if(stats===undefined)return
            if(Object.values(stats).length==0){
              await cb(`empty stat output`)
              return
            }
            let graphs
            try{
                graphs = await generateGraphs(stats)
            }catch(e){
                await cb(`error generating graphs!`)
                return
            }
            await sent.delete()
            let files = graphs.map(buffer=>{return {attachment: buffer, name: 'graph.webp'}})
            files.push({attachment: Buffer.from(JSON.stringify(stats)), name: "rawStats.json"})
            message.reply({files})
            return
        }
    }
  });