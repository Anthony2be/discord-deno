const token = await import("./token.json", {
    assert: { type: "json" },
});

import { APIMessage, GatewayReadyDispatchData, GatewayMessageDeleteDispatchData } from "./deps.ts"

export interface DiscordBotCallbacks {
    onMessage?: (message: APIMessage) => void;
    onReady?: (event: GatewayReadyDispatchData) => void;
    onMessageEdit?: (message: APIMessage) => void;
    onMessageDelete?: (message: GatewayMessageDeleteDispatchData) => void;
    onUserJoin?: (user: User) => void;
}

export function discordConnector(token: string, callbacks?: DiscordBotCallbacks) {
    let lastNumber: number;
    fetch('https://discord.com/api/gateway/bot', { headers: { Authorization: `Bot ${token}` } })
        .then(res => res.json())
        .then(json => {
            console.log(json)
        })

    const websocket = new WebSocket("wss://gateway.discord.gg/?v=10&encoding=json");
    websocket.onopen = () => {
        console.log("Connected to Discord")
    }
    websocket.onmessage = (message) => {
        const data = JSON.parse(message.data)
        lastNumber = data.s ?? lastNumber
        console.log(lastNumber)
        console.log(data)
        if (data.op === 10) {
            setTimeout(() => {
                websocket.send(JSON.stringify({ op: 1, d: 250 }))

                setInterval(() => {
                    websocket.send(JSON.stringify({ op: 1, d: lastNumber }))
                }, data.d.heartbeat_interval)
            }, data.d.heartbeat_interval * 0.1)
            websocket.send(JSON.stringify({ op: 2, d: { token, properties: { $os: "windows", $browser: "deno", $device: "deno" }, compress: false, large_threshold: 50, intents: 3276799 } }))
        }
        if (data.op === 1) {
            websocket.send(JSON.stringify({ op: 1, d: lastNumber }))
        }
        if (data.op === 0) {
            switch (data.t) {
                case "READY":
                    if (callbacks?.onReady) callbacks.onReady(data.d)
                    break;

                case "MESSAGE_CREATE":
                    if(data.d.type === 7) {
                        if (callbacks?.onUserJoin) callbacks.onUserJoin(data.d)
                    }
                    if (callbacks?.onMessage) callbacks.onMessage(data.d)
                    break;

                case "GUILD_CREATE":
                    console.log(data.d.id)
                    break;

                case "MESSAGE_UPDATE":
                    if (callbacks?.onMessageEdit) callbacks.onMessageEdit(data.d)
                    break;

                case "MESSAGE_DELETE":
                    console.log(data.d.id)
                    break;
            }
        }
    }

    return {
        sendMessage: (channelId: string, content: string) => {
            fetch('https://discord.com/api/gateway/bot', { headers: { Authorization: `Bot ${token}` } })
        },
        createGuild: (name: string) => {
            fetch('https://discord.com/api/v10/guilds', { headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' }, method: "POST", body: JSON.stringify({ "name": name }) })
            .then(response => {
                //handle response            
                console.log(response);
              })
              .then(data => { 
                //handle data
                console.log(data);
              })
              .catch(error => {
                console.log(error);
              });
        }
    }
}

const bot = discordConnector(token.default.token, {
    onMessage: (message) => {
        console.log(message)
    },
    onReady: (event) => {
        console.log(event.user.username)
    }
});

/*
example api

import {connector} from "./connector.ts"

const bot = connector("token", {
    intents: 3276799,
    onMessage: (message) => {
        console.log(message.content)
    }
    onReady: () => {
        console.log("Ready")
    }
})

bot.sendMessage("channel id", "message")

bot.sendWebhookMessage(avatar, username, content)

bot.getGuilds()

bot.getGuildChannels(guild id)

bot.getGuildMembers(guild id)

bot.getGuildMember(guild id, user id)

bot.getGuildMemberRoles(guild id, user id)

*/