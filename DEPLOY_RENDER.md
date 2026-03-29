# 🚀 Déploiement sur Render.com (Gratuit)

## Étape 1 : Préparer votre projet

✅ **Déjà fait** :
- `render.yaml` créé
- `package.json` avec script `start`
- `.env.example` créé (template)

---

## Étape 2 : Créer un compte Render

1. Allez sur : https://render.com
2. Cliquez sur **"Get Started for Free"**
3. Inscrivez-vous avec GitHub (recommandé) ou email

---

## Étape 3 : Connecter votre dépôt

1. Dans Render, cliquez sur **"New +"** → **"Web Service"**
2. **Connectez votre dépôt GitHub** :
   - Si pas connecté, autorisez Render à accéder à GitHub
   - Sélectionnez votre dépôt `S4S`
3. Render détecte automatiquement Node.js

---

## Étape 4 : Configurer le service

### Informations de base :
- **Name** : `s4s-platform` (ou votre choix)
- **Region** : Choisissez le plus proche (ex: `Frankfurt` pour l'Europe)
- **Branch** : `main` ou `master`
- **Root Directory** : `.` (racine)
- **Environment** : `Node`

### Build & Deploy :
- **Build Command** : `npm install`
- **Start Command** : `npm start`

### Plan :
- **Free** (pour commencer)

---

## Étape 5 : Variables d'environnement

Dans la section **"Environment"**, ajoutez :

```env
NODE_ENV=production
PORT=4100
GMAIL_USER=ayaboudhas7@gmail.com
GMAIL_APP_PASSWORD=votre_mot_de_passe_app_gmail
STRIPE_SECRET_KEY=sk_live_votre_clé_stripe
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_webhook
APP_URL=https://votre-app.onrender.com
CORS_ORIGIN=https://votre-app.onrender.com
```

**⚠️ Important** :
- Remplacez les valeurs par vos vraies clés
- `APP_URL` : Vous obtiendrez l'URL après le premier déploiement
- Vous pouvez la mettre à jour après

---

## Étape 6 : Déployer

1. Cliquez sur **"Create Web Service"**
2. Render va :
   - Cloner votre dépôt
   - Installer les dépendances (`npm install`)
   - Démarrer le serveur (`npm start`)
3. **Premier déploiement** : ~5-10 minutes

---

## Étape 7 : Obtenir votre URL

Après le déploiement :
1. Render vous donne une URL : `https://s4s-platform.onrender.com`
2. **Copiez cette URL**
3. Mettez à jour `APP_URL` dans les variables d'environnement avec cette URL
4. Redéployez (Render redéploie automatiquement si vous poussez sur GitHub)

---

## Étape 8 : Configurer Stripe Webhook

1. Allez sur : https://dashboard.stripe.com/webhooks
2. Cliquez sur **"Add endpoint"**
3. **Endpoint URL** : `https://votre-app.onrender.com/api/payments/webhook`
4. **Événements à écouter** :
   - `payment_intent.succeeded`
   - `invoice.payment_succeeded`
   - `charge.succeeded`
5. Copiez le **Signing Secret** (`whsec_...`)
6. Ajoutez-le dans les variables d'environnement Render : `STRIPE_WEBHOOK_SECRET`

---

## ⚠️ Limitations du plan gratuit

- **Sommeil automatique** : Le serveur se met en veille après 15 minutes d'inactivité
- **Premier démarrage** : 30-60 secondes après la mise en veille
- **750 heures/mois** : Gratuit, mais limité
- **Performance** : Légèrement plus lente que les plans payants

---

## ✅ Checklist

- [ ] Compte Render créé
- [ ] Dépôt GitHub connecté
- [ ] Service Web créé
- [ ] Variables d'environnement configurées
- [ ] Premier déploiement réussi
- [ ] URL obtenue et testée
- [ ] Webhook Stripe configuré
- [ ] APP_URL mis à jour dans les variables

---

## 🔄 Déploiement automatique

Render déploie automatiquement quand vous poussez sur GitHub :
```bash
git add .
git commit -m "Update"
git push origin main
```

Render détecte le changement et redéploie automatiquement !

---

## 📊 Monitoring

Dans le dashboard Render :
- **Logs** : Voir les logs en temps réel
- **Metrics** : CPU, RAM, requêtes
- **Events** : Historique des déploiements

---

## 🆘 Problèmes courants

### "Build failed"
→ Vérifiez les logs dans Render
→ Assurez-vous que `package.json` est correct

### "Application error"
→ Vérifiez les variables d'environnement
→ Vérifiez les logs du serveur

### "Timeout"
→ Le plan gratuit peut être lent au démarrage
→ Attendez 30-60 secondes après le premier accès

---

## 🎉 C'est tout !

Votre site est maintenant accessible publiquement à :
**`https://votre-app.onrender.com`**

Partagez cette URL ! 🚀

