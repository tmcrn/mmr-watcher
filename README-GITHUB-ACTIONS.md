# ⚔️ MMR WATCHER - GitHub Actions

Tracker MMR Rocket League qui **scrappe le JSON** depuis tracker.gg et envoie des notifications Discord toutes les 2 minutes via GitHub Actions.

## 🎯 Fonctionnalités

- ✅ **Scraping JSON** depuis `<script id="__NEXT_DATA__">` (méthode Stack Overflow)
- 🤖 **GitHub Actions** - Exécution automatique toutes les 2 minutes
- 🔔 **Notifications Discord** uniquement en cas de changement
- 💾 **State persistant** via git commit
- 🆓 **Gratuit** - utilise les GitHub Actions gratuites

## 📦 Installation

### 1️⃣ Fork ce repo

Clique sur "Fork" en haut à droite

### 2️⃣ Ajouter le secret Discord Webhook

1. Va dans **Settings** → **Secrets and variables** → **Actions**
2. Clique sur **New repository secret**
3. Nom: `DISCORD_WEBHOOK`
4. Valeur: `https://discord.com/api/webhooks/...` (ton webhook)
5. Clique sur **Add secret**

### 3️⃣ Activer GitHub Actions

1. Va dans **Actions**
2. Clique sur **I understand my workflows, go ahead and enable them**

### 4️⃣ Donner les permissions d'écriture

1. Va dans **Settings** → **Actions** → **General**
2. Section **Workflow permissions**
3. Sélectionne **Read and write permissions**
4. Clique sur **Save**

### 5️⃣ Lancer manuellement (première fois)

1. Va dans **Actions**
2. Clique sur **MMR Watcher** (à gauche)
3. Clique sur **Run workflow**
4. Clique sur **Run workflow** (bouton vert)

---

## ⚙️ Configuration

Éditer `mmr-watcher-scraper.js` lignes 11-24 :

```javascript
const CONFIG = {
    player: {
        username: "TonPseudo",
        platform: "epic"  // epic, steam, psn, xbl
    },
    discord: {
        webhookUrl: process.env.DISCORD_WEBHOOK
    },
    target: {
        "2v2": 1315  // Ton objectif MMR
    },
    mmrPerWin: 9
};
```

---

## 🕐 Fréquence d'exécution

Par défaut: **toutes les 2 minutes**

Pour changer, édite `.github/workflows/mmr-watcher.yml` :

```yaml
schedule:
  - cron: '*/5 * * * *'  # Toutes les 5 minutes
  - cron: '0 * * * *'    # Toutes les heures
  - cron: '*/10 * * * *' # Toutes les 10 minutes
```

⚠️ **Limite GitHub Actions gratuit** : 2000 minutes/mois
- 2 min d'exécution = ~1000 checks/mois → **OK** ✅
- 1 min d'exécution = ~2000 checks/mois → **OK** ✅

---

## 🔧 Comment ça marche ?

### 1. Scraping (méthode Stack Overflow)

```javascript
// Charge la page tracker.gg
await page.goto('https://tracker.gg/rocket-league/profile/...');

// Extrait le JSON du <script id="__NEXT_DATA__">
const jsonData = await page.evaluate(() => {
    const script = document.querySelector('script[id="__NEXT_DATA__"]');
    return JSON.parse(script.innerHTML);
});

// Parse la structure
const mmr = jsonData.props.pageProps.profile.data.segments
    .find(s => s.attributes?.playlistId === 11)  // 2v2
    .stats.rating.value;
```

### 2. Comparaison

```javascript
// Charge state.json (dernier MMR connu)
const previousMMR = JSON.parse(fs.readFileSync('state.json'));

// Compare
if (currentMMR !== previousMMR) {
    // 🔔 Envoie notification Discord
    await sendDiscordNotification();
}

// Sauvegarde nouveau state
fs.writeFileSync('state.json', JSON.stringify({ mmr: currentMMR }));
```

### 3. GitHub Actions commit le state

```yaml
- name: 💾 Commit state changes
  run: |
    git add state.json
    git commit -m "🔄 Update MMR state"
    git push
```

---

## 📊 Exemple de notification Discord

```
⚔️ Snowthy – 2v2
🟢 VICTOIRE

MMR: 1234 → 1243 (+9)
🎯 Rang: Champion II Division II
🔥 Série: 3 victoires
🏁 ~8 wins pour 1315 MMR
```

---

## 🆚 Pourquoi pas trn-rocket-league ?

| Méthode | trn-rocket-league | Scraping JSON |
|---------|:-----------------:|:-------------:|
| **Fonctionne sur GitHub Actions** | ❌ Non | ✅ Oui |
| **Rate limiting** | ⚠️ Oui | ✅ Rarement |
| **Maintenance** | ⚠️ Dépend de la lib | ✅ Stable |
| **Rapidité** | 🚀 2s | 🐢 10s |

**Conclusion** : Pour GitHub Actions, le scraping JSON est **la seule solution fiable** !

---

## 🔍 Vérifier que ça marche

### Logs GitHub Actions

1. Va dans **Actions**
2. Clique sur la dernière exécution
3. Clique sur **check-mmr**
4. Regarde les logs :

```
📥 Checkout code
🟢 Setup Node.js
📦 Install dependencies
🔍 Check MMR
  🌐 Lancement navigateur...
  📍 Chargement: https://tracker.gg/...
  ✅ JSON extrait !
  📊 MMR actuel: 1234 (Champion II)
  ✅ Aucun changement
💾 Commit state changes
```

---

## 🛠️ Dépannage

### "Workflow not found"
→ Vérifie que `.github/workflows/mmr-watcher.yml` existe bien

### "Secret not found"
→ Va dans Settings → Secrets → Ajoute `DISCORD_WEBHOOK`

### "Permission denied"
→ Settings → Actions → General → Read and write permissions

### Pas de notifications
→ Vérifie les logs dans Actions → Regarde l'erreur

---

## 💡 Optimisations possibles

### Réduire la fréquence si proche de l'objectif

```javascript
// Dans mmr-watcher-scraper.js
const mmrDiff = CONFIG.target["2v2"] - currentMMR;

if (mmrDiff < 50) {
    // Check toutes les 1 min
} else {
    // Check toutes les 5 min
}
```

### Suivre plusieurs modes

```javascript
const CONFIG = {
    target: {
        "1v1": 1000,
        "2v2": 1315,
        "3v3": 1200
    }
};

// Parser tous les segments
for (const [mode, playlistId] of [["1v1", 10], ["2v2", 11], ["3v3", 13]]) {
    // ...
}
```

---

## 📝 Crédits

- Méthode scraping inspirée de [Stack Overflow](https://stackoverflow.com/questions/72721556)
- Développé par Timothé avec Claude

---

⚔️ **Bon tracking automatique, Compagnon !** 🤖🔥
