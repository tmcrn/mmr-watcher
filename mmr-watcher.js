import fetch from 'node-fetch';
import fs from 'fs';

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/..."; // ton webhook
const PLAYER_HANDLE = "Snowthy";
const PLATFORM = "epic"; // selon ton JSON
const MMR_PER_GAME = 9;
const TARGET_MMR = 2000;

const PLAYLISTS = {
    "1v1": 10,
    "2v2": 11,
    "3v3": 12
};

async function checkMMR() {
    try {
        const res = await fetch(`https://public-api.tracker.gg/v2/rocket-league/standard/profile/${PLATFORM}/${PLAYER_HANDLE}`, {
            headers: { "TRN-Api-Key": "public" }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const segments = data.data.segments || [];

        // Extraire MMR pour chaque playlist
        const mmrData = {};
        for (const [mode, id] of Object.entries(PLAYLISTS)) {
            const playlist = segments.find(s => s.attributes?.playlistId === id);
            if (playlist && playlist.stats.rating) {
                mmrData[mode] = playlist.stats.rating.value;
            }
        }

        if (Object.keys(mmrData).length === 0) {
            console.log("⚠️ Aucun MMR trouvé dans le JSON");
            return;
        }

        // Lire ancien MMR
        let lastMMR = {};
        if (fs.existsSync("state.json")) lastMMR = JSON.parse(fs.readFileSync("state.json", "utf8"));

        // Comparer et notifier Discord
        for (const [mode, mmr] of Object.entries(mmrData)) {
            const old = lastMMR[mode] || mmr;
            if (mmr !== old) {
                const diff = mmr - old;
                const result = diff > 0 ? "WIN 🟢" : "LOSS 🔴";
                const gamesLeft = Math.ceil((TARGET_MMR - mmr) / MMR_PER_GAME);

                await fetch(DISCORD_WEBHOOK, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: `⚔️ ${mode}: ${result}\nMMR: ${old} → ${mmr}\nEncore ~${gamesLeft} wins pour up`
                    })
                });
            }
        }

        fs.writeFileSync("state.json", JSON.stringify(mmrData, null, 2));
        console.log("✅ MMR mis à jour :", mmrData);

    } catch (err) {
        console.error("❌ Erreur :", err.message);
    }
}

checkMMR();
