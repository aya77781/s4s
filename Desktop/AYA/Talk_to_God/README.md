# آية من القرآن الكريم — Verset aléatoire du Coran + Tafsir

Application web qui affiche un verset (آية) du Coran en arabe, tiré **aléatoirement**,
avec son **tafsir** (explication, التفسير الميسر). Un bouton permet d'afficher un
nouveau verset. L'interface est **100 % en arabe** et en **RTL (droite-à-gauche)** —
aucun texte en français ou anglais n'est visible à l'écran.

![Aperçu](public/favicon.svg)

## ✨ Fonctionnalités

- **Verset aléatoire** : tire un numéro global au hasard (1 → 6236) et récupère le
  verset **et** son tafsir en un seul appel à l'API.
- **Tafsir dépliable** (`التفسير` / `إخفاء التفسير`) : panneau distinct qui se
  déplie en douceur sous le verset, en police *Noto Naskh Arabic*.
- **Affichage soigné** : texte avec tashkeel en police *Amiri / Amiri Quran*,
  nom de la sourate en arabe, numéro du verset dans un médaillon (۝).
- **Mode clair / sombre** basculable (émeraude & crème / bleu nuit & or).
- **Animations douces** : fondu et léger glissement à chaque nouveau verset.
- **États gérés** : chargement (spinner + `جارٍ التحميل...`), erreur réseau
  (`حدث خطأ، تعذّر تحميل الآية`) avec bouton **`إعادة المحاولة`**.
- **Bonus** : copier (`نسخ`) et partager (`مشاركة`, Web Share API avec repli copie).
- **Anti-répétition** : on évite de retomber 2× de suite sur le même verset (mémoire
  de session).

### 👤 Comptes personnels

- **Inscription / connexion** (`تسجيل الدخول`) avec un mini-backend.
- **Favoris** (`المفضلة`) : sauvegarde des versets aimés **avec leur tafsir**.
- **Historique** (`السجل`) : les derniers versets consultés.
- **Profil** : nom affiché en arabe dans l'en-tête (`مرحباً، [اسم]`).
- Sécurité : mots de passe **hachés (bcrypt)**, sessions par **jeton JWT**.

> Le cœur de l'app (verset + tafsir) fonctionne **sans connexion**. Les comptes
> ajoutent seulement la sauvegarde des favoris, l'historique et le profil.

## 🗄️ Source des données — api.alquran.cloud

Les versets et le tafsir proviennent de l'**API gratuite
[api.alquran.cloud](https://alquran.cloud/api)** (aucune clé, aucune authentification).

Un seul appel récupère les deux éditions à la fois :

```
GET https://api.alquran.cloud/v1/ayah/{numéro}/editions/quran-uthmani,ar.muyassar
```

- `quran-uthmani` → texte arabe du verset (avec tashkeel)
- `ar.muyassar` → Tafsir al-Muyassar (التفسير الميسر)

La réponse contient un tableau `data` avec les 2 éditions ; pour chacune on lit
`text`, `surah.name`, `surah.number`, `surah.revelationType` et `numberInSurah`.

### Contexte approfondi (chargé à la demande)

Deux sections facultatives utilisent le dépôt **[spa5k/tafsir_api](https://github.com/spa5k/tafsir_api)** (CDN jsDelivr, sans clé) :

- **سياق الآية** — Tafsir d'**Ibn Kathir** (contexte / أسباب النزول) :
  `…/ar-tafsir-ibn-kathir/{sourate}/{verset}.json` (texte tronqué avec « اقرأ المزيد »).
- **تعريف بالسورة** — présentation de la sourate, via le tafsir al-Muyassar du
  **1ᵉʳ verset** : `…/ar-tafsir-muyassar/{sourate}/1.json`.

Ces appels sont **non bloquants** : déclenchés seulement quand l'utilisateur ouvre
la section. Si le contenu est vide ou indisponible, un message s'affiche au lieu
d'une erreur. Tous les appels sont centralisés dans [`src/quranApi.ts`](src/quranApi.ts).

## 🧱 Stack technique

- **Frontend** : [React 18](https://react.dev/) + [Vite](https://vite.dev/) + **TypeScript** + [TailwindCSS](https://tailwindcss.com/)
- **Données des versets** : API publique `api.alquran.cloud` (fetch direct, côté client)
- **Comptes (optionnel)** : [Express](https://expressjs.com/) + base **fichier JSON** (`server/db/users.json`)

## 🚀 Lancer le projet

Prérequis : [Node.js](https://nodejs.org/) ≥ 18.

```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer le frontend ET le backend (comptes) ensemble
npm run dev
```

- Frontend : http://localhost:5173 (les versets viennent directement de l'API)
- Backend comptes : http://localhost:3001 (appels `/api`, redirigés par Vite)

### Autres commandes

```bash
npm run dev:client   # frontend Vite seul (suffit pour le verset + tafsir)
npm run dev:server   # backend Express seul (comptes)
npm run build        # build de production dans dist/
npm run preview      # prévisualiser le build de production
```

> En production, définis la variable d'environnement `JWT_SECRET` pour sécuriser
> les jetons (`set JWT_SECRET=...` sous Windows, `export JWT_SECRET=...` sous Unix).

## 📂 Structure du projet

```
.
├── index.html                  # <html dir="rtl" lang="ar"> + polices arabes
├── server/                     # backend Express (comptes — optionnel)
│   ├── index.js                # routes : register / login / me / favorites / history
│   ├── auth.js                 # bcrypt + JWT
│   ├── db.js                   # lecture/écriture du fichier JSON (sérialisée)
│   └── db/users.json           # base de données des comptes
└── src/
    ├── App.tsx                 # composition de la page + onglets + actions
    ├── quranApi.ts             # appels à api.alquran.cloud (verset + tafsir)
    ├── api.ts                  # client HTTP vers le backend des comptes
    ├── types.ts                # type RandomAyah (verset + tafsir)
    ├── auth/
    │   └── AuthContext.tsx     # état d'authentification (React Context)
    ├── hooks/
    │   ├── useQuranData.ts     # tirage aléatoire + états chargement/erreur
    │   └── useTheme.ts         # bascule clair/sombre persistée
    └── components/
        ├── AyahCard.tsx        # carte d'inspiration marocaine (+ tafsir)
        ├── TafsirPanel.tsx     # panneau de tafsir dépliable
        ├── ActionButtons.tsx   # rangée d'actions sous le verset
        ├── VerseMedallion.tsx  # médaillon du numéro (۝)
        ├── MihrabArch.tsx      # arche mihrab (arc mauresque, SVG)
        ├── ZelligeStar.tsx     # étoile zellige à 8 branches (SVG)
        ├── RevelationBadge.tsx # badge مكية / مدنية
        ├── IconButton.tsx      # bouton réutilisable
        ├── Spinner.tsx         # indicateur de chargement
        ├── Header.tsx          # en-tête : compte + thème
        ├── AuthModal.tsx       # fenêtre de connexion / inscription
        └── SavedList.tsx       # liste des favoris / historique
```
