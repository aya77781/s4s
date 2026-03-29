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
  if (user.role !== "Alumni" && user.role !== "Donor") {
    if (user.role === "Student") window.location.href = "student.html";
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

  if (userNameEl) userNameEl.textContent = user.name || "Alumni User";
  if (userRoleEl) userRoleEl.textContent = user.role || "Alumni";

  // Avatar avec initiales complètes
  const avatar = document.getElementById("user-avatar");
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

  // Personnaliser le titre de bienvenue
  const welcomeTitle = document.getElementById("welcome-title");
  const welcomeSubtitle = document.getElementById("welcome-subtitle");

  if (welcomeTitle || welcomeSubtitle) {
    const nameParts = (user.name || "A").trim().split(" ");
    const firstName = nameParts[0] || user.name || "Alumni";
    
    if (welcomeTitle) {
      welcomeTitle.textContent = `Welcome back, ${firstName}!`;
    }
    if (welcomeSubtitle) {
      welcomeSubtitle.textContent = `${user.role} Dashboard`;
    }
  }

  // Personnaliser le titre de la page
  if (user.name) {
    document.title = `$forS – ${user.name}'s ${user.role} Area`;
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
    console.log("User menu and dropdown found");
    
    // Fermer le dropdown quand on clique ailleurs
    document.addEventListener("click", e => {
      if (!userMenu.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });

    // Simple clic : ouvrir/fermer le dropdown
    userMenu.addEventListener("click", (e) => {
      // Si on clique sur un élément du dropdown (bouton), ne pas toggle
      if (e.target.classList.contains("dropdown-item")) {
        return;
      }
      
      // Toggle le dropdown
      const isOpen = dropdown.style.display === "block";
      dropdown.style.display = isOpen ? "none" : "block";
      console.log("Dropdown toggled:", !isOpen);
    });
  } else {
    console.warn("User menu or dropdown not found", { userMenu, dropdown });
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
// Attendre que le DOM soit complètement chargé
function setupLogout() {
  const logoutBtn = document.getElementById("logout-btn") || document.querySelector(".dropdown-item.danger");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      logout();
    });
    console.log("Logout button found and configured");
  } else {
    console.warn("Logout button not found");
  }
}

// Configurer le logout au chargement
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
    background: ${success ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #e11d48 0%, #be185d 100%)"};
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

    // Charger toutes les requêtes pour trouver des étudiants à aider
    const requestsRes = await fetch(`${API_BASE}/requests/all`);
    if (requestsRes.ok) {
      allRequests = await requestsRes.json();
    }

    updateDashboard();
    renderSupportedStudents();
    renderHistory();
  } catch (err) {
    console.error("Erreur lors du chargement des données :", err);
  }
}

