# Guide d'hébergement - $forS Platform

## 📋 Checklist de déploiement

### 1. Variables d'environnement (`.env`)

**✅ DÉJÀ PRÉPARÉ :** Le fichier `ENV_TEMPLATE.txt` contient un modèle.

Créez un fichier `.env` à la racine du projet (copiez depuis `ENV_TEMPLATE.txt`) avec ces variables :

```env
# Port du serveur (adaptez selon votre hébergeur)
PORT=4100

# URL de votre application (pour CORS et webhooks)
APP_URL=https://votre-domaine.com

# Origine CORS (optionnel)
CORS_ORIGIN=https://votre-domaine.com

# Stripe Configuration (Live keys en production)
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Email Configuration (Gmail)
GMAIL_APP_PASSWORD=xxxxxxxxxxxxx
```

**⚠️ IMPORTANT :** 
- Utilisez les clés **LIVE** de Stripe en production (pas les test keys)
- Ne commitez jamais le fichier `.env` (déjà dans `.gitignore`)
- Le port est maintenant dynamique : `process.env.PORT || 4100`

### 2. Configuration du serveur

#### ✅ Modifications déjà faites dans `backend/server.js` :

**a) Port dynamique** (✅ fait) :
```javascript
const PORT = process.env.PORT || 4100;
```

**b) CORS - Autoriser votre domaine** (✅ fait) :
```javascript
const corsOptions = {
  origin: process.env.APP_URL || process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

**c) URLs du frontend** (✅ fait) :
- Tous les fichiers JS utilisent maintenant `window.location.origin + '/api'` automatiquement
- Le fichier `public/config.js` permet de personnaliser l'URL si nécessaire

### 3. URLs du frontend

#### ✅ Déjà configuré automatiquement !

Tous les fichiers JS (`alumni.js`, `donor.js`, `admin.js`, `app.js`, `partner.js`) utilisent maintenant :
```javascript
const API_BASE = window.location.origin + '/api';
```

**Cela signifie :**
- En développement : `http://localhost:4100/api` (si vous servez sur le même port)
- En production : `https://votre-domaine.com/api` (automatiquement)

**Personnalisation** : Si besoin, modifiez `public/config.js`

### 4. Configuration Stripe Webhook

#### Dans Stripe Dashboard :
1. Allez sur [Webhooks](https://dashboard.stripe.com/webhooks)
2. Créez un nouveau webhook endpoint
3. URL : `https://votre-domaine.com/api/payments/webhook`
4. Événements à écouter :
   - `payment_intent.succeeded`
   - `invoice.payment_succeeded`
   - `charge.succeeded`
5. Copiez le **Signing Secret** (`whsec_...`) et ajoutez-le dans `.env`

### 5. Stockage des fichiers (images, JSON)

**Option A : Système de fichiers (actuel)**
- Les fichiers JSON et images sont stockés localement
- Créez le dossier `public/uploads` avec les bonnes permissions
- ✅ Simple mais limité à un seul serveur

**Option B : Base de données (recommandé pour production)**
- Migrer vers MongoDB, PostgreSQL, ou MySQL
- Utiliser S3/Cloud Storage pour les images
- Plus scalable et fiable

### 6. Sécurité

#### À ajouter/configurer :

**a) HTTPS obligatoire** :
- Utilisez Let's Encrypt (gratuit) ou un certificat SSL
- Redirigez tout le trafic HTTP vers HTTPS

**b) Rate limiting** :
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite à 100 requêtes par IP
});

app.use('/api/', limiter);
```

**c) Helmet.js** (sécurité HTTP) :
```bash
npm install helmet
```
```javascript
import helmet from 'helmet';
app.use(helmet());
```

**d) Validation des entrées** :
- Validez tous les inputs côté serveur
- Utilisez des bibliothèques comme `joi` ou `express-validator`

### 7. Logs et Monitoring

**a) Logs structurés** :
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

**b) Monitoring** :
- Utilisez un service comme Sentry pour les erreurs
- Configurez des alertes pour les paiements échoués

### 8. Options d'hébergement

#### Option A : VPS (DigitalOcean, Linode, etc.)
```bash
# Sur votre serveur Linux
git clone votre-repo
cd S4S
npm install
npm install -g pm2
pm2 start backend/server.js --name "fors-backend"
pm2 startup
pm2 save
```

**Nginx configuration** :
```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    
    location / {
        proxy_pass http://localhost:4100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Option B : Platform as a Service (Heroku, Railway, Render)
1. Connectez votre repo Git
2. Configurez les variables d'environnement
3. Déployez automatiquement

**Pour Heroku** :
```bash
heroku create fors-platform
heroku config:set STRIPE_SECRET_KEY=sk_live_xxx
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_xxx
git push heroku main
```

#### Option C : Docker
Créez un `Dockerfile` :
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4100
CMD ["node", "backend/server.js"]
```

### 9. Base de données (recommandé)

**Migrer vers MongoDB** :
```bash
npm install mongoose
```

Créer un modèle de transaction :
```javascript
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  stripePaymentIntentId: String,
  userId: Number,
  amount: Number,
  email: String,
  createdAt: Date
});

const Transaction = mongoose.model('Transaction', transactionSchema);
```

### 10. Checklist finale

- [ ] Variables d'environnement configurées
- [ ] URLs frontend mises à jour
- [ ] Webhook Stripe configuré avec la bonne URL
- [ ] HTTPS activé
- [ ] CORS configuré pour votre domaine
- [ ] Logs configurés
- [ ] Backups des données JSON configurés
- [ ] Monitoring configuré
- [ ] Tests effectués en production

### 11. Commandes utiles

```bash
# Installer les dépendances
npm install

# Démarrer en production
NODE_ENV=production node backend/server.js

# Avec PM2
pm2 start backend/server.js --name fors --env production

# Voir les logs
pm2 logs fors

# Redémarrer
pm2 restart fors
```

### 12. Fichiers à ne PAS déployer

Vérifiez que `.gitignore` contient :
```
node_modules/
.env
public/uploads/
*.log
.DS_Store
```

## 🔧 Scripts de déploiement recommandés

Créez `deploy.sh` :
```bash
#!/bin/bash
git pull origin main
npm install
pm2 restart fors
echo "✅ Déploiement terminé"
```

## 📞 Support

En cas de problème :
1. Vérifiez les logs : `pm2 logs` ou `tail -f error.log`
2. Vérifiez les variables d'environnement
3. Testez les endpoints API manuellement
4. Vérifiez les webhooks Stripe dans le dashboard

