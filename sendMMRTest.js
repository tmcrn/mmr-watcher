import { fetchProfile } from "trn-rocket-league";
import fetch from "node-fetch";

// ================= CONFIG =================
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1460587872485773415/sTKYEmZknUzLhjjipQxFpPyliByh_M6oM3h_-nfuLevMhWAmqHQFD0h5Q-AQLBJqojlG";
const PLAYER = "Snowthy";
const PLATFORM = "epic"; // epic | steam | psn | xbl

const MODES = {
    "1v1": "duel",
    "2v2": "double",
    "3v3": "standard"
};

// =========================================
async function sendDiscordMessage(message) {
    try {
        const res = await fetch(DISCORD_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: message })
        });
        const text = await res.text();
        console.log("Webhook envoyé – status:", res.status, "| response:", text);
    } catch (err) {
        console.error("Erreur lors de l'envoi du webhook :", err);
    }
}

async function sendMMRTest() {
    try {
        const profile = await fetchProfile(PLAYER, PLATFORM);

        const currentMMR = {
            "1v1": profile.stats.ranked.duel.mmr,
            "2v2": profile.stats.ranked.double.mmr,
            "3v3": profile.stats.ranked.standard.mmr
        };

        let message = `⚔️ **${PLAYER} – MMR actuel**\n`;
        for (const mode of Object.keys(currentMMR)) {
            message += `${mode}: **${currentMMR[mode]}**\n`;
        }

        await sendDiscordMessage(message);
        console.log("✅ Message envoyé :", message);

    } catch (err) {
        console.error("❌ Erreur :", err);
    }
}

sendMMRTest();
