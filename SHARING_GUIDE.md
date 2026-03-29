# Guide : Partager et Héberger $forS

Ce guide vous explique comment rendre votre site accessible avec une URL publique, avec ou sans hébergeur traditionnel.

---

## 🌐 Option 1 : Partage Temporaire (Sans Hébergeur)

### **ngrok** (Recommandé pour tester rapidement)

**ngrok** crée un tunnel vers votre serveur local et génère une URL publique.

#### Installation :
```bash
# Windows (avec Chocolatey)
choco install ngrok

# Ou téléchargez depuis : https://ngrok.com/download
```

#### Utilisation :
1. **Démarrez votre serveur local** :
   ```bash
   npm start
   # ou
   node backend/server.js
   ```

2. **Dans un nouveau terminal, lancez ngrok** :
   ```bash
   ngrok http 4100
   ```

3. **Vous obtiendrez une URL comme** :
   ```
   https://abc123.ngrok-free.app
   ```

4. **Partagez cette URL** - Elle fonctionne tant que :
   - Votre ordinateur est allumé
   - Le serveur Node.js tourne
   - ngrok est actif

⚠️ **Limitations** :
- URL change à chaque redémarrage (gratuit)
- Tunnel gratuit limité à quelques heures
- Version payante pour URL fixe et durée illimitée

---

### **Cloudflare Tunnel (cloudflared)** (Gratuit, Plus Stable)

#### Installation :
```bash
# Windows - Téléchargez depuis :
# https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

#### Utilisation :
```bash
# Créer un tunnel (première fois)
cloudflared tunnel --url http://localhost:4100
```

✅ **Avantages** :
- Gratuit et illimité
- URL plus stable que ngrok gratuit
- Pas besoin de compte Cloudflare pour usage basique

---

### **Localtunnel** (Simple mais moins fiable)

```bash
# Installation
npm install -g localtunnel

# Utilisation
lt --port 4100
```

---

## 🚀 Option 2 : Hébergement Gratuit Permanent

### **Render.com** (Recommandé - Gratuit)

✅ **Avantages** : Gratuit, SSL automatique, déploiement GitHub, base de données disponible

#### Étapes :

1. **Préparez votre projet** :
   - Créez un fichier `render.yaml` (voir ci-dessous)
   - Assurez-vous que `package.json` a un script `"start"`

2. **Créez un compte** : https://render.com

3. **Connectez votre dépôt GitHub** (ou GitLab/Bitbucket)

4. **Créez un nouveau "Web Service"** :
   - Build Command : `npm install`
   - Start Command : `npm start`
   - Environnement : `Node`
   - Plan : **Free**

5. **Ajoutez les variables d'environnement** dans le dashboard Render :
   ```
   PORT=4100
   GMAIL_USER=ayaboudhas7@gmail.com
   GMAIL_APP_PASSWORD=votre_mot_de_passe
   STRIPE_SECRET_KEY=votre_clé_stripe
   STRIPE_WEBHOOK_SECRET=votre_secret_webhook
   APP_URL=https://votre-app.render.com
   ```

6. **Configurez le webhook Stripe** :
   - URL du webhook : `https://votre-app.render.com/api/payments/webhook`
   - Événements : `payment_intent.succeeded`, `invoice.payment_succeeded`

**Votre site sera accessible à** : `https://votre-app.onrender.com`

⚠️ **Limitations du plan gratuit** :
- Le serveur se met en veille après 15 minutes d'inactivité
- Premier démarrage peut prendre 30-60 secondes
- 750 heures gratuites par mois

---

### **Railway.app** (Excellent pour Node.js)

1. **Créez un compte** : https://railway.app
2. **Cliquez sur "New Project"** → "Deploy from GitHub repo"
3. **Sélectionnez votre dépôt**
4. **Railway détecte automatiquement Node.js** et démarre
5. **Ajoutez les variables d'environnement** dans "Variables"

✅ **Avantages** :
- Pas de sommeil automatique (contrairement à Render gratuit)
- Déploiement automatique depuis GitHub
- SSL gratuit
- $5 crédit gratuit par mois

---

### **Vercel** (Idéal pour Frontend, Backend API)

