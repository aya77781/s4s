// === CONFIGURATION DE BASE ===
// Utilise la configuration depuis config.js si disponible, sinon localhost
const API_BASE = (typeof window !== 'undefined' && window.APP_CONFIG?.API_BASE) 
  ? window.APP_CONFIG.API_BASE 
  : (window.location.origin + '/api');
const user = JSON.parse(localStorage.getItem("fors_user") || "null");

// Si aucun utilisateur connecté → redirection vers login
if (!user) window.location.href = "login.html";

// === AFFICHAGE DU NOM ET DU RÔLE ===
document.getElementById("user-name").textContent = user.name;
document.querySelector(".user-role").textContent = user.role || "Student";

// Personnaliser l'avatar avec les initiales
const avatar = document.querySelector(".user-menu .avatar");
if (avatar) {
  const nameParts = (user.name || "A").trim().split(" ");
  let initials = "";
  if (nameParts.length >= 2) {
    initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  } else {
    initials = (user.name || "A").substring(0, 2).toUpperCase();
  }
  avatar.textContent = initials;
}

// === NAVIGATION ENTRE LES ONGLET ===
const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".tab-panel");

// Make activateTab globally available
window.activateTab = function(tabName) {
  tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === tabName));
  panels.forEach(p => p.classList.toggle("active", p.id === tabName));
};

tabs.forEach(tab => {
  tab.addEventListener("click", () => window.activateTab(tab.dataset.tab));
});

// Handle buttons with data-open attribute
document.addEventListener("click", (e) => {
  const button = e.target.closest("[data-open]");
  if (button) {
    const tabName = button.getAttribute("data-open");
    if (tabName) {
      window.activateTab(tabName);
    }
  }
});

// === MENU UTILISATEUR ===
const userMenu = document.getElementById("user-menu");
const dropdown = document.getElementById("user-dropdown");

document.addEventListener("click", e => {
  if (!userMenu.contains(e.target)) dropdown.style.display = "none";
});

// Simple clic : ouvrir/fermer le dropdown
userMenu.addEventListener("click", (e) => {
  // Ne pas ouvrir le dropdown si on clique sur le bouton logout du dropdown
  if (e.target.classList.contains("dropdown-item")) return;
  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
});

// Double-clic sur l'élément utilisateur : logout direct
userMenu.addEventListener("dblclick", (e) => {
  e.stopPropagation();
  localStorage.removeItem("fors_user");
  window.location.href = "login.html";
});

// Fonction de logout
function logout() {
  localStorage.removeItem("fors_user");
  window.location.href = "login.html";
}

// === DÉCONNEXION ===
const logoutBtn = document.querySelector(".dropdown-item.danger");
if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    logout();
  });
}

// === NOTIFICATION VISUELLE ===
function showNotif(msg, success = true) {
  const n = document.createElement("div");
  n.textContent = msg;
  n.className = success ? "notif success" : "notif error";
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 3000);
}

// === VARIABLES GLOBALES POUR LA RECHERCHE ===
let allRequests = [];
let allUsers = [];

