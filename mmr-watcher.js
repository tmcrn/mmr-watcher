import fetch from "node-fetch";
import fs from "fs";

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;
const TRACKER_API_KEY = process.env.TRACKER_API_KEY;
const PLAYER = "Snowthy";
const PLATFORM = "epic";

async function fetchProfile(player, platform) {
    const res = await fetch(`https://public-api.tracker.gg/v2/rocket-league/standard/profile/${platform}/${player}`, {
        headers: { "TRN-Api-Key": TRACKER_API_KEY, "Accept": "application/json" }
    });

    if (!res.ok) throw new Error(`Tracker API error (${res.status})`);
    const data = await res.json();
    return data.data;
}

async function sendDiscordMessage(message) {
    await fetch(DISCORD_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message })
    });
}

async function checkMMR() {
    const profile = await fetchProfile(PLAYER, PLATFORM);
    const mmr = {
        "1v1": profile.segments.find(s => s.type === "ranked").stats.duel.mmr.value,
        "2v2": profile.segments.find(s => s.type === "ranked").stats.double.mmr.value,
        "3v3": profile.segments.find(s => s.type === "ranked").stats.standard.mmr.value
    };

    await sendDiscordMessage(`⚔️ MMR actuel : ${JSON.stringify(mmr, null, 2)}`);
}

checkMMR();
