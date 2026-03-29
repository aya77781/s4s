# Informations Business pour Stripe - $forS

## Catégorie de Business

**Catégorie principale** : **Education** / **Educational Services**

**Sous-catégorie** : Student Support Platform / Educational Funding Platform

**Type de business** : Platform / Marketplace for Student Financial Support

---

## Description du Business

### Description courte (pour Stripe Dashboard) :
```
$forS (Students for Students) is an educational funding platform that connects alumni and donors with current students in need. The platform facilitates monthly contributions and one-time donations to support students with tuition fees, housing, transport, and educational equipment.
```

### Description détaillée (pour documentation/compte Stripe) :
```
$forS (Students for Students) is a nonprofit educational platform designed to improve the academic journey by connecting students with alumni and partner companies. 

The platform operates on a sustainable model where:
- Current students receive free membership and financial support for tuition, housing, transport, and equipment
- Alumni who secure employment (salary > $1000) contribute $10/month for at least 5 years to help the next generation
- Donors can make monthly pledges ($10/month) or one-time donations to expand scholarship funding
- Partner companies offer internships, job opportunities, and collaborative projects

Mission: Create a chain of solidarity where each graduating student becomes a contributor, ensuring continuous support for future generations of students.
```

---

## Catégories Stripe Recommandées

### Pour créer un compte Stripe :
- **Business Type**: `Nonprofit` ou `Education`
- **Industry**: `Education` / `Educational Services`
- **Subcategory**: `Student Support Services` / `Educational Funding`

### Pour les produits Stripe :
Les produits créés automatiquement dans le code incluent maintenant :
- **Name**: "$forS Alumni Monthly Contribution"
- **Description**: "Monthly recurring contribution to support current students..."
- **Metadata**:
  - `platform: "$forS"`
  - `category: "Education"`
  - `business_type: "Student Support Platform"`

---

## Code Merchant Category Code (MCC)

Pour Stripe, le **Merchant Category Code** recommandé est :

- **MCC 8299**: "Educational Services - Not Elsewhere Classified"
- Ou **MCC 8398**: "Charitable and Social Service Organizations - Fundraising"

---

## Informations Légales à Fournir à Stripe

Lors de la vérification de votre compte Stripe, vous devrez fournir :

1. **Nom légal de l'entreprise** : 
   - $forS ou "Students for Students"
   
2. **Type d'entité** :
   - Si association à but non lucratif : "Nonprofit Organization"
   - Si entreprise : "Corporation" ou "LLC"
   - Si personne individuelle : "Individual/Sole Proprietor"

3. **Numéro d'enregistrement** :
   - Numéro SIRET (si France)
   - Numéro d'enregistrement d'association (si applicable)
   - Numéro fiscal / TVA (si applicable)

4. **Adresse légale** :
   - Adresse complète du siège social

5. **Numéro de téléphone** :
   - Téléphone de contact officiel

6. **Site web** :
   - URL de la plateforme $forS

---

## Utilisation dans le Code

Les informations de business sont maintenant incluses dans :

1. **Products Stripe** (`backend/server.js` ligne ~803) :
   - Metadata avec `category: "Education"` et `business_type: "Student Support Platform"`

2. **Payment Intents** (`backend/server.js` ligne ~752) :
   - Description améliorée et metadata avec les mêmes informations

---

## Notes Importantes

- ✅ Ces informations aident Stripe à mieux comprendre votre business
- ✅ Cela peut améliorer les taux d'acceptation des paiements
- ✅ C'est nécessaire pour la conformité réglementaire
- ✅ Les métadonnées permettent un meilleur suivi dans le dashboard Stripe

---

**Dernière mise à jour** : Intégration Stripe pour $forS