// === RÉCUPÉRATION DES REQUÊTES DE L'UTILISATEUR ===
async function fetchRequests() {
  try {
    const res = await fetch(`${API_BASE}/requests/${user.id}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    console.log(`✅ ${data.length} demande(s) récupérée(s) pour l'utilisateur ${user.id}`);
    allRequests = data; // Stocker pour la recherche
    renderRequests(data);
  } catch (err) {
    console.error("❌ Erreur lors du chargement des requêtes :", err);
    showNotif("Erreur lors du chargement des demandes", false);
  }
}

// === RÉCUPÉRATION DE TOUS LES UTILISATEURS (pour la recherche) ===
async function fetchAllUsers() {
  try {
    const res = await fetch(`${API_BASE}/users`);
    if (res.ok) {
      allUsers = await res.json();
    }
  } catch (err) {
    console.error("Erreur lors du chargement des utilisateurs :", err);
  }
}

// === AFFICHAGE DES REQUÊTES ===
function renderRequests(requests) {
  const total = document.getElementById("total-requests");
  const pending = document.getElementById("pending-count");
  const approved = document.getElementById("approved-count");
  const rejected = document.getElementById("rejected-count");
  const tableBody = document.getElementById("requests-table-body");
  const recent = document.getElementById("recent-requests");

  total.textContent = requests.length;
  pending.textContent = requests.filter(r => r.status === "pending").length;
  approved.textContent = requests.filter(r => r.status === "approved").length;
  if (rejected) rejected.textContent = requests.filter(r => r.status === "rejected").length;

  // Tableau des requests
  if (!tableBody) return;

  if (requests.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 2rem; color: #64748b;">
          <div class="empty-state">
            <h4>No requests yet</h4>
            <p>You haven't submitted any requests yet. Start by creating your first request.</p>
            <button class="btn" data-open="new-request" onclick="activateTab('new-request')">Create your first request</button>
          </div>
        </td>
      </tr>`;
    recent.innerHTML = `
      <div class="empty-state">
        <h4>No requests yet</h4>
        <p>You haven't submitted any requests yet. Start by creating your first request.</p>
        <button class="btn" data-open="new-request" onclick="activateTab('new-request')">Create your first request</button>
      </div>`;
    return;
  }

  tableBody.innerHTML = requests
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Plus récent en premier
    .map(r => {
      const statusClass = r.status === "approved" ? "status-badge approved" : r.status === "pending" ? "status-badge pending" : "status-badge rejected";
      const statusText = r.status.charAt(0).toUpperCase() + r.status.slice(1);
      const date = new Date(r.createdAt);
      const formattedDate = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
      
      return `
        <tr data-request-id="${r.id}">
          <td><strong>${r.type || "N/A"}</strong></td>
          <td><strong>€${(r.amount || 0).toLocaleString()}</strong></td>
          <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${r.description || ""}">${r.description || "No description"}</td>
          <td>${formattedDate}</td>
          <td><span class="${statusClass}">${statusText}</span></td>
        </tr>`;
    })
    .join("");

  // 3 dernières demandes dans le Dashboard
  const last3 = requests.slice(-3).reverse();
  recent.innerHTML = last3
    .map(
      r => {
        const statusClass = r.status === "approved" ? "status-badge approved" : r.status === "pending" ? "status-badge pending" : "status-badge rejected";
        const statusText = r.status.charAt(0).toUpperCase() + r.status.slice(1);
        return `
      <div class="card request-card">
        <div class="card-header-row">
          <strong>${r.type}</strong>
          <span class="amount-badge">${r.amount} €</span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 1rem;">
          <span class="${statusClass}">${statusText}</span>
          <small style="color: #94a3b8; font-size: 0.85rem;">${new Date(r.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</small>
        </div>
      </div>`;
      }
    )
    .join("");
}

// === ENVOI DU FORMULAIRE "SUBMIT REQUEST" ===
const form = document.getElementById("request-form");
form.addEventListener("submit", async e => {
  e.preventDefault();

  const type = document.getElementById("request-type").value;
  const amount = document.getElementById("amount").value;
  const description = document.getElementById("description").value;
  const doc = document.getElementById("document").files[0];
  const documentName = doc ? doc.name : null;

  try {
    const res = await fetch(`${API_BASE}/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        type,
        amount,
        description,
        documentName
      })
    });

    if (!res.ok) throw new Error("Erreur lors de l'envoi de la requête");

    // Réinitialiser le formulaire + notification
    form.reset();
    showNotif("Request sent successfully");

    // Recharger la liste des requêtes
    await fetchRequests();
    activateTab("my-requests");
  } catch (err) {
    console.error("Erreur lors de la création de la demande :", err);
    showNotif("Error while sending request", false);
  }
});

// === FONCTIONNALITÉ DE RECHERCHE ===
const searchInput = document.getElementById("search-input");
const searchResultsList = document.getElementById("search-results-list");
const searchResultsCount = document.getElementById("search-results-count");
const searchDropdown = document.getElementById("search-dropdown");

