# Configuration Stripe pour $forS

## Étapes pour configurer les paiements Stripe

### 1. Créer un compte Stripe

1. Allez sur [https://stripe.com](https://stripe.com)
2. Créez un compte (gratuit)
3. Vérifiez votre compte et activez les paiements

### 2. Récupérer vos clés API

1. Dans votre dashboard Stripe, allez dans **Developers** > **API keys**
2. Vous verrez deux clés :
   - **Publishable key** (commence par `pk_test_` ou `pk_live_`)
   - **Secret key** (commence par `sk_test_` ou `sk_live_`)

### 3. Configurer le fichier .env

Créez un fichier `.env` à la racine du projet (à côté de `package.json`) :

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_votre_clé_secrète_ici
STRIPE_PUBLISHABLE_KEY=pk_test_votre_clé_publique_ici

# Optionnel : pour les webhooks en production
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_webhook_ici
```

**⚠️ IMPORTANT :**
- Ne partagez JAMAIS votre Secret Key publiquement
- Le fichier `.env` est déjà dans `.gitignore` pour éviter qu'il soit commité
- Utilisez `pk_test_` et `sk_test_` pour les tests (mode développement)
- Utilisez `pk_live_` et `sk_live_` pour la production

### 4. Configurer les clés côté frontend

Les clés Stripe sont maintenant configurées dans le code :

✅ **Clé publique configurée** : `pk_live_51Qxyc4DfbY6lGYcLPMY6nNnQs6ZhGYjfY5l2ZjdY1Anrg0rsIhRlfSXUooCa7yjRhCE7BO80IpkzaMV5yPchTj1a00brHti2LN`

**Fichiers concernés** :
- `public/alumni.js` (ligne ~310)
- `public/donor.js` (ligne ~258)

⚠️ **Important** : Vous devez aussi configurer la **clé secrète** (Secret Key) dans le fichier `.env` côté backend :
```env
STRIPE_SECRET_KEY=sk_live_votre_clé_secrète_ici
```

**Pour trouver votre Secret Key** :
1. Allez sur https://dashboard.stripe.com/apikeys
2. Copiez votre **Secret key** (commence par `sk_live_`)
3. Ajoutez-la dans le fichier `.env` à la racine du projet

### 5. Configurer les webhooks (optionnel, pour la production)

Les webhooks permettent à Stripe de notifier votre serveur des événements de paiement :

1. Dans Stripe Dashboard, allez dans **Developers** > **Webhooks**
2. Cliquez sur **Add endpoint**
3. URL : `https://votre-domaine.com/api/payments/webhook`
4. Sélectionnez les événements :
   - `payment_intent.succeeded`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
5. Copiez le **Signing secret** et ajoutez-le dans `.env` comme `STRIPE_WEBHOOK_SECRET`

### 5. Intégration Stripe Pricing Table

Un **Stripe Pricing Table** est maintenant intégré dans les interfaces Alumni et Donor. Ce tableau de prix utilise :
- **Pricing Table ID** : `prctbl_1SOiKADfbY6lGYcLRu8DVxNh`
- **Publishable Key** : `pk_live_51Qxyc4DfbY6lGYcLPMY6nNnQs6ZhGYjfY5l2ZjdY1Anrg0rsIhRlfSXUooCa7yjRhCE7BO80IpkzaMV5yPchTj1a00brHti2LN`

Le script est chargé automatiquement dans :
- `public/alumni.html`
- `public/donor.html`

**Pour personnaliser les couleurs du Pricing Table** :
1. Allez sur [https://dashboard.stripe.com/payment-links](https://dashboard.stripe.com/payment-links)
2. Sélectionnez votre Pricing Table
3. Allez dans "Appearance" > "Colors"
4. Configurez :
   - **Primary color** : `#02aeb2`
   - **Border radius** : `12px`
   - **Text color** : `#ffffff` (pour les boutons)

### 6. Tester avec les cartes de test

Stripe fournit des cartes de test pour le mode développement :

- **Carte qui fonctionne** : `4242 4242 4242 4242`
- **Date d'expiration** : N'importe quelle date future (ex: `12/34`)
- **CVC** : N'importe quel code à 3 chiffres (ex: `123`)
- **Code postal** : N'importe quel code postal valide (ex: `12345`)

**Cartes pour tester différents scénarios :**
- `4000 0000 0000 0002` : Carte refusée (insufficient funds)
- `4000 0000 0000 9995` : Carte refusée (generic decline)

### 7. Démarrer le serveur

```bash
npm start
```

Le serveur démarrera sur `http://localhost:4100`

### 8. Fonctionnalités implémentées

- ✅ **Paiements ponctuels** : Pour les dons uniques (Donors)
- ✅ **Abonnements récurrents** : Pour les contributions mensuelles (Alumni)
- ✅ **Gestion des abonnements** : Affichage du statut, annulation
- ✅ **Historique des transactions** : Stocké dans `backend/data/transactions.json`
- ✅ **Webhooks** : Pour synchroniser les paiements (optionnel)

### 9. Structure des transactions

Les transactions sont stockées dans `backend/data/transactions.json` :

```json
{
  "id": 1234567890,
  "stripePaymentIntentId": "pi_...",
  "userId": 1,
  "amount": 50.00,
  "currency": "usd",
  "status": "completed",
  "type": "one_time" | "subscription",
  "description": "Donation to $forS",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "metadata": {}
}
```

### 10. Dépannage

**Erreur : "Stripe is not configured"**
- Vérifiez que `STRIPE_SECRET_KEY` est défini dans `.env`
- Redémarrez le serveur après avoir modifié `.env`

**Erreur : "Payment failed"**
- Vérifiez que vous utilisez une carte de test valide
- Vérifiez les logs du serveur pour plus de détails

**Les webhooks ne fonctionnent pas**
- En développement local, utilisez [Stripe CLI](https://stripe.com/docs/stripe-cli) pour forarder les webhooks
- En production, assurez-vous que votre URL webhook est accessible publiquement

### 11. Passer en production

1. Activez votre compte Stripe en mode "Live"
2. Remplacez les clés de test (`pk_test_`, `sk_test_`) par les clés de production (`pk_live_`, `sk_live_`)
3. Configurez les webhooks avec votre URL de production
4. Testez avec de vraies petites transactions d'abord
5. Surveillez le dashboard Stripe pour les transactions

---

**Besoin d'aide ?** Consultez la [documentation Stripe](https://stripe.com/docs) ou les [forums de support](https://support.stripe.com/).

