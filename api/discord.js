// api/discord.js
import { verifyKey } from "discord-interactions";

function mustGet(name) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env var: ${name}`);
    return v;
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

// קריאת raw body ב-Vercel
async function getRawBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

export default async function handler(req, res) {
    // GET request
    if (req.method === "GET") {
        return res.status(200).send("Discord Bot is running properly!");
    }

    // POST request (Discord interactions)
    if (req.method === "POST") {
        try {
            // קריאת ה-raw body ישירות מה-stream
            // זה חשוב כי Discord צריך את ה-raw body לאימות החתימה
            const rawBody = await getRawBody(req);

            // אימות חתימה - חשוב: צריך להשתמש ב-raw body המקורי
            const signature = req.headers["x-signature-ed25519"];
            const timestamp = req.headers["x-signature-timestamp"];
            const publicKey = mustGet("DISCORD_PUBLIC_KEY");

            if (!signature || !timestamp) {
                return res.status(401).send("Missing signature headers");
            }

            const isValid = await verifyKey(rawBody, signature, timestamp, publicKey);

            if (!isValid) {
                return res.status(401).send("Bad signature");
            }

            // Parse interaction
            const interaction = JSON.parse(rawBody.toString('utf8'));

            // PING - Discord בודק את זה לאימות ה-endpoint
            if (interaction.type === 1) {
                return res.status(200).json({ type: 1 });
            }

            // Slash command
            if (interaction.type === 2 && interaction.data?.name === "what-legend") {
                const xp = interaction.data.options?.find(o => o.name === "xp")?.value;
                const rank = rankFromXp(Number(xp));
                const content = rank || "Invalid XP value";
                return res.status(200).json({ type: 4, data: { content } });
            }

            return res.status(200).json({ type: 4, data: { content: "Unsupported interaction" } });
        } catch (error) {
            console.error("Error handling Discord interaction:", error);
            return res.status(500).send("Internal server error");
        }
    }

    return res.status(405).send("Method not allowed");
};