// === MISE À JOUR DU DASHBOARD ===
function updateDashboard() {
  // Total contributions (uniquement celles de l'utilisateur connecté)
  const userContributions = contributions.filter(c => Number(c.userId) === Number(user.id));
  const total = userContributions.reduce((sum, c) => sum + c.amount, 0);
  document.getElementById("total-contributions").textContent = `€${total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  // Calculer la date d'adhésion (première contribution de l'utilisateur ou date actuelle)
  const firstContribution = userContributions.length > 0 
    ? userContributions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0]
    : null;
  
  const joinDate = firstContribution 
    ? new Date(firstContribution.createdAt)
    : new Date();
  
  const joinDateText = firstContribution
    ? `Since ${joinDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
    : "Since you joined";

  // Mettre à jour le texte contextuel avec la date d'adhésion
  const statContext = document.getElementById("join-date-text");
  if (statContext) {
    statContext.textContent = joinDateText;
  }

  // Monthly contribution (uniquement celles de l'utilisateur connecté)
  const monthly = userContributions
    .filter(c => c.type === "monthly" && c.status === "active")
    .reduce((sum, c) => sum + c.amount, 0);
  
  if (monthly > 0) {
    document.getElementById("monthly-contribution").textContent = `€${monthly}/month`;
    const firstMonthly = userContributions
      .filter(c => c.type === "monthly")
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
    if (firstMonthly) {
      const date = new Date(firstMonthly.createdAt);
      const monthName = date.toLocaleString('en-US', { month: 'long' });
      document.getElementById("monthly-context").textContent = `Since ${monthName} ${date.getFullYear()}`;
    }
  } else {
    document.getElementById("monthly-contribution").textContent = "€0/month";
    document.getElementById("monthly-context").textContent = "Not set";
  }

  // Students helped (uniquement ceux de l'utilisateur connecté)
  const userSupported = supportedStudents.filter(s => Number(s.alumniId) === Number(user.id));
  const uniqueStudents = new Set(userSupported.map(s => s.studentId));
  const studentsCount = uniqueStudents.size;
  document.getElementById("students-helped-count").textContent = studentsCount;
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
    // Si Stripe n'est pas configuré, utiliser l'ancien système
    return false;
  }
  
  currentPaymentType = paymentType;
  const paymentCard = document.getElementById("stripe-payment-card");
  const contributionCard = document.querySelector(".contribute-card");
  
  try {
    let clientSecret;
    
    if (paymentType === "subscription") {
      // Créer un abonnement
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
      // Créer un PaymentIntent
      const res = await fetch(`${API_BASE}/payments/create-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          currency: "usd",
          userId: user.id,
          description: description || "Contribution to $forS"
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create payment intent");
      }
      
      const data = await res.json();
      clientSecret = data.clientSecret;
    }
    
    // Créer les Elements Stripe
    elements = stripe.elements({ clientSecret });
    paymentElement = elements.create("payment");
    paymentElement.mount("#payment-element");
    
    // Afficher le formulaire de paiement
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
            return_url: `${window.location.origin}/alumni.html?payment=success`,
          },
          redirect: "if_required"
        });
        
        if (error) {
          messageDiv.textContent = error.message;
          messageDiv.style.display = "block";
          submitBtn.disabled = false;
          submitBtn.textContent = "Pay Now";
        } else {
          // Paiement réussi
          showNotif("Payment successful! Your contribution has been processed.");
          
          // Cacher le formulaire de paiement
          document.getElementById("stripe-payment-card").style.display = "none";
          document.querySelector(".contribute-card").style.display = "block";
          
          // Recharger les données
          await loadData();
          // loadSubscriptionStatus(); // Section supprimée
          
          // Réinitialiser le formulaire
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

async function loadSubscriptionStatus() {
  // Fonction désactivée - section supprimée
  return;
  
  const statusCard = document.getElementById("subscription-status-card");
  const statusContent = document.getElementById("subscription-status-content");
  
  if (!statusCard || !statusContent) return;
  
  try {
    const res = await fetch(`${API_BASE}/payments/subscription/${user.id}`);
    if (!res.ok) throw new Error("Failed to fetch subscription status");
    
    const data = await res.json();
    
    if (data.active) {
      const periodEnd = new Date(data.currentPeriodEnd);
      statusContent.innerHTML = `
        <div style="padding: 1rem; background: #f0fdf4; border-radius: 0.5rem; border: 1px solid #86efac;">
          <p style="margin: 0 0 0.5rem 0; color: #166534; font-weight: 600;">✓ Active Subscription</p>
          <p style="margin: 0; color: #15803d; font-size: 0.9rem;">
            Next payment: ${periodEnd.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          ${data.cancelAtPeriodEnd ? '<p style="margin: 0.5rem 0 0 0; color: #dc2626; font-size: 0.9rem;">⚠️ Subscription will be cancelled at period end</p>' : ''}
          <button class="btn-outline" onclick="window.cancelSubscription('${data.subscriptionId}')" style="margin-top: 0.75rem;">
            Cancel Subscription
          </button>
        </div>
      `;
    } else {
      statusContent.innerHTML = `
        <div style="padding: 1rem; background: #fef3c7; border-radius: 0.5rem; border: 1px solid #fde68a;">
          <p style="margin: 0 0 0.5rem 0; color: #92400e; font-weight: 600;">No Active Subscription</p>
          <p style="margin: 0; color: #78350f; font-size: 0.9rem;">
            Set up a monthly recurring contribution to automatically help students every month.
          </p>
        </div>
      `;
    }
  } catch (err) {
    console.error("Error loading subscription status:", err);
    statusContent.innerHTML = `<p style="color: #64748b;">Unable to load subscription status.</p>`;
  }
}

window.cancelSubscription = async function(subscriptionId) {
  if (!confirm("Are you sure you want to cancel your subscription? It will remain active until the end of the current billing period.")) {
    return;
  }
  
  try {
    const res = await fetch(`${API_BASE}/payments/cancel-subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionId })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to cancel subscription");
    }
    
    showNotif("Subscription will be cancelled at the end of the current period.");
    await loadSubscriptionStatus();
  } catch (err) {
    console.error("Error cancelling subscription:", err);
    showNotif(err.message || "Failed to cancel subscription", false);
  }
};

