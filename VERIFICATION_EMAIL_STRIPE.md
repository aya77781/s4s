# ✅ Vérification : Récupération de l'Email depuis Stripe

## 🎯 OUI, On Peut Récupérer l'Email !

Stripe récupère **toujours** l'email lors d'un paiement, et votre système est configuré pour l'utiliser.

---

## 📧 Où Stripe Récupère l'Email

Quand quelqu'un paie via Stripe, l'email peut être trouvé dans **3 endroits** :

### 1. Customer Email (Si un customer existe)
```javascript
customer.email
```
- Quand l'utilisateur utilise le Pricing Table ou Buy Button
- Stripe crée un "customer" avec l'email fourni

### 2. Billing Email (Email de facturation)
```javascript
paymentIntent.charges.data[0].billing_details.email
```
- Email saisi dans le formulaire de paiement

### 3. Receipt Email
```javascript
paymentIntent.receipt_email
```
- Email pour l'envoi du reçu

---

## 🔍 Votre Code Actuel

Votre système cherche l'email dans **cet ordre** :

1. ✅ **Customer Email** : `customer.email`
2. ✅ **Billing Email** : `billing_details.email`
3. ✅ **Receipt Email** : `receipt_email`

**Si un email est trouvé**, le système :
- ✅ Cherche l'utilisateur dans `users.json` par email
- ✅ Si trouvé → Enregistre la transaction avec `userId`
- ✅ **Et ajoute automatiquement la contribution !**

---

## 🧪 Test Avant de Payer (Recommandé)

### Test 1 : Vérifier qu'un utilisateur existe

Vérifiez que vous avez un compte avec un email :

```bash
type backend\data\users.json
```

Vous devriez voir vos utilisateurs avec leurs emails (ex: `alumni@gmail.com`).

---

### Test 2 : Test avec Stripe Dashboard (Gratuit)

**SANS PAYER**, vous pouvez tester :

1. Allez sur : https://dashboard.stripe.com/webhooks
2. Cliquez sur votre webhook
3. Cliquez sur **"Send test webhook"**
4. Sélectionnez : `payment_intent.succeeded`
5. **Dans les paramètres du test**, vous pouvez modifier l'email :
   - Modifiez `customer.email` ou `billing_details.email`
   - Mettez l'email de votre compte (ex: `alumni@gmail.com`)
6. Envoyez le webhook

**Vérifiez ensuite** :
```bash
type backend\data\contributions.json
```

Si vous voyez une contribution ajoutée, **ça fonctionne !** ✅

---

## 💳 Quand Vous Payez Vraiment

### Ce Qui Se Passe :

1. **Vous remplissez le formulaire Stripe**
   - Stripe vous demande votre email
   - ⚠️ **IMPORTANT** : Utilisez **EXACTEMENT** le même email que votre compte

2. **Vous payez**
   - Stripe enregistre le paiement avec votre email

3. **Stripe envoie le webhook** vers votre serveur
   - Avec l'email que vous avez fourni

4. **Votre serveur** :
   - ✅ Reçoit l'email depuis Stripe
   - ✅ Cherche dans `users.json`
   - ✅ Trouve votre compte (si email correspond)
   - ✅ Enregistre la transaction
   - ✅ **Ajoute la contribution automatiquement !**

---

## ⚠️ Important : Email Doit Correspondre

**Exemple** :

❌ **Ne fonctionne PAS** :
- Compte créé avec : `alumni@gmail.com`
- Paiement avec : `ALUMNI@GMAIL.COM` (même si majuscules)
- → **ÇA FONCTIONNE** (comparaison en minuscules)

❌ **Ne fonctionne PAS** :
- Compte créé avec : `alumni@gmail.com`
- Paiement avec : `alumni2@gmail.com` (email différent)
- → Pas de match, contribution non ajoutée

✅ **FONCTIONNE** :
- Compte créé avec : `alumni@gmail.com`
- Paiement avec : `alumni@gmail.com` (identique)
- → Match trouvé, contribution ajoutée !

---

## 🔒 Sécurité : Les Paiements sont Vraiment Reçus

**Oui, vous recevrez vraiment l'argent !**

- ✅ Stripe est un service de paiement professionnel
- ✅ Les paiements sont traités par Stripe
- ✅ L'argent arrive dans votre compte Stripe
- ✅ Vous pouvez le transférer vers votre compte bancaire

**Votre système** enregistre juste :
- ✅ Qui a payé (email → userId)
- ✅ Combien (montant)
- ✅ Quand (date)
- ✅ Pour l'afficher dans l'historique

---

## 📋 Checklist Avant de Payer

- [ ] Un compte utilisateur créé avec un email
- [ ] Le serveur tourne (`npm start`)
- [ ] Ngrok ou webhook configuré (si nécessaire)
- [ ] Notez l'email de votre compte
- [ ] **Utilisez EXACTEMENT le même email** lors du paiement

---

## 🧪 Test Gratuit (Sans Payer)

**Avant de payer**, testez gratuitement :

1. Allez sur Stripe Dashboard → Webhooks
2. Votre webhook → "Send test webhook"
3. Modifiez l'email dans le test pour correspondre à votre compte
4. Envoyez le test
5. Vérifiez `contributions.json`

**Si ça marche avec le test, ça marchera avec un vrai paiement !** ✅

---

## ✅ Conclusion

**OUI**, vous pouvez récupérer l'argent et l'associer à l'utilisateur par email :

1. ✅ Stripe récupère toujours l'email
2. ✅ Votre système cherche l'utilisateur par email
3. ✅ Si trouvé → Contribution automatiquement ajoutée
4. ✅ L'argent arrive bien dans Stripe
5. ✅ Vous pouvez le transférer vers votre banque

**Testez d'abord avec le test webhook (gratuit) pour être sûr !** 🧪

