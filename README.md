# $forS - Students for Students Platform

Une plateforme de solidarité connectant les étudiants avec les anciens élèves et les entreprises partenaires.

---

## 🚀 Démarrage Rapide

### Installation
```bash
npm install
```

### Lancer le serveur local
```bash
npm start
```

Le serveur démarre sur : `http://localhost:4100`

---

## 📖 Guides Disponibles

### Pour **partager rapidement** votre site (sans hébergeur) :
👉 **Lisez `README_NGROK.md`** - Guide simple avec ngrok (5 minutes)

### Pour **héberger gratuitement** (permanent) :
👉 **Lisez `DEPLOY_RENDER.md`** - Déploiement sur Render.com (15 minutes)

### Pour toutes les options (complet) :
👉 **Lisez `SHARING_GUIDE.md`** - Guide exhaustif avec toutes les méthodes

---

## 🎯 Options de Partage

### Option 1 : ngrok (Partage Temporaire - Le Plus Rapide)
✅ Parfait pour tester rapidement
✅ Fonctionne en 2 minutes
✅ Gratuit

**Fichiers utiles** :
- `README_NGROK.md` - Guide détaillé
- `START_NGROK.bat` - Script Windows pour démarrer ngrok
- `START_SERVER.bat` - Script Windows pour démarrer le serveur

### Option 2 : Render.com (Hébergement Gratuit Permanent)
✅ Gratuit avec SSL automatique
✅ Déploiement automatique depuis GitHub
✅ URL permanente

**Fichiers utiles** :
- `DEPLOY_RENDER.md` - Guide de déploiement étape par étape
- `render.yaml` - Configuration Render (déjà prêt)

### Option 3 : Railway.app / Vercel / Netlify
✅ Voir `SHARING_GUIDE.md` pour les détails

---

## 📁 Structure du Projet

```
S4S/
├── backend/
│   ├── data/           # Fichiers JSON (users, requests, etc.)
│   └── server.js       # Serveur Express
├── public/
│   ├── index.html      # Page d'accueil
│   ├── student.html    # Interface Student
│   ├── alumni.html     # Interface Alumni
│   ├── donor.html      # Interface Donor
│   ├── partner.html    # Interface Partner
│   ├── admin.html      # Interface Admin
│   └── ...
├── .env                # Variables d'environnement (à créer)
├── package.json        # Dépendances Node.js
└── render.yaml         # Configuration Render.com
```

---

## 🔧 Configuration

### Variables d'Environnement

Créez un fichier `.env` à la racine (copiez depuis `.env.example`) :

```env
PORT=4100
GMAIL_USER=ayaboudhas7@gmail.com
GMAIL_APP_PASSWORD=votre_mot_de_passe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
APP_URL=https://votre-domaine.com
```

---

## 🌐 Rôles Disponibles

- **Student** : Soumet des demandes de financement
- **Alumni** : Contribue mensuellement pour aider les étudiants
- **Donor** : Fait des dons ponctuels
- **Partner** : Entreprises partenaires offrant des opportunités
- **Admin** : Gestion complète de la plateforme

---

## 📚 Documentation

- `README_NGROK.md` - Partage rapide avec ngrok
- `DEPLOY_RENDER.md` - Hébergement sur Render.com
- `SHARING_GUIDE.md` - Guide complet de toutes les méthodes
- `QUICK_SHARE.md` - Options de partage rapide
- `DEPLOYMENT_GUIDE.md` - Guide d'hébergement avancé
- `WEBHOOK_SETUP.md` - Configuration Stripe Webhooks
- `README_STRIPE.md` - Configuration Stripe

---

## 🎨 Technologies Utilisées

- **Backend** : Node.js + Express
- **Frontend** : HTML, CSS, JavaScript (Vanilla)
- **Payments** : Stripe
- **Email** : Nodemailer (Gmail)

---

## 📝 Scripts Disponibles

```bash
npm start          # Démarrer le serveur
```

**Windows** :
- **Méthode simple** : Double-cliquez sur `DEMARRER_TOUT.bat` (démarre tout automatiquement)
- **Méthode manuelle** :
  - Double-cliquez sur `START_SERVER.bat` pour démarrer le serveur
  - Double-cliquez sur `DEMARRER_NGROK.bat` pour lancer ngrok
- **Test** : Double-cliquez sur `TEST_NGROK.bat` pour vérifier l'installation

---

## 🆘 Support

En cas de problème :
1. Vérifiez que le serveur démarre localement (`npm start`)
2. Consultez les guides dans la documentation
3. Vérifiez les variables d'environnement

---

## 📄 Licence

Projet éducatif - $forS Platform

---

**Bon partage ! 🚀**

