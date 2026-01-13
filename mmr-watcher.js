import fs from "fs";
import fetch from "node-fetch";

/* ================= CONFIG ================= */
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;
if (!DISCORD_WEBHOOK) {
    throw new Error("❌ DISCORD_WEBHOOK non défini");
}

const PLAYER = "Snowthy";
const PLATFORM = "epic"; // epic | steam | psn | xbl
const TARGET_MMR = 1315;
const MMR_PER_WIN = 9;

const TRACKER_URL = `https://api.tracker.gg/api/v2/rocket-league/standard/profile/${PLATFORM}/${PLAYER}`;
/* ========================================== */

console.log("⚔️ Sir FlipReset part en reconnaissance...");

/* ---------- DISCORD ---------- */
async function sendDiscordMessage(message) {
    const res = await fetch(DISCORD_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message })
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Webhook Discord failed (${res.status}) : ${text}`);
    }
}

/* ---------- TRACKER ---------- */
async function fetchMMR() {
    const res = await fetch(TRACKER_URL, {
        headers: {
            "User-Agent": "SirFlipReset/1.0",
            "Accept": "application/json"
        }
    });

    if (!res.ok) {
        throw new Error(`Tracker API error (${res.status})`);
    }

    const json = await res.json();
    const segments = json.data.segments;

    const getMMR = (name) =>
        segments.find(s => s.metadata?.name === name)?.stats?.rating?.value;

    return {
        "1v1": getMMR("Ranked Duel 1v1"),
        "2v2": getMMR("Ranked Doubles 2v2"),
        "3v3": getMMR("Ranked Standard 3v3")
    };
}

/* ---------- MAIN ---------- */
async function checkMMR() {
    const currentMMR = await fetchMMR();

    let lastMMR = {};
    if (fs.existsSync("state.json")) {
        lastMMR = JSON.parse(fs.readFileSync("state.json", "utf8"));
    }

    for (const mode of Object.keys(currentMMR)) {
        const oldMMR = lastMMR[mode];
        const newMMR = currentMMR[mode];

        if (newMMR == null) continue;

        if (oldMMR !== undefined && oldMMR !== newMMR) {
            const diff = newMMR - oldMMR;
            const result = diff > 0 ? "🟢 VICTOIRE" : "🔴 DÉFAITE";

            const gamesLeft = Math.max(
                0,
                Math.ceil((TARGET_MMR - newMMR) / MMR_PER_WIN)
            );

            const message = `
⚔️ **Sir FlipReset – ${mode}**
${result}
MMR : **${oldMMR} → ${newMMR}** (${diff > 0 ? "+" : ""}${diff})
🎯 ~${gamesLeft} wins pour atteindre ${TARGET_MMR}
`.trim();

            await sendDiscordMessage(message);
        }
    }

    fs.writeFileSync("state.json", JSON.stringify(currentMMR, null, 2));
    console.log("✅ Rapport envoyé. MMR actuel :", currentMMR);
}

/* ---------- EXEC ---------- */
checkMMR().catch(err => {
    console.error("❌ Mission échouée :", err.message);
    process.exit(1);
});
