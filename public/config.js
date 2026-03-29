// Configuration pour l'environnement de production
// Ce fichier est chargé dans toutes les pages avant les autres scripts

window.APP_CONFIG = {
  // URL de l'API - S'adapte automatiquement à l'environnement
  // En production : utilise l'origine actuelle + /api
  // En développement : peut être changé manuellement ci-dessous
  
  // Par défaut : utilise l'URL actuelle (fonctionne en production)
  API_BASE: window.location.origin + '/api',
  
  // ⚠️ Pour le développement local, décommentez la ligne ci-dessous :
  // API_BASE: 'http://localhost:4100/api',
  
  // ⚠️ Pour une URL absolue en production, utilisez :
  // API_BASE: 'https://votre-domaine.com/api',
};

// Définir une variable globale pour compatibilité (optionnel)
if (typeof window !== 'undefined') {
  window.API_BASE = window.APP_CONFIG.API_BASE;
}

