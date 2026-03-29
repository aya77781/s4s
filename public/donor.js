// === CONFIGURATION DE BASE ===
// Utilise la configuration depuis config.js si disponible, sinon localhost
const API_BASE = (typeof window !== 'undefined' && window.APP_CONFIG?.API_BASE) 
  ? window.APP_CONFIG.API_BASE 
  : (window.location.origin + '/api');
let stripe = null;
let elements = null;
let paymentElement = null;
let currentPaymentType = null; // "subscription" ou "one_time"

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
  if (user.role !== "Donor") {
    if (user.role === "Alumni") window.location.href = "alumni.html";
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
  
  // Personnaliser le nom et le rôle dans la barre supérieure
  const userNameEl = document.getElementById("user-name");
  const userRoleEl = document.querySelector(".user-role");

  if (userNameEl) userNameEl.textContent = user.name || "Donor User";
  if (userRoleEl) userRoleEl.textContent = user.role || "Donor";

  // Avatar avec initiales complètes
  const avatar = document.getElementById("user-avatar");
  if (avatar) {
    const nameParts = (user.name || "D").trim().split(" ");
    let initials = "";
    if (nameParts.length >= 2) {
      initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    } else {
      initials = (user.name || "D").substring(0, 2).toUpperCase();
    }
    avatar.textContent = initials;
  }

  // Personnaliser le titre de la page
  if (user.name) {
    document.title = `$forS – ${user.name}'s Donor Space`;
  }
}

// Exécuter après le chargement du DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ensurePersonalization);
} else {
  ensurePersonalization();
}

// === NAVIGATION ENTRE LES ONGLETS ===
let tabs, panels;

// Définir activateTab globalement AVANT l'initialisation
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
  
  console.log("Tabs initialized:", tabs.length, "tabs found");
}

// Initialiser les tabs au chargement
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
    // Fermer le dropdown quand on clique ailleurs
    document.addEventListener("click", e => {
      if (!userMenu.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });

    // Simple clic : ouvrir/fermer le dropdown
    userMenu.addEventListener("click", (e) => {
      if (e.target.classList.contains("dropdown-item")) {
        return;
      }
      
      const isOpen = dropdown.style.display === "block";
      dropdown.style.display = isOpen ? "none" : "block";
    });
  }
}

// Initialiser le menu au chargement
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

// === VARIABLES GLOBALES ===
let contributions = [];
let supportedStudents = [];
let allRequests = [];

// === CHARGEMENT DES DONNÉES ===
async function loadData() {
  try {
    // Charger les contributions de l'utilisateur
    const contribRes = await fetch(`${API_BASE}/contributions/${user.id}`);
    if (contribRes.ok) {
      contributions = await contribRes.json();
    }

    // Charger les étudiants aidés
    const studentsRes = await fetch(`${API_BASE}/supported-students/${user.id}`);
    if (studentsRes.ok) {
      supportedStudents = await studentsRes.json();
    }

    // Charger toutes les requêtes
    const requestsRes = await fetch(`${API_BASE}/requests/all`);
    if (requestsRes.ok) {
      allRequests = await requestsRes.json();
    }

    updateDashboard();
    renderHistory();
  } catch (err) {
    console.error("Erreur lors du chargement des données :", err);
  }
}

