import { APIMessage, GatewayReadyDispatchData, GatewayMessageDeleteDispatchData, APIGatewayBotInfo, GatewayGuildMemberAddDispatchData, APIGuild } from "./deps.ts"

export interface DiscordBotCallbacks {
    onMessage?: (message: APIMessage) => void;
    onReady?: (event: GatewayReadyDispatchData) => void;
    onMessageEdit?: (message: APIMessage) => void;
    onMessageDelete?: (message: GatewayMessageDeleteDispatchData) => void;
    onUserJoin?: (user: GatewayGuildMemberAddDispatchData) => void;
    onGatewayConnect?: () => void;
}

export function discordConnector(token: string, intents: number, callbacks?: DiscordBotCallbacks) {
    let lastNumber: number;
    fetch('https://discord.com/api/gateway/bot', { headers: { Authorization: `Bot ${token}` } })
        .then(res => res.json() as Promise<APIGatewayBotInfo>)
        .then(json => {
            if (json.session_start_limit.remaining === 0) {
                throw new Error("bitch how tf did you manage to do this");
            }
        })

    const websocket = new WebSocket("wss://gateway.discord.gg/?v=10&encoding=json");
    websocket.onopen = () => {
        if (callbacks?.onGatewayConnect) callbacks.onGatewayConnect();
    }
    websocket.onmessage = (message) => {
        const data = JSON.parse(message.data)
        lastNumber = data.s ?? lastNumber
        if (data.op === 10) {
            setTimeout(() => {
                websocket.send(JSON.stringify({ op: 1, d: 250 }))

                setInterval(() => {
                    websocket.send(JSON.stringify({ op: 1, d: lastNumber }))
                }, data.d.heartbeat_interval)
            }, data.d.heartbeat_interval * 0.1)
            websocket.send(JSON.stringify({ op: 2, d: { token, properties: { $os: "windows", $browser: "deno", $device: "deno" }, compress: false, large_threshold: 50, intents } }))
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
                    if (callbacks?.onMessage) callbacks.onMessage(data.d)
                    break;

                case "GUILD_CREATE":
                    
                    break;

                case "MESSAGE_UPDATE":
                    if (callbacks?.onMessageEdit) callbacks.onMessageEdit(data.d)
                    break;

                case "MESSAGE_DELETE":
                    
                    break;

                case "GUILD_MEMBER_ADD":
                    if (callbacks?.onUserJoin) callbacks.onUserJoin(data.d)
            }
        }
    }

    return {
        sendMessage: (channelId: string, content: string) => {
            return new Promise<APIMessage>((resolve, reject) => {
                fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, { headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' }, method: "POST", body: JSON.stringify({ "content":content }) })
                    .then(res => res.json())
                    .then(json => {
                        resolve(json)
                    })
                    .catch(err => {
                        reject(err)
                    })
            })
        },
        createGuild: (name: string) => {
            return new Promise<APIGuild>((resolve, reject) => {
                fetch('https://discord.com/api/v10/guilds', { headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' }, method: "POST", body: JSON.stringify({ "name": name }) })
                    .then(res => res.json())
                    .then(json => {
                        resolve(json)
                    })
                    .catch(err => {
                        reject(err)
                    }
                )
            })
        },
        getGuild: (guildId: string) => {
            return new Promise<APIGuild>((resolve, reject) => {
                fetch(`https://discord.com/api/v10/guilds/${guildId}`, { headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' }, method: "GET" })
                    .then(res => res.json())
                    .then(json => {
                        resolve(json)
                    })
                    .catch(err => {
                        reject(err)
                    }
                )
            })
        },
        getGuilds: () => {
            return new Promise<APIGuild[]>((resolve, reject) => {
                fetch(`https://discord.com/api/v10/users/@me/guilds`, { headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' }, method: "GET" })
                    .then(res => res.json())
                    .then(json => {
                        resolve(json)
                    })
                    .catch(err => {
                        reject(err)
                    }
                )
            })
        }
    }
}