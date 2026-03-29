# 🔍 Trouver stripe.exe

## ⚠️ Problème

`stripe.exe` n'est pas dans ce dossier. Il faut le trouver ou le télécharger.

---

## 📥 Option 1 : Télécharger stripe.exe

1. **Allez sur** : https://github.com/stripe/stripe-cli/releases/latest
2. **Téléchargez** : `stripe_X.X.X_windows_x86_64.zip`
3. **Décompressez** le ZIP
4. **Copiez** `stripe.exe` dans ce dossier :
   ```
   C:\Users\hp\Downloads\projet cdlab\cdl_IKNOVA\Nouveau dossier\S4S\
   ```

---

## 🔍 Option 2 : Chercher stripe.exe

Cherchez dans votre dossier Downloads :
```
C:\Users\hp\Downloads\
```

Ou utilisez la recherche Windows :
- Recherchez "stripe.exe" dans Windows
- Si trouvé, copiez-le dans ce dossier

---

## ✅ Après avoir trouvé/copié stripe.exe

Une fois `stripe.exe` dans ce dossier :

1. **Double-cliquez sur** `DEMARRER_STRIPE_CLI.bat`
   OU
2. **Dans le terminal** :
   ```bash
   .\stripe.exe listen --forward-to http://localhost:4100/api/payments/webhook
   ```

---

## 🔄 Alternative : Utiliser 'stripe' (si dans PATH)

Si Stripe CLI est installé dans le PATH système :

```bash
stripe listen --forward-to http://localhost:4100/api/payments/webhook
```

---

**Trouvez stripe.exe et copiez-le dans ce dossier !**

