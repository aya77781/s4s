# Comment voir les transactions Stripe

## ✅ La section Transactions est déjà créée dans l'interface Admin !

## Méthode 1 : Via l'Interface Admin (RECOMMANDÉ)

1. **Connectez-vous en tant qu'Admin**
   - Allez sur `http://localhost:4100/login.html`
   - Connectez-vous avec un compte Admin

2. **Accédez à la section Transactions**
   - Dans le menu de gauche, cliquez sur **"Transactions"**
   - Toutes les transactions Stripe apparaîtront ici automatiquement

3. **Vous verrez :**
   - ID de la transaction
   - Nom de l'utilisateur
   - Email
   - Montant
   - Devise
   - Type (One-time ou Monthly)
   - Statut (Completed, Failed, Pending)
   - Source (Stripe ou Local)
   - Date

---

## Méthode 2 : Générer une transaction de test (Stripe CLI)

Pour tester sans faire de vrai paiement :

### Prérequis :
1. ✅ Le serveur doit être démarré : `npm start`
2. ✅ Stripe CLI doit être actif : `.\stripe.exe listen --forward-to http://localhost:4100/api/payments/webhook`

### Commandes :

1. **Démarrer le serveur** (Terminal 1) :
   ```bash
   npm start
   ```

2. **Lancer Stripe CLI** (Terminal 2) :
   ```bash
   .\stripe.exe listen --forward-to http://localhost:4100/api/payments/webhook
   ```

3. **Générer une transaction de test** (Terminal 3) :
   ```bash
   .\stripe.exe trigger payment_intent.succeeded
   ```

4. **Vérifier les logs du serveur** :
   Vous devriez voir :
   ```
   ✅ Transaction enregistrée: ... amount: X email: Y
   ✅ Contribution enregistrée pour userId X: Y EUR
   ```

5. **Voir dans l'interface Admin** :
   - Allez sur la section "Transactions"
   - La transaction de test apparaîtra avec le badge "Stripe"

---

## Méthode 3 : Faire un vrai paiement

1. **Utilisez le lien Stripe** :
   ```
   https://buy.stripe.com/3cI9ATdSbemY4pFaHxdfG02
   ```

2. **Important** : Entrez **votre email** (celui de votre compte dans la plateforme)

3. **Effectuez le paiement**

4. **La transaction apparaîtra automatiquement** :
   - Dans `backend/data/transactions.json`
   - Dans `backend/data/contributions.json`
   - Dans l'interface Admin > Transactions

---

## Vérifications

### Si aucune transaction n'apparaît :

1. **Vérifiez que le serveur est démarré** :
   ```bash
   npm start
   ```

2. **Vérifiez que Stripe CLI écoute** (pour les tests) :
   ```bash
   .\stripe.exe listen --forward-to http://localhost:4100/api/payments/webhook
   ```

3. **Vérifiez le fichier `.env`** :
   ```
   STRIPE_SECRET_KEY=...
   STRIPE_WEBHOOK_SECRET=...
   ```

4. **Vérifiez les logs du serveur** :
   - Si vous voyez `✅ Transaction enregistrée`, c'est bon !
   - Si vous voyez des erreurs, regardez les messages

5. **Vérifiez les fichiers JSON** :
   ```bash
   type backend\data\transactions.json
   type backend\data\contributions.json
   ```

---

## Filtrage dans l'interface Admin

La section Transactions dans l'Admin vous permet de :
- ✅ Voir toutes les transactions Stripe
- ✅ Rechercher par nom, email, montant
- ✅ Filtrer par type, statut, devise
- ✅ Voir les détails d'une transaction
- ✅ Exporter les données

---

## Notes importantes

- ⚠️ Les transactions Stripe ont le badge **"Stripe"** bleu
- ⚠️ Les transactions locales (ancien système) ont le badge **"Local"**
- ⚠️ Les transactions sont automatiquement liées à l'utilisateur via son **email**
- ⚠️ Si l'email ne correspond à aucun compte, la transaction est quand même enregistrée mais sans userId

---

## Problème : Aucune transaction n'apparaît

1. **Vérifiez que le webhook fonctionne** :
   - Faites un test : `.\stripe.exe trigger payment_intent.succeeded`
   - Regardez les logs du serveur

2. **Vérifiez que le serveur peut écrire dans les fichiers** :
   - Vérifiez que `backend/data/` existe
   - Vérifiez les permissions d'écriture

3. **Vérifiez les logs du serveur** pour les erreurs

