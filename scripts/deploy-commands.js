// scripts/deploy-commands.js
import 'dotenv/config';

const appId = process.env.DISCORD_APPLICATION_ID;
const token = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID; // מומלץ להתחלה

if (!appId || !token) throw new Error("Missing DISCORD_APPLICATION_ID or DISCORD_BOT_TOKEN");

const commands = [
    {
        name: "what-legend",
        description: "Calculate Tanki rank/legend from XP",
        options: [
            { name: "xp", description: "Your XP", type: 10, required: true } // NUMBER
        ]
    }
];

const url = guildId
    ? `https://discord.com/api/v10/applications/${appId}/guilds/${guildId}/commands`
    : `https://discord.com/api/v10/applications/${appId}/commands`;

const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bot ${token}` },
    body: JSON.stringify(commands),
});

const data = await res.json();
if (!res.ok) throw new Error(JSON.stringify(data, null, 2));
console.log("Deployed:", data.map(c => c.name));