import { discordConnector } from "./mod.ts";

const token = await import("./token.json", {
    assert: { type: "json" },
});

const bot = discordConnector(token.default.token, 3276799, {
    onMessage: (message) => {
        if(message.content === "!ping") {
            bot.sendMessage(message.channel_id, "pong").then(response => { console.log(response) })
        }
    },
    onReady: async () => {
        const guilds = await bot.getGuilds()
        const guild = await bot.getGuild(guilds[0].id)
        console.log(guild)
    },
});