// === FORMULAIRE DE CONTRIBUTION ===
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

    if (!type || !amount || amount <= 0) {
      showNotif("Please fill all required fields", false);
      return;
    }

    try {
      // Si c'est un paiement mensuel et que Stripe est configuré, utiliser Stripe
      if (type === "monthly" && stripe) {
        const setupSuccess = await setupPaymentForm("subscription", amount, "Monthly Alumni Contribution");
        if (setupSuccess) {
          return; // Le paiement sera géré par Stripe
        }
      } else if (type === "one-time" && stripe) {
        // Pour les paiements ponctuels, on peut aussi utiliser Stripe si configuré
        const setupSuccess = await setupPaymentForm("one_time", amount, "One-time Contribution");
        if (setupSuccess) {
          return; // Le paiement sera géré par Stripe
        }
      }
      
      // Sinon, utiliser l'ancien système (ou si Stripe n'est pas configuré)
      const res = await fetch(`${API_BASE}/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          type,
          amount,
          allocation,
          anonymous
        })
      });

      if (!res.ok) throw new Error("Erreur lors de la création de la contribution");

      const newContribution = await res.json();
      contributions.push(newContribution);
      
      // Traiter l'allocation automatique
      await processContributionAllocation(newContribution);

      showNotif("Contribution confirmed successfully!");
      contributionForm.reset();
      
      // Recharger les données (loadData va aussi recharger depuis le serveur)
      await loadData();
      activateTab("dashboard");
    } catch (err) {
      console.error("Erreur :", err);
      showNotif("Error while creating contribution", false);
    }
  });
}

// Initialiser le formulaire au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupContributionForm);
} else {
  setupContributionForm();
}

// === MODAL STRIPE PAYMENT ===
let stripeMessageListener = null;
let stripeCheckInterval = null;

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
            showNotif('Please wait while we update your contribution history...', true);
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
    showNotif('Popup blocked. Payment page opened in a new tab.', false);
  }
}

function closeStripeModal() {
  const modal = document.getElementById('stripe-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Réactiver le scroll
    
    // Nettoyer les listeners
    if (stripeMessageListener) {
      window.removeEventListener('message', stripeMessageListener);
      stripeMessageListener = null;
    }
    if (stripeCheckInterval) {
      clearInterval(stripeCheckInterval);
      stripeCheckInterval = null;
    }
    
    // Recharger les données après fermeture (au cas où un paiement aurait été effectué)
    if (typeof loadData === 'function') {
      setTimeout(() => {
        loadData();
      }, 1000);
    }
  }
}

function setupStripeMessageListener() {
  // Nettoyer les anciens listeners s'ils existent
  if (stripeMessageListener) {
    window.removeEventListener('message', stripeMessageListener);
  }
  if (stripeCheckInterval) {
    clearInterval(stripeCheckInterval);
  }
  
  // Écouter les messages de l'iframe Stripe
  stripeMessageListener = (event) => {
    try {
      const iframe = document.getElementById('stripe-payment-iframe');
      if (iframe && event.source === iframe.contentWindow) {
        // Si Stripe envoie un message de succès
        if (event.data && (event.data.type === 'stripe-success' || event.data.success)) {
          showNotif('Payment successful! Thank you for your contribution.', true);
          setTimeout(() => {
            closeStripeModal();
          }, 2000);
        }
      }
    } catch (e) {
      // Erreur de cross-origin, c'est normal
    }
  };
  
  window.addEventListener('message', stripeMessageListener);
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

// === TRAITEMENT DE L'ALLOCATION AUTOMATIQUE ===
async function processContributionAllocation(contribution) {
  if (contribution.allocation !== "auto") {
    // Allocation spécifique
    const matchingRequests = allRequests.filter(r => {
      if (contribution.allocation === "tuition") return r.type === "Tuition fees";
      if (contribution.allocation === "housing") return r.type === "Housing";
      if (contribution.allocation === "transport") return r.type === "Transport";
      if (contribution.allocation === "equipment") return r.type === "Equipment";
      return false;
    });
    
    await allocateToRequests(matchingRequests, contribution);
  } else {
    // Allocation automatique - distribuer aux requêtes en attente
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
    
    // Trouver ou créer un enregistrement de soutien
    let support = supportedStudents.find(s => s.studentId === request.userId && s.requestId === request.id);
    
    if (!support) {
      // Créer un nouveau soutien
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
      
      // Mettre à jour le statut de la requête si l'objectif est atteint
      if (support.totalContributed >= request.amount) {
        // Mettre à jour dans le backend
        await updateRequestStatus(request.id, "approved");
        // Mettre à jour localement
        const requestIndex = allRequests.findIndex(r => r.id === request.id);
        if (requestIndex !== -1) {
          allRequests[requestIndex].status = "approved";
        }
      }
    }
  }
  
  // Sauvegarder les étudiants aidés
  await saveSupportedStudents();
  
  // Recharger les données pour refléter les changements
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

// === AFFICHAGE DES ÉTUDIANTS AIDÉS ===
async function renderSupportedStudents() {
  const container = document.getElementById("supported-students-list");
  
  // Filtrer uniquement les étudiants aidés par l'utilisateur connecté
  const userSupportedStudents = supportedStudents.filter(s => Number(s.alumniId) === Number(user.id));
  
  if (userSupportedStudents.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h4>No students supported yet</h4>
        <p>Your generous contributions will help students in need. Start making a difference today!</p>
        <button class="btn" onclick="activateTab('contribute')">Make your first contribution</button>
      </div>
    `;
    return;
  }

  // Grouper par étudiant
  const studentsMap = new Map();
  
  for (const support of userSupportedStudents) {
    const key = support.studentId;
    if (!studentsMap.has(key)) {
      studentsMap.set(key, {
        studentId: support.studentId,
        supports: []
      });
    }
    studentsMap.get(key).supports.push(support);
  }

  // Récupérer les infos des étudiants
  const usersRes = await fetch(`${API_BASE}/users`);
  const allUsers = usersRes.ok ? await usersRes.json() : [];
  
  let html = "";
  for (const [studentId, data] of studentsMap.entries()) {
    const student = allUsers.find(u => u.id === studentId);
    if (!student) continue;
    
    // Trouver la requête principale
    const mainSupport = data.supports[0];
    const request = allRequests.find(r => r.id === mainSupport.requestId);
    
    if (!request) continue;
    
    const totalContributed = data.supports.reduce((sum, s) => sum + s.totalContributed, 0);
    const percentage = Math.min(100, Math.round((totalContributed / request.amount) * 100));
    
    const colors = ["blue", "green", "purple"];
    const colorClass = colors[data.supports.length % colors.length];
    
    const initials = student.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    const avatarColors = ["#02aeb2", "#059199", "#0284c7"];
    const avatarColor = avatarColors[data.supports.length % avatarColors.length];
    
    html += `
      <div class="student-card">
        <div class="student-header">
          <div class="student-avatar" style="background: ${avatarColor}">${initials}</div>
          <div class="student-info">
            <h4>${student.name}</h4>
            <p>Student</p>
          </div>
        </div>
        <div class="student-details">
          <div class="student-aid">Aid for: ${request.type}</div>
          <div class="student-amount">€${totalContributed}</div>
          <div class="progress-bar">
            <div class="progress-fill ${colorClass}" style="width: ${percentage}%"></div>
          </div>
          <div class="progress-text">${percentage}% of goal (€${request.amount})</div>
        </div>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

// === AFFICHAGE DE L'HISTORIQUE ===
async function renderHistory() {
  const container = document.getElementById("contribution-history-list");
  
  try {
    // Recharger les contributions (pour inclure celles ajoutées automatiquement depuis Stripe)
    const contribRes = await fetch(`${API_BASE}/contributions/${user.id}`);
    const currentContributions = contribRes.ok ? await contribRes.json() : [];
    
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
    const allContributions = [
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
        description: t.description || (t.type === "subscription" ? "Monthly contribution" : "One-time contribution"),
        createdAt: t.createdAt,
        source: "stripe",
        stripeId: t.stripePaymentIntentId || t.stripeInvoiceId || t.stripeSubscriptionId
      }))
    ];
    
    if (allContributions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h4>No contributions yet</h4>
          <p>Your contribution history will appear here. Start contributing to make a difference!</p>
          <button class="btn" onclick="activateTab('contribute')">Make your first contribution</button>
        </div>
      `;
      return;
    }

    // Trier par date (plus récent en premier)
    const sorted = allContributions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    container.innerHTML = sorted.map(c => {
      const date = new Date(c.createdAt);
      const formattedDate = date.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
      });
      
      const typeText = c.type === "monthly" || c.type === "subscription" ? "Monthly contribution" : "One-time contribution";
      const allocationText = c.allocation && c.allocation !== "auto" 
        ? ` • ${c.allocation.charAt(0).toUpperCase() + c.allocation.slice(1)}`
        : "";
      const anonymousText = c.anonymous ? " (Anonymous)" : "";
      const stripeBadge = c.source === "stripe" ? '<span style="background: #02aeb2; color: white; padding: 0.2rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600; margin-left: 0.5rem;">✓ Stripe</span>' : "";
      
      return `
        <div class="history-card">
          <div class="history-type">${typeText}${anonymousText}${stripeBadge}</div>
          <div class="history-amount">€${c.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div class="history-date">${formattedDate}${allocationText}</div>
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
      activateTab("contribute");
    });
    console.log("Make donation button configured");
  } else {
    console.warn("Make donation button not found");
  }
}

// Initialiser le bouton au chargement
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
    const res = await fetch(`${API_BASE}/news?category=Alumni`);
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

// Load subscription status when contribute tab is activated
const contributeTab = document.querySelector('.tab[data-tab="contribute"]');
if (contributeTab) {
  contributeTab.addEventListener("click", () => {
    loadSubscriptionStatus();
  });
}

// === INITIALISATION ===
async function initAlumni() {
  console.log("Initializing Alumni interface...");
  await initializeStripe();
  setupPaymentFormSubmit();
  loadData();
}

// Initialiser au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAlumni);
} else {
  initAlumni();
}

