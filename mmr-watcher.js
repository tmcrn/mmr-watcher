import { fetchProfile } from "trn-rocket-league";
import fetch from "node-fetch";

// ================= CONFIG =================
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;
const PLAYER = "Snowthy";
const PLATFORM = "epic"; // epic | steam | psn | xbl
const TARGET_MMR = 1315;
const MMR_PER_WIN = 9;

if (!DISCORD_WEBHOOK) {
    throw new Error("❌ DISCORD_WEBHOOK non défini");
}

// =========================================
async function sendDiscordMessage(message) {
    const res = await fetch(DISCORD_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message })
    });

    console.log("📨 Webhook status:", res.status);
}

async function checkMMR() {
    console.log("⚔️ Sir FlipReset part en reconnaissance...");

    const profile = await fetchProfile(PLAYER, PLATFORM);

    const mmr = {
        "1v1": profile.stats.ranked.duel.mmr,
        "2v2": profile.stats.ranked.double.mmr,
        "3v3": profile.stats.ranked.standard.mmr
    };

    const message =
        `⚔️ **Sir FlipReset – Rapport de bataille**
👤 **${PLAYER}**

🥊 1v1 : **${mmr["1v1"]}**
🤝 2v2 : **${mmr["2v2"]}**
🏹 3v3 : **${mmr["3v3"]}**

🎯 Objectif : ${TARGET_MMR} MMR
🧮 ~${Math.max(0, Math.ceil((TARGET_MMR - mmr["2v2"]) / MMR_PER_WIN))} wins restantes`;

    await sendDiscordMessage(message);

    console.log("✅ Rapport envoyé avec succès");
}

checkMMR().catch(err => {
    console.error("❌ Erreur fatale :", err);
    process.exit(1);
});
