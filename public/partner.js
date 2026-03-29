// === CONFIGURATION DE BASE ===
// Utilise la configuration depuis config.js si disponible, sinon localhost
const API_BASE = (typeof window !== 'undefined' && window.APP_CONFIG?.API_BASE) 
  ? window.APP_CONFIG.API_BASE 
  : (window.location.origin + '/api');

// Récupérer l'utilisateur
let user = null;
try {
  const userStr = localStorage.getItem("fors_user");
  if (!userStr) {
    window.location.href = "login.html";
  }
  user = JSON.parse(userStr);
  
  if (!user || !user.id) {
    window.location.href = "login.html";
  }
  
  // Vérifier le rôle
  if (user.role !== "Partner") {
    if (user.role === "Alumni") window.location.href = "alumni.html";
    else if (user.role === "Donor") window.location.href = "donor.html";
    else if (user.role === "Student") window.location.href = "student.html";
    else window.location.href = "login.html";
  }
} catch (err) {
  console.error("Error parsing user:", err);
  window.location.href = "login.html";
}

// === AFFICHAGE DU NOM ET DU RÔLE ===
function ensurePersonalization() {
  if (!user) return;
  
  const userNameEl = document.getElementById("user-name");
  const userRoleEl = document.querySelector(".user-role");

  if (userNameEl) userNameEl.textContent = user.name || "Partner User";
  if (userRoleEl) userRoleEl.textContent = user.role || "Partner";

  const avatar = document.getElementById("user-avatar");
  if (avatar) {
    const nameParts = (user.name || "P").trim().split(" ");
    let initials = "";
    if (nameParts.length >= 2) {
      initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    } else {
      initials = (user.name || "P").substring(0, 2).toUpperCase();
    }
    avatar.textContent = initials;
  }

  if (user.name) {
    document.title = `$forS – ${user.name}'s Partner Area`;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ensurePersonalization);
} else {
  ensurePersonalization();
}

// === NAVIGATION ENTRE LES ONGLETS ===
let tabs, panels;

window.activateTab = function(tabName) {
  if (!tabs || tabs.length === 0) {
    tabs = document.querySelectorAll(".tab");
    panels = document.querySelectorAll(".tab-panel");
  }
  if (!tabs || tabs.length === 0) {
    console.warn("Tabs not found");
    return;
  }
  tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === tabName));
  panels.forEach(p => p.classList.toggle("active", p.id === tabName));
};

function initTabs() {
  tabs = document.querySelectorAll(".tab");
  panels = document.querySelectorAll(".tab-panel");
  
  if (tabs.length === 0 || panels.length === 0) {
    console.warn("Tabs or panels not found");
    return;
  }

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const tabName = tab.dataset.tab;
      if (tabName) {
        activateTab(tabName);
      }
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTabs);
} else {
  initTabs();
}

