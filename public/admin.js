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
  if (user.role !== "Admin") {
    if (user.role === "Student") window.location.href = "student.html";
    else if (user.role === "Alumni") window.location.href = "alumni.html";
    else if (user.role === "Donor") window.location.href = "donor.html";
    else if (user.role === "Partner") window.location.href = "partner.html";
    else window.location.href = "login.html";
  }
} catch (err) {
  console.error("Error parsing user:", err);
  window.location.href = "login.html";
}

// === PERSONNALISATION ===
function ensurePersonalization() {
  if (!user) return;
  
  const userNameEl = document.getElementById("user-name");
  const userRoleEl = document.getElementById("user-role-display");

  if (userNameEl) userNameEl.textContent = user.name || "Admin User";
  if (userRoleEl) userRoleEl.textContent = "Administrator";

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
}

// === NAVIGATION ===
window.showSection = function(sectionName) {
  // Hide all sections
  document.querySelectorAll(".admin-section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".sidebar-item").forEach(i => i.classList.remove("active"));
  
  // Show selected section
  const sectionId = sectionName === "dashboard" ? "dashboard-section" :
                     sectionName === "users" ? "users-section" :
                     sectionName === "contributions" ? "contributions-section" :
                     sectionName === "requests" ? "requests-section" :
                     sectionName === "transactions" ? "transactions-section" :
                     sectionName === "news" ? "news-section" :
                     sectionName === "content" ? "content-section" :
                     sectionName === "contacts" ? "contacts-section" :
                     sectionName === "all-data" ? "all-data-section" : "dashboard-section";
  
  const section = document.getElementById(sectionId);
  if (section) section.classList.add("active");
  
  // Update sidebar
  const sidebarItems = document.querySelectorAll(".sidebar-item");
  sidebarItems.forEach(item => {
    const itemText = item.textContent.trim().toLowerCase();
    if ((sectionName === "dashboard" && itemText.includes("dashboard") && !itemText.includes("all")) ||
        (sectionName === "users" && itemText.includes("users")) ||
        (sectionName === "contributions" && itemText.includes("contributions")) ||
        (sectionName === "requests" && itemText.includes("requests")) ||
        (sectionName === "transactions" && itemText.includes("transactions")) ||
        (sectionName === "news" && itemText.includes("news")) ||
        (sectionName === "content" && itemText.includes("content")) ||
        (sectionName === "contacts" && itemText.includes("contacts")) ||
        (sectionName === "all-data" && itemText.includes("all data"))) {
      item.classList.add("active");
    }
  });
  
  // Load data for the section
  if (sectionName === "users") {
    loadUsers();
  } else if (sectionName === "contributions") {
    loadContributions();
  } else if (sectionName === "requests") {
    loadRequests();
  } else if (sectionName === "transactions") {
    loadTransactions();
  } else if (sectionName === "news") {
    loadNews();
  } else if (sectionName === "contacts") {
    loadContacts();
  } else if (sectionName === "all-data") {
    loadAllUserData();
  }
};

// === GESTION UTILISATEURS ===
// IMPORTANT: Variables GLOBALES - toutes les données de la plateforme
// Ces données sont partagées entre TOUS les admins (pas de filtrage par admin.user.id)
let allUsers = [];          // Tous les utilisateurs de la plateforme
let allRequests = [];       // Toutes les requests de la plateforme
let allContributions = []; // Toutes les contributions de la plateforme
let allNews = [];           // Toutes les news de la plateforme

async function loadUsers() {
  try {
    const res = await fetch(`${API_BASE}/users`);
    if (!res.ok) throw new Error("Failed to fetch users");
    allUsers = await res.json();
    renderUsers();
    updateQuickActions();
  } catch (err) {
    console.error("Error loading users:", err);
    showNotif("Error loading users", "error");
  }
}

function renderUsers() {
  const tbody = document.getElementById("users-table-body");
  if (!tbody) return;
  
  const searchQuery = document.getElementById("users-search")?.value.toLowerCase() || "";
  const filtered = allUsers.filter(u => 
    u.name?.toLowerCase().includes(searchQuery) ||
    u.email?.toLowerCase().includes(searchQuery)
  );
  
  tbody.innerHTML = filtered.map(u => {
    const lastLogin = u.lastLogin || "Never";
    const status = u.status || "Active";
    const roleClass = (u.role || "Student").toLowerCase();
    
    return `
      <tr>
        <td>${u.name || "Unknown"}</td>
        <td>${u.email || ""}</td>
        <td><span class="role-badge ${roleClass}">${u.role || "Student"}</span></td>
        <td><span class="status-badge ${status.toLowerCase()}">${status}</span></td>
        <td>${lastLogin}</td>
        <td class="actions-cell">
          <button class="icon-btn" onclick="editUser(${u.id})" title="Edit">
            <span class="icon-edit"></span>
          </button>
          <button class="icon-btn danger" onclick="deleteUser(${u.id})" title="Delete">
            <span class="icon-delete"></span>
          </button>
        </td>
      </tr>
    `;
  }).join("");
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #64748b;">No users found</td></tr>`;
  }
}

window.deleteUser = async function(userId) {
  if (!confirm("Are you sure you want to delete this user?")) return;
  
  try {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      method: "DELETE"
    });
    
    if (res.ok) {
      allUsers = allUsers.filter(u => u.id !== userId);
      renderUsers();
      updateDashboardMetrics();
      showNotif("User deleted successfully", "success");
    } else {
      throw new Error("Failed to delete user");
    }
  } catch (err) {
    console.error("Error deleting user:", err);
    showNotif("Error deleting user", "error");
  }
};

window.editUser = function(userId) {
  const user = allUsers.find(u => u.id === userId);
  if (!user) return;
  
  // For now, just open the add user modal with pre-filled data
  document.getElementById("user-name-input").value = user.name || "";
  document.getElementById("user-email-input").value = user.email || "";
  document.getElementById("user-role-input").value = user.role || "Student";
  document.getElementById("user-password-input").value = "";
  
  document.getElementById("add-user-modal").classList.add("show");
  // Note: To fully implement edit, you'd need to track editing state and update the API call
};

// === GESTION REQUESTS ===
// IMPORTANT: Charge TOUTES les requests (globales) - tous les admins voient les mêmes requests
async function loadRequests() {
  try {
    // Get ALL requests (global data, shared by all admins)
    const res = await fetch(`${API_BASE}/requests/all`);
    if (!res.ok) throw new Error("Failed to fetch requests");
    allRequests = await res.json(); // All requests (no filter by admin)
    renderRequests();
    updateRequestMetrics();
  } catch (err) {
    console.error("Error loading requests:", err);
    allRequests = [];
    renderRequests();
    updateRequestMetrics();
  }
}

