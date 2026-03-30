import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import multer from "multer";
import Stripe from "stripe";
import fetch from "node-fetch";

// Charger les variables d'environnement depuis .env
dotenv.config();

// Initialiser Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    })
  : null;

// === CONFIG DE BASE ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4100; // Port dynamique pour l'hébergement

const DATA_DIR = path.join(__dirname, "data");
const USERS_PATH = path.join(DATA_DIR, "users.json");
const REQUESTS_PATH = path.join(DATA_DIR, "requests.json");
const CONTRIBUTIONS_PATH = path.join(DATA_DIR, "contributions.json");
const SUPPORTED_STUDENTS_PATH = path.join(DATA_DIR, "supported-students.json");
const CONTACTS_PATH = path.join(DATA_DIR, "contacts.json");
const NEWS_PATH = path.join(DATA_DIR, "news.json");
const TRANSACTIONS_PATH = path.join(DATA_DIR, "transactions.json");

// Dossier pour les images uploadées
const UPLOADS_DIR = path.join(__dirname, "..", "public", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configuration CORS pour la production
const corsOptions = {
  origin: process.env.APP_URL || process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Configuration multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique avec timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `news-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Accepter seulement les images
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Routes API doivent être définies AVANT express.static

// === FONCTIONS UTILITAIRES ===
function readJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      // Créer un fichier vide si il n'existe pas
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, "[]", "utf-8");
      return [];
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    if (!raw || raw.trim() === "") {
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Erreur lecture JSON :", err);
    console.error("Fichier problématique :", filePath);
    return [];
  }
}

function writeJSON(filePath, data) {
  try {
    // S'assurer que le dossier existe
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Erreur écriture JSON :", err);
    throw err; // Propager l'erreur au lieu de la silencier
  }
}

// === ROUTE TEST ===
app.get("/api/ping", (req, res) => {
  res.json({
    ok: true,
    message: "Serveur S4S opérationnel",
    requestsPath: REQUESTS_PATH
  });
});

// === LOGIN ===
app.post("/api/login", (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const users = readJSON(USERS_PATH);
    if (!Array.isArray(users)) {
      console.error("❌ users.json is not a valid array");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Normaliser l'email pour la recherche (lowercase)
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email && u.email.toLowerCase() === normalizedEmail && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    res.json({ id: user.id, name: user.name, role: user.role, email: user.email });
  } catch (err) {
    console.error("❌ Erreur lors du login :", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

// === REGISTER ===
app.post("/api/register", (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const validRoles = ["Student", "Alumni", "Donor", "Partner", "Admin"];
    console.log("Role reçu:", role, "Roles valides:", validRoles);
    if (!validRoles.includes(role)) {
      console.log("❌ Rôle invalide:", role);
      return res.status(400).json({ error: "Invalid role selected", received: role, valid: validRoles });
    }

    const users = readJSON(USERS_PATH);
    if (!Array.isArray(users)) {
      console.error("❌ users.json is not a valid array");
      return res.status(500).json({ error: "Server configuration error" });
    }

    if (users.some(u => u.email === email)) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const newUser = { 
      id: Date.now(), 
      name: name.trim(), 
      email: email.trim().toLowerCase(), 
      password, 
      role 
    };
    
    users.push(newUser);
    
    try {
      writeJSON(USERS_PATH, users);
      console.log("✅ Nouvel utilisateur enregistré :", { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role });
      // Retourner l'utilisateur sans le mot de passe pour login automatique
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (writeErr) {
      console.error("❌ Erreur écriture users.json :", writeErr);
      res.status(500).json({ error: "Failed to save user data", details: writeErr.message });
    }
  } catch (err) {
    console.error("❌ Erreur lors de l'inscription :", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

// === GET ALL USERS (pour la recherche, admin seulement) ===
app.get("/api/users", (req, res) => {
  const users = readJSON(USERS_PATH);
  // Ne pas renvoyer les mots de passe
  const safeUsers = users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status || "Active",
    lastLogin: u.lastLogin || null
  }));
  res.json(safeUsers);
});

// === DELETE USER (pour Admin) ===
app.delete("/api/users/:userId", (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const users = readJSON(USERS_PATH);
    const filtered = users.filter(u => u.id !== userId);
    
    if (filtered.length === users.length) {
      return res.status(404).json({ error: "User not found" });
    }
    
    writeJSON(USERS_PATH, filtered);
    console.log("✅ User deleted:", userId);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user", details: err.message });
  }
});

// === GET ALL CONTACTS (pour Admin) ===
app.get("/api/contacts", (req, res) => {
  const contacts = readJSON(CONTACTS_PATH);
  res.json(contacts);
});

// === GET CONTACTS BY USER (pour Partner - voir leur historique) ===
app.get("/api/contacts/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  const contacts = readJSON(CONTACTS_PATH);
  const filtered = contacts.filter(c => c.userId === userId);
  res.json(filtered);
});

// === GET ALL REQUESTS (pour Alumni/Donor) ===
app.get("/api/requests/all", (req, res) => {
  const requests = readJSON(REQUESTS_PATH);
  res.json(requests);
});

// === GET REQUESTS (par utilisateur) ===
app.get("/api/requests/:userId", (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const requests = readJSON(REQUESTS_PATH);
    const filtered = requests.filter(r => Number(r.userId) === userId);
    console.log(`✅ ${filtered.length} demande(s) trouvée(s) pour userId ${userId}`);
    // Trier par date (plus récent en premier)
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });
    res.json(filtered);
  } catch (err) {
    console.error("❌ Erreur lors de la récupération des demandes :", err);
    res.status(500).json({ error: "Failed to fetch requests", details: err.message });
  }
});

// === POST REQUEST ===
app.post("/api/requests", (req, res) => {
  const { userId, type, amount, description, documentName } = req.body;

  if (!userId || !type || !amount) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Vérifier que le userId existe dans users.json
  const users = readJSON(USERS_PATH);
  const numericUserId = Number(userId);
  const userExists = users.some(u => Number(u.id) === numericUserId);
  
  if (!userExists) {
    return res.status(400).json({ error: "Invalid userId: User does not exist" });
  }

  const requests = readJSON(REQUESTS_PATH);
  const newRequest = {
    id: Date.now(),
    userId: numericUserId,
    type,
    amount: Number(amount),
    description: description || "",
    documentName: documentName || null,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  requests.push(newRequest);
  try {
    writeJSON(REQUESTS_PATH, requests);
    console.log("✅ Nouvelle requête enregistrée :", newRequest);
    res.status(201).json(newRequest);
  } catch (err) {
    console.error("❌ Erreur écriture :", err);
    res.status(500).json({ error: "Write failed", details: err.message });
  }
});

// === PATCH REQUEST STATUS ===
app.patch("/api/requests/:requestId/status", (req, res) => {
  try {
    const requestId = Number(req.params.requestId);
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be: pending, approved, or rejected" });
    }

    const requests = readJSON(REQUESTS_PATH);
    const requestIndex = requests.findIndex(r => r.id === requestId);
    
    if (requestIndex === -1) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Update the request status
    requests[requestIndex].status = status;
    requests[requestIndex].updatedAt = new Date().toISOString();
    
    // Save to file
    writeJSON(REQUESTS_PATH, requests);
    
    console.log(`✅ Request ${requestId} status updated to: ${status}`);
    
    // Return the updated request
    res.json(requests[requestIndex]);
  } catch (err) {
    console.error("❌ Error updating request status:", err);
    res.status(500).json({ error: "Failed to update request status", details: err.message });
  }
});

// === GET ALL CONTRIBUTIONS (pour Admin) ===
app.get("/api/contributions", (req, res) => {
  const contributions = readJSON(CONTRIBUTIONS_PATH);
  res.json(contributions);
});

// === GET CONTRIBUTIONS (par Alumni/Donor) ===
app.get("/api/contributions/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  const contributions = readJSON(CONTRIBUTIONS_PATH);
  const filtered = contributions.filter(c => Number(c.userId) === userId);
  res.json(filtered);
});

// === POST CONTRIBUTION ===
app.post("/api/contributions", (req, res) => {
  const { userId, type, amount, allocation, anonymous } = req.body;

  if (!userId || !type || !amount) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!["monthly", "one-time"].includes(type)) {
    return res.status(400).json({ error: "Invalid contribution type" });
  }

  const contributions = readJSON(CONTRIBUTIONS_PATH);
  const newContribution = {
    id: Date.now(),
    userId: Number(userId),
    type,
    amount: Number(amount),
    allocation: allocation || "auto",
    anonymous: anonymous || false,
    status: type === "monthly" ? "active" : "completed",
    createdAt: new Date().toISOString()
  };

  contributions.push(newContribution);
  writeJSON(CONTRIBUTIONS_PATH, contributions);
  
  console.log("✅ Nouvelle contribution enregistrée :", newContribution);
  res.status(201).json(newContribution);
});

// === GET SUPPORTED STUDENTS (par Alumni/Donor) ===
app.get("/api/supported-students/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  const supported = readJSON(SUPPORTED_STUDENTS_PATH);
  const filtered = supported.filter(s => Number(s.alumniId) === userId);
  res.json(filtered);
});

// === POST/UPDATE SUPPORTED STUDENTS ===
app.post("/api/supported-students", (req, res) => {
  const { students } = req.body;
  
  if (!Array.isArray(students)) {
    return res.status(400).json({ error: "Invalid data format" });
  }

  // Fusionner avec les données existantes (éviter les doublons)
  const existing = readJSON(SUPPORTED_STUDENTS_PATH);
  const existingMap = new Map(existing.map(s => [s.id, s]));
  
  students.forEach(s => {
    if (existingMap.has(s.id)) {
      // Mettre à jour
      const index = existing.findIndex(e => e.id === s.id);
      existing[index] = s;
    } else {
      // Ajouter
      existing.push(s);
    }
  });

  writeJSON(SUPPORTED_STUDENTS_PATH, existing);
  res.json({ success: true, count: existing.length });
});

// === CONFIGURATION EMAIL (NODEMAILER) ===
// Configuration pour Gmail SMTP
// NOTE: Pour utiliser Gmail, vous devez créer un "Mot de passe d'application" dans votre compte Google
// Allez dans: Compte Google > Sécurité > Authentification à 2 facteurs > Mots de passe des applications
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ayaboudhas7@gmail.com', // Votre adresse Gmail
    pass: process.env.GMAIL_APP_PASSWORD || '' // Mot de passe d'application Gmail (à mettre dans .env ou variable d'environnement)
  }
});

// === ENDPOINT CONTACT (ENVOI EMAIL + STOCKAGE) ===
app.post("/api/contact", async (req, res) => {
  try {
    // Support deux formats : Partner (avec companyName, contactPerson, partnershipType) ou General (avec name, subject)
    const { 
      companyName, contactPerson, email, phone, partnershipType, message, userId, 
      name, subject // Format général depuis la page d'accueil
    } = req.body;
    
    // Vérifier les champs requis selon le format
    let contactMessage;
    
    if (companyName && contactPerson && partnershipType) {
      // Format Partner
      if (!email || !message) {
        return res.status(400).json({ error: "All required fields must be filled" });
      }
      
      contactMessage = {
        id: Date.now(),
        userId: userId ? Number(userId) : null,
        type: "partner",
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        partnershipType,
        message: message.trim(),
        createdAt: new Date().toISOString(),
        read: false
      };
    } else if (name && email && subject && message) {
      // Format général depuis la page d'accueil
      contactMessage = {
        id: Date.now(),
        userId: null,
        type: "general",
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
        createdAt: new Date().toISOString(),
        read: false
      };
    } else {
      return res.status(400).json({ error: "All required fields must be filled" });
    }

    // Sauvegarder dans le fichier JSON
    try {
      const contacts = readJSON(CONTACTS_PATH);
      contacts.push(contactMessage);
      writeJSON(CONTACTS_PATH, contacts);
      console.log("✅ Message de contact sauvegardé:", contactMessage.id);
    } catch (saveErr) {
      console.error("❌ Erreur lors de la sauvegarde:", saveErr);
      // Continue quand même pour envoyer l'email
    }

    // Configuration de l'email
    let mailOptions;
    
    if (contactMessage.type === "partner") {
      mailOptions = {
        from: 'ayaboudhas7@gmail.com',
        to: 'ayaboudhas7@gmail.com',
        subject: `New Partnership Inquiry from ${contactMessage.companyName}`,
        html: `
          <h2>New Partnership Inquiry</h2>
          <p><strong>Company Name:</strong> ${contactMessage.companyName}</p>
          <p><strong>Contact Person:</strong> ${contactMessage.contactPerson}</p>
          <p><strong>Email:</strong> ${contactMessage.email}</p>
          <p><strong>Phone:</strong> ${contactMessage.phone || 'Not provided'}</p>
          <p><strong>Partnership Type:</strong> ${contactMessage.partnershipType}</p>
          <hr>
          <p><strong>Message:</strong></p>
          <p>${contactMessage.message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><small>This email was sent from the $forS Partner Area contact form.</small></p>
        `,
        text: `
New Partnership Inquiry

Company Name: ${contactMessage.companyName}
Contact Person: ${contactMessage.contactPerson}
Email: ${contactMessage.email}
Phone: ${contactMessage.phone || 'Not provided'}
Partnership Type: ${contactMessage.partnershipType}

Message:
${contactMessage.message}
        `
      };
    } else {
      // Format général
      mailOptions = {
        from: 'ayaboudhas7@gmail.com',
        to: 'ayaboudhas7@gmail.com',
        subject: `Contact Form: ${contactMessage.subject}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${contactMessage.name}</p>
          <p><strong>Email:</strong> ${contactMessage.email}</p>
          <p><strong>Subject:</strong> ${contactMessage.subject}</p>
          <hr>
          <p><strong>Message:</strong></p>
          <p>${contactMessage.message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><small>This email was sent from the $forS website contact form.</small></p>
        `,
        text: `
New Contact Form Submission

Name: ${contactMessage.name}
Email: ${contactMessage.email}
Subject: ${contactMessage.subject}

Message:
${contactMessage.message}
        `
      };
    }

    // Envoi de l'email (si GMAIL_APP_PASSWORD est configuré)
    if (process.env.GMAIL_APP_PASSWORD) {
      try {
        const info = await emailTransporter.sendMail(mailOptions);
        console.log("✅ Email envoyé avec succès:", info.messageId);
      } catch (emailErr) {
        console.error("❌ Erreur lors de l'envoi de l'email :", emailErr.message);
        // Continue même si l'email échoue, le message est déjà sauvegardé
      }
    } else {
      console.log("⚠️  Email non envoyé (GMAIL_APP_PASSWORD non configuré)");
    }
    
    res.json({ success: true, message: "Your message has been sent successfully!" });
    
  } catch (err) {
    console.error("❌ Erreur lors du traitement du contact :", err);
    res.status(500).json({ 
      error: "Failed to process contact message", 
      details: err.message 
    });
  }
});

// === WAITLIST ENDPOINT ===
const WAITLIST_PATH = path.join(DATA_DIR, "waitlist.json");

app.get("/api/waitlist", (req, res) => {
  try {
    const waitlist = readJSON(WAITLIST_PATH);
    res.json(waitlist);
  } catch (err) {
    res.status(500).json({ error: "Failed to load waitlist" });
  }
});

app.delete("/api/waitlist/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const waitlist = readJSON(WAITLIST_PATH);
    const updated = waitlist.filter(e => e.id !== id);
    writeJSON(WAITLIST_PATH, updated);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete entry" });
  }
});

app.post("/api/waitlist", async (req, res) => {
  try {
    const { name, email, role, company, message } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ error: "Name, email and role are required" });
    }

    const waitlist = readJSON(WAITLIST_PATH);

    const alreadyExists = waitlist.some(e => e.email.toLowerCase() === email.toLowerCase());
    if (alreadyExists) {
      return res.status(409).json({ error: "This email is already on the waitlist" });
    }

    const entry = {
      id: Date.now(),
      name,
      email,
      role,
      company: company || '',
      message: message || '',
      joinedAt: new Date().toISOString()
    };

    waitlist.push(entry);
    writeJSON(WAITLIST_PATH, waitlist);

    res.json({ success: true, message: "Successfully added to waitlist" });
  } catch (err) {
    console.error("❌ Waitlist error:", err);
    res.status(500).json({ error: "Failed to join waitlist", details: err.message });
  }
});

// === NEWS ENDPOINTS ===

// GET /api/news - Récupérer toutes les news (optionnel: filtrer par catégorie)
app.get("/api/news", (req, res) => {
  try {
    const news = readJSON(NEWS_PATH);
    const category = req.query.category; // Student, Alumni, Donor, Partner, All, null
    
    let filteredNews = news;
    
    // Si une catégorie est spécifiée, filtrer (sauf "All")
    if (category && category !== "All") {
      filteredNews = news.filter(n => n.category === category || n.category === "All");
    }
    
    // Trier par date de publication (plus récent en premier)
    filteredNews.sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.createdAt || 0);
      const dateB = new Date(b.publishedAt || b.createdAt || 0);
      return dateB - dateA;
    });
    
    res.json(filteredNews);
  } catch (err) {
    console.error("❌ Erreur lors de la récupération des news :", err);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// GET /api/news/:newsId - Récupérer une news spécifique
app.get("/api/news/:newsId", (req, res) => {
  try {
    const news = readJSON(NEWS_PATH);
    const newsId = Number(req.params.newsId);
    const newsItem = news.find(n => n.id === newsId);
    
    if (!newsItem) {
      return res.status(404).json({ error: "News not found" });
    }
    
    res.json(newsItem);
  } catch (err) {
    console.error("❌ Erreur lors de la récupération de la news :", err);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// Fonction pour convertir les liens ImgBB en liens directs
function convertImgBBUrl(url) {
  if (!url) return null;
  
  const trimmedUrl = url.trim();
  
  // Si c'est déjà un lien direct d'image (se termine par .jpg, .png, etc.), le retourner tel quel
  if (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(trimmedUrl)) {
    return trimmedUrl;
  }
  
  // Si c'est un lien ImgBB (ibb.co ou i.ibb.co)
  // Convertir https://ibb.co/XXXXX en https://i.ibb.co/XXXXX/image.jpg
  // Mais comme on ne connaît pas le nom exact du fichier, on essaie de récupérer depuis l'URL
  const imgbbMatch = trimmedUrl.match(/ibb\.co\/([a-zA-Z0-9]+)/);
  if (imgbbMatch) {
    const imgbbId = imgbbMatch[1];
    // Essayer de construire un lien direct (format commun ImgBB)
    // Note: Cela pourrait ne pas fonctionner pour tous les cas, mais c'est une approximation
    return `https://i.ibb.co/${imgbbId}/image.jpg`;
  }
  
  // Si c'est déjà un lien i.ibb.co, le retourner tel quel
  if (trimmedUrl.includes('i.ibb.co')) {
    return trimmedUrl;
  }
  
  // Sinon, retourner l'URL originale
  return trimmedUrl;
}

// POST /api/news - Créer une nouvelle news (admin seulement)
app.post("/api/news", (req, res) => {
  try {
    const { title, content, category, imageUrl } = req.body;
    
    // Validation
    if (!title || !content || !category) {
      return res.status(400).json({ error: "Title, content, and category are required" });
    }
    
    const validCategories = ["Student", "Alumni", "Donor", "Partner", "All"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }
    
    const news = readJSON(NEWS_PATH);
    
    // Convertir le lien ImgBB en lien direct si nécessaire
    const processedImageUrl = imageUrl ? convertImgBBUrl(imageUrl) : null;
    
    const newNews = {
      id: Date.now(),
      title: title.trim(),
      content: content.trim(),
      category,
      imageUrl: processedImageUrl,
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      authorId: req.body.authorId || null, // Optionnel: ID de l'admin qui crée
      authorName: req.body.authorName || "Admin"
    };
    
    news.push(newNews);
    writeJSON(NEWS_PATH, news);
    
    console.log("✅ News créée:", newNews.id);
    res.status(201).json(newNews);
  } catch (err) {
    console.error("❌ Erreur lors de la création de la news :", err);
    res.status(500).json({ error: "Failed to create news", details: err.message });
  }
});

// PATCH /api/news/:newsId - Modifier une news (admin seulement)
app.patch("/api/news/:newsId", (req, res) => {
  try {
    const newsId = Number(req.params.newsId);
    const { title, content, category, imageUrl } = req.body;
    
    const news = readJSON(NEWS_PATH);
    const newsIndex = news.findIndex(n => n.id === newsId);
    
    if (newsIndex === -1) {
      return res.status(404).json({ error: "News not found" });
    }
    
    // Mettre à jour les champs fournis
    if (title !== undefined) news[newsIndex].title = title.trim();
    if (content !== undefined) news[newsIndex].content = content.trim();
    if (category !== undefined) {
      const validCategories = ["Student", "Alumni", "Donor", "Partner", "All"];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: "Invalid category" });
      }
      news[newsIndex].category = category;
    }
    if (imageUrl !== undefined) {
      // Convertir le lien ImgBB en lien direct si nécessaire
      news[newsIndex].imageUrl = imageUrl ? convertImgBBUrl(imageUrl) : null;
    }
    
    news[newsIndex].updatedAt = new Date().toISOString();
    
    writeJSON(NEWS_PATH, news);
    
    console.log("✅ News mise à jour:", newsId);
    res.json(news[newsIndex]);
  } catch (err) {
    console.error("❌ Erreur lors de la mise à jour de la news :", err);
    res.status(500).json({ error: "Failed to update news", details: err.message });
  }
});