// === MENU UTILISATEUR ===
function setupUserMenu() {
  const userMenu = document.getElementById("user-menu");
  const dropdown = document.getElementById("user-dropdown");

  if (userMenu && dropdown) {
    document.addEventListener("click", e => {
      if (!userMenu.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });

    userMenu.addEventListener("click", (e) => {
      if (e.target.classList.contains("dropdown-item")) {
        return;
      }
      
      const isOpen = dropdown.style.display === "block";
      dropdown.style.display = isOpen ? "none" : "block";
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupUserMenu);
} else {
  setupUserMenu();
}

// Fonction de logout
function logout() {
  localStorage.removeItem("fors_user");
  window.location.href = "login.html";
}

// === DÉCONNEXION ===
function setupLogout() {
  const logoutBtn = document.getElementById("logout-btn") || document.querySelector(".dropdown-item.danger");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      logout();
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupLogout);
} else {
  setupLogout();
}

// === NOTIFICATION VISUELLE ===
function showNotif(msg, success = true) {
  const n = document.createElement("div");
  n.textContent = msg;
  n.className = success ? "notif success" : "notif error";
  n.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    padding: 1rem 1.5rem;
    border-radius: 0.75rem;
    font-weight: 600;
    color: white;
    z-index: 1000;
    animation: fadeInUp 0.3s ease;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    background: ${success ? "linear-gradient(135deg, #02aeb2 0%, #059199 100%)" : "linear-gradient(135deg, #e11d48 0%, #be185d 100%)"};
  `;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 3000);
}

// === FORMULAIRE DE CONTACT ===
function setupContactForm() {
  const contactForm = document.getElementById("contact-form");
  if (!contactForm) {
    return;
  }
  
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const companyName = document.getElementById("company-name").value.trim();
    const contactPerson = document.getElementById("contact-person").value.trim();
    const email = document.getElementById("contact-email").value.trim();
    const phone = document.getElementById("contact-phone").value.trim();
    const partnershipType = document.getElementById("partnership-type").value;
    const message = document.getElementById("message").value.trim();

    if (!companyName || !contactPerson || !email || !partnershipType || !message) {
      showNotif("Please fill all required fields", false);
      return;
    }

    // Désactiver le bouton pendant l'envoi
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          contactPerson,
          email,
          phone,
          partnershipType,
          message,
          userId: user.id // Inclure l'ID du partner pour l'historique
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      showNotif("Thank you! Your message has been sent. We'll get back to you soon.");
      contactForm.reset();
      
      // Recharger l'historique après l'envoi
      loadContactHistory();
    } catch (err) {
      console.error("Erreur :", err);
      showNotif("Error while sending message. Please try again later.", false);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupContactForm);
} else {
  setupContactForm();
}

// === BOUTON CONTACT US ===
function setupContactBtn() {
  const contactBtn = document.getElementById("contact-us-btn");
  if (contactBtn) {
    contactBtn.addEventListener("click", () => {
      activateTab("contact");
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupContactBtn);
} else {
  setupContactBtn();
}

// === CHARGEMENT DE L'HISTORIQUE DES MESSAGES ===
let contactHistory = [];

async function loadContactHistory() {
  try {
    const res = await fetch(`${API_BASE}/contacts/${user.id}`);
    if (!res.ok) throw new Error("Failed to fetch contact history");
    contactHistory = await res.json();
    renderContactHistory();
  } catch (err) {
    console.error("Error loading contact history:", err);
    contactHistory = [];
    renderContactHistory();
  }
}

function renderContactHistory() {
  const container = document.getElementById("contact-history-list");
  if (!container) return;

  if (contactHistory.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h4>No messages yet</h4>
        <p>You haven't sent any messages yet. Use the Contact tab to send your first message.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = contactHistory
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Plus récent en premier
    .map(contact => {
      const date = new Date(contact.createdAt);
      const formattedDate = date.toLocaleString();
      const readStatus = contact.read ? "Read" : "Unread";
      const statusClass = contact.read ? "published" : "active";
      
      return `
        <div class="card" style="margin-bottom: 1rem; border-left: 3px solid #02aeb2;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
            <div>
              <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; color: #0f172a;">${contact.partnershipType}</h3>
              <p style="margin: 0; color: #64748b; font-size: 0.9rem; line-height: 1.6;">
                <strong>Company:</strong> ${contact.companyName}<br>
                <strong>Contact:</strong> ${contact.contactPerson}<br>
                <strong>Email:</strong> ${contact.email}${contact.phone ? `<br><strong>Phone:</strong> ${contact.phone}` : ''}
              </p>
            </div>
            <div style="text-align: right;">
              <span class="status-badge ${statusClass}" style="display: inline-block; margin-bottom: 0.5rem;">${readStatus}</span>
              <p style="margin: 0; color: #94a3b8; font-size: 0.85rem;">${formattedDate}</p>
            </div>
          </div>
          <div style="background: #f8fafc; border-radius: 0.5rem; padding: 1rem; margin-top: 1rem;">
            <p style="margin: 0; color: #0f172a; white-space: pre-wrap; line-height: 1.6;">${contact.message}</p>
          </div>
        </div>
      `;
    })
    .join("");
}

// Charger l'historique quand l'onglet est activé
function initContactHistoryTab() {
  const contactHistoryTab = document.querySelector('[data-tab="contact-history"]');
  if (contactHistoryTab) {
    contactHistoryTab.addEventListener("click", () => {
      loadContactHistory();
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContactHistoryTab);
} else {
  initContactHistoryTab();
}

// === LOAD NEWS ===
async function loadNews() {
  const newsList = document.getElementById("news-list");
  if (!newsList) return;
  
  try {
    const res = await fetch(`${API_BASE}/news?category=Partner`);
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

