# 🎯 Configuration Stripe Webhook avec ngrok

## ✅ OUI ! Vous pouvez utiliser ngrok pour Stripe

Vous n'avez **PAS besoin** de Stripe CLI. Utilisez simplement votre URL ngrok !

---

## 🌐 Votre URL Webhook

Votre URL webhook complète sera :

```
https://statued-thermoelectrically-lilith.ngrok-free.dev/api/payments/webhook
```

⚠️ **Note** : Si vous redémarrez ngrok, l'URL changera et il faudra la mettre à jour dans Stripe.

---

## 📋 Étapes de Configuration

### Étape 1 : Ouvrir Stripe Dashboard

1. Allez sur : https://dashboard.stripe.com/webhooks
2. Connectez-vous à votre compte Stripe

---

### Étape 2 : Créer un nouveau Webhook Endpoint

1. Cliquez sur **"Add endpoint"** ou **"Add endpoint"**
2. **Endpoint URL** : Collez votre URL ngrok :
   ```
   https://statued-thermoelectrically-lilith.ngrok-free.dev/api/payments/webhook
   ```
3. **Description** (optionnel) : `$forS Webhook via ngrok`

---

### Étape 3 : Sélectionner les Événements

Sélectionnez ces événements à écouter :

- ✅ `payment_intent.succeeded`
- ✅ `invoice.payment_succeeded`
- ✅ `charge.succeeded`
- ✅ `customer.subscription.deleted` (optionnel)
- ✅ `invoice.payment_failed` (optionnel)

---

### Étape 4 : Créer l'Endpoint

1. Cliquez sur **"Add endpoint"**
2. Stripe va créer le webhook et vous donnera un **Signing Secret**

---

### Étape 5 : Copier le Signing Secret

1. Cliquez sur le webhook que vous venez de créer
2. Dans la section **"Signing secret"**, cliquez sur **"Reveal"**
3. **Copiez le secret** (il commence par `whsec_...`)

---

### Étape 6 : Ajouter le Secret dans votre `.env`

Ouvrez votre fichier `.env` (ou créez-le) et ajoutez :

```env
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_ici
```

⚠️ **Important** : Redémarrez le serveur après avoir modifié `.env`

---

## ✅ Vérification

### Test 1 : Vérifier que le webhook fonctionne

1. Dans Stripe Dashboard, allez sur votre webhook
2. Cliquez sur **"Send test webhook"**
3. Sélectionnez un événement : `payment_intent.succeeded`
4. Cliquez sur **"Send test webhook"**

### Test 2 : Vérifier les logs

Dans votre terminal serveur, vous devriez voir :
```
✅ Transaction enregistrée: ...
```

Dans Stripe Dashboard → Webhooks → Votre webhook → **"Recent events"**, vous devriez voir :
- ✅ **200 Success** (webhook reçu avec succès)

---

## 🔄 Si l'URL ngrok Change

Si vous redémarrez ngrok, vous obtiendrez une nouvelle URL.

**Solution** :
1. Copiez la nouvelle URL ngrok
2. Allez sur Stripe Dashboard → Webhooks
3. Cliquez sur votre webhook existant
4. Cliquez sur **"Update endpoint URL"**
5. Collez la nouvelle URL : `https://nouvelle-url.ngrok-free.dev/api/payments/webhook`
6. Sauvegardez

⚠️ **Le Signing Secret reste le même**, vous n'avez pas besoin de le changer.

---

## 🎯 URL Complète à Utiliser

**Format général** :
```
https://votre-url-ngrok.ngrok-free.dev/api/payments/webhook
```

**Votre URL actuelle** :
```
https://statued-thermoelectrically-lilith.ngrok-free.dev/api/payments/webhook
```

---

## 📝 Checklist

- [ ] ngrok actif avec URL : `https://statued-thermoelectrically-lilith.ngrok-free.dev`
- [ ] Serveur Node.js actif sur port 4100
- [ ] Webhook créé dans Stripe Dashboard
- [ ] URL webhook configurée : `https://...ngrok-free.dev/api/payments/webhook`
- [ ] Événements sélectionnés : `payment_intent.succeeded`, `invoice.payment_succeeded`, etc.
- [ ] Signing Secret copié (`whsec_...`)
- [ ] Secret ajouté dans `.env` : `STRIPE_WEBHOOK_SECRET=whsec_...`
- [ ] Serveur redémarré après modification `.env`
- [ ] Test webhook réussi dans Stripe Dashboard

---

## 🆘 Problèmes Courants

### "Webhook received but processing failed"
→ Vérifiez que `STRIPE_WEBHOOK_SECRET` est correct dans `.env`
→ Vérifiez que le serveur peut accéder à `backend/server.js`

### "Webhook timeout"
→ Vérifiez que le serveur tourne sur port 4100
→ Vérifiez que ngrok est actif

### "Invalid webhook signature"
→ Le `STRIPE_WEBHOOK_SECRET` ne correspond pas
→ Vérifiez que vous avez copié le bon secret depuis Stripe Dashboard

---

## 🌐 Pour Production (URL Fixe)

Pour éviter de changer l'URL à chaque fois :
1. Utilisez **Render.com** (voir `DEPLOY_RENDER.md`)
2. Configurez le webhook avec l'URL Render permanente
3. Plus besoin de changer l'URL !

---

**Votre webhook Stripe fonctionne maintenant avec ngrok ! 🎉**