// DELETE /api/news/:newsId - Supprimer une news (admin seulement)
app.delete("/api/news/:newsId", (req, res) => {
  try {
    const newsId = Number(req.params.newsId);
    const news = readJSON(NEWS_PATH);
    const newsIndex = news.findIndex(n => n.id === newsId);
    
    if (newsIndex === -1) {
      return res.status(404).json({ error: "News not found" });
    }
    
    news.splice(newsIndex, 1);
    writeJSON(NEWS_PATH, news);
    
    console.log("✅ News supprimée:", newsId);
    res.json({ success: true, message: "News deleted successfully" });
  } catch (err) {
    console.error("❌ Erreur lors de la suppression de la news :", err);
    res.status(500).json({ error: "Failed to delete news", details: err.message });
  }
});

// === UPLOAD IMAGE ENDPOINT ===
app.post("/api/upload/image", (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error("❌ Erreur multer:", err);
      return res.status(400).json({ error: err.message || "Failed to upload image" });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      
      // Retourner l'URL relative de l'image
      const imageUrl = `/uploads/${req.file.filename}`;
      
      console.log("✅ Image uploadée:", req.file.filename);
      res.json({ 
        success: true, 
        imageUrl: imageUrl,
        filename: req.file.filename 
      });
    } catch (err) {
      console.error("❌ Erreur lors de l'upload de l'image :", err);
      res.status(500).json({ error: "Failed to upload image", details: err.message });
    }
  });
});