// === MISE À JOUR DU DASHBOARD ===
function updateDashboard() {
  // Total donations (uniquement celles de l'utilisateur connecté)
  const userContributions = contributions.filter(c => Number(c.userId) === Number(user.id));
  const total = userContributions.reduce((sum, c) => sum + c.amount, 0);
  const totalEl = document.getElementById("total-donations");
  if (totalEl) {
    totalEl.textContent = `€${total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  // Students helped
  const userSupported = supportedStudents.filter(s => Number(s.alumniId) === Number(user.id));
  const uniqueStudents = new Set(userSupported.map(s => s.studentId));
  const studentsCount = uniqueStudents.size;
  const studentsEl = document.getElementById("students-helped-count");
  if (studentsEl) {
    studentsEl.textContent = studentsCount;
  }

  // Next tax receipt (janvier de l'année suivante)
  const now = new Date();
  const nextYear = now.getFullYear() + 1;
  const nextTaxReceipt = `January ${nextYear}`;
  const taxEl = document.getElementById("next-tax-receipt");
  if (taxEl) {
    taxEl.textContent = nextTaxReceipt;
  }
}

// === STRIPE PAYMENT SETUP ===
async function initializeStripe() {
  try {
    // Initialiser Stripe avec la clé publique (Live key)
    const publishableKey = "pk_live_51Qxyc4DfbY6lGYcLPMY6nNnQs6ZhGYjfY5l2ZjdY1Anrg0rsIhRlfSXUooCa7yjRhCE7BO80IpkzaMV5yPchTj1a00brHti2LN";
    if (publishableKey && publishableKey.startsWith("pk_")) {
      stripe = Stripe(publishableKey);
      console.log("✅ Stripe initialized with publishable key");
    } else {
      console.warn("⚠️  Stripe publishable key not configured. Payment features will not work.");
    }
  } catch (err) {
    console.error("Error initializing Stripe:", err);
  }
}

async function setupPaymentForm(paymentType, amount, description) {
  if (!stripe) {
    return false;
  }
  
  currentPaymentType = paymentType;
  const paymentCard = document.getElementById("stripe-payment-card");
  const contributionCard = document.querySelector(".contribute-card");
  
  try {
    let clientSecret;
    
    if (paymentType === "subscription") {
      const res = await fetch(`${API_BASE}/payments/create-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          name: user.name,
          amount: amount,
          currency: "usd"
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create subscription");
      }
      
      const data = await res.json();
      clientSecret = data.clientSecret;
    } else {
      const res = await fetch(`${API_BASE}/payments/create-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          currency: "usd",
          userId: user.id,
          description: description || "Donation to $forS"
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create payment intent");
      }
      
      const data = await res.json();
      clientSecret = data.clientSecret;
    }
    
    elements = stripe.elements({ clientSecret });
    paymentElement = elements.create("payment");
    paymentElement.mount("#payment-element");
    
    paymentCard.style.display = "block";
    contributionCard.style.display = "none";
    
    return true;
  } catch (err) {
    console.error("Error setting up payment:", err);
    showNotif(err.message || "Failed to initialize payment", false);
    return false;
  }
}

function setupPaymentFormSubmit() {
  const paymentForm = document.getElementById("payment-form");
  const cancelBtn = document.getElementById("cancel-payment-btn");
  
  if (paymentForm) {
    paymentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      if (!stripe || !paymentElement) {
        showNotif("Payment system not initialized", false);
        return;
      }
      
      const submitBtn = document.getElementById("submit-payment-btn");
      const messageDiv = document.getElementById("payment-message");
      
      submitBtn.disabled = true;
      submitBtn.textContent = "Processing...";
      messageDiv.style.display = "none";
      
      try {
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/donor.html?payment=success`,
          },
          redirect: "if_required"
        });
        
        if (error) {
          messageDiv.textContent = error.message;
          messageDiv.style.display = "block";
          submitBtn.disabled = false;
          submitBtn.textContent = "Pay Now";
        } else {
          showNotif("Payment successful! Your donation has been processed.");
          document.getElementById("stripe-payment-card").style.display = "none";
          document.querySelector(".contribute-card").style.display = "block";
          await loadData();
          paymentForm.reset();
          if (paymentElement) {
            paymentElement.unmount();
            paymentElement = null;
          }
        }
      } catch (err) {
        console.error("Payment error:", err);
        messageDiv.textContent = "An error occurred. Please try again.";
        messageDiv.style.display = "block";
        submitBtn.disabled = false;
        submitBtn.textContent = "Pay Now";
      }
    });
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      document.getElementById("stripe-payment-card").style.display = "none";
      document.querySelector(".contribute-card").style.display = "block";
      if (paymentElement) {
        paymentElement.unmount();
        paymentElement = null;
      }
      currentPaymentType = null;
    });
  }
}