function renderRequests() {
  const tbody = document.getElementById("requests-table-body");
  if (!tbody) return;
  
  const searchQuery = document.getElementById("requests-search")?.value.toLowerCase() || "";
  const filtered = allRequests.filter(r => {
    const student = allUsers.find(u => u.id === r.userId);
    const studentName = student?.name?.toLowerCase() || "";
    const studentEmail = student?.email?.toLowerCase() || "";
    const type = (r.type || "").toLowerCase();
    const description = (r.description || "").toLowerCase();
    const amount = String(r.amount || "");
    const status = (r.status || "").toLowerCase();
    
    return studentName.includes(searchQuery) ||
           studentEmail.includes(searchQuery) ||
           type.includes(searchQuery) ||
           description.includes(searchQuery) ||
           amount.includes(searchQuery) ||
           status.includes(searchQuery);
  });
  
  tbody.innerHTML = filtered.map(r => {
    const student = allUsers.find(u => u.id === r.userId) || { name: "Unknown", email: "" };
    const date = r.createdAt || r.date || new Date().toISOString();
    const dateObj = new Date(date);
    const formattedDate = dateObj.toISOString().split("T")[0];
    const status = r.status || "pending";
    const statusClass = status === "approved" ? "published" : status === "pending" ? "active" : "inactive";
    const statusText = status === "approved" ? "Completed" : status === "pending" ? "Pending" : "Rejected";
    const typeClass = `request-type-${(r.type || "other").toLowerCase().replace(/\s+/g, "-")}`;
    
    const descriptionText = (r.description || "No description").trim();
    const shortDescription = descriptionText.length > 50 ? descriptionText.substring(0, 50) + "..." : descriptionText;
    
    return `
      <tr>
        <td><strong>${student.name || "Unknown"}</strong></td>
        <td style="color: #64748b; font-size: 0.9rem;">${student.email || "N/A"}</td>
        <td><span class="request-type-badge ${typeClass}">${r.type || "Other"}</span></td>
        <td><strong>€${(r.amount || 0).toLocaleString()}</strong></td>
        <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${descriptionText}">${shortDescription}</td>
        <td>${formattedDate}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td class="actions-cell">
          <button class="icon-btn" onclick="window.viewRequest(${r.id})" title="View Details">
            <span class="icon-view"></span>
          </button>
          ${status === "pending" ? `
            <button class="icon-btn" onclick="window.approveRequest(${r.id})" title="Approve" style="color: #10b981;">
              <span class="icon-check"></span>
            </button>
            <button class="icon-btn danger" onclick="window.rejectRequest(${r.id})" title="Reject">
              <span class="icon-delete"></span>
            </button>
          ` : ""}
        </td>
      </tr>
    `;
  }).join("");
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #64748b;">No requests found</td></tr>`;
  }
}

function updateRequestMetrics() {
  const total = allRequests.length;
  const pending = allRequests.filter(r => r.status === "pending").length;
  const approved = allRequests.filter(r => r.status === "approved").length;
  const totalAmount = allRequests.reduce((sum, r) => sum + (r.amount || 0), 0);
  
  document.getElementById("requests-total").textContent = total.toLocaleString();
  document.getElementById("requests-pending").textContent = pending.toLocaleString();
  document.getElementById("requests-approved").textContent = approved.toLocaleString();
  
  // Update trend indicators (removed amount card, keeping 3 cards like contributions)
}

window.viewRequest = function(requestId) {
  const request = allRequests.find(r => r.id === requestId);
  if (!request) return;
  
  const student = allUsers.find(u => u.id === request.userId) || { name: "Unknown", email: "" };
  const modal = document.getElementById("request-detail-modal");
  const title = document.getElementById("request-modal-title");
  const body = document.getElementById("request-modal-body");
  const actions = document.getElementById("request-modal-actions");
  
  title.textContent = `Request from ${student.name}`;
  body.innerHTML = `
    <div class="contact-detail-item">
      <label>Student Name</label>
      <p>${student.name || "Unknown"}</p>
    </div>
    <div class="contact-detail-item">
      <label>Student Email</label>
      <p><a href="mailto:${student.email}">${student.email || "N/A"}</a></p>
    </div>
    <div class="contact-detail-item">
      <label>Request Type</label>
      <p><span class="request-type-badge request-type-${(request.type || "other").toLowerCase().replace(/\s+/g, "-")}">${request.type || "Other"}</span></p>
    </div>
    <div class="contact-detail-item">
      <label>Amount</label>
      <p><strong style="font-size: 1.2rem;">€${(request.amount || 0).toLocaleString()}</strong></p>
    </div>
    <div class="contact-detail-item">
      <label>Status</label>
      <p><span class="status-badge request-status-${request.status || "pending"}">${(request.status || "pending").charAt(0).toUpperCase() + (request.status || "pending").slice(1)}</span></p>
    </div>
    <div class="contact-detail-item">
      <label>Date</label>
      <p>${new Date(request.createdAt || request.date || Date.now()).toLocaleString()}</p>
    </div>
    <div class="contact-detail-item">
      <label>Description</label>
      <div class="contact-message">${request.description || "No description provided"}</div>
    </div>
    ${request.documentName ? `
      <div class="contact-detail-item">
        <label>Document</label>
        <p>${request.documentName}</p>
      </div>
    ` : ""}
  `;
  
  // Action buttons
  if (request.status === "pending") {
    actions.innerHTML = `
      <button type="button" class="btn-secondary" onclick="window.closeRequestModal()">Close</button>
      <button type="button" class="btn-primary" style="background: #ef4444;" onclick="window.rejectRequest(${request.id})">Reject</button>
      <button type="button" class="btn-primary" style="background: #10b981;" onclick="window.approveRequest(${request.id})">Approve</button>
    `;
  } else {
    actions.innerHTML = `
      <button type="button" class="btn-secondary" onclick="window.closeRequestModal()">Close</button>
    `;
  }
  
  modal.classList.add("show");
};

window.closeRequestModal = function() {
  document.getElementById("request-detail-modal").classList.remove("show");
};

