import { fetchProfile } from "trn-rocket-league";
import fs from "fs";
import fetch from "node-fetch";

// ================= CONFIG =================
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1460587872485773415/sTKYEmZknUzLhjjipQxFpPyliByh_M6oM3h_-nfuLevMhWAmqHQFD0h5Q-AQLBJqojlG";
const PLAYER = "Snowthy";
const PLATFORM = "epic"; // epic | steam | psn | xbl
const TARGET_MMR = 1315;
const MMR_PER_WIN = 9;

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

async function checkMMR() {
    try {
        const profile = await fetchProfile(PLAYER, PLATFORM);

        const currentMMR = {
            "1v1": profile.stats.ranked.duel.mmr,
            "2v2": profile.stats.ranked.double.mmr,
            "3v3": profile.stats.ranked.standard.mmr
        };

        let lastMMR = {};
        if (fs.existsSync("state.json")) {
            lastMMR = JSON.parse(fs.readFileSync("state.json", "utf8"));
        }

        for (const mode of Object.keys(currentMMR)) {
            const oldMMR = lastMMR[mode];
            const newMMR = currentMMR[mode];

            if (oldMMR !== undefined && oldMMR !== newMMR) {
                const diff = newMMR - oldMMR;
                const result = diff > 0 ? "🟢 WIN" : "🔴 LOSS";
                const gamesLeft = Math.max(
                    0,
                    Math.ceil((TARGET_MMR - newMMR) / MMR_PER_WIN)
                );

                const message =
                    `⚔️ **${PLAYER} – ${mode}**
${result}
MMR : **${oldMMR} → ${newMMR}** (${diff > 0 ? "+" : ""}${diff})
🎯 ~${gamesLeft} wins pour atteindre ${TARGET_MMR}`;

                await sendDiscordMessage(message);
            }
        }

        fs.writeFileSync("state.json", JSON.stringify(currentMMR, null, 2));
        console.log("✅ MMR mis à jour :", currentMMR);

    } catch (err) {
        console.error("❌ Erreur :", err);
    }
}

checkMMR();
