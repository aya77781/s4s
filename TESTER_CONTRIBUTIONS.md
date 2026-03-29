# 🧪 Tester les Contributions Automatiques

## ✅ Prérequis

1. ✅ Serveur actif : `npm start` (port 4100)
2. ✅ Stripe CLI installé : `.\stripe.exe --version`
3. ✅ Stripe CLI connecté : `.\stripe.exe login`
4. ✅ Un utilisateur créé avec un email (ex: `test@example.com`)

---

## 🧪 Test 1 : Avec Stripe CLI (Rapide)

### Étape 1 : Préparer l'environnement

**Terminal 1 - Serveur** :
```bash
npm start
```
Attendez : `✅ Serveur S4S en cours d'exécution sur http://localhost:4100`

**Terminal 2 - Stripe CLI Listen** :
```bash
.\stripe.exe listen --forward-to http://localhost:4100/api/payments/webhook
```
Vous verrez :
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```
⚠️ **Copiez ce secret** et mettez-le dans `.env` si vous voulez l'utiliser (sinon utilisez celui du dashboard).

**Terminal 3 - Tester un paiement** :
```bash
.\stripe.exe trigger payment_intent.succeeded
```

---

### Étape 2 : Vérifier les résultats

1. **Dans le Terminal 1 (serveur)**, vous devriez voir :
   ```
   ✅ Transaction enregistrée: 1234567890 userId: X amount: Y
   ✅ Contribution enregistrée pour userId X: Y€
   ```

2. **Vérifiez les fichiers** :
   - `backend/data/transactions.json` → Transaction enregistrée
   - `backend/data/contributions.json` → Contribution ajoutée automatiquement

---

## 🧪 Test 2 : Vrai Paiement (Plus Réaliste)

### Étape 1 : Créer un compte utilisateur

1. Allez sur votre site : `http://localhost:4100` ou votre URL ngrok
2. Cliquez sur **"Sign Up"** ou **"Register"**
3. Créez un compte avec :
   - Nom : `Test User`
   - Email : `test@example.com` (utilisez un email que vous pouvez utiliser pour payer)
   - Rôle : `Donor` ou `Alumni`
   - Mot de passe : votre choix

⚠️ **Important** : Notez l'email que vous utilisez !

---

### Étape 2 : Utiliser votre lien Stripe

1. Allez sur votre interface **Alumni** ou **Donor**
2. Utilisez le **Stripe Pricing Table** ou le **Stripe Buy Button**
3. Lors du paiement, **utilisez EXACTEMENT le même email** que lors de la création du compte

Exemple :
- Compte créé avec : `test@example.com`
- Paiement Stripe avec : `test@example.com` ✅

---

### Étape 3 : Effectuer le paiement

1. Remplissez le formulaire de paiement Stripe
2. Utilisez une **carte de test Stripe** :
   - Numéro : `4242 4242 4242 4242`
   - Date d'expiration : N'importe quelle date future
   - CVC : N'importe quel 3 chiffres
3. **Email** : Utilisez le même email que votre compte
4. Complétez le paiement

---

### Étape 4 : Vérifier les résultats

**Dans le Terminal 1 (serveur)**, vous devriez voir :
```
✅ UserId trouvé via email customer: 1 pour test@example.com
✅ Transaction enregistrée: ... userId: 1 amount: X
✅ Contribution enregistrée pour userId 1: X€
```

**Vérifiez les fichiers** :
- `backend/data/transactions.json` → Transaction avec votre userId
- `backend/data/contributions.json` → Contribution avec votre userId et montant

**Vérifiez l'interface** :
- Allez sur votre interface Alumni/Donor
- Section "History" → Vous devriez voir votre contribution !

---

## 🧪 Test 3 : Test avec Email Différent

Testez ce qui se passe si l'email ne correspond pas :

1. Créez un compte avec : `user1@example.com`
2. Faites un paiement avec : `user2@example.com` (email différent)
3. Résultat attendu :
   - ✅ Transaction enregistrée (mais avec `userId: null`)
   - ⚠️ Contribution **NON** ajoutée (pas de match)

---

## 📋 Checklist de Test

- [ ] Serveur actif (`npm start`)
- [ ] Un utilisateur créé avec un email
- [ ] Test avec Stripe CLI ou vrai paiement
- [ ] Email du paiement = Email du compte
- [ ] Vérification dans `transactions.json`
- [ ] Vérification dans `contributions.json`
- [ ] Vérification dans l'interface utilisateur (History)

---

## 🔍 Vérifications Manuelles

### Lire transactions.json :
```bash
type backend\data\transactions.json
```

### Lire contributions.json :
```bash
type backend\data\contributions.json
```

### Vérifier qu'un utilisateur existe :
```bash
type backend\data\users.json
```

---

## 🎯 Résultat Attendu

### Si email correspond :
- ✅ Transaction avec `userId: X`
- ✅ Contribution avec `userId: X` et `amount: Y`
- ✅ Visible dans l'historique de l'utilisateur

### Si email ne correspond pas :
- ✅ Transaction avec `userId: null`
- ⚠️ Pas de contribution ajoutée
- ⚠️ Pas visible dans l'historique de l'utilisateur

---

## 🆘 Problèmes Courants

### "Aucun userId trouvé"
→ Vérifiez que l'email du paiement correspond exactement à l'email du compte
→ Vérifiez que l'utilisateur existe dans `users.json`

### "Contribution non ajoutée"
→ Normal si aucun userId n'a été trouvé
→ Vérifiez les logs du serveur pour voir pourquoi

### "Transaction pas reçue"
→ Vérifiez que Stripe CLI ou ngrok tourne
→ Vérifiez que le webhook secret est correct dans `.env`

---

**Testez maintenant et dites-moi ce que vous voyez ! 🚀**