// Fonction de recherche
function performSearch(query) {
  if (!query || query.trim().length === 0) {
    searchDropdown.style.display = "none";
    return;
  }

  const searchTerm = query.toLowerCase().trim();
  const results = {
    requests: [],
    users: []
  };

  // Recherche dans les requêtes
  if (allRequests && allRequests.length > 0) {
    results.requests = allRequests.filter(req => {
      const type = (req.type || "").toLowerCase();
      const description = (req.description || "").toLowerCase();
      const amount = String(req.amount || "");
      const status = (req.status || "").toLowerCase();
      
      return type.includes(searchTerm) ||
             description.includes(searchTerm) ||
             amount.includes(searchTerm) ||
             status.includes(searchTerm);
    });
  }

  // Recherche dans les utilisateurs (si admin ou si autorisé)
  if (allUsers && allUsers.length > 0 && (user.role === "Administrator" || user.role === "Admin")) {
    results.users = allUsers.filter(usr => {
      const name = (usr.name || "").toLowerCase();
      const email = (usr.email || "").toLowerCase();
      const role = (usr.role || "").toLowerCase();
      
      return name.includes(searchTerm) ||
             email.includes(searchTerm) ||
             role.includes(searchTerm);
    });
  }

  displaySearchResults(results, query);
}

// Affichage des résultats de recherche
function displaySearchResults(results, query) {
  const totalResults = results.requests.length + results.users.length;

  if (totalResults === 0) {
    searchDropdown.innerHTML = `
      <div class="search-dropdown-item no-results">
        <p>No results found for "${query}"</p>
      </div>
    `;
    searchDropdown.style.display = "block";
    return;
  }

  let html = "";

  // Afficher les requêtes trouvées
  if (results.requests.length > 0) {
    html += `<div class="search-dropdown-section">
      <div class="search-section-title">Requests (${results.requests.length})</div>`;
    
    results.requests.slice(0, 5).forEach(req => {
      const statusClass = req.status === "approved" ? "status-badge approved" : req.status === "pending" ? "status-badge pending" : "status-badge rejected";
      const statusText = req.status.charAt(0).toUpperCase() + req.status.slice(1);
      
      html += `
      <div class="search-dropdown-item search-result-item" onclick="handleSearchClick('request', ${req.id})">
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
          <div style="flex: 1;">
            <strong>${req.type}</strong>
            <span class="amount-badge" style="margin-left: 0.5rem;">${req.amount} €</span>
            ${req.description ? `<p style="color: #64748b; font-size: 0.85rem; margin: 0.25rem 0 0 0;">${req.description.substring(0, 60)}${req.description.length > 60 ? '...' : ''}</p>` : ""}
          </div>
          <span class="${statusClass}" style="margin-left: 0.5rem;">${statusText}</span>
        </div>
      </div>`;
    });
    
    if (results.requests.length > 5) {
      html += `<div class="search-dropdown-item show-more" onclick="showAllSearchResults('requests')">
        Show ${results.requests.length - 5} more requests...
      </div>`;
    }
    
    html += `</div>`;
  }

  // Afficher les utilisateurs trouvés (si admin)
  if (results.users.length > 0 && (user.role === "Administrator" || user.role === "Admin")) {
    html += `<div class="search-dropdown-section">
      <div class="search-section-title">Users (${results.users.length})</div>`;
    
    results.users.slice(0, 3).forEach(usr => {
      html += `
      <div class="search-dropdown-item search-result-item" onclick="handleSearchClick('user', ${usr.id})">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div class="avatar" style="width: 32px; height: 32px; font-size: 0.85rem;">${(usr.name || "U").charAt(0).toUpperCase()}</div>
          <div>
            <strong>${usr.name}</strong>
            <p style="color: #64748b; font-size: 0.85rem; margin: 0;">${usr.email}</p>
          </div>
          <span style="margin-left: auto; font-size: 0.75rem; color: #94a3b8; text-transform: capitalize;">${usr.role}</span>
        </div>
      </div>`;
    });
    
    if (results.users.length > 3) {
      html += `<div class="search-dropdown-item show-more" onclick="showAllSearchResults('users')">
        Show ${results.users.length - 3} more users...
      </div>`;
    }
    
    html += `</div>`;
  }

  searchDropdown.innerHTML = html;
  searchDropdown.style.display = "block";
}