window.approveRequest = async function(requestId) {
  if (!confirm("Are you sure you want to approve this request? The student will be notified.")) return;
  
  try {
    const res = await fetch(`${API_BASE}/requests/${requestId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to update request status");
    }
    
    const updatedRequest = await res.json();
    
    // Update local data
    const requestIndex = allRequests.findIndex(r => r.id === requestId);
    if (requestIndex !== -1) {
      allRequests[requestIndex] = updatedRequest;
    }
    
    renderRequests();
    updateRequestMetrics();
    updateDashboardMetrics();
    updateDashboardSummary();
    closeRequestModal();
    showNotif("Request approved successfully. The student can now see the update.", "success");
  } catch (err) {
    console.error("Error approving request:", err);
    showNotif(err.message || "Error approving request", "error");
  }
};

window.rejectRequest = async function(requestId) {
  if (!confirm("Are you sure you want to reject this request? The student will be notified.")) return;
  
  try {
    const res = await fetch(`${API_BASE}/requests/${requestId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to update request status");
    }
    
    const updatedRequest = await res.json();
    
    // Update local data
    const requestIndex = allRequests.findIndex(r => r.id === requestId);
    if (requestIndex !== -1) {
      allRequests[requestIndex] = updatedRequest;
    }
    
    renderRequests();
    updateRequestMetrics();
    updateDashboardMetrics();
    updateDashboardSummary();
    closeRequestModal();
    showNotif("Request rejected. The student can now see the update.", "success");
  } catch (err) {
    console.error("Error rejecting request:", err);
    showNotif(err.message || "Error rejecting request", "error");
  }
};

// === GESTION NEWS ===

async function loadNews() {
  try {
    const res = await fetch(`${API_BASE}/news`);
    if (!res.ok) throw new Error("Failed to fetch news");
    allNews = await res.json(); // Toutes les news (globales)
    renderNews();
    updateNewsMetrics();
  } catch (err) {
    console.error("Error loading news:", err);
    allNews = [];
    renderNews();
    updateNewsMetrics();
  }
}

function renderNews() {
  const tbody = document.getElementById("news-table-body");
  if (!tbody) return;
  
  const searchQuery = document.getElementById("news-search")?.value.toLowerCase() || "";
  const filtered = allNews.filter(n => {
    const title = (n.title || "").toLowerCase();
    const content = (n.content || "").toLowerCase();
    const category = (n.category || "").toLowerCase();
    return title.includes(searchQuery) || content.includes(searchQuery) || category.includes(searchQuery);
  });
  
  tbody.innerHTML = filtered.map(n => {
    const date = n.publishedAt || n.createdAt || new Date().toISOString();
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const contentPreview = (n.content || "").length > 100 
      ? (n.content || "").substring(0, 100) + "..." 
      : (n.content || "");
    
    const categoryBadgeClass = n.category === "All" ? "published" : 
                               n.category === "Student" ? "active" :
                               n.category === "Alumni" ? "published" :
                               n.category === "Donor" ? "active" : "inactive";
    
    return `
      <tr>
        <td><strong>${n.title || "Untitled"}</strong></td>
        <td><span class="status-badge ${categoryBadgeClass}">${n.category || "All"}</span></td>
        <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${n.content || ""}">${contentPreview}</td>
        <td>${formattedDate}</td>
        <td class="actions-cell">
          <button class="icon-btn" onclick="window.editNews(${n.id})" title="Edit">
            <span class="icon-edit"></span>
          </button>
          <button class="icon-btn danger" onclick="window.deleteNews(${n.id})" title="Delete">
            <span class="icon-delete"></span>
          </button>
        </td>
      </tr>
    `;
  }).join("");
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #64748b;">No news found</td></tr>`;
  }
}

function updateNewsMetrics() {
  const total = allNews.length;
  document.getElementById("news-total").textContent = total.toLocaleString();
  document.getElementById("news-published").textContent = total.toLocaleString(); // Toutes sont publiées par défaut
}

let editingNewsId = null;

window.editNews = function(newsId) {
  const newsItem = allNews.find(n => n.id === newsId);
  if (!newsItem) return;
  
  editingNewsId = newsId;
  
  document.getElementById("news-modal-title").textContent = "Edit News";
  document.getElementById("news-title-input").value = newsItem.title || "";
  document.getElementById("news-category-input").value = newsItem.category || "All";
  document.getElementById("news-content-input").value = newsItem.content || "";
  document.getElementById("news-image-input").value = newsItem.imageUrl || "";
  document.getElementById("news-image-file").value = ""; // Reset file input
  document.getElementById("news-submit-btn").textContent = "Update News";
  
  // Afficher preview si imageUrl existe
  const previewDiv = document.getElementById("image-preview");
  const previewImg = document.getElementById("preview-img");
  if (newsItem.imageUrl) {
    previewImg.src = newsItem.imageUrl;
    previewDiv.style.display = "block";
  } else {
    previewDiv.style.display = "none";
  }
  
  document.getElementById("news-modal").classList.add("show");
};