**Vercel** est excellent pour les applications Node.js.

1. **Installez Vercel CLI** :
   ```bash
   npm install -g vercel
   ```

2. **Dans votre projet** :
   ```bash
   vercel
   ```

3. **Suivez les instructions** et configurez :
   - Root Directory : `.` (racine du projet)
   - Build Command : (laissez vide ou `npm install`)
   - Output Directory : `public` (pour les fichiers statiques)
   - Install Command : `npm install`

4. **Créez `vercel.json`** :
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "backend/server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "backend/server.js"
       },
       {
         "src": "/(.*)",
         "dest": "public/$1"
       }
     ]
   }
   ```

5. **Ajoutez les variables d'environnement** dans le dashboard Vercel

✅ **Avantages** :
- Gratuit avec SSL
- Déploiement ultra-rapide
- CDN global

---

### **Netlify** (Alternative)

Similaire à Vercel, excellent pour le frontend.

---

## 📋 Configuration pour Hébergement

### 1. Créez `render.yaml` (pour Render.com) :

```yaml
services:
  - type: web
    name: s4s-platform
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 4100
```

### 2. Vérifiez `package.json` a un script `start` :

```json
{
  "scripts": {
    "start": "node backend/server.js"
  }
}
```

### 3. Mettez à jour `.gitignore` (si pas déjà fait) :

```
node_modules/
.env
public/uploads/
*.log
```

### 4. Créez un fichier `.env.example` (template) :

```env
PORT=4100
NODE_ENV=production
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_URL=https://votre-app.onrender.com
CORS_ORIGIN=https://votre-app.onrender.com
```

---

## 🔧 Configuration Backend pour Production

Le fichier `backend/server.js` est déjà configuré pour la production :

✅ Port dynamique : `process.env.PORT || 4100`
✅ CORS configuré : `process.env.APP_URL || process.env.CORS_ORIGIN || '*'`
✅ API_BASE dynamique dans `config.js`

---

## 📝 Checklist Avant Déploiement

- [ ] Variables d'environnement configurées
- [ ] `package.json` a le script `start`
- [ ] `.env` ajouté à `.gitignore`
- [ ] `config.js` utilise `window.location.origin` (déjà fait)
- [ ] Webhook Stripe configuré avec la nouvelle URL
- [ ] Images/uploads accessibles (vérifier `public/uploads`)
- [ ] Testez localement avec `npm start`

---

## 🌍 Partage Rapide (Sans Configuration)

### **Méthode la plus simple : ngrok**

1. Installez ngrok : https://ngrok.com/download
2. Démarrez votre serveur : `npm start`
3. Lancez : `ngrok http 4100`
4. Copiez l'URL HTTPS fournie (ex: `https://abc123.ngrok-free.app`)
5. Partagez cette URL - Elle fonctionne immédiatement !

⚠️ **Note** : Cette URL ne fonctionne que tant que :
- Votre ordinateur est allumé
- Le serveur Node.js tourne
- ngrok est actif

---

## 🎯 Résumé des Options

| Méthode | Gratuit | Permanent | Difficulté | Meilleur Pour |
|---------|---------|-----------|-----------|---------------|
| **ngrok** | ✅ | ❌ (temporaire) | ⭐ Facile | Tests rapides |
| **Render** | ✅ | ✅ | ⭐⭐ Moyen | Production gratuite |
| **Railway** | ✅ ($5 crédit) | ✅ | ⭐⭐ Moyen | Production stable |
| **Vercel** | ✅ | ✅ | ⭐⭐ Moyen | Frontend + API |
| Cloudflare Tunnel | ✅ | ✅ | ⭐⭐⭐ Avancé | Tunnels persistants |

---

## 🚀 Recommandation

**Pour tester rapidement** : Utilisez **ngrok**
**Pour héberger gratuitement** : Utilisez **Render.com** ou **Railway.app**

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que le serveur démarre localement (`npm start`)
2. Vérifiez les logs dans le dashboard de l'hébergeur
3. Assurez-vous que toutes les variables d'environnement sont définies
4. Vérifiez que le port est correctement configuré

---

**Bon déploiement ! 🎉**