// Gestion du clic sur un résultat
window.handleSearchClick = function(type, id) {
  if (type === "request") {
    activateTab("my-requests");
    // Optionnel : scroll vers la requête spécifique
    setTimeout(() => {
      const requestCard = document.querySelector(`[data-request-id="${id}"]`);
      if (requestCard) {
        requestCard.scrollIntoView({ behavior: "smooth", block: "center" });
        requestCard.style.background = "#f0fdfe";
        requestCard.style.borderColor = "#02aeb2";
        setTimeout(() => {
          requestCard.style.background = "";
          requestCard.style.borderColor = "";
        }, 2000);
      }
    }, 100);
  }
  searchInput.value = "";
  searchDropdown.style.display = "none";
};

// Afficher tous les résultats dans un onglet
window.showAllSearchResults = function(type) {
  const query = searchInput.value;
  // Ici on pourrait créer une vue complète des résultats
  // Pour l'instant, on redirige vers l'onglet approprié
  if (type === "requests") {
    activateTab("my-requests");
  }
  searchDropdown.style.display = "none";
};

// Écouteurs d'événements pour la recherche
let searchTimeout;
searchInput.addEventListener("input", (e) => {
  clearTimeout(searchTimeout);
  const query = e.target.value;
  
  searchTimeout = setTimeout(() => {
    performSearch(query);
  }, 300); // Délai de 300ms pour éviter trop de recherches
});

searchInput.addEventListener("focus", (e) => {
  if (e.target.value.trim().length > 0) {
    performSearch(e.target.value);
  }
});

// Fermer le dropdown quand on clique en dehors
document.addEventListener("click", (e) => {
  if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
    searchDropdown.style.display = "none";
  }
});

// Fermer avec Escape
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    searchDropdown.style.display = "none";
    searchInput.blur();
  }
  if (e.key === "Enter") {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query.length > 0) {
      // Activer l'onglet de résultats et afficher tous les résultats
      const results = {
        requests: allRequests.filter(req => {
          const searchTerm = query.toLowerCase();
          const type = (req.type || "").toLowerCase();
          const description = (req.description || "").toLowerCase();
          const amount = String(req.amount || "");
          const status = (req.status || "").toLowerCase();
          return type.includes(searchTerm) || description.includes(searchTerm) || 
                 amount.includes(searchTerm) || status.includes(searchTerm);
        }),
        users: []
      };
      
      if (user.role === "Administrator" || user.role === "Admin") {
        results.users = allUsers.filter(usr => {
          const searchTerm = query.toLowerCase();
          const name = (usr.name || "").toLowerCase();
          const email = (usr.email || "").toLowerCase();
          const role = (usr.role || "").toLowerCase();
          return name.includes(searchTerm) || email.includes(searchTerm) || role.includes(searchTerm);
        });
      }
      
      displayFullSearchResults(results, query);
      searchDropdown.style.display = "none";
    }
  }
});