window.deleteNews = async function(newsId) {
  if (!confirm("Are you sure you want to delete this news? This action cannot be undone.")) return;
  
  try {
    const res = await fetch(`${API_BASE}/news/${newsId}`, {
      method: "DELETE"
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to delete news");
    }
    
    // Update local data
    allNews = allNews.filter(n => n.id !== newsId);
    
    renderNews();
    updateNewsMetrics();
    showNotif("News deleted successfully", "success");
  } catch (err) {
    console.error("Error deleting news:", err);
    showNotif(err.message || "Error deleting news", "error");
  }
};

window.closeNewsModal = function() {
  document.getElementById("news-modal").classList.remove("show");
  document.getElementById("news-form").reset();
  document.getElementById("image-preview").style.display = "none";
  editingNewsId = null;
  document.getElementById("news-modal-title").textContent = "Create News";
  document.getElementById("news-submit-btn").textContent = "Publish News";
};

// Setup news form
function setupNewsForm() {
  const form = document.getElementById("news-form");
  const addBtn = document.getElementById("add-news-btn");
  const imageFileInput = document.getElementById("news-image-file");
  const imageUrlInput = document.getElementById("news-image-input");
  const previewDiv = document.getElementById("image-preview");
  const previewImg = document.getElementById("preview-img");
  
  // Preview pour l'upload de fichier
  if (imageFileInput) {
    imageFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          previewImg.src = event.target.result;
          previewDiv.style.display = "block";
          // Vider l'input URL si un fichier est sélectionné
          imageUrlInput.value = "";
        };
        reader.readAsDataURL(file);
      } else {
        previewDiv.style.display = "none";
      }
    });
  }
  
  // Preview pour l'URL
  if (imageUrlInput) {
    imageUrlInput.addEventListener("input", (e) => {
      const url = e.target.value.trim();
      if (url && (url.startsWith("http") || url.startsWith("/"))) {
        previewImg.src = url;
        previewDiv.style.display = "block";
        // Vider l'input file si une URL est entrée
        if (imageFileInput) imageFileInput.value = "";
      } else if (!url) {
        previewDiv.style.display = "none";
      }
    });
  }
  
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      editingNewsId = null;
      document.getElementById("news-modal-title").textContent = "Create News";
      document.getElementById("news-submit-btn").textContent = "Publish News";
      document.getElementById("news-form").reset();
      previewDiv.style.display = "none";
      document.getElementById("news-modal").classList.add("show");
    });
  }
  
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const title = document.getElementById("news-title-input").value.trim();
      const content = document.getElementById("news-content-input").value.trim();
      const category = document.getElementById("news-category-input").value;
      const imageFile = imageFileInput?.files[0];
      const imageUrl = imageUrlInput?.value.trim();
      
      if (!title || !content || !category) {
        showNotif("Please fill in all required fields", "error");
        return;
      }
      
      const submitBtn = document.getElementById("news-submit-btn");
      submitBtn.disabled = true;
      submitBtn.textContent = editingNewsId ? "Updating..." : "Publishing...";
      
      try {
        let finalImageUrl = imageUrl || null;
        
        // Si un fichier est sélectionné, l'uploader d'abord
        if (imageFile) {
          const formData = new FormData();
          formData.append('image', imageFile);
          
          const uploadRes = await fetch(`${API_BASE}/upload/image`, {
            method: "POST",
            body: formData
          });
          
          if (!uploadRes.ok) {
            let errorMessage = "Failed to upload image";
            try {
              const error = await uploadRes.json();
              errorMessage = error.error || errorMessage;
            } catch (e) {
              // Si la réponse n'est pas du JSON, c'est probablement une page HTML d'erreur
              errorMessage = `Server error (${uploadRes.status}). Please make sure the server is running.`;
            }
            throw new Error(errorMessage);
          }
          
          const uploadData = await uploadRes.json();
          finalImageUrl = uploadData.imageUrl;
        }
        
        let res;
        if (editingNewsId) {
          // Update existing news
          res = await fetch(`${API_BASE}/news/${editingNewsId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, content, category, imageUrl: finalImageUrl })
          });
        } else {
          // Create new news
          res = await fetch(`${API_BASE}/news`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              title, 
              content, 
              category, 
              imageUrl: finalImageUrl,
              authorId: user?.id || null,
              authorName: user?.name || "Admin"
            })
          });
        }
        
        if (!res.ok) {
          let errorMessage = "Failed to save news";
          try {
            const error = await res.json();
            errorMessage = error.error || errorMessage;
          } catch (e) {
            // Si la réponse n'est pas du JSON, c'est probablement une page HTML d'erreur
            errorMessage = `Server error (${res.status}). Please make sure the server is running and the endpoint exists.`;
          }
          throw new Error(errorMessage);
        }
        
        let savedNews;
        try {
          savedNews = await res.json();
        } catch (e) {
          throw new Error("Server returned invalid response. Please check the server logs.");
        }
        
        // Update local data
        if (editingNewsId) {
          const index = allNews.findIndex(n => n.id === editingNewsId);
          if (index !== -1) {
            allNews[index] = savedNews;
          }
        } else {
          allNews.push(savedNews);
        }
        
        renderNews();
        updateNewsMetrics();
        closeNewsModal();
        showNotif(editingNewsId ? "News updated successfully" : "News published successfully", "success");
      } catch (err) {
        console.error("Error saving news:", err);
        showNotif(err.message || "Error saving news", "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = editingNewsId ? "Update News" : "Publish News";
      }
    });
  }
  
  // Setup search
  const searchInput = document.getElementById("news-search");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderNews();
    });
  }
}

// === GESTION CONTRIBUTIONS ===
// IMPORTANT: Charge TOUTES les contributions (globales) - pas de filtrage par admin
async function loadContributions() {
  try {
    // Get ALL contributions (global data, shared by all admins)
    const res = await fetch(`${API_BASE}/contributions`);
    if (res.ok) {
      allContributions = await res.json(); // All contributions (no filter by admin)
    } else {
      // Fallback: get contributions by user (but still aggregate all)
      allContributions = [];
      for (const u of allUsers) {
        try {
          const userRes = await fetch(`${API_BASE}/contributions/${u.id}`);
          if (userRes.ok) {
            const userContributions = await userRes.json();
            allContributions.push(...userContributions);
          }
        } catch (e) {
          console.error(`Error fetching contributions for user ${u.id}:`, e);
        }
      }
    }
    
    // Charger aussi les transactions Stripe qui sont des contributions
    // (pour avoir une vue complète de toutes les contributions)
    try {
      const transactionsRes = await fetch(`${API_BASE}/transactions`);
      if (transactionsRes.ok) {
        const allTransactionsData = await transactionsRes.json();
        
        // Convertir les transactions Stripe en contributions pour l'affichage
        const stripeContributions = allTransactionsData
          .filter(t => t.stripeId || t.stripePaymentIntentId || t.stripeChargeId || t.stripeSubscriptionId || t.stripeInvoiceId)
          .map(t => ({
            id: t.id,
            userId: t.userId,
            amount: t.amount,
            type: t.type === "subscription" ? "monthly" : "one-time",
            status: t.status || "completed",
            createdAt: t.createdAt,
            date: t.createdAt,
            description: t.description || (t.type === "subscription" ? "Monthly contribution" : "One-time contribution"),
            stripePaymentIntentId: t.stripePaymentIntentId,
            stripeChargeId: t.stripeChargeId,
            stripeSubscriptionId: t.stripeSubscriptionId,
            stripeInvoiceId: t.stripeInvoiceId,
            email: t.email,
            source: "stripe"
          }));
        
        // Fusionner avec les contributions existantes (éviter les doublons)
        const existingIds = new Set(allContributions.map(c => 
          c.stripePaymentIntentId || c.stripeChargeId || c.stripeSubscriptionId || c.stripeInvoiceId || c.id
        ));
        
        const newStripeContributions = stripeContributions.filter(c => {
          const id = c.stripePaymentIntentId || c.stripeChargeId || c.stripeSubscriptionId || c.stripeInvoiceId || c.id;
          return !existingIds.has(id);
        });
        
        allContributions.push(...newStripeContributions);
      }
    } catch (err) {
      console.error("Error loading transactions for contributions:", err);
    }
    
    renderContributions();
    updateContributionMetrics();
  } catch (err) {
    console.error("Error loading contributions:", err);
    allContributions = [];
    renderContributions();
    updateContributionMetrics();
  }
}

function renderContributions() {
  const tbody = document.getElementById("contributions-table-body");
  if (!tbody) return;
  
  const searchQuery = document.getElementById("contributions-search")?.value.toLowerCase() || "";
  const filtered = allContributions.filter(c => {
    const donor = allUsers.find(u => u.id === c.userId) || { name: "Unknown", email: c.email || "" };
    const transactionEmail = (c.email || "").toLowerCase();
    const type = (c.type || "").toLowerCase();
    const amount = String(c.amount || "");
    return donor?.name?.toLowerCase().includes(searchQuery) ||
           donor?.email?.toLowerCase().includes(searchQuery) ||
           transactionEmail.includes(searchQuery) ||
           type.includes(searchQuery) ||
           amount.includes(searchQuery);
  });
  
  tbody.innerHTML = filtered.map(c => {
    const donor = allUsers.find(u => u.id === c.userId) || { name: c.email ? "User (by email)" : "Unknown", email: c.email || "" };
    const date = c.date || c.createdAt || new Date().toISOString().split("T")[0];
    const dateObj = new Date(date);
    const formattedDate = dateObj.toISOString().split("T")[0];
    const amount = c.amount ? `€${c.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "N/A";
    const status = c.status || (c.type === "monthly" ? "active" : "completed");
    const statusClass = status === "completed" ? "published" : "active";
    const statusText = status === "completed" ? "Completed" : "Active";
    const type = c.type === "monthly" || c.type === "subscription" ? "Monthly" : "One-time";
    const stripeBadge = c.source === "stripe" || c.stripePaymentIntentId || c.stripeChargeId || c.stripeSubscriptionId || c.stripeInvoiceId
      ? '<span style="background: #02aeb2; color: white; padding: 0.2rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600; margin-left: 0.5rem;">✓ Stripe</span>'
      : "";
    
    return `
      <tr>
        <td><strong>${donor.name || "Unknown"}</strong><br><span style="color: #64748b; font-size: 0.85rem;">${c.email || donor.email || "N/A"}</span></td>
        <td>${type}${stripeBadge}</td>
        <td><strong>${amount}</strong></td>
        <td>${formattedDate}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${c.program || c.allocation || "General Fund"}</td>
        <td>
          <button class="icon-btn" title="View">
            <span class="icon-view"></span>
          </button>
        </td>
      </tr>
    `;
  }).join("");
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #64748b;">No contributions found</td></tr>`;
  }
}