// === FORMULAIRE DE DONATION ===
function setupContributionForm() {
  const contributionForm = document.getElementById("contribution-form");
  if (!contributionForm) {
    console.warn("Contribution form not found");
    return;
  }
  
  contributionForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const type = document.getElementById("contribution-type").value;
    const amount = parseFloat(document.getElementById("contribution-amount").value);
    const allocation = document.getElementById("fund-allocation").value;
    const anonymous = document.getElementById("anonymous-donation").checked;
    const taxReceipt = document.getElementById("tax-receipt").checked;

    if (!type || !amount || amount <= 0) {
      showNotif("Please fill all required fields", false);
      return;
    }

    try {
      // Utiliser Stripe si disponible
      if (stripe && (type === "monthly" || type === "one-time")) {
        const paymentType = type === "monthly" ? "subscription" : "one_time";
        const setupSuccess = await setupPaymentForm(paymentType, amount, `${type === "monthly" ? "Monthly" : "One-time"} Donation`);
        if (setupSuccess) {
          return; // Le paiement sera géré par Stripe
        }
      }
      
      // Sinon, utiliser l'ancien système
      const res = await fetch(`${API_BASE}/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          type,
          amount,
          allocation,
          anonymous,
          taxReceipt
        })
      });

      if (!res.ok) throw new Error("Erreur lors de la création de la donation");

      const newContribution = await res.json();
      contributions.push(newContribution);
      
      // Traiter l'allocation automatique
      await processContributionAllocation(newContribution);

      showNotif("Donation confirmed successfully!");
      contributionForm.reset();
      
      // Recharger les données
      await loadData();
      activateTab("dashboard");
    } catch (err) {
      console.error("Erreur :", err);
      showNotif("Error while creating donation", false);
    }
  });
}

// Initialiser le formulaire au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupContributionForm();
    initializeStripe().then(() => {
      setupPaymentFormSubmit();
    });
  });
} else {
  setupContributionForm();
  initializeStripe().then(() => {
    setupPaymentFormSubmit();
  });
}

// === TRAITEMENT DE L'ALLOCATION AUTOMATIQUE ===
async function processContributionAllocation(contribution) {
  if (contribution.allocation !== "auto") {
    const matchingRequests = allRequests.filter(r => {
      if (contribution.allocation === "tuition") return r.type === "Tuition fees";
      if (contribution.allocation === "housing") return r.type === "Housing";
      if (contribution.allocation === "transport") return r.type === "Transport";
      if (contribution.allocation === "equipment") return r.type === "Equipment";
      return false;
    });
    
    await allocateToRequests(matchingRequests, contribution);
  } else {
    const pendingRequests = allRequests
      .filter(r => r.status === "pending")
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    await allocateToRequests(pendingRequests, contribution);
  }
}

async function allocateToRequests(requests, contribution) {
  let remaining = contribution.amount;
  
  for (const request of requests) {
    if (remaining <= 0) break;
    
    let support = supportedStudents.find(s => s.studentId === request.userId && s.requestId === request.id && s.alumniId === user.id);
    
    if (!support) {
      support = {
        id: Date.now() + Math.random(),
        alumniId: user.id,
        studentId: request.userId,
        requestId: request.id,
        totalContributed: 0,
        createdAt: new Date().toISOString()
      };
      supportedStudents.push(support);
    }
    
    const currentContributed = support.totalContributed || 0;
    const toContribute = Math.min(remaining, request.amount - currentContributed);
    
    if (toContribute > 0 && currentContributed < request.amount) {
      support.totalContributed = currentContributed + toContribute;
      remaining -= toContribute;
      
      if (support.totalContributed >= request.amount) {
        await updateRequestStatus(request.id, "approved");
        const requestIndex = allRequests.findIndex(r => r.id === request.id);
        if (requestIndex !== -1) {
          allRequests[requestIndex].status = "approved";
        }
      }
    }
  }
  
  await saveSupportedStudents();
  await loadData();
}

async function updateRequestStatus(requestId, status) {
  try {
    await fetch(`${API_BASE}/requests/${requestId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
  } catch (err) {
    console.error("Erreur mise à jour requête :", err);
  }
}

async function saveSupportedStudents() {
  try {
    await fetch(`${API_BASE}/supported-students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ students: supportedStudents })
    });
  } catch (err) {
    console.error("Erreur sauvegarde étudiants :", err);
  }
}

// === AFFICHAGE DE L'HISTORIQUE ===
async function renderHistory() {
  const container = document.getElementById("donation-history-list");
  
  try {
    // Charger TOUTES les transactions depuis transactions.json
    let allTransactionsFromFile = [];
    try {
      const allTransactionsRes = await fetch(`${API_BASE}/transactions`);
      if (allTransactionsRes.ok) {
        allTransactionsFromFile = await allTransactionsRes.json();
      }
    } catch (err) {
      console.error("Erreur chargement toutes les transactions:", err);
    }
    
    // Filtrer les transactions qui appartiennent à cet utilisateur
    // Par userId OU par email (pour récupérer celles où userId n'est pas encore associé)
    const userTransactions = allTransactionsFromFile.filter(t => {
      // Vérifier par userId
      if (t.userId && Number(t.userId) === Number(user.id)) {
        return true;
      }
      // Vérifier par email (insensible à la casse)
      if (user.email && t.email) {
        return t.email.toLowerCase().trim() === user.email.toLowerCase().trim();
      }
      return false;
    });
    
    // Fusionner et éviter les doublons
    const allStripeTransactionIds = new Set();
    const stripeTransactions = [];
    
    userTransactions.forEach(t => {
      const id = t.stripePaymentIntentId || t.stripeChargeId || t.stripeInvoiceId || t.stripeSubscriptionId || t.stripeId || t.id;
      if (id && !allStripeTransactionIds.has(id)) {
        allStripeTransactionIds.add(id);
        stripeTransactions.push(t);
      }
    });
    
    // Recharger les contributions (pour inclure celles ajoutées automatiquement depuis Stripe)
    const contribRes = await fetch(`${API_BASE}/contributions/${user.id}`);
    const currentContributions = contribRes.ok ? await contribRes.json() : [];
    
    // Filtrer uniquement les contributions de l'utilisateur connecté
    const userContributions = currentContributions.filter(c => Number(c.userId) === Number(user.id));
    
    // Combiner les contributions et transactions
    // Les contributions depuis Stripe sont déjà dans userContributions (via contributions.json)
    // On garde aussi les transactions Stripe pour un historique complet
    
    // Identifier les contributions qui viennent de Stripe (ont stripePaymentIntentId, etc.)
    const stripeContributions = userContributions.filter(c => 
      c.stripePaymentIntentId || c.stripeChargeId || c.stripeSubscriptionId || c.stripeInvoiceId
    );
    
    // Les transactions Stripe qui ne sont pas déjà dans les contributions
    const stripeTransactionIds = new Set(stripeContributions.map(c => 
      c.stripePaymentIntentId || c.stripeInvoiceId || c.stripeSubscriptionId
    ));
    
    const newStripeTransactions = stripeTransactions.filter(t => 
      !stripeTransactionIds.has(t.stripePaymentIntentId || t.stripeInvoiceId || t.stripeSubscriptionId)
    );
    
    // Combiner toutes les contributions
    const allDonations = [
      // Contributions depuis Stripe (déjà dans contributions.json - ajoutées automatiquement)
      ...stripeContributions.map(c => ({
        ...c,
        source: "stripe",
        type: c.type || (c.stripeSubscriptionId ? "monthly" : "one-time")
      })),
      // Contributions locales (ancien système)
      ...userContributions.filter(c => 
        !c.stripePaymentIntentId && !c.stripeChargeId && !c.stripeSubscriptionId && !c.stripeInvoiceId
      ).map(c => ({
        ...c,
        source: "local"
      })),
      // Transactions Stripe non encore dans contributions (fallback)
      ...newStripeTransactions.map(t => ({
        id: t.id,
        amount: t.amount,
        type: t.type === "subscription" ? "monthly" : "one-time",
        description: t.description || (t.type === "subscription" ? "Monthly donation" : "One-time donation"),
        createdAt: t.createdAt,
        source: "stripe",
        stripeId: t.stripePaymentIntentId || t.stripeInvoiceId || t.stripeSubscriptionId
      }))
    ];
    
    if (allDonations.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h4>No donations yet</h4>
          <p>Your donation history will appear here. Start making a difference today!</p>
          <button class="btn" onclick="activateTab('make-donation')">Make your first donation</button>
        </div>
      `;
      return;
    }

    // Trier par date (plus récent en premier)
    const sorted = allDonations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    container.innerHTML = sorted.map(d => {
      const date = new Date(d.createdAt);
      const formattedDate = date.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
      });
      
      const typeText = d.type === "monthly" || d.type === "subscription" ? "Monthly donation" : "One-time donation";
      const allocationText = d.allocation && d.allocation !== "auto" 
        ? ` • ${d.allocation.charAt(0).toUpperCase() + d.allocation.slice(1)}`
        : "";
      const anonymousText = d.anonymous ? " (Anonymous)" : "";
      const taxText = d.taxReceipt ? " • Tax receipt requested" : "";
      const stripeBadge = d.source === "stripe" ? '<span style="background: #02aeb2; color: white; padding: 0.2rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600; margin-left: 0.5rem;">✓ Stripe</span>' : "";
      
      return `
        <div class="history-card">
          <div class="history-type">${typeText}${anonymousText}${stripeBadge}</div>
          <div class="history-amount">€${d.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div class="history-date">${formattedDate}${allocationText}${taxText}</div>
        </div>
      `;
    }).join("");
  } catch (err) {
    console.error("Erreur chargement historique:", err);
    container.innerHTML = `
      <div class="empty-state">
        <h4>Error loading history</h4>
        <p>Please try again later.</p>
      </div>
    `;
  }
}

