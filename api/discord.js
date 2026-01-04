// api/discord.js
import express from "express";
import { verifyKey } from "discord-interactions";

const app = express();

// חובה: Discord צריך את ה-raw body כדי לאמת חתימה
app.use(express.raw({ type: "*/*" }));

function mustGet(name) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env var: ${name}`);
    return v;
}

function verifyDiscord(req) {
    const signature = req.header("x-signature-ed25519");
    const timestamp = req.header("x-signature-timestamp");
    const publicKey = mustGet("DISCORD_PUBLIC_KEY");
    return verifyKey(req.body, signature, timestamp, publicKey);
}

const RANKS = [
    { name: "Recruit", xp: 0 },
    { name: "Private", xp: 100 },
    { name: "Gefreiter", xp: 500 },
    { name: "Corporal", xp: 1_500 },
    { name: "Master Corporal", xp: 3_700 },
    { name: "Sergeant", xp: 7_100 },
    { name: "Staff Sergeant", xp: 12_300 },
    { name: "Master Sergeant", xp: 20_000 },
    { name: "First Sergeant", xp: 29_000 },
    { name: "Sergeant-Major", xp: 41_000 },
    { name: "Warrant Officer 1", xp: 57_000 },
    { name: "Warrant Officer 2", xp: 76_000 },
    { name: "Warrant Officer 3", xp: 98_000 },
    { name: "Warrant Officer 4", xp: 125_000 },
    { name: "Warrant Officer 5", xp: 156_000 },
    { name: "Third Lieutenant", xp: 192_000 },
    { name: "Second Lieutenant", xp: 233_000 },
    { name: "First Lieutenant", xp: 280_000 },
    { name: "Captain", xp: 332_000 },
    { name: "Major", xp: 390_000 },
    { name: "Lieutenant Colonel", xp: 455_000 },
    { name: "Colonel", xp: 527_000 },
    { name: "Brigadier", xp: 606_000 },
    { name: "Major General", xp: 692_000 },
    { name: "Lieutenant General", xp: 787_000 },
    { name: "General", xp: 889_000 },
    { name: "Marshal", xp: 1_000_000 },
    { name: "Field Marshal", xp: 1_122_000 },
    { name: "Commander", xp: 1_255_000 },
    { name: "Generalissimo", xp: 1_400_000 },
    { name: "Legend", xp: 1_600_000 },
];

function rankFromXp(xp) {
    if (!Number.isFinite(xp) || xp < 0) return null;
    
    // Legend ranks (>= 1,600,000)
    if (xp >= 1_600_000) {
        const base = 1_600_000;
        const step = 200_000;
        const legendNum = Math.floor((xp - base) / step) + 1;
        return `Legend ${legendNum}`;
    }
    
    // Regular ranks (< 1,600,000)
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (xp >= RANKS[i].xp) {
            return RANKS[i].name;
        }
    }
    
    return null;
}

app.post("/", (req, res) => {
    if (!verifyDiscord(req)) return res.status(401).send("Bad signature");

    const interaction = JSON.parse(req.body.toString("utf8"));

    // PING
    if (interaction.type === 1) return res.json({ type: 1 });

    // Slash command
    if (interaction.type === 2 && interaction.data?.name === "what-legend") {
        const xp = interaction.data.options?.find(o => o.name === "xp")?.value;
        const rank = rankFromXp(Number(xp));

        const content = rank || "Invalid XP value";

        return res.json({ type: 4, data: { content } });
    }

    return res.json({ type: 4, data: { content: "Unsupported interaction" } });
});

app.get("/", (req, res) => res.status(200).send("Discord Bot is running properly!"));

// חשוב: export default handler ל-Vercel
// Vercel מצפה ל-handler function, לא ל-Express app ישירות
export default (req, res) => {
    return app(req, res);
};