// === STRIPE PAYMENT ENDPOINTS ===

// POST /api/payments/create-intent - Créer un PaymentIntent pour un paiement ponctuel
app.post("/api/payments/create-intent", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured. Please set STRIPE_SECRET_KEY in .env" });
    }
    
    const { amount, currency = "usd", userId, description } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount is required and must be greater than 0" });
    }
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    // Créer un PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe utilise les centimes
      currency: currency.toLowerCase(),
      description: description || "Donation to $forS - Students for Students educational funding platform",
      metadata: {
        userId: String(userId),
        platform: "$forS",
        category: "Education",
        business_type: "Student Support Platform"
      }
    });
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (err) {
    console.error("❌ Erreur lors de la création du PaymentIntent :", err);
    res.status(500).json({ error: "Failed to create payment intent", details: err.message });
  }
});

// POST /api/payments/create-subscription - Créer un abonnement récurrent (Alumni)
app.post("/api/payments/create-subscription", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured. Please set STRIPE_SECRET_KEY in .env" });
    }
    
    const { userId, email, name, amount = 10, currency = "usd" } = req.body;
    
    if (!userId || !email) {
      return res.status(400).json({ error: "User ID and email are required" });
    }
    
    // Créer ou récupérer un customer Stripe
    const customers = await stripe.customers.list({ email: email, limit: 1 });
    let customer;
    
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: email,
        name: name,
        metadata: {
          userId: String(userId),
          platform: "$forS"
        }
      });
    }
    
    // Créer un produit et un prix pour l'abonnement
    const product = await stripe.products.create({
      name: "$forS Alumni Monthly Contribution",
      description: "Monthly recurring contribution to support current students with tuition fees, housing, transport, and equipment. Part of the $forS (Students for Students) educational funding platform.",
      metadata: {
        platform: "$forS",
        category: "Education",
        business_type: "Student Support Platform"
      }
    });
    
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      recurring: {
        interval: 'month',
      },
    });
    
    // Créer un abonnement
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      metadata: {
        userId: String(userId),
        platform: "$forS",
        type: "alumni_monthly"
      }
    });
    
    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      customerId: customer.id
    });
  } catch (err) {
    console.error("❌ Erreur lors de la création de l'abonnement :", err);
    res.status(500).json({ error: "Failed to create subscription", details: err.message });
  }
});

