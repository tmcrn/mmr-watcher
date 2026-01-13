#!/usr/bin/env node
// ⚔️ MMR Watcher - Scrape JSON depuis le script tag (méthode Stack Overflow)

import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import fs from 'fs';

// ═══════════════════════════════════════════════════════════════
// ⚙️ CONFIG
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
    player: {
        username: "Snowthy",
        platform: "epic"
    },
    discord: {
        webhookUrl: process.env.DISCORD_WEBHOOK || "https://discord.com/api/webhooks/1460587872485773415/sTKYEmZknUzLhjjipQxFpPyliByh_M6oM3h_-nfuLevMhWAmqHQFD0h5Q-AQLBJqojlG"
    },
    target: {
        "2v2": 1315
    },
    mmrPerWin: 9
};

const STATE_FILE = './state.json';

// ═══════════════════════════════════════════════════════════════
// 🌐 SCRAPER (méthode Stack Overflow)
// ═══════════════════════════════════════════════════════════════

async function scrapeMMRFromPage() {
    console.log('🌐 Lancement navigateur...');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    const url = `https://tracker.gg/rocket-league/profile/${CONFIG.player.platform}/${CONFIG.player.username}/overview`;
    
    console.log(`📍 Chargement: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    // EXTRAIRE le JSON depuis le premier <script> tag (méthode Stack Overflow)
    const jsonData = await page.evaluate(() => {
        const script = document.querySelector('script[id="__NEXT_DATA__"]');
        if (script) {
            return JSON.parse(script.innerHTML);
        }
        return null;
    });
    
    await browser.close();
    
    if (!jsonData) {
        throw new Error('❌ JSON __NEXT_DATA__ introuvable');
    }
    
    console.log('✅ JSON extrait !');
    
    // Parser selon la structure tracker.gg
    const profileData = jsonData.props.pageProps.profile;
    const segments = profileData.data.segments;
    
    // Trouver le segment 2v2 (playlistId: 11)
    const segment2v2 = segments.find(s => 
        s.type === 'playlist' && 
        s.attributes?.playlistId === 11
    );
    
    if (!segment2v2) {
        throw new Error('❌ Segment 2v2 introuvable');
    }
    
    return {
        mmr: segment2v2.stats.rating.value,
        tier: segment2v2.stats.tier.metadata.name,
        division: segment2v2.stats.division.metadata.name,
        winStreak: segment2v2.stats.winStreak?.value || 0,
        streakType: segment2v2.stats.winStreak?.metadata?.type || 'neutral'
    };
}

// ═══════════════════════════════════════════════════════════════
// 🔔 DISCORD
// ═══════════════════════════════════════════════════════════════

async function sendDiscordNotification(oldMMR, newMMR, data) {
    const diff = newMMR - oldMMR;
    const isWin = diff > 0;
    const emoji = isWin ? "🟢" : "🔴";
    const result = isWin ? "VICTOIRE" : "DÉFAITE";
    
    const targetMMR = CONFIG.target["2v2"];
    const gamesLeft = Math.ceil((targetMMR - newMMR) / CONFIG.mmrPerWin);
    
    let streakText = "";
    if (data.winStreak !== 0) {
        const streakEmoji = data.streakType === "win" ? "🔥" : "❄️";
        streakText = `\n**Série:** ${streakEmoji} ${Math.abs(data.winStreak)} ${data.streakType === "win" ? "victoires" : "défaites"}`;
    }
    
    const message = `⚔️ **${CONFIG.player.username} – 2v2**
${emoji} **${result}**

MMR: **${oldMMR} → ${newMMR}** (${diff > 0 ? '+' : ''}${diff})
🎯 Rang: ${data.tier} ${data.division}${streakText}
🏁 ~${gamesLeft} wins pour ${targetMMR} MMR`;
    
    await fetch(CONFIG.discord.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message })
    });
    
    console.log(`✅ Discord notifié`);
}

// ═══════════════════════════════════════════════════════════════
// 🎯 LOGIQUE PRINCIPALE
// ═══════════════════════════════════════════════════════════════

async function check() {
    console.log('\n' + '='.repeat(60));
    console.log(`⏰ ${new Date().toISOString()} - Check MMR`);
    console.log('='.repeat(60));
    
    try {
        const currentData = await scrapeMMRFromPage();
        const currentMMR = currentData.mmr;
        
        console.log(`📊 MMR actuel: ${currentMMR} (${currentData.tier})`);
        
        // Charger ancien état
        let previousMMR = null;
        if (fs.existsSync(STATE_FILE)) {
            const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
            previousMMR = state.mmr;
        }
        
        // Première exécution
        if (previousMMR === null) {
            console.log('🚀 Première exécution - État initial sauvegardé');
            fs.writeFileSync(STATE_FILE, JSON.stringify({ mmr: currentMMR }, null, 2));
            console.log('='.repeat(60) + '\n');
            return;
        }
        
        // Comparer
        if (currentMMR !== previousMMR) {
            const diff = currentMMR - previousMMR;
            console.log(`🎯 CHANGEMENT DÉTECTÉ: ${previousMMR} → ${currentMMR} (${diff > 0 ? '+' : ''}${diff})`);
            await sendDiscordNotification(previousMMR, currentMMR, currentData);
        } else {
            console.log('✅ Aucun changement');
        }
        
        // Sauvegarder
        fs.writeFileSync(STATE_FILE, JSON.stringify({ mmr: currentMMR }, null, 2));
        
    } catch (error) {
        console.error(`❌ Erreur: ${error.message}`);
        throw error;
    }
    
    console.log('='.repeat(60) + '\n');
}

// Lancer
check().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});
