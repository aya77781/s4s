import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

// === CONFIG DE BASE ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");
const TRANSACTIONS_PATH = path.join(DATA_DIR, "transactions.json");

// URL NoCodeAPI pour récupérer les charges Stripe
const NOCODE_API_URL = "https://v1.nocodeapi.com/aboudhas1/stripe/wGSGvJFKQwNBuvon/charges";

async function getTransactions() {
  try {
    console.log("🔄 Récupération des transactions depuis Stripe via NoCodeAPI...");
    console.log(`📡 URL: ${NOCODE_API_URL}`);
    
    // 1. Faire un fetch sur l'URL NoCodeAPI
    const response = await fetch(NOCODE_API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
    }
    
    // 2. Transformer la réponse en JSON
    const data = await response.json();
    
    console.log(`✅ ${Array.isArray(data) ? data.length : 'Données'} transaction(s) récupérée(s)`);
    
    // Vérifier la structure de la réponse
    let transactions = [];
    if (Array.isArray(data)) {
      // Si c'est directement un tableau
      transactions = data;
    } else if (data.data && Array.isArray(data.data)) {
      // Si c'est un objet avec une propriété "data" qui contient le tableau
      transactions = data.data;
    } else if (data.charges && Array.isArray(data.charges)) {
      // Si c'est un objet avec une propriété "charges"
      transactions = data.charges;
    } else {
      console.log("⚠️  Structure de réponse inattendue, tentative de normalisation...");
      transactions = [data]; // Essayer avec un seul objet
    }
    
    // Normaliser les transactions pour correspondre au format attendu
    const normalizedTransactions = transactions.map((tx, index) => {
      // Convertir le montant depuis cents si nécessaire
      let amount = tx.amount;
      if (typeof amount === 'number' && amount > 1000) {
        // Probablement en cents, convertir
        amount = amount / 100;
      }
      
      // Récupérer la date
      let createdAt = tx.created || tx.createdAt || new Date().toISOString();
      if (typeof createdAt === 'number') {
        createdAt = new Date(createdAt * 1000).toISOString();
      }
      
      return {
        id: tx.id || `tx_${Date.now()}_${index}`,
        stripeId: tx.id || null,
        stripeChargeId: tx.id || null,
        amount: amount || 0,
        currency: (tx.currency || "usd").toUpperCase(),
        status: tx.status === "succeeded" ? "completed" : (tx.status || "pending"),
        type: "charge",
        email: tx.billing_details?.email || tx.receipt_email || null,
        description: tx.description || "Stripe Charge",
        createdAt: createdAt,
        metadata: tx.metadata || {}
      };
    });
    
    // 3. Sauvegarder les transactions dans transactions.json
    // S'assurer que le dossier data existe
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Lire les transactions existantes pour fusionner (éviter les doublons)
    let existingTransactions = [];
    if (fs.existsSync(TRANSACTIONS_PATH)) {
      try {
        const existingData = fs.readFileSync(TRANSACTIONS_PATH, "utf8");
        if (existingData.trim()) {
          existingTransactions = JSON.parse(existingData);
        }
      } catch (err) {
        console.log("⚠️  Impossible de lire les transactions existantes, création d'un nouveau fichier");
      }
    }
    
    // Fusionner en évitant les doublons (basé sur stripeId)
    const existingMap = new Map();
    existingTransactions.forEach(tx => {
      const id = tx.stripeId || tx.stripeChargeId || tx.id;
      if (id) {
        existingMap.set(id, tx);
      }
    });
    
    // Ajouter les nouvelles transactions
    normalizedTransactions.forEach(tx => {
      const id = tx.stripeId || tx.stripeChargeId || tx.id;
      if (id) {
        existingMap.set(id, tx);
      } else {
        // Transaction sans ID Stripe, l'ajouter quand même
        existingMap.set(`local_${tx.id}`, tx);
      }
    });
    
    const mergedTransactions = Array.from(existingMap.values());
    
    // Trier par date (plus récent en premier)
    mergedTransactions.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });
    
    // Écrire dans le fichier
    fs.writeFileSync(
      TRANSACTIONS_PATH,
      JSON.stringify(mergedTransactions, null, 2),
      "utf8"
    );
    
    const newCount = mergedTransactions.length - existingTransactions.length;
    console.log(`✅ ${newCount} nouvelle(s) transaction(s) ajoutée(s)`);
    console.log(`✅ Total : ${mergedTransactions.length} transaction(s) dans transactions.json`);
    console.log(`📁 Fichier sauvegardé : ${TRANSACTIONS_PATH}`);
    
    return mergedTransactions;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des transactions :", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter le script
getTransactions();