// Afficher tous les résultats dans une vue complète
function displayFullSearchResults(results, query) {
  const totalResults = results.requests.length + results.users.length;
  
  if (totalResults === 0) {
    searchResultsList.innerHTML = `
      <div class="empty-state">
        <h4>No results found</h4>
        <p>No results found for "${query}"</p>
      </div>
    `;
  } else {
    let html = "";
    
    // Requêtes
    if (results.requests.length > 0) {
      html += `<div style="margin-bottom: 2rem;">
        <h3 style="color: #475569; margin-bottom: 1rem; font-size: 1.1rem;">Requests (${results.requests.length})</h3>
        ${results.requests.map(req => {
          const statusClass = req.status === "approved" ? "status-badge approved" : req.status === "pending" ? "status-badge pending" : "status-badge rejected";
          const statusText = req.status.charAt(0).toUpperCase() + req.status.slice(1);
          return `
          <div class="card request-card" data-request-id="${req.id}">
            <div class="card-header-row">
              <strong>${req.type}</strong>
              <span class="amount-badge">${req.amount} €</span>
            </div>
            ${req.description ? `<p style="color: #64748b; margin: 0.75rem 0; line-height: 1.6;">${req.description}</p>` : ""}
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f1f5f9;">
              <span class="${statusClass}">${statusText}</span>
              <small style="color: #94a3b8; font-size: 0.85rem;">${new Date(req.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</small>
            </div>
          </div>`;
        }).join("")}
      </div>`;
    }
    
    // Utilisateurs (si admin)
    if (results.users.length > 0 && (user.role === "Administrator" || user.role === "Admin")) {
      html += `<div>
        <h3 style="color: #475569; margin-bottom: 1rem; font-size: 1.1rem;">Users (${results.users.length})</h3>
        ${results.users.map(usr => `
          <div class="card request-card">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div class="avatar">${(usr.name || "U").charAt(0).toUpperCase()}</div>
              <div style="flex: 1;">
                <strong>${usr.name}</strong>
                <p style="color: #64748b; margin: 0.25rem 0 0 0; font-size: 0.9rem;">${usr.email}</p>
              </div>
              <span style="font-size: 0.85rem; color: #94a3b8; text-transform: capitalize; padding: 0.4rem 0.9rem; background: #f1f5f9; border-radius: 0.5rem;">${usr.role}</span>
            </div>
          </div>
        `).join("")}
      </div>`;
    }
    
    searchResultsList.innerHTML = html;
  }
  
  searchResultsCount.textContent = `${totalResults} result${totalResults > 1 ? 's' : ''}`;
  
  // Ajouter un onglet de recherche si nécessaire et l'activer
  let searchTab = document.querySelector('.tab[data-tab="search-results"]');
  if (!searchTab) {
    const tabsContainer = document.querySelector('.tabs');
    searchTab = document.createElement('button');
    searchTab.className = 'tab';
    searchTab.dataset.tab = 'search-results';
    searchTab.textContent = 'Search Results';
    tabsContainer.appendChild(searchTab);
    searchTab.addEventListener("click", () => activateTab('search-results'));
  }
  activateTab('search-results');
}

// === LOAD NEWS ===
async function loadNews() {
  const newsList = document.getElementById("news-list");
  if (!newsList) return;
  
  try {
    const res = await fetch(`${API_BASE}/news?category=Student`);
    if (!res.ok) throw new Error("Failed to fetch news");
    const news = await res.json();
    
    if (news.length === 0) {
      newsList.innerHTML = `
        <div class="empty-state">
          <h4>No news available</h4>
          <p>Check back later for updates and announcements.</p>
        </div>
      `;
      return;
    }
    
    newsList.innerHTML = news.map(n => {
      const date = new Date(n.publishedAt || n.createdAt);
      const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      
      return `
        <div class="card" style="margin-bottom: 1.5rem;">
          ${n.imageUrl ? `<img src="${n.imageUrl}" alt="${n.title}" style="width: 100%; height: 300px; object-fit: cover; border-radius: 0.75rem 0.75rem 0 0; margin-bottom: 1rem; display: block;" onerror="this.style.display='none';" />` : ""}
          <div style="padding: 0 1.5rem 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
              <h3 style="margin: 0; color: #0f172a;">${n.title}</h3>
              <span class="status-badge active" style="font-size: 0.8rem;">${n.category}</span>
            </div>
            <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 0.75rem;">${formattedDate}</p>
            <div style="color: #475569; line-height: 1.7; white-space: pre-wrap;">${n.content}</div>
          </div>
        </div>
      `;
    }).join("");
  } catch (err) {
    console.error("Error loading news:", err);
    newsList.innerHTML = `
      <div class="empty-state">
        <h4>Error loading news</h4>
        <p>Please try again later.</p>
      </div>
    `;
  }
}

// Load news when news tab is activated
const newsTab = document.querySelector('.tab[data-tab="news"]');
if (newsTab) {
  newsTab.addEventListener("click", () => {
    loadNews();
  });
}

// Recharger les demandes quand l'onglet "My Requests" est activé
const myRequestsTab = document.querySelector('.tab[data-tab="my-requests"]');
if (myRequestsTab) {
  myRequestsTab.addEventListener("click", () => {
    fetchRequests(); // Recharger les demandes pour avoir les dernières mises à jour
  });
}

// Recharger les demandes quand l'onglet "Dashboard" est activé
const dashboardTab = document.querySelector('.tab[data-tab="dashboard"]');
if (dashboardTab) {
  dashboardTab.addEventListener("click", () => {
    fetchRequests(); // Recharger les demandes pour mettre à jour les compteurs
  });
}

// === INITIALISATION ===
fetchRequests();
fetchAllUsers();
