example api

```ts
import {connector} from "library name"

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
```