// POST /api/payments/webhook - Webhook Stripe pour les événements
app.post("/api/payments/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    return res.status(500).send("Stripe not configured");
  }
  
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.log("⚠️  STRIPE_WEBHOOK_SECRET not set, webhook verification skipped");
    // En développement, on peut continuer sans vérification
    return handleWebhookEvent(req.body, res);
  }
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("❌ Erreur de signature webhook:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  handleWebhookEvent(event, res);
});

async function handleWebhookEvent(event, res) {
  try {
    const transactions = readJSON(TRANSACTIONS_PATH);
    const users = readJSON(USERS_PATH);
    
    switch (event.type || event.data?.object?.object) {
      case 'payment_intent.succeeded':
      case 'charge.succeeded':
        const paymentIntent = event.type === 'payment_intent.succeeded' 
          ? event.data.object 
          : event.data.object;
        
        // Vérifier si la transaction existe déjà (éviter les doublons)
        const existingTx = transactions.find(t => 
          t.stripePaymentIntentId === paymentIntent.id || 
          t.stripeChargeId === paymentIntent.id ||
          (paymentIntent.charges?.data?.[0]?.id && t.stripeChargeId === paymentIntent.charges.data[0].id)
        );
        
        if (existingTx) {
          console.log(`ℹ️  Transaction déjà enregistrée: ${paymentIntent.id}`);
          res.json({ received: true, message: "Transaction already exists" });
          return;
        }
        
        // Récupérer le montant (convertir depuis cents)
        const amount = paymentIntent.amount_received ? paymentIntent.amount_received / 100 : 
                       (paymentIntent.amount ? paymentIntent.amount / 100 : 0);
        const currency = paymentIntent.currency ? paymentIntent.currency.toUpperCase() : "USD";
        
        // Récupérer l'email du client (plusieurs sources possibles)
        let customerEmail = paymentIntent.receipt_email ||
                           paymentIntent.charges?.data?.[0]?.billing_details?.email ||
                           paymentIntent.billing_details?.email ||
                           null;
        
        // Essayer de récupérer le userId depuis les metadata
        let userId = paymentIntent.metadata?.userId ? Number(paymentIntent.metadata.userId) : null;
        
        // Si pas de userId dans metadata, essayer de le trouver via l'email du customer
        if (!userId && paymentIntent.customer) {
          try {
            const customer = await stripe.customers.retrieve(paymentIntent.customer);
            if (customer && customer.email) {
              customerEmail = customer.email.toLowerCase();
              // Chercher l'utilisateur par email
              const users = readJSON(USERS_PATH);
              const foundUser = users.find(u => u.email.toLowerCase() === customerEmail);
              if (foundUser) {
                userId = foundUser.id;
                console.log(`✅ UserId trouvé via email customer: ${userId} pour ${customerEmail}`);
              }
            }
            // Si le customer a userId dans ses metadata, l'utiliser
            if (!userId && customer.metadata?.userId) {
              userId = Number(customer.metadata.userId);
            }
          } catch (err) {
            console.error("Erreur récupération customer:", err);
          }
        }
        
        // Si toujours pas de userId, essayer avec l'email de facturation (billing_details)
        if (!userId) {
          const billingEmail = paymentIntent.charges?.data?.[0]?.billing_details?.email || 
                                paymentIntent.receipt_email ||
                                paymentIntent.billing_details?.email;
          if (billingEmail) {
            try {
              const users = readJSON(USERS_PATH);
              const foundUser = users.find(u => u.email.toLowerCase() === billingEmail.toLowerCase());
              if (foundUser) {
                userId = foundUser.id;
                customerEmail = billingEmail.toLowerCase();
                console.log(`✅ UserId trouvé via email de facturation: ${userId} pour ${billingEmail}`);
              }
            } catch (err) {
              console.error("Erreur recherche par email de facturation:", err);
            }
          }
        }
        
        const transaction = {
          id: Date.now(),
          stripePaymentIntentId: paymentIntent.id,
          stripeChargeId: paymentIntent.charges?.data?.[0]?.id || null,
          userId: userId,
          amount: amount,
          currency: currency,
          status: "completed",
          type: "one_time",
          description: paymentIntent.description || "Donation",
          createdAt: new Date().toISOString(),
          metadata: paymentIntent.metadata || {},
          email: customerEmail,
          identifiedByEmail: !!userId && !!customerEmail
        };
        
        transactions.push(transaction);
        writeJSON(TRANSACTIONS_PATH, transactions);
        
        console.log("✅ Transaction enregistrée:", transaction.id, `userId: ${userId}`, `amount: ${transaction.amount} ${transaction.currency}`, `email: ${transaction.email || 'N/A'}`);
        
        // TOUJOURS ajouter dans les contributions (même sans userId, pour être exploité depuis contributions.json)
        try {
          const contributions = readJSON(CONTRIBUTIONS_PATH);
          
          // Vérifier si cette contribution existe déjà (éviter les doublons)
          const existingContribution = contributions.find(c => 
            c.stripePaymentIntentId === transaction.stripePaymentIntentId ||
            c.stripeChargeId === transaction.stripeChargeId ||
            (transaction.stripePaymentIntentId && c.stripePaymentIntentId === transaction.stripePaymentIntentId)
          );
          
          if (!existingContribution) {
            const newContribution = {
              id: Date.now(),
              userId: userId || null, // Peut être null si pas trouvé
              amount: transaction.amount, // Déjà divisé par 100 dans le code précédent
              type: transaction.type === "one_time" ? "one-time" : transaction.type,
              description: transaction.description || "Donation via Stripe",
              stripePaymentIntentId: transaction.stripePaymentIntentId,
              stripeChargeId: transaction.stripeChargeId,
              email: transaction.email,
              createdAt: transaction.createdAt,
              status: "completed",
              currency: transaction.currency,
              date: transaction.createdAt // Pour compatibilité
            };
            
            contributions.push(newContribution);
            writeJSON(CONTRIBUTIONS_PATH, contributions);
            
            if (userId) {
              console.log(`✅ Contribution enregistrée pour userId ${userId}: ${transaction.amount} ${transaction.currency}`);
            } else {
              console.log(`✅ Contribution enregistrée (sans userId, email: ${transaction.email}): ${transaction.amount} ${transaction.currency}`);
            }
          } else {
            console.log(`ℹ️  Contribution déjà existante pour cette transaction Stripe`);
          }
        } catch (err) {
          console.error("❌ Erreur lors de l'enregistrement de la contribution:", err);
        }
        
        break;
        
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        if (invoice.subscription) {
          // Vérifier si cette invoice a déjà été enregistrée (éviter les doublons)
          const existingInvoice = transactions.find(t => 
            t.stripeInvoiceId === invoice.id
          );
          
          if (existingInvoice) {
            console.log(`ℹ️  Invoice déjà enregistrée: ${invoice.id}`);
            res.json({ received: true, message: "Invoice already exists" });
            return;
          }
          
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          
          // Essayer de trouver userId via metadata
          let userId = subscription.metadata?.userId ? Number(subscription.metadata.userId) : null;
          let customerEmail = null;
          
          // Si pas de userId, essayer via l'email du customer
          if (!userId && subscription.customer) {
            try {
              const customer = await stripe.customers.retrieve(subscription.customer);
              if (customer && customer.email) {
                customerEmail = customer.email.toLowerCase();
                const users = readJSON(USERS_PATH);
                const foundUser = users.find(u => u.email.toLowerCase() === customerEmail);
                if (foundUser) {
                  userId = foundUser.id;
                  console.log(`✅ UserId trouvé via email (abonnement): ${userId} pour ${customerEmail}`);
                }
              }
              // Si le customer a userId dans ses metadata, l'utiliser
              if (!userId && customer.metadata?.userId) {
                userId = Number(customer.metadata.userId);
              }
            } catch (err) {
              console.error("Erreur récupération customer (abonnement):", err);
            }
          }
          
          // Essayer aussi avec l'email de facturation de l'invoice
          if (!userId && invoice.customer_email) {
            try {
              const users = readJSON(USERS_PATH);
              const foundUser = users.find(u => u.email.toLowerCase() === invoice.customer_email.toLowerCase());
              if (foundUser) {
                userId = foundUser.id;
                customerEmail = invoice.customer_email.toLowerCase();
                console.log(`✅ UserId trouvé via email invoice: ${userId} pour ${customerEmail}`);
              }
            } catch (err) {
              console.error("Erreur recherche par email invoice:", err);
            }
          }
          
          const subscriptionTransaction = {
            id: Date.now(),
            stripeSubscriptionId: subscription.id,
            stripeInvoiceId: invoice.id,
            userId: userId,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency || "usd",
            status: "completed",
            type: "subscription",
            description: "Monthly Alumni Contribution",
            createdAt: new Date().toISOString(),
            metadata: subscription.metadata || {},
            email: customerEmail || invoice.customer_email || null,
            identifiedByEmail: !!userId && !!customerEmail
          };
          
          transactions.push(subscriptionTransaction);
          writeJSON(TRANSACTIONS_PATH, transactions);
          
          console.log("✅ Paiement d'abonnement enregistré:", subscriptionTransaction.id, `userId: ${userId}`, `email: ${subscriptionTransaction.email}`);
          
          // TOUJOURS ajouter dans les contributions (même sans userId, pour être exploité depuis contributions.json)
          try {
            const contributions = readJSON(CONTRIBUTIONS_PATH);
            
            // Vérifier si cette contribution existe déjà (éviter les doublons)
            const existingContribution = contributions.find(c => 
              c.stripeSubscriptionId === subscriptionTransaction.stripeSubscriptionId &&
              c.stripeInvoiceId === subscriptionTransaction.stripeInvoiceId
            );
            
            if (!existingContribution) {
              const newContribution = {
                id: Date.now(),
                userId: userId || null, // Peut être null si pas trouvé
                amount: subscriptionTransaction.amount, // Déjà divisé par 100 dans le code précédent
                type: subscriptionTransaction.type === "subscription" ? "monthly" : subscriptionTransaction.type,
                description: subscriptionTransaction.description || "Monthly Alumni Contribution",
                stripeSubscriptionId: subscriptionTransaction.stripeSubscriptionId,
                stripeInvoiceId: subscriptionTransaction.stripeInvoiceId,
                email: subscriptionTransaction.email,
                createdAt: subscriptionTransaction.createdAt,
                status: "completed",
                currency: subscriptionTransaction.currency,
                date: subscriptionTransaction.createdAt // Pour compatibilité
              };
              
              contributions.push(newContribution);
              writeJSON(CONTRIBUTIONS_PATH, contributions);
              
              if (userId) {
                console.log(`✅ Contribution d'abonnement enregistrée pour userId ${userId}: ${subscriptionTransaction.amount} ${subscriptionTransaction.currency}`);
              } else {
                console.log(`✅ Contribution d'abonnement enregistrée (sans userId, email: ${subscriptionTransaction.email}): ${subscriptionTransaction.amount} ${subscriptionTransaction.currency}`);
              }
            } else {
              console.log(`ℹ️  Contribution d'abonnement déjà existante pour cette transaction Stripe`);
            }
          } catch (err) {
            console.error("❌ Erreur lors de l'enregistrement de la contribution d'abonnement:", err);
          }
        }
        break;
        
      case 'customer.subscription.deleted':
      case 'invoice.payment_failed':
        const failedEvent = event.data.object;
        console.log("⚠️  Paiement échoué ou abonnement annulé:", failedEvent.id);
        break;
    }
    
    res.json({ received: true });
  } catch (err) {
    console.error("❌ Erreur lors du traitement du webhook:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

// GET /api/transactions/:userId - Récupérer les transactions d'un utilisateur
app.get("/api/transactions/:userId", (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const transactions = readJSON(TRANSACTIONS_PATH);
    const userTransactions = transactions.filter(t => t.userId === userId);
    res.json(userTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (err) {
    console.error("❌ Erreur lors de la récupération des transactions :", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// GET /api/transactions/by-email/:email - Récupérer les transactions d'un utilisateur par email
app.get("/api/transactions/by-email/:email", (req, res) => {
  try {
    const userEmail = decodeURIComponent(req.params.email).toLowerCase().trim();
    const transactions = readJSON(TRANSACTIONS_PATH);
    
    // Filtrer les transactions où l'email correspond
    const userTransactions = transactions.filter(t => {
      if (!t.email) return false;
      return t.email.toLowerCase().trim() === userEmail;
    });
    
    // Trier par date (plus récent en premier)
    userTransactions.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });
    
    console.log(`✅ ${userTransactions.length} transaction(s) trouvée(s) pour l'email: ${userEmail}`);
    res.json(userTransactions);
  } catch (err) {
    console.error("❌ Erreur lors de la récupération des transactions par email :", err);
    res.status(500).json({ error: "Failed to fetch transactions by email" });
  }
});

// GET /api/transactions - Récupérer toutes les transactions (pour Admin)
// Utilise autoPagingIterator pour récupérer TOUTES les transactions automatiquement
app.get("/api/transactions", async (req, res) => {
  try {
    // Lire les transactions locales existantes
    let existingTransactions = [];
    try {
      existingTransactions = readJSON(TRANSACTIONS_PATH);
    } catch (err) {
      console.log("⚠️  Aucune transaction locale trouvée");
    }
    
    // Si Stripe est configuré, synchroniser automatiquement
    if (stripe) {
      try {
        console.log("🔄 Synchronisation automatique des transactions Stripe...");
        const users = readJSON(USERS_PATH);
        const seen = new Set();
        const combined = [];
        
        // 1. Récupérer toutes les Charges
        try {
          for await (const charge of stripe.charges.list({ limit: 100 }).autoPagingIterator()) {
            const tx = normalizeStripeTransaction(charge, "charge", users);
            if (!seen.has(tx.stripeId)) {
              combined.push(tx);
              seen.add(tx.stripeId);
            }
          }
        } catch (err) {
          console.error("   ❌ Erreur récupération charges:", err.message);
        }
        
        // 2. Récupérer tous les Payment Intents
        try {
          for await (const pi of stripe.paymentIntents.list({ limit: 100 }).autoPagingIterator()) {
            const tx = normalizeStripeTransaction(pi, "payment_intent", users);
            if (!seen.has(tx.stripeId)) {
              combined.push(tx);
              seen.add(tx.stripeId);
            }
          }
        } catch (err) {
          console.error("   ❌ Erreur récupération payment intents:", err.message);
        }
        
        // 3. Récupérer toutes les Invoices
        try {
          for await (const inv of stripe.invoices.list({ limit: 100 }).autoPagingIterator()) {
            if (inv.status === 'paid' && inv.amount_paid > 0) {
              const tx = normalizeStripeTransaction(inv, "invoice", users);
              if (!seen.has(tx.stripeId)) {
                combined.push(tx);
                seen.add(tx.stripeId);
              }
            }
          }
        } catch (err) {
          console.error("   ❌ Erreur récupération invoices:", err.message);
        }
        
        // 4. Récupérer tous les Refunds
        try {
          for await (const refund of stripe.refunds.list({ limit: 100 }).autoPagingIterator()) {
            const tx = normalizeStripeTransaction(refund, "refund", users);
            if (!seen.has(tx.stripeId)) {
              combined.push(tx);
              seen.add(tx.stripeId);
            }
          }
        } catch (err) {
          console.error("   ❌ Erreur récupération refunds:", err.message);
        }
        
        // Trier par date
        combined.sort((a, b) => {
          const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
          const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
          return tb - ta;
        });
        
        // Fusionner avec les transactions existantes
        const mergedMap = new Map();
        
        // D'ABORD, préserver TOUTES les transactions existantes (locales ET Stripe)
        for (const existing of existingTransactions) {
          const id = existing.stripeId || existing.stripePaymentIntentId || existing.stripeChargeId || 
                     existing.stripeInvoiceId || existing.stripeRefundId || existing.stripeSubscriptionId;
          if (id) {
            // Transaction Stripe existante, la préserver avec son ID
            mergedMap.set(id, existing);
          } else {
            // Transaction locale (sans ID Stripe), la préserver avec un ID local
            mergedMap.set(`local_${existing.id}`, existing);
          }
        }
        
        // PUIS, ajouter/mettre à jour avec les transactions Stripe récupérées
        // (cela mettra à jour les transactions existantes ou en ajoutera de nouvelles)
        for (const tx of combined) {
          const txId = tx.stripeId || tx.stripePaymentIntentId || tx.stripeChargeId || tx.stripeInvoiceId || tx.stripeSubscriptionId || tx.stripeRefundId;
          if (txId) {
            mergedMap.set(txId, tx); // Met à jour ou ajoute
          }
        }
        
        const merged = Array.from(mergedMap.values());
        
        // Re-tri par date
        merged.sort((a, b) => {
          const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
          const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
          return tb - ta;
        });
        
        // Sauvegarder dans le fichier
        writeJSON(TRANSACTIONS_PATH, merged);
        
        const oldStripeCount = existingTransactions.filter(t => 
          t.stripeId || t.stripePaymentIntentId || t.stripeChargeId || t.stripeInvoiceId || t.stripeRefundId
        ).length;
        const newStripeCount = combined.length;
        
        if (newStripeCount > oldStripeCount) {
          console.log(`✅ ${newStripeCount - oldStripeCount} nouvelles transactions Stripe synchronisées automatiquement`);
        }
        console.log(`✅ Total : ${merged.length} transactions dans transactions.json`);
        
        existingTransactions = merged;
      } catch (stripeErr) {
        console.error("❌ Erreur lors de la récupération depuis Stripe:", stripeErr);
        // Continuer avec les transactions locales seulement
      }
    }
    
    // Trier par date (plus récent en premier)
    existingTransactions.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });
    
    res.json(existingTransactions);
  } catch (err) {
    console.error("❌ Erreur lors de la récupération des transactions :", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// Helper pour normaliser les objets Stripe
function normalizeStripeTransaction(obj, type, users = []) {
  // Récupérer le montant (convertir depuis cents)
  let amount = null;
  if (obj.amount !== undefined) amount = obj.amount / 100;
  else if (obj.amount_received !== undefined) amount = obj.amount_received / 100;
  else if (obj.amount_paid !== undefined) amount = obj.amount_paid / 100;
  else if (obj.amount_due !== undefined) amount = obj.amount_due / 100;
  
  const currency = (obj.currency || "usd").toUpperCase();
  
  // Récupérer l'email
  let email = obj.customer_email || null;
  if (!email && obj.billing_details) email = obj.billing_details.email || null;
  if (!email && obj.receipt_email) email = obj.receipt_email;
  
  // Trouver userId via email
  let userId = null;
  if (email) {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (foundUser) userId = foundUser.id;
  }
  
  // Créer l'objet transaction normalisé
  const transaction = {
    id: obj.created ? obj.created * 1000 : Date.now(),
    stripeId: obj.id,
    type: type,
    amount: amount,
    currency: currency,
    email: email,
    userId: userId,
    status: obj.status === "succeeded" ? "completed" : (obj.status || null),
    createdAt: obj.created ? new Date(obj.created * 1000).toISOString() : new Date().toISOString(),
    metadata: obj.metadata || {}
  };
  
  // Ajouter les IDs spécifiques selon le type
  if (type === "charge") {
    transaction.stripeChargeId = obj.id;
    transaction.stripePaymentIntentId = obj.payment_intent;
  } else if (type === "payment_intent") {
    transaction.stripePaymentIntentId = obj.id;
    transaction.stripeChargeId = obj.latest_charge;
  } else if (type === "invoice") {
    transaction.stripeInvoiceId = obj.id;
    transaction.stripeSubscriptionId = obj.subscription;
    if (obj.subscription) transaction.type = "subscription";
  } else if (type === "refund") {
    transaction.stripeRefundId = obj.id;
    transaction.stripeChargeId = obj.charge;
  }
  
  return transaction;
}

// Récupère tous les objets avec autoPagingIterator (récupère TOUTES les pages)
async function fetchAllStripeObjects(listCall) {
  const results = [];
  for await (const item of listCall.autoPagingIterator()) {
    results.push(item);
  }
  return results;
}

// Helper pour enregistrer une transaction dans contributions.json
// Cette fonction vérifie les doublons et enregistre uniquement si la contribution n'existe pas déjà
function addTransactionToContributions(transaction) {
  try {
    const contributions = readJSON(CONTRIBUTIONS_PATH);
    
    // Vérifier si cette contribution existe déjà (par n'importe quel ID Stripe)
    const existingContribution = contributions.find(c => 
      (transaction.stripePaymentIntentId && c.stripePaymentIntentId === transaction.stripePaymentIntentId) ||
      (transaction.stripeChargeId && c.stripeChargeId === transaction.stripeChargeId) ||
      (transaction.stripeSubscriptionId && c.stripeSubscriptionId === transaction.stripeSubscriptionId) ||
      (transaction.stripeInvoiceId && c.stripeInvoiceId === transaction.stripeInvoiceId)
    );
    
    if (existingContribution) {
      return false; // Contribution déjà existante
    }
    
    const newContribution = {
      id: Date.now() + Math.random(), // ID unique
      userId: transaction.userId || null,
      amount: transaction.amount, // Déjà divisé par 100
      type: transaction.type === "subscription" ? "monthly" : (transaction.type === "one_time" ? "one-time" : transaction.type),
      description: transaction.description || "Contribution via Stripe",
      stripePaymentIntentId: transaction.stripePaymentIntentId || null,
      stripeChargeId: transaction.stripeChargeId || null,
      stripeSubscriptionId: transaction.stripeSubscriptionId || null,
      stripeInvoiceId: transaction.stripeInvoiceId || null,
      email: transaction.email || null,
      createdAt: transaction.createdAt,
      status: "completed",
      currency: transaction.currency || "EUR",
      date: transaction.createdAt || transaction.date
    };
    
    contributions.push(newContribution);
    writeJSON(CONTRIBUTIONS_PATH, contributions);
    
    return true; // Contribution ajoutée avec succès
  } catch (err) {
    console.error("❌ Erreur lors de l'enregistrement de la contribution:", err);
    return false;
  }
}

// === SYNCHRONISATION DES TRANSACTIONS VIA NOCODEAPI (SANS STRIPE_SECRET_KEY) ===
// Permet de récupérer les charges Stripe via NoCodeAPI et de les stocker dans transactions.json
// Utilise l'URL définie dans la variable d'environnement NOCODE_STRIPE_CHARGES_URL
// ou, par défaut, l'URL fournie pour ce projet.
app.post("/api/transactions/sync-nocode", async (req, res) => {
  try {
    const nocodeUrl =
      process.env.NOCODE_STRIPE_CHARGES_URL ||
      "https://v1.nocodeapi.com/aboudhas1/stripe/wGSGvJFKQwNBuvon/charges";

    console.log("🔄 Synchronisation des transactions Stripe via NoCodeAPI...");

    const response = await fetch(nocodeUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const rawBody = await response.text();

    if (!response.ok) {
      console.error("❌ Erreur NoCodeAPI:", rawBody);
      return res.status(500).json({
        error: "Failed to fetch transactions from NoCodeAPI",
        details: rawBody,
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawBody);
    } catch (err) {
      console.error("❌ Réponse NoCodeAPI non valide (JSON):", err.message);
      return res.status(500).json({
        error: "Invalid JSON returned from NoCodeAPI",
        details: err.message,
      });
    }

    // NoCodeAPI retourne généralement un objet avec une propriété "data" contenant la liste des charges.
    const charges = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.data)
      ? parsed.data
      : [];

    if (!Array.isArray(charges) || charges.length === 0) {
      console.log("ℹ️  Aucune charge Stripe trouvée via NoCodeAPI.");
      return res.json({
        success: true,
        message: "No charges found from NoCodeAPI",
        total: 0,
        new: 0,
      });
    }

    const users = readJSON(USERS_PATH);
    const existingTransactions = readJSON(TRANSACTIONS_PATH);

    const seen = new Set();
    const combined = [];

    // Construire des transactions normalisées à partir des charges Stripe
    for (const charge of charges) {
      try {
        const tx = normalizeStripeTransaction(charge, "charge", users);
        if (tx.stripeId && !seen.has(tx.stripeId)) {
          combined.push(tx);
          seen.add(tx.stripeId);
        }
      } catch (err) {
        console.error("❌ Erreur lors de la normalisation d'une charge:", err);
      }
    }

    // Trier par date (plus récent en premier)
    combined.sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return tb - ta;
    });

    // Fusionner avec les transactions existantes (éviter les doublons)
    const mergedMap = new Map();

    // D'ABORD, préserver TOUTES les transactions existantes (locales ET Stripe)
    for (const existing of existingTransactions) {
      const id =
        existing.stripeId ||
        existing.stripePaymentIntentId ||
        existing.stripeChargeId ||
        existing.stripeInvoiceId ||
        existing.stripeRefundId ||
        existing.stripeSubscriptionId;
      if (id) {
        // Transaction Stripe existante, la préserver avec son ID
        mergedMap.set(id, existing);
      } else {
        // Transaction locale (sans ID Stripe), la préserver avec un ID local
        mergedMap.set(`local_${existing.id}`, existing);
      }
    }

    // PUIS, ajouter/mettre à jour avec les transactions Stripe issues de NoCodeAPI
    // (cela mettra à jour les transactions existantes ou en ajoutera de nouvelles)
    for (const tx of combined) {
      const txId = tx.stripeId || tx.stripePaymentIntentId || tx.stripeChargeId || tx.stripeInvoiceId || tx.stripeSubscriptionId;
      if (txId) {
        mergedMap.set(txId, tx); // Met à jour ou ajoute
      }
    }

    const merged = Array.from(mergedMap.values());

    // Re-tri final par date
    merged.sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return tb - ta;
    });

    // Sauvegarder dans le fichier JSON
    writeJSON(TRANSACTIONS_PATH, merged);

    const oldStripeCount = existingTransactions.filter(
      (t) =>
        t.stripeId ||
        t.stripePaymentIntentId ||
        t.stripeChargeId ||
        t.stripeInvoiceId ||
        t.stripeRefundId
    ).length;
    const newStripeCount = combined.length;

    const newCount =
      newStripeCount > oldStripeCount ? newStripeCount - oldStripeCount : 0;

    // Enregistrer les nouvelles transactions dans contributions.json
    let contributionsAdded = 0;
    if (newCount > 0) {
      // Identifier les nouvelles transactions (celles qui n'existaient pas avant)
      const existingIds = new Set(
        existingTransactions.map(t => 
          t.stripeId || t.stripePaymentIntentId || t.stripeChargeId || t.stripeInvoiceId || t.stripeSubscriptionId
        ).filter(Boolean)
      );
      
      for (const tx of combined) {
        const txId = tx.stripeId || tx.stripePaymentIntentId || tx.stripeChargeId || tx.stripeInvoiceId || tx.stripeSubscriptionId;
        if (txId && !existingIds.has(txId)) {
          // C'est une nouvelle transaction, l'ajouter dans contributions.json
          if (addTransactionToContributions(tx)) {
            contributionsAdded++;
          }
        }
      }
    }

    console.log(
      `✅ Synchronisation NoCodeAPI terminée : ${newCount} nouvelles transactions ajoutées`
    );
    if (contributionsAdded > 0) {
      console.log(`✅ ${contributionsAdded} nouvelle(s) contribution(s) ajoutée(s) dans contributions.json`);
    }
    console.log(`✅ Total : ${merged.length} transactions dans transactions.json`);

    res.json({
      success: true,
      message: `Synchronisation NoCodeAPI réussie : ${newCount} nouvelles transactions ajoutées`,
      total: merged.length,
      new: newCount,
      contributionsAdded: contributionsAdded,
      source: "nocodeapi",
    });
  } catch (err) {
    console.error("❌ Erreur lors de la synchronisation via NoCodeAPI :", err);
    res.status(500).json({
      error: "Failed to sync transactions from NoCodeAPI",
      details: err.message,
    });
  }
});

// POST /api/transactions/sync - Synchroniser les transactions depuis Stripe vers transactions.json
app.post("/api/transactions/sync", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured. Please set STRIPE_SECRET_KEY in .env" });
    }
    
    console.log("🔄 Synchronisation complète des transactions Stripe...");
    
    const users = readJSON(USERS_PATH);
    const existingTransactions = readJSON(TRANSACTIONS_PATH);
    const seen = new Set();
    const combined = [];
    
    // 1. Récupérer toutes les Charges
    console.log("📥 Récupération des Charges...");
    try {
      const charges = await fetchAllStripeObjects(stripe.charges.list({ limit: 100 }));
      for (const charge of charges) {
        const tx = normalizeStripeTransaction(charge, "charge", users);
        if (!seen.has(tx.stripeId)) {
          combined.push(tx);
          seen.add(tx.stripeId);
        }
      }
      console.log(`   ✅ ${charges.length} charges récupérées`);
    } catch (err) {
      console.error("   ❌ Erreur récupération charges:", err.message);
    }
    
    // 2. Récupérer tous les Payment Intents
    console.log("📥 Récupération des Payment Intents...");
    try {
      const paymentIntents = await fetchAllStripeObjects(stripe.paymentIntents.list({ limit: 100 }));
      for (const pi of paymentIntents) {
        const tx = normalizeStripeTransaction(pi, "payment_intent", users);
        if (!seen.has(tx.stripeId)) {
          combined.push(tx);
          seen.add(tx.stripeId);
        }
      }
      console.log(`   ✅ ${paymentIntents.length} payment intents récupérés`);
    } catch (err) {
      console.error("   ❌ Erreur récupération payment intents:", err.message);
    }
    
    // 3. Récupérer toutes les Invoices
    console.log("📥 Récupération des Invoices...");
    try {
      const invoices = await fetchAllStripeObjects(stripe.invoices.list({ limit: 100 }));
      for (const inv of invoices) {
        // Seulement les invoices payées
        if (inv.status === 'paid' && inv.amount_paid > 0) {
          const tx = normalizeStripeTransaction(inv, "invoice", users);
          if (!seen.has(tx.stripeId)) {
            combined.push(tx);
            seen.add(tx.stripeId);
          }
        }
      }
      console.log(`   ✅ ${invoices.length} invoices récupérées`);
    } catch (err) {
      console.error("   ❌ Erreur récupération invoices:", err.message);
    }
    
    // 4. Récupérer tous les Refunds
    console.log("📥 Récupération des Refunds...");
    try {
      const refunds = await fetchAllStripeObjects(stripe.refunds.list({ limit: 100 }));
      for (const refund of refunds) {
        const tx = normalizeStripeTransaction(refund, "refund", users);
        if (!seen.has(tx.stripeId)) {
          combined.push(tx);
          seen.add(tx.stripeId);
        }
      }
      console.log(`   ✅ ${refunds.length} refunds récupérés`);
    } catch (err) {
      console.error("   ❌ Erreur récupération refunds:", err.message);
    }
    
    // Trier par date de création (plus récent en premier)
    combined.sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return tb - ta;
    });
    
    // Fusionner avec les transactions existantes (éviter les doublons)
    const mergedMap = new Map();
    
    // D'ABORD, préserver TOUTES les transactions existantes (locales ET Stripe)
    for (const existing of existingTransactions) {
      const id = existing.stripeId || existing.stripePaymentIntentId || existing.stripeChargeId || 
                 existing.stripeInvoiceId || existing.stripeRefundId || existing.stripeSubscriptionId;
      if (id) {
        // Transaction Stripe existante, la préserver avec son ID
        mergedMap.set(id, existing);
      } else {
        // Transaction locale (sans ID Stripe), la préserver avec un ID local
        mergedMap.set(`local_${existing.id}`, existing);
      }
    }
    
    // PUIS, ajouter/mettre à jour avec les transactions Stripe récupérées
    // (cela mettra à jour les transactions existantes ou en ajoutera de nouvelles)
    for (const tx of combined) {
      const txId = tx.stripeId || tx.stripePaymentIntentId || tx.stripeChargeId || tx.stripeInvoiceId || tx.stripeSubscriptionId || tx.stripeRefundId;
      if (txId) {
        mergedMap.set(txId, tx); // Met à jour ou ajoute
      }
    }
    
    const merged = Array.from(mergedMap.values());
    
    // Re-tri par date
    merged.sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return tb - ta;
    });
    
    // Sauvegarder dans le fichier
    writeJSON(TRANSACTIONS_PATH, merged);
    
    const newCount = merged.length - existingTransactions.filter(t => 
      t.stripeId || t.stripePaymentIntentId || t.stripeChargeId || t.stripeInvoiceId || t.stripeRefundId
    ).length;
    
    // Enregistrer les nouvelles transactions dans contributions.json
    let contributionsAdded = 0;
    if (newCount > 0) {
      // Identifier les nouvelles transactions (celles qui n'existaient pas avant)
      const existingIds = new Set(
        existingTransactions.map(t => 
          t.stripeId || t.stripePaymentIntentId || t.stripeChargeId || t.stripeInvoiceId || t.stripeSubscriptionId
        ).filter(Boolean)
      );
      
      for (const tx of combined) {
        const txId = tx.stripeId || tx.stripePaymentIntentId || tx.stripeChargeId || tx.stripeInvoiceId || tx.stripeSubscriptionId;
        if (txId && !existingIds.has(txId)) {
          // C'est une nouvelle transaction, l'ajouter dans contributions.json
          if (addTransactionToContributions(tx)) {
            contributionsAdded++;
          }
        }
      }
    }
    
    console.log(`✅ Synchronisation terminée : ${newCount} nouvelles transactions ajoutées`);
    if (contributionsAdded > 0) {
      console.log(`✅ ${contributionsAdded} nouvelle(s) contribution(s) ajoutée(s) dans contributions.json`);
    }
    console.log(`✅ Total : ${merged.length} transactions dans transactions.json`);
    
    res.json({
      success: true,
      message: `Synchronisation réussie : ${newCount} nouvelles transactions ajoutées`,
      total: merged.length,
      new: newCount,
      contributionsAdded: contributionsAdded,
      breakdown: {
        charges: combined.filter(t => t.type === "charge").length,
        paymentIntents: combined.filter(t => t.type === "payment_intent").length,
        invoices: combined.filter(t => t.type === "invoice" || t.type === "subscription").length,
        refunds: combined.filter(t => t.type === "refund").length
      }
    });
  } catch (err) {
    console.error("❌ Erreur lors de la synchronisation :", err);
    res.status(500).json({ error: "Failed to sync transactions from Stripe", details: err.message });
  }
});

