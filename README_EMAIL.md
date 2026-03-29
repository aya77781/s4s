# Configuration Email - Instructions

Pour recevoir automatiquement les emails de contact depuis l'interface Partner, vous devez configurer un mot de passe d'application Gmail.

## Étapes pour obtenir un mot de passe d'application Gmail

1. **Activez l'authentification à 2 facteurs** (si ce n'est pas déjà fait)
   - Allez sur https://myaccount.google.com/
   - Sécurité > Authentification à 2 facteurs
   - Activez-la si nécessaire

2. **Créez un mot de passe d'application**
   - Allez sur https://myaccount.google.com/
   - Sécurité > Authentification à 2 facteurs > Mots de passe des applications
   - Sélectionnez "Mail" comme application
   - Sélectionnez "Autre (nom personnalisé)" comme appareil
   - Entrez "S4S Partner Contact" comme nom
   - Cliquez sur "Générer"
   - **Copiez le mot de passe généré** (16 caractères)

3. **Configurez le fichier .env**
   - Créez un fichier `.env` à la racine du projet (à côté de `package.json`)
   - Ajoutez cette ligne :
     ```
     GMAIL_APP_PASSWORD=votre_mot_de_passe_application_ici
     ```
   - Remplacez `votre_mot_de_passe_application_ici` par le mot de passe généré

4. **Redémarrez le serveur**
   - Arrêtez le serveur (Ctrl+C)
   - Relancez avec `npm start`

## Test

Après configuration, testez en remplissant le formulaire de contact dans l'interface Partner. Vous devriez recevoir un email sur ayaboudhas7@gmail.com avec toutes les informations du formulaire.

