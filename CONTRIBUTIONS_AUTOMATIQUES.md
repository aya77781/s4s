# 💰 Contributions Automatiques depuis Stripe

## ✅ Fonctionnalité Implémentée

Désormais, **à chaque fois qu'un utilisateur effectue un paiement via Stripe**, le système :

1. ✅ **Identifie l'utilisateur par email** : Match avec l'email utilisé dans le paiement Stripe
2. ✅ **Enregistre la transaction** : Dans `backend/data/transactions.json`
3. ✅ **Ajoute automatiquement la contribution** : Dans `backend/data/contributions.json`

---

## 🔍 Comment ça fonctionne ?

### Lors d'un paiement Stripe :

1. **L'utilisateur paie** avec son email (via Stripe Buy Button ou Pricing Table)
2. **Stripe envoie un webhook** vers votre serveur
3. **Le serveur identifie l'utilisateur** :
   - Cherche dans `users.json` l'email correspondant
   - Compare les emails (en minuscules, case-insensitive)
4. **Si un utilisateur est trouvé** :
   - ✅ Enregistre dans `transactions.json`
   - ✅ **Ajoute automatiquement dans `contributions.json`**
5. **Si aucun utilisateur n'est trouvé** :
   - ✅ Enregistre quand même dans `transactions.json` (avec `userId: null`)
   - ⚠️ N'ajoute PAS dans contributions (car pas d'utilisateur associé)

---

## 📋 Structure des Contributions

Chaque contribution enregistrée automatiquement contient :

```json
{
  "id": 1234567890,
  "userId": 1,
  "amount": 50.00,
  "type": "one_time",
  "description": "Donation via Stripe",
  "stripePaymentIntentId": "pi_xxxxx",
  "stripeChargeId": "ch_xxxxx",
  "email": "user@example.com",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "status": "completed"
}
```

---

## 🔑 Points Importants

### ✅ Email Doit Correspondre

Pour que la contribution soit automatiquement liée à un utilisateur :
- ✅ L'email utilisé dans le paiement Stripe **DOIT** être le même que celui utilisé lors de la création du compte
- ✅ Les emails sont comparés en minuscules (case-insensitive)
- ✅ Exemple : `User@Example.com` = `user@example.com` ✅

### ⚠️ Si l'Email Ne Correspond Pas

Si l'email du paiement ne correspond à aucun utilisateur :
- ✅ La transaction est quand même enregistrée dans `transactions.json`
- ⚠️ Mais **PAS** dans `contributions.json` (car pas de `userId`)
- 💡 Vous pouvez manuellement ajouter la contribution plus tard si nécessaire

---

## 🧪 Test

### Test 1 : Avec Stripe CLI

1. Assurez-vous qu'un utilisateur existe avec l'email `test@example.com`
2. Lancez le serveur : `npm start`
3. Lancez Stripe CLI : `.\stripe.exe listen --forward-to http://localhost:4100/api/payments/webhook`
4. Dans un autre terminal : `.\stripe.exe trigger payment_intent.succeeded`
5. Vérifiez :
   - Dans `transactions.json` : Transaction enregistrée
   - Dans `contributions.json` : Contribution ajoutée (si email correspond)

### Test 2 : Vrai Paiement

1. Créez un compte utilisateur avec un email (ex: `donor@example.com`)
2. Utilisez votre lien Stripe Buy Button ou Pricing Table
3. Payer avec **exactement le même email** (`donor@example.com`)
4. Après le paiement, vérifiez `contributions.json` : la contribution devrait être là !

---

## 📊 Voir les Contributions d'un Utilisateur

### API Endpoint

```
GET /api/contributions/:userId
```

Retourne toutes les contributions d'un utilisateur spécifique.

### Frontend

Les interfaces Alumni et Donor chargent déjà les contributions via :
- `GET /api/contributions/:userId`
- Affichées dans la section "History"

---

## 🔄 Flux Complet

```
Utilisateur paie via Stripe
    ↓
Email saisi dans le formulaire de paiement Stripe
    ↓
Stripe envoie webhook avec email
    ↓
Serveur cherche l'utilisateur par email dans users.json
    ↓
Si trouvé → userId identifié
    ↓
Enregistrement dans transactions.json ✅
    ↓
Enregistrement automatique dans contributions.json ✅
    ↓
L'utilisateur voit sa contribution dans son historique !
```

---

## 📝 Logs du Serveur

Quand un paiement est reçu et qu'un utilisateur est trouvé, vous verrez :

```
✅ Transaction enregistrée: 1234567890 userId: 1 amount: 50
✅ Contribution enregistrée pour userId 1: 50€
```

Si aucun utilisateur n'est trouvé :

```
✅ Transaction enregistrée: 1234567890 userId: null amount: 50
⚠️  Aucun userId trouvé pour cette transaction (email: unknown@example.com). Contribution non enregistrée.
```

---

## ✅ C'est Tout !

Les contributions sont maintenant **automatiquement ajoutées** quand un utilisateur paie via Stripe et que son email correspond à un compte existant.

**Testez avec un vrai paiement pour voir la magie opérer ! 🎉**