// GET /api/payments/subscription/:userId - Récupérer l'abonnement actif d'un utilisateur
app.get("/api/payments/subscription/:userId", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured" });
    }
    
    const userId = String(req.params.userId);
    
    // Chercher les abonnements avec ce userId dans les metadata
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      status: 'all'
    });
    
    const userSubscription = subscriptions.data.find(sub => 
      sub.metadata?.userId === userId && 
      (sub.status === 'active' || sub.status === 'trialing')
    );
    
    if (!userSubscription) {
      return res.json({ active: false });
    }
    
    res.json({
      active: true,
      subscriptionId: userSubscription.id,
      status: userSubscription.status,
      currentPeriodEnd: new Date(userSubscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: userSubscription.cancel_at_period_end
    });
  } catch (err) {
    console.error("❌ Erreur lors de la récupération de l'abonnement :", err);
    res.status(500).json({ error: "Failed to fetch subscription", details: err.message });
  }
});

// POST /api/payments/cancel-subscription - Annuler un abonnement
app.post("/api/payments/cancel-subscription", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured" });
    }
    
    const { subscriptionId } = req.body;
    
    if (!subscriptionId) {
      return res.status(400).json({ error: "Subscription ID is required" });
    }
    
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
    
    res.json({
      success: true,
      message: "Subscription will be cancelled at the end of the current period",
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    });
  } catch (err) {
    console.error("❌ Erreur lors de l'annulation de l'abonnement :", err);
    res.status(500).json({ error: "Failed to cancel subscription", details: err.message });
  }
});

