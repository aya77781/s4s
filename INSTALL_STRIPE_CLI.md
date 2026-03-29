# 🔧 Installation Stripe CLI pour Tests Locaux

## 📥 Installation Windows

### Option 1 : Via Winget (Recommandé - Windows 10/11)

Ouvrez PowerShell en tant qu'administrateur et tapez :

```powershell
winget install stripe.stripe-cli
```

---

### Option 2 : Téléchargement Manuel

1. Allez sur : https://github.com/stripe/stripe-cli/releases/latest
2. Téléchargez : `stripe_X.X.X_windows_x86_64.zip` (dernière version)
3. Décompressez le fichier
4. Placez `stripe.exe` dans un dossier accessible (ex: `C:\StripeCLI\`)
5. Ajoutez le dossier au **PATH Windows** :
   - Recherchez "Variables d'environnement" dans Windows
   - Cliquez sur "Variables d'environnement"
   - Dans "Variables système", trouvez "Path"
   - Cliquez sur "Modifier"
   - Ajoutez le chemin vers le dossier contenant `stripe.exe`
   - Cliquez sur "OK"

---

### Option 3 : Via Scoop (Si vous avez Scoop)

```powershell
scoop install stripe
```

---

## ✅ Vérifier l'Installation

Ouvrez un nouveau terminal et tapez :

```bash
stripe --version
```

Vous devriez voir quelque chose comme : `stripe version X.X.X`

---

## 🔐 Connexion à Stripe

Dans votre terminal, tapez :

```bash
stripe login
```

1. Une page s'ouvrira dans votre navigateur
2. Autorisez Stripe CLI à accéder à votre compte
3. Vous serez automatiquement connecté

---

## 🚀 Utiliser Stripe CLI pour les Webhooks

### Méthode 1 : Forwarder vers le serveur local (Sans ngrok)

Si votre serveur tourne sur `http://localhost:4100` :

```bash
stripe listen --forward-to http://localhost:4100/api/payments/webhook
```

Stripe CLI va :
- Créer un tunnel vers votre serveur local
- Vous donner un **webhook signing secret** (commence par `whsec_...`)
- Forwarder tous les événements Stripe vers votre serveur

⚠️ **Important** : Utilisez ce nouveau secret dans votre `.env` au lieu de celui du dashboard !

---

### Méthode 2 : Avec ngrok (Ce que vous faites déjà)

Si vous préférez utiliser ngrok (comme maintenant) :
- Gardez ngrok actif
- Utilisez le webhook secret du dashboard Stripe
- Stripe CLI n'est pas nécessaire dans ce cas

---

## 🧪 Tester un Webhook

Une fois `stripe listen` actif, dans un **nouveau terminal** :

```bash
stripe trigger payment_intent.succeeded
```

Cela va :
1. Créer un paiement test
2. Envoyer l'événement `payment_intent.succeeded`
3. Le forwarder vers votre serveur local
4. Vous devriez voir dans le terminal serveur : `✅ Transaction enregistrée`

---

## 📋 Événements de Test Disponibles

```bash
# Test paiement réussi
stripe trigger payment_intent.succeeded

# Test abonnement réussi
stripe trigger invoice.payment_succeeded

# Test paiement échoué
stripe trigger payment_intent.payment_failed

# Test annulation d'abonnement
stripe trigger customer.subscription.deleted
```

---

## 🔄 Configuration avec votre Projet

### Si vous utilisez Stripe CLI (sans ngrok) :

1. Lancez le serveur : `npm start`
2. Dans un nouveau terminal : `stripe listen --forward-to http://localhost:4100/api/payments/webhook`
3. Copiez le `whsec_...` affiché et ajoutez-le dans `.env` : `STRIPE_WEBHOOK_SECRET=whsec_...`
4. Redémarrez le serveur
5. Testez : `stripe trigger payment_intent.succeeded`

### Si vous utilisez ngrok (comme maintenant) :

Vous n'avez pas besoin de Stripe CLI, mais vous pouvez l'utiliser pour tester localement sans ouvrir ngrok à chaque fois.

---

## 🎯 Avantages de Stripe CLI

✅ Pas besoin de ngrok pour les tests locaux
✅ Tests rapides et instantanés
✅ Pas d'URL publique nécessaire
✅ Webhook signing secret généré automatiquement
✅ Idéal pour le développement local

---

## 📝 Commandes Utiles

```bash
# Se connecter
stripe login

# Écouter et forwarder les webhooks
stripe listen --forward-to http://localhost:4100/api/payments/webhook

# Tester un événement
stripe trigger payment_intent.succeeded

# Voir les événements reçus
stripe events list

# Voir les logs en temps réel
stripe listen --forward-to http://localhost:4100/api/payments/webhook --print-secret
```

---

## 🆘 Problèmes Courants

### "stripe: command not found"
→ Vérifiez que Stripe CLI est dans le PATH
→ Redémarrez le terminal après l'installation

### "Authentication required"
→ Tapez `stripe login` pour vous connecter

### "Connection refused"
→ Vérifiez que le serveur tourne sur le port 4100
→ Vérifiez l'URL dans `--forward-to`

---

**Installez Stripe CLI maintenant pour tester localement ! 🚀**

