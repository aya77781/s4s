# Configuration du Webhook Stripe

## 📋 Vue d'ensemble

Le webhook Stripe permet d'identifier automatiquement les paiements des donors/alumni via leur adresse email et de les lier à leur compte dans la plateforme.

## 🔧 Configuration

### 1. URL du Webhook

L'URL du webhook est : `https://votre-domaine.com/api/payments/webhook`

**En développement local :** Utilisez un service comme ngrok :
```bash
ngrok http 4100
```
L'URL sera : `https://xxxxx.ngrok.io/api/payments/webhook`

### 2. Configuration dans Stripe Dashboard

1. Allez sur [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Cliquez sur "Add endpoint"
3. Collez l'URL de votre webhook
4. Sélectionnez les événements à écouter :
   - `payment_intent.succeeded`
   - `invoice.payment_succeeded`
   - `charge.succeeded` (optionnel)

### 3. Secret du Webhook

Après la création, Stripe vous donnera un **Signing Secret** (commence par `whsec_...`).

Ajoutez-le dans votre fichier `.env` :
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 4. Variables d'environnement nécessaires

Assurez-vous d'avoir ces variables dans votre `.env` :
```
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## 🔍 Comment fonctionne l'identification par email

Le webhook essaie d'identifier le `userId` dans cet ordre :

1. **Metadata du PaymentIntent/Subscription** : Si `metadata.userId` existe
2. **Email du Customer Stripe** : Récupère le customer, puis cherche l'email dans votre base de données
3. **Email de facturation** : Cherche dans `billing_details.email` ou `receipt_email`
4. **Email de l'invoice** : Pour les abonnements, utilise `invoice.customer_email`

### ✅ Transaction enregistrée avec succès si :
- L'email du paiement correspond à un utilisateur existant
- Le `userId` est trouvé et enregistré dans `transactions.json`
- Le montant, la date et l'email sont sauvegardés

### ⚠️ Transaction enregistrée sans userId si :
- L'email ne correspond à aucun utilisateur
- La transaction est quand même sauvegardée avec `userId: null` et l'email

## 📊 Format des transactions

Chaque transaction enregistrée contient :
```json
{
  "id": 1234567890,
  "stripePaymentIntentId": "pi_xxxxx",
  "userId": 1,
  "amount": 50.00,
  "currency": "usd",
  "status": "completed",
  "type": "one_time",
  "description": "Donation",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "email": "donor@example.com",
  "identifiedByEmail": true
}
```

## 🔐 Sécurité

- Le webhook vérifie la signature Stripe si `STRIPE_WEBHOOK_SECRET` est configuré
- En développement, le webhook fonctionne sans vérification de signature (mais c'est moins sécurisé)
- En production, **TOUJOURS** utiliser le secret webhook

## 🧪 Tester le webhook

1. Faites un test de paiement via votre lien Stripe Buy Button
2. Vérifiez les logs du serveur : vous devriez voir :
   ```
   ✅ Transaction enregistrée: 1234567890 userId: 1 amount: 50
   ✅ UserId trouvé via email customer: 1 pour donor@example.com
   ```
3. Vérifiez le fichier `backend/data/transactions.json`

## 📝 Note importante

**Pour que l'identification par email fonctionne :**
- Le donor/alumni doit utiliser **exactement la même adresse email** lors du paiement Stripe que celle utilisée lors de la création de son compte
- L'email est comparé en minuscules (case-insensitive)

