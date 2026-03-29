# 🔍 Vérifier Pourquoi le Webhook n'a Pas Été Reçu

## ⚠️ Diagnostic

Vos fichiers sont vides :
- `transactions.json` = `[]`
- `contributions.json` = `[]`

Cela signifie que le webhook Stripe **n'a pas été reçu** par votre serveur.

---

## 🔧 Vérifications Immédiates

### 1. Le serveur tourne-t-il ?

**Dans votre terminal serveur**, vérifiez :
- ✅ Vous voyez : `✅ Serveur S4S en cours d'exécution sur http://localhost:4100`
- ❌ Sinon → Relancez : `npm start`

---

### 2. Ngrok est-il actif ? (CRUCIAL)

**Si vous utilisez ngrok**, vérifiez votre terminal ngrok :

✅ **Ngrok actif** → Vous voyez :
```
Forwarding    https://abc123.ngrok-free.dev -> http://localhost:4100
```

❌ **Ngrok non actif** → Stripe ne peut PAS envoyer le webhook !

**Solution** :
```bash
ngrok http 4100
```

---

### 3. L'URL webhook dans Stripe est-elle correcte ?

1. Allez sur : https://dashboard.stripe.com/webhooks
2. Cliquez sur votre webhook
3. Vérifiez l'**Endpoint URL**

**Elle doit être** :
```
https://statued-thermoelectrically-lilith.ngrok-free.dev/api/payments/webhook
```

⚠️ **Si vous avez redémarré ngrok**, l'URL a changé !
- Copiez la nouvelle URL ngrok
- Mettez-la à jour dans Stripe Dashboard

---

### 4. Vérifier dans Stripe Dashboard si le webhook a été envoyé

1. Allez sur : https://dashboard.stripe.com/payments
2. Trouvez votre paiement récent
3. Cliquez dessus
4. Allez dans l'onglet **"Events"**
5. Cherchez : `payment_intent.succeeded`
6. Cliquez dessus
7. Regardez si le webhook a été envoyé :
   - ✅ **"200 Success"** → Webhook reçu par votre serveur (mais peut-être erreur de traitement)
   - ❌ **"Failed"** → Webhook non envoyé ou erreur
   - ⚠️ **Rien** → Webhook pas encore envoyé (parfois Stripe met quelques minutes)

---

### 5. Vérifier les logs du serveur

**Dans votre terminal serveur**, cherchez :
- ✅ `✅ Transaction enregistrée` → Webhook reçu et traité
- ✅ `✅ Contribution enregistrée` → Contribution ajoutée
- ❌ `❌ Erreur` → Problème de traitement
- ⚠️ **Aucun message** → Webhook non reçu du tout

---

## 🎯 Solutions Selon le Problème

### Problème A : Ngrok non actif

**Solution** :
1. Relancez ngrok : `ngrok http 4100`
2. Copiez la nouvelle URL
3. Mettez à jour dans Stripe Dashboard → Webhooks → Update endpoint URL

---

### Problème B : URL webhook incorrecte dans Stripe

**Solution** :
1. Allez sur Stripe Dashboard → Webhooks
2. Cliquez sur votre webhook
3. Cliquez sur **"Update endpoint URL"**
4. Collez : `https://votre-nouvelle-url-ngrok.ngrok-free.dev/api/payments/webhook`
5. Sauvegardez

---

### Problème C : Webhook envoyé mais erreur (200 Failed)

**Dans Stripe Dashboard → Webhooks → Votre webhook → Recent events** :
1. Cliquez sur l'événement récent
2. Regardez la réponse de votre serveur
3. Vérifiez l'erreur affichée

**Vérifiez aussi les logs du serveur** pour voir l'erreur exacte.

---

### Problème D : Paiement avec Stripe Buy Button (lien direct)

Si vous avez utilisé le lien Stripe Buy Button direct :
```
https://buy.stripe.com/3cI9ATdSbemY4pFaHxdfG02
```

**Ce lien ne passe pas par votre serveur !** Il va directement vers Stripe.

Pour que le webhook soit envoyé :
- ✅ Le paiement doit être fait via votre site (Pricing Table)
- ✅ Ou configurez le webhook dans Stripe pour ce Buy Button aussi

---

## 🧪 Test Immédiat

### Test 1 : Vérifier que le serveur reçoit les requêtes

Dans votre terminal serveur, vous devriez voir des logs pour chaque requête.

**Testez** : Ouvrez votre site dans le navigateur → Vous devriez voir des logs dans le terminal.

---

### Test 2 : Tester le webhook depuis Stripe Dashboard

1. Allez sur : https://dashboard.stripe.com/webhooks
2. Votre webhook → **"Send test webhook"**
3. Sélectionnez : `payment_intent.succeeded`
4. Cliquez sur **"Send test webhook"**

**Résultat attendu** :
- ✅ Dans Stripe : "200 Success"
- ✅ Dans votre terminal serveur : "✅ Transaction enregistrée"
- ✅ Dans `transactions.json` : Nouvelle transaction

**Si ça ne marche pas** → Le problème est la connexion entre Stripe et votre serveur (ngrok ou URL).

---

## 📋 Checklist Rapide

Répondez à ces questions :

1. ✅ Serveur actif ? (terminal avec `npm start`)
2. ✅ Ngrok actif ? (terminal avec `ngrok http 4100`)
3. ✅ URL webhook correcte dans Stripe Dashboard ?
4. ✅ Webhook secret correct dans `.env` ?
5. ✅ Avez-vous vérifié dans Stripe Dashboard → Payments → Votre paiement → Events ?

---

## 🆘 Informations à Me Donner

Pour vous aider, dites-moi :

1. **Le serveur tourne-t-il ?** (terminal actif avec `npm start`)
2. **Ngrok est-il actif ?** (URL affichée)
3. **Dans Stripe Dashboard → Webhooks → Recent events**, voyez-vous votre paiement ?
4. **Quel statut** : "200 Success", "Failed", ou rien ?
5. **Quel type de paiement** : Pricing Table, Buy Button, ou autre ?

---

**Vérifiez d'abord si ngrok est actif et si l'URL dans Stripe Dashboard est correcte !**

