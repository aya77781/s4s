# 📥 Installation Manuelle Stripe CLI (Windows)

## Méthode Recommandée : Téléchargement Direct

### Étape 1 : Télécharger Stripe CLI

1. Allez sur : **https://github.com/stripe/stripe-cli/releases/latest**
2. Cherchez la section **"Assets"**
3. Téléchargez : **`stripe_X.X.X_windows_x86_64.zip`** (remplacez X.X.X par la version)

Exemple : `stripe_1.21.9_windows_x86_64.zip`

---

### Étape 2 : Décompresser

1. Décompressez le fichier ZIP
2. Vous obtiendrez un fichier `stripe.exe`

---

### Étage 3 : Placer dans un Dossier Accessible

Créez un dossier (ex: `C:\StripeCLI\`) et placez-y `stripe.exe`

---

### Étape 4 : Ajouter au PATH Windows

1. Recherchez **"Variables d'environnement"** dans Windows
2. Cliquez sur **"Variables d'environnement"**
3. Dans **"Variables système"**, trouvez **"Path"**
4. Cliquez sur **"Modifier"**
5. Cliquez sur **"Nouveau"**
6. Ajoutez le chemin : `C:\StripeCLI` (ou le chemin où vous avez mis stripe.exe)
7. Cliquez sur **"OK"** partout

---

### Étape 5 : Vérifier

Ouvrez un **nouveau terminal** et tapez :

```bash
stripe --version
```

Vous devriez voir : `stripe version X.X.X`

---

## Alternative : Installation dans le Dossier du Projet

Si vous ne voulez pas modifier le PATH :

1. Téléchargez `stripe.exe` comme ci-dessus
2. Placez-le dans votre dossier projet : `C:\Users\hp\Downloads\projet cdlab\cdl_IKNOVA\Nouveau dossier\S4S\`
3. Utilisez-le directement : `.\stripe.exe --version`

---

## Alternative 2 : Via Scoop

Si vous avez Scoop installé :

```powershell
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

---

**Suivez les étapes ci-dessus pour installer Stripe CLI manuellement !**