// Middleware static doit être APRÈS toutes les routes API
app.use(express.static(path.join(__dirname, "..", "public")));

// Route pour rediriger la racine vers index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// === SYNCHRONISATION AUTOMATIQUE DES TRANSACTIONS ===
// Synchronise automatiquement les transactions depuis NoCodeAPI toutes les X minutes
// Cela garantit qu'aucune transaction n'est manquée même si le webhook échoue
async function autoSyncTransactions() {
  const syncIntervalMinutes = parseInt(process.env.AUTO_SYNC_INTERVAL_MINUTES || "15"); // Par défaut toutes les 15 minutes
  
  const nocodeUrl = process.env.NOCODE_STRIPE_CHARGES_URL ||
    "https://v1.nocodeapi.com/aboudhas1/stripe/wGSGvJFKQwNBuvon/charges";
  
  try {
    console.log(`🔄 Synchronisation automatique des transactions (toutes les ${syncIntervalMinutes} minutes)...`);
    
    const response = await fetch(nocodeUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    
    if (!response.ok) {
      console.log(`⚠️  Synchronisation automatique échouée: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    const charges = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
    
    if (charges.length === 0) {
      console.log(`ℹ️  Aucune nouvelle transaction trouvée lors de la synchronisation automatique`);
      return;
    }
    
    const users = readJSON(USERS_PATH);
    const existingTransactions = readJSON(TRANSACTIONS_PATH);
    
    // Créer un Set avec TOUS les IDs possibles des transactions existantes (pour éviter les doublons)
    const seen = new Set();
    existingTransactions.forEach(t => {
      const id = t.stripeId || t.stripePaymentIntentId || t.stripeChargeId || t.stripeInvoiceId || t.stripeSubscriptionId || t.stripeRefundId;
      if (id) seen.add(id);
    });
    
    let newCount = 0;
    const newTransactions = []; // Stocker les nouvelles transactions pour les ajouter dans contributions.json
    
    for (const charge of charges) {
      const tx = normalizeStripeTransaction(charge, "charge", users);
      const txId = tx.stripeId || tx.stripePaymentIntentId || tx.stripeChargeId || tx.stripeInvoiceId || tx.stripeSubscriptionId;
      
      // Vérifier si cette transaction existe déjà (par n'importe quel ID)
      if (txId && !seen.has(txId)) {
        existingTransactions.push(tx);
        seen.add(txId);
        newTransactions.push(tx); // Ajouter à la liste des nouvelles transactions
        newCount++;
      }
    }
    
    // TOUJOURS sauvegarder pour préserver toutes les transactions existantes
    // Même si aucune nouvelle transaction n'est ajoutée, on préserve les existantes
    writeJSON(TRANSACTIONS_PATH, existingTransactions);
    
    // Enregistrer les nouvelles transactions dans contributions.json
    let contributionsAdded = 0;
    for (const tx of newTransactions) {
      if (addTransactionToContributions(tx)) {
        contributionsAdded++;
      }
    }
    
    if (contributionsAdded > 0) {
      console.log(`✅ ${contributionsAdded} nouvelle(s) contribution(s) ajoutée(s) dans contributions.json`);
    }
    
    if (newCount > 0) {
      console.log(`✅ Synchronisation automatique: ${newCount} nouvelle(s) transaction(s) ajoutée(s)`);
    } else {
      console.log(`ℹ️  Synchronisation automatique: ${existingTransactions.length} transaction(s) préservée(s), aucune nouvelle`);
    }
  } catch (err) {
    console.error(`❌ Erreur lors de la synchronisation automatique:`, err.message);
  }
}

// === DÉMARRAGE SERVEUR ===
app.listen(PORT, () => {
  console.log(`✅ Serveur S4S en cours d'exécution sur http://localhost:${PORT}`);
  console.log(`🏠 Page d'accueil: http://localhost:${PORT}/`);
  console.log(`📧 Email notifications configured for: ayaboudhas7@gmail.com`);
  if (!process.env.GMAIL_APP_PASSWORD) {
    console.log(`⚠️  WARNING: GMAIL_APP_PASSWORD not set. Email sending will not work until configured.`);
    console.log(`   To configure: Set GMAIL_APP_PASSWORD environment variable or create a .env file`);
  }
  
  // Démarrer la synchronisation automatique immédiatement puis toutes les X minutes
  const syncInterval = parseInt(process.env.AUTO_SYNC_INTERVAL_MINUTES || "15") * 60 * 1000;
  autoSyncTransactions(); // Première synchronisation immédiate
  setInterval(autoSyncTransactions, syncInterval); // Puis toutes les X minutes
  console.log(`🔄 Synchronisation automatique activée (toutes les ${process.env.AUTO_SYNC_INTERVAL_MINUTES || "15"} minutes)`);
});