function updateContributionMetrics() {
  const total = allContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const thisMonth = new Date().getMonth();
  const thisMonthContributions = allContributions.filter(c => {
    const date = new Date(c.date || c.createdAt);
    return date.getMonth() === thisMonth;
  });
  const lastMonthContributions = allContributions.filter(c => {
    const date = new Date(c.date || c.createdAt);
    return date.getMonth() === (thisMonth - 1 + 12) % 12;
  });
  
  const monthlyTotal = thisMonthContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const lastMonthTotal = lastMonthContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const growth = lastMonthTotal > 0 ? ((monthlyTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1) : 0;
  
  const uniqueContributors = new Set(allContributions.map(c => c.userId)).size;
  const avgDonation = allContributions.length > 0 ? total / allContributions.length : 0;
  
  document.getElementById("total-donations").textContent = `€${total.toLocaleString()}`;
  document.getElementById("donations-trend").innerHTML = `<span class="trend-arrow">${growth >= 0 ? '↑' : '↓'}</span><span class="trend-value">${Math.abs(growth)}% from last month</span>`;
  
  document.getElementById("new-contributors").textContent = uniqueContributors;
  document.getElementById("contributors-trend").innerHTML = `<span class="trend-arrow">↑</span><span class="trend-value">+${growth >= 0 ? growth : 0}% from last month</span>`;
  
  document.getElementById("average-donation").textContent = `€${Math.round(avgDonation).toLocaleString()}`;
  const avgGrowth = 0; // Calculate if needed
  document.getElementById("average-trend").innerHTML = `<span class="trend-arrow">↓</span><span class="trend-value">-${avgGrowth}% from last month</span>`;
}

// === GESTION TRANSACTIONS ===
// IMPORTANT: Charge TOUTES les transactions (globales) - pas de filtrage par admin
let allTransactions = [];

async function loadTransactions() {
  try {
    // Get ALL transactions (global data, shared by all admins)
    const res = await fetch(`${API_BASE}/transactions`);
    if (res.ok) {
      allTransactions = await res.json(); // All transactions (no filter by admin)
      renderTransactions();
      updateTransactionMetrics();
    } else {
      allTransactions = [];
      renderTransactions();
      updateTransactionMetrics();
    }
  } catch (err) {
    console.error("Error loading transactions:", err);
    allTransactions = [];
    renderTransactions();
    updateTransactionMetrics();
  }
}

function renderTransactions() {
  const tbody = document.getElementById("transactions-table-body");
  if (!tbody) return;
  
  // Filtrer pour n'afficher QUE les transactions Stripe réelles (pas de données factices)
  const realStripeTransactions = allTransactions.filter(t => {
    // Seulement les transactions avec un ID Stripe (provenant de Stripe)
    return t.stripeId || t.stripePaymentIntentId || t.stripeChargeId || t.stripeSubscriptionId || t.stripeInvoiceId || t.stripeRefundId;
  });
  
  const searchQuery = document.getElementById("transactions-search")?.value.toLowerCase() || "";
  const filtered = realStripeTransactions.filter(t => {
    const user = allUsers.find(u => u.id === t.userId);
    const userName = user?.name?.toLowerCase() || "";
    const userEmail = user?.email?.toLowerCase() || "";
    const transactionEmail = (t.email || "").toLowerCase();
    const amount = String(t.amount || "");
    const type = (t.type || "").toLowerCase();
    const status = (t.status || "").toLowerCase();
    const currency = (t.currency || "").toLowerCase();
    
    return userName.includes(searchQuery) ||
           userEmail.includes(searchQuery) ||
           transactionEmail.includes(searchQuery) ||
           amount.includes(searchQuery) ||
           type.includes(searchQuery) ||
           status.includes(searchQuery) ||
           currency.includes(searchQuery);
  });
  
  tbody.innerHTML = filtered.map(t => {
    const user = allUsers.find(u => u.id === t.userId) || { name: "Unknown", email: "" };
    const date = t.createdAt || new Date().toISOString();
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    const amount = t.amount ? `€${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "N/A";
    const currency = (t.currency || "EUR").toUpperCase();
    const type = t.type === "subscription" ? "Monthly" : t.type === "one_time" ? "One-time" : (t.type || "N/A");
    const status = t.status || "completed";
    const statusClass = status === "completed" ? "published" : status === "failed" ? "inactive" : "active";
    const statusText = status === "completed" ? "Completed" : status === "failed" ? "Failed" : "Pending";
    const source = t.stripePaymentIntentId || t.stripeChargeId || t.stripeSubscriptionId || t.stripeInvoiceId ? "Stripe" : "Local";
    const email = t.email || user.email || "N/A";
    
    return `
      <tr>
        <td>#${t.id || "N/A"}</td>
        <td><strong>${user.name || "Unknown"}</strong></td>
        <td style="color: #64748b; font-size: 0.9rem;">${email}</td>
        <td><strong>${amount}</strong></td>
        <td>${currency}</td>
        <td>${type}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td><span style="background: #02aeb2; color: white; padding: 0.2rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">${source}</span></td>
        <td style="color: #64748b; font-size: 0.9rem;">${formattedDate}</td>
        <td class="actions-cell">
          <button class="icon-btn" onclick="window.viewTransaction(${t.id})" title="View Details">
            <span class="icon-view"></span>
          </button>
        </td>
      </tr>
    `;
  }).join("");
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 2rem; color: #64748b;">No transactions found</td></tr>`;
  }
}

function updateTransactionMetrics() {
  // Filtrer SEULEMENT les transactions Stripe réelles (pas de données factices)
  const realStripeTransactions = allTransactions.filter(t => {
    return t.stripeId || t.stripePaymentIntentId || t.stripeChargeId || t.stripeSubscriptionId || t.stripeInvoiceId || t.stripeRefundId;
  });
  
  const total = realStripeTransactions.length;
  const totalAmount = realStripeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthlyTransactions = realStripeTransactions.filter(t => {
    const date = new Date(t.createdAt);
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
  });
  const monthlyAmount = monthlyTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  
  document.getElementById("total-transactions").textContent = total.toLocaleString();
  document.getElementById("total-transactions-amount").textContent = `€${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  document.getElementById("monthly-transactions").textContent = `€${monthlyAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Fonction pour voir les détails d'une transaction
window.viewTransaction = function(transactionId) {
  const transaction = allTransactions.find(t => t.id === transactionId);
  if (!transaction) {
    alert("Transaction not found");
    return;
  }
  
  const user = allUsers.find(u => u.id === transaction.userId) || { name: "Unknown", email: "" };
  const date = transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : "N/A";
  
  let details = `
    Transaction ID: #${transaction.id}
    User: ${user.name} (${user.email || transaction.email || "N/A"})
    Amount: €${transaction.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${(transaction.currency || "EUR").toUpperCase()}
    Type: ${transaction.type === "subscription" ? "Monthly Subscription" : transaction.type === "one_time" ? "One-time Payment" : transaction.type || "N/A"}
    Status: ${transaction.status || "N/A"}
    Source: ${transaction.stripePaymentIntentId || transaction.stripeChargeId || transaction.stripeSubscriptionId || transaction.stripeInvoiceId ? "Stripe" : "Local"}
    Date: ${date}
  `;
  
  if (transaction.stripePaymentIntentId) {
    details += `\nStripe Payment Intent ID: ${transaction.stripePaymentIntentId}`;
  }
  if (transaction.stripeChargeId) {
    details += `\nStripe Charge ID: ${transaction.stripeChargeId}`;
  }
  if (transaction.stripeSubscriptionId) {
    details += `\nStripe Subscription ID: ${transaction.stripeSubscriptionId}`;
  }
  if (transaction.stripeInvoiceId) {
    details += `\nStripe Invoice ID: ${transaction.stripeInvoiceId}`;
  }
  if (transaction.description) {
    details += `\nDescription: ${transaction.description}`;
  }
  
  alert(details);
}

// Fonction pour synchroniser les transactions depuis Stripe
window.syncStripeTransactions = async function() {
  const btn = document.getElementById('sync-stripe-btn');
  if (!btn) return;
  
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="icon-check"></span> Syncing...';
  
  try {
    // Utilise l'endpoint backend qui parle à Stripe via NoCodeAPI
    // et remplit backend/data/transactions.json avec TOUTES les charges.
    const res = await fetch(`${API_BASE}/transactions/sync-nocode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await res.json();
    
    if (res.ok && data.success) {
      alert(`✅ Synchronisation réussie !\n\n${data.new} nouvelles transactions ajoutées\nTotal : ${data.total} transactions`);
      // Recharger les transactions
      await loadTransactions();
    } else {
      alert(`❌ Erreur : ${data.error || 'Failed to sync transactions'}`);
    }
  } catch (err) {
    console.error('Error syncing transactions:', err);
    alert('❌ Erreur lors de la synchronisation. Vérifiez la console pour plus de détails.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// === MÉTRIQUES DU DASHBOARD ===
// IMPORTANT: Toutes les données sont GLOBALES et partagées entre tous les admins
// Aucun filtrage par user.id - tous les admins voient exactement les mêmes données
async function loadDashboardData() {
  try {
    // Load ALL global data (not filtered by admin user)
    // All admins see the same platform-wide data
    const [usersRes, requestsRes] = await Promise.all([
      fetch(`${API_BASE}/users`),           // ALL users
      fetch(`${API_BASE}/requests/all`)     // ALL requests
    ]);
    
    if (usersRes.ok) allUsers = await usersRes.json();        // All users (no filter)
    if (requestsRes.ok) allRequests = await requestsRes.json(); // All requests (no filter)
    
    // Load ALL contributions (global, not filtered)
    await loadContributions();
    
    // Update dashboard with global data (same for all admins)
    updateDashboardMetrics();
    updateQuickActions();
    updateCharts();
    
    return true;
  } catch (err) {
    console.error("Error loading dashboard data:", err);
    return false;
  }
}

function updateDashboardMetrics() {
  // IMPORTANT: Toutes ces métriques sont calculées à partir de TOUTES les données
  // Tous les admins voient exactement les mêmes valeurs (données globales)
  
  // Total Users (tous les utilisateurs de la plateforme)
  const totalUsers = allUsers.length;
  const activeUsers = allUsers.filter(u => (u.status || "Active").toLowerCase() === "active").length;
  document.getElementById("total-users").textContent = totalUsers.toLocaleString();
  
  // Monthly Contributions (toutes les contributions du mois en cours)
  const thisMonth = new Date().getMonth();
  const thisMonthContributions = allContributions.filter(c => {
    const date = new Date(c.date || c.createdAt);
    return date.getMonth() === thisMonth && date.getFullYear() === new Date().getFullYear();
  });
  const monthlyTotal = thisMonthContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  document.getElementById("monthly-contributions").textContent = `€${monthlyTotal.toLocaleString()}`;
  
  // Pending Requests (toutes les requests en attente)
  const pendingRequests = allRequests.filter(r => r.status === "pending").length;
  document.getElementById("pending-requests").textContent = pendingRequests;
  
  // Success Rate (taux de réussite global)
  const totalRequests = allRequests.length;
  const approvedRequests = allRequests.filter(r => r.status === "approved").length;
  const successRate = totalRequests > 0 ? (approvedRequests / totalRequests * 100).toFixed(1) : 0;
  document.getElementById("success-rate").textContent = `${successRate}%`;
  
  // Trends - Calculés depuis les vraies données (pas de mock)
  // Pas de données factices - les trends sont masqués si pas de données historiques
  const usersGrowth = 0; // Calculé depuis vraies données si nécessaire
  document.getElementById("users-trend").innerHTML = ``;
  
  const contributionsGrowth = 0; // Calculé depuis vraies données si nécessaire
  document.getElementById("contributions-trend").innerHTML = ``;
  
  const requestsChange = 0; // Calculé depuis vraies données si nécessaire
  document.getElementById("requests-trend").innerHTML = ``;
  
  const successGrowth = 0; // Calculé depuis vraies données si nécessaire
  document.getElementById("success-trend").innerHTML = ``;
  
  // Update summary (données globales partagées)
  updateDashboardSummary();
}

function updateQuickActions() {
  const urgentRequests = allRequests.filter(r => r.status === "pending" && r.urgent).length;
  const newApplications = allUsers.filter(u => (u.status || "").toLowerCase() === "pending").length;
  
  document.getElementById("urgent-count").textContent = urgentRequests || allRequests.filter(r => r.status === "pending").length;
  document.getElementById("applications-count").textContent = newApplications || 0;
  
  // Update report month
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonth = months[new Date().getMonth()];
  document.getElementById("report-month").textContent = `${currentMonth} performance report ready for download`;
}

// === GRAPHIQUES ===
let contributionsChart = null;
let requestsChart = null;

function updateCharts() {
  // Contributions Chart
  const ctx1 = document.getElementById("contributions-chart");
  if (ctx1) {
    const last7Months = [];
    const contributionsData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleString('default', { month: 'short' });
      last7Months.push(monthKey);
      
      const monthContributions = allContributions.filter(c => {
        const cDate = new Date(c.date || c.createdAt);
        return cDate.getMonth() === date.getMonth() && cDate.getFullYear() === date.getFullYear();
      });
      contributionsData.push(monthContributions.reduce((sum, c) => sum + (c.amount || 0), 0));
    }
    
    if (contributionsChart) contributionsChart.destroy();
    contributionsChart = new Chart(ctx1, {
      type: 'line',
      data: {
        labels: last7Months,
        datasets: [{
          label: 'Value',
          data: contributionsData,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: '#8b5cf6'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '€' + value;
              }
            }
          }
        }
      }
    });
  }
  
  // Requests Chart
  const ctx2 = document.getElementById("requests-chart");
  if (ctx2) {
    const last7Months = [];
    const requestsData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleString('default', { month: 'short' });
      last7Months.push(monthKey);
      
      const monthRequests = allRequests.filter(r => {
        const rDate = new Date(r.createdAt || r.date);
        return rDate.getMonth() === date.getMonth() && rDate.getFullYear() === date.getFullYear();
      });
      requestsData.push(monthRequests.length);
    }
    
    if (requestsChart) requestsChart.destroy();
    requestsChart = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: last7Months,
        datasets: [{
          label: 'Value',
          data: requestsData,
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }
}

// === MODAL ===
window.closeModal = function() {
  document.getElementById("add-user-modal").classList.remove("show");
  document.getElementById("add-user-form").reset();
};

window.openModal = function() {
  document.getElementById("add-user-modal").classList.add("show");
};

// === ADD USER FORM ===
async function setupAddUserForm() {
  const form = document.getElementById("add-user-form");
  if (!form) return;
  
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const name = document.getElementById("user-name-input").value.trim();
    const email = document.getElementById("user-email-input").value.trim();
    const password = document.getElementById("user-password-input").value;
    const role = document.getElementById("user-role-input").value;
    
    if (!name || !email || !password || !role) {
      showNotif("Please fill all fields", "error");
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create user");
      }
      
      const newUser = await res.json();
      allUsers.push(newUser);
      renderUsers();
      updateDashboardMetrics();
      closeModal();
      showNotif("User created successfully", "success");
    } catch (err) {
      console.error("Error creating user:", err);
      showNotif(err.message || "Error creating user", "error");
    }
  });
}

// === SEARCH ===
function setupSearch() {
  const usersSearch = document.getElementById("users-search");
  const contributionsSearch = document.getElementById("contributions-search");
  
  if (usersSearch) {
    usersSearch.addEventListener("input", () => renderUsers());
  }
  
  if (contributionsSearch) {
    contributionsSearch.addEventListener("input", () => renderContributions());
  }
}

// === CONTENT TABS ===
function setupContentTabs() {
  const tabs = document.querySelectorAll(".content-tab");
  const panels = document.querySelectorAll(".content-panel");
  
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      const target = tab.dataset.content;
      panels.forEach(p => p.style.display = "none");
      document.getElementById(`${target}-panel`).style.display = "block";
    });
  });
}

// === USER MENU ===
function setupUserMenu() {
  const userMenu = document.getElementById("user-menu");
  const dropdown = document.getElementById("user-dropdown");
  
  if (!userMenu || !dropdown) return;
  
  userMenu.addEventListener("click", (e) => {
    if (e.target.closest(".dropdown")) return;
    dropdown.classList.toggle("show");
  });
  
  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!userMenu.contains(e.target)) {
      dropdown.classList.remove("show");
    }
  });
}

// === LOGOUT ===
function setupLogout() {
  const logoutBtn = document.getElementById("logout-btn");
  if (!logoutBtn) return;
  
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("fors_user");
    window.location.href = "login.html";
  });
}

// === NOTIFICATIONS ===
function showNotif(message, type = "success") {
  // Simple notification (you can enhance this)
  alert(message);
}

// === EXPORT REPORT ===
function setupExportReport() {
  const btn = document.getElementById("export-report-btn");
  if (!btn) return;
  
  btn.addEventListener("click", () => {
    // Simple export (you can enhance this)
    const data = {
      users: allUsers.length,
      contributions: allContributions.length,
      requests: allRequests.length,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotif("Report exported successfully", "success");
  });
}

// === DOWNLOAD REPORT ===
function setupDownloadReport() {
  const btn = document.getElementById("download-report-btn");
  if (!btn) return;
  
  btn.addEventListener("click", () => {
    setupExportReport();
    btn.click();
  });
}

// === GESTION CONTACTS ===
// IMPORTANT: Tous les messages de contact sont GLOBAUX - tous les admins voient les mêmes messages
let allContacts = [];

async function loadContacts() {
  try {
    // Get ALL contact messages (global, shared by all admins)
    const res = await fetch(`${API_BASE}/contacts`);
    if (!res.ok) throw new Error("Failed to fetch contacts");
    allContacts = await res.json(); // All contacts (no filter by admin)
    renderContacts();
  } catch (err) {
    console.error("Error loading contacts:", err);
    allContacts = [];
    renderContacts();
  }
}

function renderContacts() {
  const tbody = document.getElementById("contacts-table-body");
  if (!tbody) return;
  
  const searchQuery = document.getElementById("contacts-search")?.value.toLowerCase() || "";
  const filtered = allContacts.filter(c => 
    c.companyName?.toLowerCase().includes(searchQuery) ||
    c.contactPerson?.toLowerCase().includes(searchQuery) ||
    c.email?.toLowerCase().includes(searchQuery) ||
    c.partnershipType?.toLowerCase().includes(searchQuery)
  );
  
  tbody.innerHTML = filtered.map(c => {
    const date = new Date(c.createdAt);
    const formattedDate = date.toLocaleDateString();
    const readStatus = c.read ? "Read" : "Unread";
    const statusClass = c.read ? "published" : "active";
    
    // Trouver le partner qui a envoyé le message
    const partner = c.userId ? allUsers.find(u => u.id === c.userId) : null;
    const partnerInfo = partner ? `${partner.name} (${partner.email})` : "Anonymous";
    
    return `
      <tr>
        <td>${c.companyName || "N/A"}</td>
        <td>${c.contactPerson || "N/A"}</td>
        <td>${c.email || "N/A"}</td>
        <td>${c.phone || "N/A"}</td>
        <td>${c.partnershipType || "N/A"}</td>
        <td>${formattedDate}</td>
        <td><span class="status-badge ${statusClass}">${readStatus}</span></td>
        <td class="actions-cell">
          <button class="icon-btn" onclick="window.viewContact(${c.id})" title="View">
            <span class="icon-view"></span>
          </button>
        </td>
      </tr>
    `;
  }).join("");
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #64748b;">No contact messages found</td></tr>`;
  }
}

window.viewContact = function(contactId) {
  const contact = allContacts.find(c => c.id === contactId);
  if (!contact) return;
  
  const partner = contact.userId ? allUsers.find(u => u.id === contact.userId) : null;
  const modal = document.getElementById("contact-detail-modal");
  const title = document.getElementById("contact-modal-title");
  const body = document.getElementById("contact-modal-body");
  
  title.textContent = `Contact from ${contact.companyName}`;
  body.innerHTML = `
    <div class="contact-detail-item">
      <label>Company Name</label>
      <p>${contact.companyName || "N/A"}</p>
    </div>
    <div class="contact-detail-item">
      <label>Contact Person</label>
      <p>${contact.contactPerson || "N/A"}</p>
    </div>
    <div class="contact-detail-item">
      <label>Email</label>
      <p><a href="mailto:${contact.email}">${contact.email || "N/A"}</a></p>
    </div>
    <div class="contact-detail-item">
      <label>Phone</label>
      <p>${contact.phone || "Not provided"}</p>
    </div>
    ${partner ? `
    <div class="contact-detail-item">
      <label>Partner Account</label>
      <p>${partner.name} (${partner.email})</p>
    </div>
    ` : ''}
    <div class="contact-detail-item">
      <label>Partnership Type</label>
      <p>${contact.partnershipType || "N/A"}</p>
    </div>
    <div class="contact-detail-item">
      <label>Date</label>
      <p>${new Date(contact.createdAt).toLocaleString()}</p>
    </div>
    <div class="contact-detail-item">
      <label>Message</label>
      <div class="contact-message">${contact.message || "No message"}</div>
    </div>
  `;
  
  modal.classList.add("show");
  
  // Mark as read
  if (!contact.read) {
    contact.read = true;
    // In a real app, you'd update this on the backend
  }
};

window.closeContactModal = function() {
  document.getElementById("contact-detail-modal").classList.remove("show");
  renderContacts(); // Refresh to show updated read status
};

// === TOUTES LES DONNÉES UTILISATEURS ===
async function loadAllUserData() {
  try {
    const container = document.getElementById("user-data-container");
    if (!container) return;
    
    container.innerHTML = "<p>Loading...</p>";
    
    // Load all data
    await Promise.all([loadUsers(), loadContributions()]);
    
    // Group data by user
    const userDataCards = allUsers.map(u => {
      const userRequests = allRequests.filter(r => r.userId === u.id);
      const userContributions = allContributions.filter(c => c.userId === u.id);
      
      return `
        <div class="user-data-card">
          <h3>${u.name || "Unknown"}</h3>
          <span class="role-badge ${(u.role || "Student").toLowerCase()}">${u.role || "Student"}</span>
          <p style="color: #64748b; font-size: 0.9rem; margin: 0.5rem 0 1rem 0;">${u.email || ""}</p>
          
          <div class="data-section">
            <h4>Requests (${userRequests.length})</h4>
            ${userRequests.length > 0 ? userRequests.map(r => `
              <div class="data-item">
                <span class="data-label">${r.type || "N/A"} - ${r.status || "pending"}</span>
                <span class="data-value">€${(r.amount || 0).toLocaleString()}</span>
              </div>
            `).join("") : "<p style='color: #64748b; font-size: 0.9rem;'>No requests</p>"}
          </div>
          
          <div class="data-section">
            <h4>Contributions (${userContributions.length})</h4>
            ${userContributions.length > 0 ? userContributions.map(c => `
              <div class="data-item">
                <span class="data-label">${c.type || "one-time"} - ${c.status || "completed"}</span>
                <span class="data-value">€${(c.amount || 0).toLocaleString()}</span>
              </div>
            `).join("") : "<p style='color: #64748b; font-size: 0.9rem;'>No contributions</p>"}
          </div>
        </div>
      `;
    }).join("");
    
    container.innerHTML = userDataCards || "<p>No user data available</p>";
  } catch (err) {
    console.error("Error loading all user data:", err);
    document.getElementById("user-data-container").innerHTML = "<p>Error loading data</p>";
  }
}

// === UPDATE DASHBOARD SUMMARY ===
// IMPORTANT: Toutes ces statistiques sont GLOBALES et identiques pour tous les admins
function updateDashboardSummary() {
  // All Requests Summary (toutes les requests de la plateforme)
  const requestsSummary = document.getElementById("all-requests-summary");
  if (requestsSummary) {
    const pending = allRequests.filter(r => r.status === "pending").length;
    const approved = allRequests.filter(r => r.status === "approved").length;
    const rejected = allRequests.filter(r => r.status === "rejected").length;
    const totalAmount = allRequests.reduce((sum, r) => sum + (r.amount || 0), 0);
    
    requestsSummary.innerHTML = `
      <table>
        <tr><td>Total Requests:</td><td>${allRequests.length}</td></tr>
        <tr><td>Pending:</td><td>${pending}</td></tr>
        <tr><td>Approved:</td><td>${approved}</td></tr>
        <tr><td>Rejected:</td><td>${rejected}</td></tr>
        <tr><td>Total Amount:</td><td>€${totalAmount.toLocaleString()}</td></tr>
      </table>
    `;
  }
  
  // All Contributions Summary (toutes les contributions de la plateforme)
  const contributionsSummary = document.getElementById("all-contributions-summary");
  if (contributionsSummary) {
    const totalContributions = allContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
    const monthly = allContributions.filter(c => c.type === "monthly").length;
    const oneTime = allContributions.filter(c => c.type === "one-time").length;
    
    contributionsSummary.innerHTML = `
      <table>
        <tr><td>Total Contributions:</td><td>€${totalContributions.toLocaleString()}</td></tr>
        <tr><td>Monthly:</td><td>${monthly}</td></tr>
        <tr><td>One-time:</td><td>${oneTime}</td></tr>
        <tr><td>Total Count:</td><td>${allContributions.length}</td></tr>
      </table>
    `;
  }
  
  // Users by Role Summary (tous les utilisateurs par rôle)
  const usersByRoleSummary = document.getElementById("users-by-role-summary");
  if (usersByRoleSummary) {
    const roleCounts = {};
    allUsers.forEach(u => {
      const role = u.role || "Student";
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    
    usersByRoleSummary.innerHTML = `
      <table>
        ${Object.entries(roleCounts).map(([role, count]) => `
          <tr><td>${role}:</td><td>${count}</td></tr>
        `).join("")}
      </table>
    `;
  }
}

// === INITIALIZATION ===
document.addEventListener("DOMContentLoaded", () => {
  ensurePersonalization();
  setupUserMenu();
  setupLogout();
  setupAddUserForm();
  setupSearch();
  setupContentTabs();
  setupExportReport();
  
  // Setup contacts search
  const contactsSearch = document.getElementById("contacts-search");
  if (contactsSearch) {
    contactsSearch.addEventListener("input", () => renderContacts());
  }
  
  // Setup requests search
  const requestsSearch = document.getElementById("requests-search");
  if (requestsSearch) {
    requestsSearch.addEventListener("input", () => renderRequests());
  }
  
  // Setup transactions search
  const transactionsSearch = document.getElementById("transactions-search");
  if (transactionsSearch) {
    transactionsSearch.addEventListener("input", () => renderTransactions());
  }
  
  // Load dashboard data
  loadDashboardData().then(() => {
    updateDashboardSummary();
  });
  
  // Add event listeners for add user buttons
  document.getElementById("add-user-btn")?.addEventListener("click", openModal);
  document.getElementById("add-user-btn-2")?.addEventListener("click", openModal);
  
  // Setup news form
  setupNewsForm();
});

