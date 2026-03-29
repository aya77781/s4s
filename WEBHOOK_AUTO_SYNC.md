# 🔄 Synchronisation Automatique des Transactions Stripe

## ✅ Ce qui est déjà configuré

Ton système a maintenant **3 mécanismes** pour récupérer automatiquement les transactions Stripe dans `backend/data/transactions.json` :

### 1. **Webhook Stripe (Temps réel)**
Quand un paiement est effectué, Stripe envoie automatiquement un événement à ton serveur qui enregistre la transaction **immédiatement**.

### 2. **Synchronisation Automatique Périodique**
Toutes les **15 minutes** (configurable), le serveur appelle automatiquement NoCodeAPI pour récupérer toutes les transactions et les ajouter à `transactions.json`.

### 3. **Synchronisation Manuelle**
Le bouton "Sync from Stripe" dans l'admin permet de forcer une synchronisation immédiate.

---

## 🚀 Configuration du Webhook Stripe (Recommandé)

Pour que les transactions soient enregistrées **instantanément** à chaque paiement, configure le webhook Stripe :

### Étape 1 : Obtenir une URL publique pour ton serveur local

En développement local, utilise **ngrok** pour exposer ton serveur :

1. **Installe ngrok** (si pas déjà fait) : https://ngrok.com/download
2. **Démarre ton serveur S4S** : `npm start` ou `START_SERVER.bat`
3. **Dans un autre terminal**, lance ngrok :
   ```bash
   ngrok http 4100
   ```
4. **Copie l'URL HTTPS** affichée (ex: `https://abc123.ngrok.io`)

### Étape 2 : Configurer le webhook dans Stripe Dashboard

1. Va sur https://dashboard.stripe.com/webhooks
2. Clique sur **"Add endpoint"**
3. **Endpoint URL** : `https://abc123.ngrok.io/api/payments/webhook`
   (Remplace `abc123.ngrok.io` par ton URL ngrok)
4. **Events to send** : Sélectionne ces événements :
   - `payment_intent.succeeded`
   - `charge.succeeded`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Clique sur **"Add endpoint"**
6. **Copie le "Signing secret"** (commence par `whsec_...`)

### Étape 3 : Ajouter le secret dans ton `.env`

Crée (ou édite) le fichier `.env` à la racine de `S4S` :

```env
STRIPE_SECRET_KEY=sk_test_........................
STRIPE_WEBHOOK_SECRET=whsec_.....................
AUTO_SYNC_INTERVAL_MINUTES=15
NOCODE_STRIPE_CHARGES_URL=https://v1.nocodeapi.com/aboudhas1/stripe/wGSGvJFKQwNBuvon/charges
```

### Étape 4 : Redémarrer le serveur

```bash
npm start
```

---

## ⚙️ Configuration de la Synchronisation Automatique

Par défaut, la synchronisation automatique se fait **toutes les 15 minutes**.

Pour changer l'intervalle, ajoute dans ton `.env` :

```env
AUTO_SYNC_INTERVAL_MINUTES=5  # Toutes les 5 minutes
# ou
AUTO_SYNC_INTERVAL_MINUTES=30  # Toutes les 30 minutes
```

---

## 📊 Comment ça fonctionne

### Scénario 1 : Paiement effectué → Webhook reçu
1. Un utilisateur paie via Stripe
2. Stripe envoie un événement `payment_intent.succeeded` à ton webhook
3. Le serveur enregistre **immédiatement** la transaction dans `transactions.json`
4. ✅ Transaction visible dans l'admin en temps réel

### Scénario 2 : Webhook manqué (serveur down, erreur réseau)
1. Le webhook n'a pas pu être reçu
2. La synchronisation automatique (toutes les 15 min) récupère la transaction via NoCodeAPI
3. La transaction est ajoutée à `transactions.json`
4. ✅ Aucune transaction n'est perdue

### Scénario 3 : Synchronisation manuelle
1. Tu cliques sur "Sync from Stripe" dans l'admin
2. Le serveur appelle NoCodeAPI immédiatement
3. Toutes les nouvelles transactions sont ajoutées
4. ✅ Tu as le contrôle total

---

## 🔍 Vérification

Pour vérifier que tout fonctionne :

1. **Vérifie les logs du serveur** :
   - Tu devrais voir : `🔄 Synchronisation automatique activée (toutes les 15 minutes)`
   - Après chaque paiement : `✅ Transaction enregistrée: ...`

2. **Vérifie `backend/data/transactions.json`** :
   - Le fichier devrait se remplir automatiquement
   - Chaque transaction a un `stripeId`, `amount`, `currency`, `status`, etc.

3. **Teste un paiement** :
   - Effectue un paiement test via Stripe
   - Vérifie que la transaction apparaît dans `transactions.json` en quelques secondes

---

## 🎯 Résultat Final

Maintenant, **chaque paiement Stripe est automatiquement enregistré** dans `backend/data/transactions.json` sans aucune action manuelle de ta part ! 🎉