// === BOUTON MAKE A DONATION ===
function setupMakeDonationBtn() {
  const makeDonationBtn = document.getElementById("make-donation-btn");
  if (makeDonationBtn) {
    makeDonationBtn.addEventListener("click", () => {
      activateTab("make-donation");
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupMakeDonationBtn);
} else {
  setupMakeDonationBtn();
}

// === LOAD NEWS ===
async function loadNews() {
  const newsList = document.getElementById("news-list");
  if (!newsList) return;
  
  try {
    const res = await fetch(`${API_BASE}/news?category=Donor`);
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

// === INITIALISATION ===
function initDonor() {
  console.log("Initializing Donor interface...");
  loadData();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDonor);
} else {
  initDonor();
}

// === MODAL STRIPE PAYMENT ===
function openStripeModal() {
  const modal = document.getElementById('stripe-modal');
  
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Empêcher le scroll de la page
  }
}

function openStripePayment() {
  // Ouvrir Stripe dans une nouvelle fenêtre popup
  const stripeUrl = 'https://buy.stripe.com/3cI9ATdSbemY4pFaHxdfG02';
  const width = 600;
  const height = 700;
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;
  
  const popup = window.open(
    stripeUrl,
    'StripePayment',
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
  );
  
  if (popup) {
    // Surveiller si la fenêtre est fermée
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        // Recharger les données après fermeture de la popup
        if (typeof loadData === 'function') {
          setTimeout(() => {
            loadData();
            if (typeof showNotif === 'function') {
              showNotif('Please wait while we update your donation history...', true);
            }
          }, 1000);
        }
        // Fermer le modal aussi
        closeStripeModal();
      }
    }, 1000);
    
    // Focus sur la popup
    popup.focus();
  } else {
    // Si popup bloquée, ouvrir dans un nouvel onglet
    window.open(stripeUrl, '_blank');
    if (typeof showNotif === 'function') {
      showNotif('Popup blocked. Payment page opened in a new tab.', false);
    }
  }
}

function closeStripeModal() {
  const modal = document.getElementById('stripe-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Réactiver le scroll
  }
}

// Rendre les fonctions accessibles globalement
window.openStripeModal = openStripeModal;
window.closeStripeModal = closeStripeModal;
window.openStripePayment = openStripePayment;

// Fermer le modal avec la touche ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('stripe-modal');
    if (modal && modal.classList.contains('active')) {
      closeStripeModal();
    }
  }
});

