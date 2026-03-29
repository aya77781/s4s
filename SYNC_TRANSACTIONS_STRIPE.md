# Comment récupérer les transactions Stripe dans transactions.json

## ✅ Le système est maintenant configuré !

## Méthode 1 : Synchronisation automatique (RECOMMANDÉ)

1. **Redémarrez le serveur** :
   ```bash
   npm start
   ```

2. **Connectez-vous en tant qu'Admin** :
   - Allez sur `http://localhost:4100/login.html`
   - Email : `admin@gmail.com`
   - Password : `123456`

3. **Allez dans Admin > Transactions** :
   - Les transactions Stripe sont automatiquement récupérées
   - Elles sont automatiquement sauvegardées dans `backend/data/transactions.json`
   - Vous verrez dans les logs du serveur :
     ```
     ✅ X nouvelles transactions Stripe ajoutées
     ✅ Total : Y transactions dans transactions.json
     ```

---

## Méthode 2 : Synchronisation manuelle avec bouton

1. **Dans Admin > Transactions**, cliquez sur le bouton **"Sync from Stripe"**
2. Attendez que la synchronisation se termine
3. Une alerte vous indiquera combien de nouvelles transactions ont été ajoutées
4. Les transactions sont automatiquement sauvegardées dans `transactions.json`

---

## Méthode 3 : Synchronisation via API

Appelez l'endpoint directement :

```bash
# Avec curl (si installé)
curl -X POST http://localhost:4100/api/transactions/sync

# Ou depuis un navigateur/Postman
POST http://localhost:4100/api/transactions/sync
```

Réponse :
```json
{
  "success": true,
  "message": "Synchronisation réussie : X nouvelles transactions ajoutées",
  "total": Y,
  "new": X
}
```

---

## Vérification

Après synchronisation, vérifiez le fichier :

```bash
type backend\data\transactions.json
```

Vous devriez voir toutes vos transactions Stripe avec :
- ID de transaction
- Montant
- Email du client
- userId (si l'email correspond à un compte)
- Date
- Type (one_time ou subscription)
- Statut
- IDs Stripe (PaymentIntent, Charge, Subscription, Invoice)

---

## Ce qui est récupéré depuis Stripe

✅ **Payment Intents** : Tous les paiements uniques réussis
✅ **Subscriptions** : Tous les abonnements actifs et annulés
✅ **Invoices** : Toutes les factures payées des abonnements
✅ **Informations complètes** : Montant, email, userId (si trouvé), date, devise

---

## Configuration requise

⚠️ **Important** : Assurez-vous que `.env` contient :
```
STRIPE_SECRET_KEY=sk_test_... (ou sk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_...
```

Le système utilise `process.env.STRIPE_SECRET_KEY` pour se connecter à Stripe.

---

## Notes

- Les transactions sont sauvegardées **automatiquement** à chaque accès à Admin > Transactions
- Les doublons sont évités (comparaison par ID Stripe)
- Les transactions locales (sans ID Stripe) sont conservées
- La synchronisation peut prendre quelques secondes selon le nombre de transactions

---

## Problème : Aucune transaction n'apparaît

1. **Vérifiez que le serveur est démarré** : `npm start`
2. **Vérifiez les logs du serveur** pour les erreurs
3. **Vérifiez que STRIPE_SECRET_KEY est dans .env**
4. **Vérifiez que vous avez des transactions dans votre compte Stripe**
5. **Essayez le bouton "Sync from Stripe"** pour forcer la synchronisation

---

## Logs attendus

Quand vous ouvrez Admin > Transactions ou cliquez sur "Sync from Stripe" :

```
🔄 Synchronisation des transactions Stripe...
📥 Récupération des Payment Intents...
📥 Récupération des Subscriptions...
✅ X nouvelles transactions Stripe ajoutées
✅ Total : Y transactions dans transactions.json
```

