# Utilisation des Webhooks Stripe en Production (après hébergement)

## ✅ **Oui, c'est BEAUCOUP plus facile après hébergement !**

## 🎯 **Avantages d'un hébergement permanent**

### 1. **URL Fixe et Permanente**
- ✅ URL stable : `https://votre-domaine.com/api/payments/webhook`
- ❌ Plus besoin de ngrok (URL change à chaque redémarrage)
- ✅ Pas besoin de reconfigurer le webhook à chaque session

### 2. **Disponibilité 24/7**
- ✅ Le webhook fonctionne même si votre PC est éteint
- ✅ Stripe peut envoyer les événements à tout moment
- ✅ Plus de problème de connexion ngrok perdue

### 3. **Sécurité Renforcée**
- ✅ HTTPS par défaut (obligatoire pour Stripe)
- ✅ Pas d'URLs temporaires partagées
- ✅ SSL/TLS automatique

## 📋 **Configuration après hébergement**

### **Étape 1 : Obtenir votre URL de production**

Après avoir hébergé votre site, vous aurez une URL comme :
```
https://votre-app.render.com/api/payments/webhook
```
ou
```
https://votre-domaine.com/api/payments/webhook
```

### **Étape 2 : Configurer dans Stripe Dashboard**

1. **Allez sur Stripe Dashboard** :
   - https://dashboard.stripe.com/webhooks

2. **Créez un nouveau webhook** :
   - Cliquez sur **"Add endpoint"**
   - Collez votre URL : `https://votre-domaine.com/api/payments/webhook`
   - Cliquez sur **"Add endpoint"**

3. **Sélectionnez les événements** :
   - ✅ `payment_intent.succeeded` - Pour les paiements uniques
   - ✅ `invoice.payment_succeeded` - Pour les abonnements
   - ✅ `charge.succeeded` (optionnel)
   - ✅ `customer.subscription.deleted` (optionnel)
   - ✅ `invoice.payment_failed` (optionnel)

4. **Récupérez le Signing Secret** :
   - Après création, Stripe vous donne un secret qui commence par `whsec_...`
   - Copiez ce secret

### **Étape 3 : Ajouter le secret dans votre hébergement**

Selon votre hébergeur (Render, Railway, Vercel, etc.) :

**Render.com** :
- Allez dans **Settings > Environment Variables**
- Ajoutez : `STRIPE_WEBHOOK_SECRET` = `whsec_xxxxxxxxxxxxx`

**Railway** :
- Allez dans **Variables**
- Ajoutez : `STRIPE_WEBHOOK_SECRET` = `whsec_xxxxxxxxxxxxx`

**Vercel** :
- Allez dans **Settings > Environment Variables**
- Ajoutez : `STRIPE_WEBHOOK_SECRET` = `whsec_xxxxxxxxxxxxx`

### **Étape 4 : Variables d'environnement nécessaires**

Assurez-vous d'avoir ces variables dans votre hébergement :
```
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
GMAIL_APP_PASSWORD=xxxxxxxxxxxxx
```

### **Étape 5 : Redémarrer l'application**

Après avoir ajouté les variables, redémarrez votre application.

## 🧪 **Tester le webhook**

1. **Test depuis Stripe Dashboard** :
   - Allez sur votre webhook dans Stripe Dashboard
   - Cliquez sur **"Send test webhook"**
   - Sélectionnez `payment_intent.succeeded`
   - Vérifiez les logs de votre serveur

2. **Test avec un vrai paiement** :
   - Faites un petit paiement test (ex: 1€)
   - Vérifiez que la transaction apparaît dans Admin > Transactions

## 📊 **Comment ça fonctionne**

### **Événements capturés automatiquement** :

1. **Quand un paiement est réussi** :
   - Stripe envoie `payment_intent.succeeded`
   - Le webhook identifie l'utilisateur via son email
   - La transaction est enregistrée dans `transactions.json`
   - L'utilisateur voit le paiement dans son historique

2. **Quand un abonnement est payé** :
   - Stripe envoie `invoice.payment_succeeded`
   - Le webhook identifie l'utilisateur
   - La transaction est enregistrée
   - L'abonnement est mis à jour

## 🔍 **Vérification que ça marche**

### **Dans les logs de votre serveur** :
```
✅ Transaction enregistrée: 1234567890 userId: 1 amount: 50 EUR
✅ UserId trouvé via email customer: 1 pour donor@example.com
✅ Contribution enregistrée pour userId 1: 50 EUR
```

### **Dans Admin > Transactions** :
- Les nouvelles transactions apparaissent automatiquement
- Elles ont un badge "Stripe"
- Elles sont liées à l'utilisateur (si l'email correspond)

## ⚠️ **Points importants**

### **1. Email doit correspondre**
Pour que l'identification fonctionne :
- L'utilisateur doit utiliser **exactement la même adresse email** dans Stripe que celle de son compte
- L'email est comparé en minuscules (case-insensitive)

### **2. HTTPS obligatoire**
- Stripe n'accepte QUE les webhooks HTTPS
- Les hébergeurs fournissent HTTPS automatiquement
- Pas besoin de configuration supplémentaire

### **3. Secret Webhook**
- **JAMAIS** partager votre `STRIPE_WEBHOOK_SECRET`
- Gardez-le secret et sécurisé
- Ne le commitez pas dans Git

## 🆚 **Comparaison : ngrok vs Hébergement**

| Feature | ngrok (local) | Hébergement (production) |
|---------|--------------|-------------------------|
| URL | Change à chaque redémarrage | Fixe et permanente |
| Disponibilité | Seulement si PC allumé | 24/7 |
| Configuration | À refaire à chaque session | Une seule fois |
| Sécurité | HTTPS (mais temporaire) | HTTPS permanent |
| Fiabilité | Dépend de votre connexion | Service professionnel |
| Coût | Gratuit (limité) | Variable selon hébergeur |

## ✅ **Conclusion**

**Oui, après hébergement, les webhooks sont BEAUCOUP plus faciles !**

- ✅ Configuration **une seule fois**
- ✅ Fonctionne **24/7** automatiquement
- ✅ Plus fiable et sécurisé
- ✅ Pas besoin de gérer ngrok

**Il suffit de** :
1. Héberger votre application
2. Configurer le webhook dans Stripe Dashboard (1 clic)
3. Ajouter le `STRIPE_WEBHOOK_SECRET` dans les variables d'environnement
4. C'est tout ! 🎉

