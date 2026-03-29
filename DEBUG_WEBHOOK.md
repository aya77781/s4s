# 🐛 Debug : Webhook Stripe Non Reçu

## 🔍 Vérifications à Faire

### 1. Le serveur tourne-t-il ?

Vérifiez dans votre terminal serveur :
- ✅ Doit afficher : `✅ Serveur S4S en cours d'exécution sur http://localhost:4100`
- ❌ Si erreur → Redémarrez avec `npm start`

---

### 2. Ngrok est-il actif ? (si vous utilisez ngrok)

Dans le terminal ngrok, vous devriez voir :
```
Forwarding    https://statued-thermoelectrically-lilith.ngrok-free.dev -> http://localhost:4100
```

⚠️ **Si ngrok n'est pas actif, Stripe ne peut pas envoyer le webhook !**

---

### 3. Le webhook est-il configuré dans Stripe ?

1. Allez sur : https://dashboard.stripe.com/webhooks
2. Vérifiez que votre webhook existe
3. Vérifiez l'URL : `https://statued-thermoelectrically-lilith.ngrok-free.dev/api/payments/webhook`
4. Vérifiez les événements : `payment_intent.succeeded`, `invoice.payment_succeeded`

---

### 4. L'URL du webhook est-elle correcte ?

**Avec ngrok** : `https://votre-url-ngrok.ngrok-free.dev/api/payments/webhook`

⚠️ **Si vous avez redémarré ngrok, l'URL a changé !**
→ Mettez à jour l'URL dans Stripe Dashboard

---

### 5. Vérifier les logs du serveur

Dans le terminal du serveur, cherchez :
- ✅ `✅ Transaction enregistrée` → Webhook reçu
- ✅ `✅ Contribution enregistrée` → Contribution ajoutée
- ❌ `❌ Erreur` → Problème de traitement

---

### 6. Vérifier les fichiers de données

```bash
type backend\data\transactions.json
type backend\data\contributions.json
```

---

## 🔧 Solutions Courantes

### Problème 1 : Ngrok non actif

**Solution** :
1. Relancez ngrok : `ngrok http 4100`
2. Copiez la nouvelle URL
3. Mettez à jour dans Stripe Dashboard → Webhooks → Votre webhook → Update endpoint URL

---

### Problème 2 : URL webhook incorrecte

**Solution** :
1. Vérifiez l'URL exacte dans Stripe Dashboard
2. Elle doit être : `https://votre-url/api/payments/webhook` (pas juste `/webhook`)
3. Mettez à jour si nécessaire

---

### Problème 3 : Webhook secret incorrect

**Solution** :
1. Vérifiez `.env` : `STRIPE_WEBHOOK_SECRET=whsec_...`
2. Copiez le secret depuis Stripe Dashboard → Webhooks → Votre webhook → Signing secret
3. Redémarrez le serveur après modification

---

### Problème 4 : Serveur non redémarré après modification

**Solution** :
1. Arrêtez le serveur : `Ctrl+C`
2. Relancez : `npm start`

---

## 📋 Checklist Rapide

- [ ] Serveur actif (`npm start`)
- [ ] Ngrok actif (si utilisé) : `ngrok http 4100`
- [ ] URL webhook correcte dans Stripe Dashboard
- [ ] Webhook secret correct dans `.env`
- [ ] Serveur redémarré après modification `.env`
- [ ] Vérifier les logs du serveur pour des erreurs

---

## 🧪 Test Rapide

### Depuis Stripe Dashboard :

1. Allez sur : https://dashboard.stripe.com/webhooks
2. Cliquez sur votre webhook
3. Cliquez sur **"Send test webhook"**
4. Sélectionnez : `payment_intent.succeeded`
5. Cliquez sur **"Send test webhook"**

**Résultat attendu** :
- ✅ Dans Stripe : "200 Success"
- ✅ Dans le terminal serveur : "✅ Transaction enregistrée"
- ✅ Dans `transactions.json` : Nouvelle transaction

---

## 🔍 Vérifier un Paiement Réel

1. Allez sur : https://dashboard.stripe.com/payments
2. Trouvez votre paiement récent
3. Cliquez dessus
4. Allez dans l'onglet **"Events"**
5. Cherchez : `payment_intent.succeeded`
6. Cliquez dessus
7. Vérifiez si le webhook a été envoyé :
   - ✅ "200 Success" → Webhook reçu par votre serveur
   - ❌ "Failed" ou rien → Webhook non envoyé ou erreur

---

**Suivez ces étapes pour identifier le problème ! 🔍**

