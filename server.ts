import dotenv from "dotenv";
dotenv.config();

// Debug environment variables
console.log("[SERVER] Environment Variables Check:");
Object.keys(process.env).forEach(key => {
  const val = process.env[key];
  if (val && typeof val === 'string' && val.startsWith('AIza')) {
    const masked = `${val.substring(0, 4)}...${val.substring(val.length - 4)}`;
    console.log(`[SERVER] Found potential API key in ${key}: ${masked} (length: ${val.length})`);
  } else if (key.includes("GEMINI") || key.includes("API")) {
    console.log(`[SERVER] ${key} is present but does not start with AIza: ${val ? 'YES' : 'NO'}`);
  }
});

import express from "express";
import { createServer as createViteServer } from "vite";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";
import sgMail from "@sendgrid/mail";
import { XMLParser } from "fast-xml-parser";
import { GoogleGenAI } from "@google/genai";
import { 
  writeUserWavvault, 
  writeArtifact, 
  searchSimilarWavvaults, 
  getStorageMetrics, 
  purgeOldArtifacts, 
  verifyWavvaultIntegrity,
  analyzeWavvaultDelta,
  getLatestSnapshot
} from './src/services/wavvaultService.ts';
import { logEvent } from './src/services/loggingService.ts';
import { ROLES, JOURNEY_STAGES, TENANTS } from './src/constants.ts';
import { getGeminiApiKey } from './src/services/aiConfig.ts';
import { vertexService } from './src/services/vertexService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DASHBOARD_DATA_FILE = path.join(__dirname, 'user-dashboards.json');

const RSS_FEEDS = [
  { name: 'HBR', url: 'https://hbr.org/feed' },
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
  { name: 'Fast Company', url: 'https://www.fastcompany.com/feed' },
  { name: 'McKinsey Insights', url: 'https://www.mckinsey.com/insights/rss' },
  { name: 'The Muse', url: 'https://www.themuse.com/advice/feed' },
  { name: 'Wired Business', url: 'https://www.wired.com/feed/category/business/latest/rss' }
];

// RBAC Roles
// Using imported ROLES from constants

let isFirestoreInitialized = true;

async function getDashboard(db_unused: any, userId: string, sparkwavvId?: string) {
  if (!isFirebaseAdminConfigured || !userId) {
    return null;
  }

  const db = getFirestoreDb();
  if (!db) return null;

  try {
    // 1. Try primary lookup by userId (uid)
    const doc = (await withTimeout(db.collection('dashboards').doc(userId).get(), 5000)) as any;
    if (doc.exists) {
      const data = doc.data();
      // Self-healing: ensure sparkwavvId is synced if we have it
      if (sparkwavvId && data.sparkwavvId !== sparkwavvId) {
        await db.collection('dashboards').doc(userId).update({ sparkwavvId });
      }
      return data;
    }

    // 2. Fallback: Lookup by sparkwavvId if provided (Self-healing for UID changes)
    if (sparkwavvId) {
      const snapshot = await db.collection('dashboards').where('sparkwavvId', '==', sparkwavvId).limit(1).get();
      if (!snapshot.empty) {
        const oldDoc = snapshot.docs[0];
        const dashboardData = oldDoc.data();
        const oldUserId = oldDoc.id;

        console.log(`[IDENTITY] Self-healing: Re-anchoring dashboard ${oldUserId} to new UID ${userId} via sparkwavvId ${sparkwavvId}`);

        // Update the dashboard with the new userId and move it to the new document ID
        const updatedData = { ...dashboardData, userId, updatedAt: new Date().toISOString() };
        
        // Use a transaction or batch to ensure atomicity
        const batch = db.batch();
        batch.set(db.collection('dashboards').doc(userId), updatedData);
        batch.delete(db.collection('dashboards').doc(oldUserId));
        await batch.commit();

        return updatedData;
      }
    }

    return null;
  } catch (error: any) {
    if (error.message === 'Firestore operation timed out') {
      console.error(`[FIRESTORE] Timeout getting dashboard for ${userId}`);
      return null;
    }
    console.error(`Error getting dashboard for ${userId}:`, error.message || error);
    return null;
  }
}

async function saveDashboard(db_unused: any, userId: string, data: any) {
  if (!isFirebaseAdminConfigured || !userId) {
    return false;
  }
  const db = getFirestoreDb();
  if (!db) return false;
  
  try {
    // 1. Save to dashboards collection
    await withTimeout(db.collection('dashboards').doc(userId).set(data, { merge: true }), 5000);
    
    // 2. If discoveryProgress is provided, sync it to journeyStage in users collection
    if (data.discoveryProgress) {
      await withTimeout(db.collection('users').doc(userId).set({
        journeyStage: data.discoveryProgress
      }, { merge: true }), 5000);
    }
    
    return true;
  } catch (error: any) {
    if (error.message === 'Firestore operation timed out') {
      console.error(`[FIRESTORE] Timeout saving dashboard for ${userId}`);
      return false;
    }
    console.error(`Error saving dashboard for ${userId}:`, error.message || error);
    return false;
  }
}

async function sendSoftCoachEmail(email: string, name: string) {
  if (!process.env.SENDGRID_API_KEY || !process.env.SKYLAR_FROM_EMAIL) {
    console.warn("[SENDGRID] Missing API Key or From Email. Skipping email.");
    return;
  }

  const msg = {
    to: email,
    from: process.env.SKYLAR_FROM_EMAIL,
    subject: "The wave has slowed down - Skylar is here to help",
    text: `Hi ${name},\n\nI noticed the wave has slowed down. I'm here to help you reboot. Let's take 5 minutes to align your energy before your next sprint.\n\nBest,\nSkylar`,
    html: `<p>Hi ${name},</p><p>I noticed the wave has slowed down. I'm here to help you reboot. Let's take 5 minutes to align your energy before your next sprint.</p><p>Best,<br>Skylar</p>`,
  };

  try {
    await sgMail.send(msg);
    console.log(`[SENDGRID] Soft Coach email sent to ${email}`);
  } catch (error: any) {
    console.error("[SENDGRID ERROR]", error.response?.body || error.message);
  }
}

async function logSecurityEvent(
  _db: any,
  actor: { uid: string; email: string; role: string },
  actionType: string,
  severity: 'INFO' | 'WARNING' | 'CRITICAL',
  target?: { uid: string; email: string },
  details: any = {},
  ipAddress: string = 'unknown'
) {
  const db = getAdminDb();
  if (!db) return;
  try {
    const logId = uuidv4();
    await db.collection('security_logs').doc(logId).set({
      id: logId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      actorId: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      actionType,
      severity,
      targetId: target?.uid || null,
      targetEmail: target?.email || null,
      details,
      ipAddress
    });
  } catch (error) {
    console.error("Failed to log security event:", error);
  }
}

async function createDefaultDashboard(db_unused: any, userId: string, initialStage: string = 'Dive-In', sparkwavvId?: string) {
  const db = getFirestoreDb();
  if (!db) return;
  const defaultDashboard = {
    userId,
    sparkwavvId: sparkwavvId || null,
    tenantId: 'sparkwavv', // Default tenant
    careerHappiness: 5,
    strengths: [
      { name: "Empathetic Listener", value: 92 },
      { name: "Strategic Thinker", value: 85 },
      { name: "Continuous Learner", value: 78 },
      { name: "Collaborative Leader", value: 91 }
    ],
    discoveryProgress: initialStage,
    resumeStatus: "Resume Process: Reviewing from last update",
    careerProfileStatus: "Career Profile: Updated 2 days ago",
    jobMatches: [
      { title: "Senior UX Designer", company: "TechFlow", matchScore: 94 },
      { title: "Product Strategist", company: "SPARKWavv", matchScore: 88 },
      { title: "AI Experience Lead", company: "FutureMind", matchScore: 82 }
    ],
    aiCompanion: {
      name: "Skylar",
      status: "Online",
      message: "Ready to help you with your career journey!"
    },
    effortTier: '3.5',
    energyTrough: { start: '14:00', end: '16:00' },
    financialExpenses: [],
    validationGateMode: 'soft-warning',
    rppValidated: false,
    milestones: [
      { id: 'commitment', label: '12-Week Commitment', completed: false, week: 1 },
      { id: 'spark', label: 'Initial "Spark" Identification', completed: false, week: 2 },
      { id: 'pie', label: 'Pie of Life Exercise', completed: false, week: 3 },
      { id: 'perfect', label: 'Perfect Day & DNA Hypothesis', completed: false, week: 4 },
      { id: 'vault', label: 'Attribute Vault (5 Core Attributes)', completed: false, week: 5 },
      { id: 'validation', label: 'Five Stories RPP Validation', completed: false, week: 6 },
      { id: 'journalist', label: 'Journalist Story Versions', completed: false, week: 7 },
      { id: 'reflective', label: 'Reflective Story Versions', completed: false, week: 8 },
      { id: 'mig', label: 'MIG Alignment Review', completed: false, week: 9 },
      { id: 'outreach', label: 'Market Engagement Launch', completed: false, week: 10 },
      { id: 'feedback', label: 'Feedback Integration', completed: false, week: 11 },
      { id: 'finalization', label: 'DNA Finalization', completed: false, week: 12 }
    ],
    pieOfLife: [
      { category: 'Work', current: 60, target: 40 },
      { category: 'Family', current: 20, target: 30 },
      { category: 'Health', current: 10, target: 20 },
      { category: 'Spirit', current: 10, target: 10 }
    ],
    perfectDay: [
      { time: '08:00', activity: 'Morning Routine', type: 'reboot' },
      { time: '09:00', activity: 'Deep Work', type: 'work' },
      { time: '12:00', activity: 'Lunch', type: 'meal' },
      { time: '13:00', activity: 'Collaboration', type: 'work' },
      { time: '15:00', activity: 'Energy Trough Reboot', type: 'reboot' }
    ]
  };
  await saveDashboard(db, userId, defaultDashboard);
  return defaultDashboard;
}

function calculateDynamicScores(dashboard: any) {
  const milestones = dashboard.milestones || [];
  const totalMilestones = milestones.length || 1;
  const completedMilestones = milestones.filter((m: any) => m.completed).length;
  const milestoneProgress = completedMilestones / totalMilestones;

  const stages = ['Dive-In', 'Ignition', 'Discovery', 'Branding', 'Outreach'];
  const currentStageIdx = stages.indexOf(dashboard.discoveryProgress || 'Dive-In');
  const stageProgress = (currentStageIdx + 1) / stages.length;

  // Profile completeness (mocked for now based on resumeStatus and careerProfileStatus)
  const profileCompleteness = (dashboard.resumeStatus?.includes('Completed') || dashboard.resumeStatus?.includes('Optimized') ? 0.5 : 0.2) + 
                             (dashboard.careerProfileStatus?.includes('Optimized') || dashboard.careerProfileStatus?.includes('Completed') ? 0.5 : 0.2);

  // Dynamic Happiness Calculation
  // (Completed Milestones % * 0.4) + (Journey Phase % * 0.4) + (Profile Completeness % * 0.2)
  let careerHappiness = Math.round(
    (milestoneProgress * 40) + 
    (stageProgress * 40) + 
    (profileCompleteness * 20)
  );

  // Initial Value Logic: Start at 5 when user completes Dive-In
  if (dashboard.discoveryProgress === 'Dive-In') {
    // Scale from 0 to 5 during Dive-In based on milestones
    const diveInMilestones = milestones.filter((m: any) => m.week <= 2);
    const completedDiveIn = diveInMilestones.filter((m: any) => m.completed).length;
    const diveInProgress = diveInMilestones.length > 0 ? completedDiveIn / diveInMilestones.length : 0;
    careerHappiness = Math.round(diveInProgress * 5);
  } else {
    // Ensure it's at least 5 if they are past Dive-In
    careerHappiness = Math.max(careerHappiness, 5);
  }

  // Alignment Matrix
  const identityClarity = Math.round(profileCompleteness * 100);
  
  const strengths = dashboard.strengths || [];
  const strengthsAlignment = strengths.length > 0 
    ? Math.round(strengths.reduce((acc: number, s: any) => acc + s.value, 0) / strengths.length)
    : 0;

  const jobMatches = dashboard.jobMatches || [];
  const marketResonance = jobMatches.length > 0
    ? Math.round(jobMatches.reduce((acc: number, j: any) => acc + j.matchScore, 0) / jobMatches.length)
    : 0;

  return {
    careerHappiness,
    alignmentMatrix: {
      identityClarity,
      strengthsAlignment,
      marketResonance
    }
  };
}

async function migrateDashboardsToFirestore(db: admin.firestore.Firestore) {
  if (fs.existsSync(DASHBOARD_DATA_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DASHBOARD_DATA_FILE, 'utf8'));
      const batch = db.batch();
      let count = 0;
      for (const [userId, dashboard] of Object.entries(data)) {
        const docRef = db.collection('dashboards').doc(userId);
        batch.set(docRef, dashboard as any);
        count++;
      }
      if (count > 0) {
        await batch.commit();
        console.log(`[MIGRATION] Migrated ${count} dashboards to Firestore.`);
        fs.renameSync(DASHBOARD_DATA_FILE, `${DASHBOARD_DATA_FILE}.migrated`);
      }
    } catch (error) {
      console.error("[MIGRATION] Error migrating dashboards:", error);
    }
  }
}

/**
 * Phase 1: Managed RAG (Vertex AI Search)
 * Scheduled Batch Sync Logic (Simulated for now)
 */
async function syncWavvaultToVertex() {
  const db = getFirestoreDb();
  if (!db) return { success: false, message: "Database unavailable" };

  console.log("[VERTEX SYNC] Starting scheduled batch sync of Wavvault to Vertex AI Search...");
  
  try {
    // 1. Fetch all Wavvault entries
    const snapshot = await db.collection('wavvault').get();
    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`[VERTEX SYNC] Found ${entries.length} entries to sync.`);

    // 2. In a real production environment, we would use the Discovery Engine API 
    // to bulk upload these documents to the Data Store.
    // For this implementation, we simulate the success of the sync.
    
    // Example of what the Discovery Engine API call would look like:
    /*
    const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/collections/default_collection/dataStores/${DATA_STORE_ID}/branches/0`;
    await discoveryEngineClient.importDocuments({
      parent,
      inlineSource: {
        documents: entries.map(e => ({
          id: e.id,
          jsonData: JSON.stringify(e)
        }))
      }
    });
    */

    console.log("[VERTEX SYNC] Batch sync completed successfully.");
    return { success: true, count: entries.length };
  } catch (error: any) {
    console.error("[VERTEX SYNC ERROR]", error.message || error);
    return { success: false, error: error.message };
  }
}

// Migration logic for mock data removed


// In-memory store for registration tokens
// In a real app, use a database (Redis/PostgreSQL)
const registrationTokens = new Map<string, { email: string; expires: number }>();

/**
 * Generates a unique Sparkwavv ID for users
 * Format: SW-YYYY-XXXX (e.g., SW-2026-0001)
 */
async function generateSparkwavvId(db: admin.firestore.Firestore): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SW-${year}-`;
  
  // Get the latest ID for this year
  const snapshot = await db.collection('users')
    .where('sparkwavvId', '>=', prefix)
    .where('sparkwavvId', '<', prefix + '\uf8ff')
    .orderBy('sparkwavvId', 'desc')
    .limit(1)
    .get();

  let nextNumber = 1;
  if (!snapshot.empty) {
    const lastId = snapshot.docs[0].data().sparkwavvId;
    if (lastId && lastId.includes('-')) {
      const parts = lastId.split('-');
      if (parts.length === 3) {
        const lastNumber = parseInt(parts[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

// Initialize Firebase Admin
let isFirebaseAdminConfigured = false;
let firebaseAppletConfig: any = {};
let sparkwavvDb: any;
let adminDb: any;
let db: any;
let sparkwavvAdmin: admin.app.App | null = null;

try {
  const configPath = path.join(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseAppletConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Ensure environment consistency with the config file
    if (firebaseAppletConfig.projectId) {
      console.log(`[AUTH] Overriding VITE_FIREBASE_PROJECT_ID with config value: ${firebaseAppletConfig.projectId}`);
      process.env.VITE_FIREBASE_PROJECT_ID = firebaseAppletConfig.projectId;
      process.env.FIREBASE_PROJECT_ID = firebaseAppletConfig.projectId;
    }
  }
} catch (error) {
  console.warn("Could not read firebase-applet-config.json:", error);
}

// Single Project Initialization (gen-lang-client-0883822731)
try {
  const projectId = firebaseAppletConfig.projectId || process.env.FIREBASE_PROJECT_ID;
  let clientEmail = process.env.FIREBASE_CLIENT_EMAIL || firebaseAppletConfig.clientEmail;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || firebaseAppletConfig.privateKey;

  if (projectId) {
    console.log(`[AUTH] Initializing Firebase Admin for Master Project: ${projectId}`);
    
    // Normalize private key
    if (privateKey && privateKey.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(privateKey);
        if (parsed.private_key) privateKey = parsed.private_key;
        if (parsed.client_email) clientEmail = parsed.client_email;
      } catch (e) {}
    }

    const options: any = { projectId };
    if (clientEmail && privateKey) {
      options.credential = admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      });
    }

    // Initialize as DEFAULT app
    sparkwavvAdmin = admin.initializeApp(options);
    isFirebaseAdminConfigured = true;
    
    // Database 1: Sparkwavv (User Data)
    const databaseId = firebaseAppletConfig.firestoreDatabaseId;
    sparkwavvDb = databaseId ? getFirestore(sparkwavvAdmin, databaseId) : getFirestore(sparkwavvAdmin);
    db = sparkwavvDb;
    
    // Database 2: Admin (System Data) - Using 'admindb'
    try {
      adminDb = getFirestore(sparkwavvAdmin, 'admindb');
      console.log(`[AUTH] Admin Database 'admindb' initialized.`);
    } catch (e: any) {
      console.warn(`[AUTH] Could not initialize 'admindb', falling back to default: ${e.message}`);
      adminDb = sparkwavvDb;
    }

    console.log(`[AUTH] Firebase Admin initialized successfully for project ${projectId}.`);
  }
} catch (error: any) {
  console.error("[AUTH] Error initializing Firebase Admin:", error.message);
}

// Legacy compatibility helper
function getFirestoreDb() {
  return sparkwavvDb;
}

function getAdminDb() {
  return adminDb || sparkwavvDb;
}

/**
 * Helper to wrap Firestore calls with a timeout to prevent hanging the API
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Firestore operation timed out'));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

// Log status to a file for diagnostics
const envStatus: any = {
  VITE_FIREBASE_API_KEY: firebaseAppletConfig.apiKey || process.env.VITE_FIREBASE_API_KEY || '',
  VITE_FIREBASE_AUTH_DOMAIN: firebaseAppletConfig.authDomain || process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  VITE_FIREBASE_PROJECT_ID: firebaseAppletConfig.projectId || process.env.VITE_FIREBASE_PROJECT_ID || '',
  VITE_FIREBASE_STORAGE_BUCKET: firebaseAppletConfig.storageBucket || process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  VITE_FIREBASE_MESSAGING_SENDER_ID: firebaseAppletConfig.messagingSenderId || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  VITE_FIREBASE_APP_ID: firebaseAppletConfig.appId || process.env.VITE_FIREBASE_APP_ID || '',
  FIREBASE_PROJECT_ID: firebaseAppletConfig.projectId || process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'PRESENT' : 'MISSING',
  USER_COUNT: 0,
  AUTH_ERROR: null,
  FIRESTORE_ERROR: null,
};

async function startServer() {
  console.log('Starting server initialization...');
  const app = express();
  const PORT = 3000;

    if (isFirebaseAdminConfigured && sparkwavvAdmin) {
      console.log('Firebase Admin configured. Verifying connectivity...');
      try {
        const listUsersResult = await withTimeout(sparkwavvAdmin.auth().listUsers(), 5000);
        envStatus.USER_COUNT = listUsersResult.users.length;
        console.log(`[AUTH] Firebase Auth connected. Found ${envStatus.USER_COUNT} users.`);
        
        const db = getFirestoreDb();
        let fsUsers: any[] = [];
        if (db) {
          const snapshot = await withTimeout(db.collection('users').get(), 5000) as any;
          fsUsers = snapshot.docs.map((d: any) => ({ uid: d.id, ...d.data() }));
          console.log(`[FIRESTORE] Connectivity check successful. Found ${snapshot.size} users in 'users' collection.`);
          
          const targetUser = fsUsers.find(u => u.email === 'lculver123@comcast.net');
          if (targetUser) {
            console.log("[DEBUG] Found target user in Firestore:", JSON.stringify(targetUser, null, 2));
            
            // Check for dashboard
            const dashboardSnapshot = await db.collection('dashboards').where('userId', '==', targetUser.uid).get();
            if (!dashboardSnapshot.empty) {
              console.log(`[DEBUG] Found ${dashboardSnapshot.size} dashboards for user ${targetUser.uid}`);
              dashboardSnapshot.docs.forEach(d => console.log(` - Dashboard ID: ${d.id}`));
            } else {
              console.log(`[DEBUG] No dashboards found for user ${targetUser.uid}`);
            }
          } else {
            console.log("[DEBUG] Target user NOT found in Firestore 'users' collection");
          }
        }
        
        const debugData = {
          projectId: firebaseAppletConfig.projectId,
          authUsers: listUsersResult.users.map(u => ({ 
            uid: u.uid, 
            email: u.email,
            displayName: u.displayName,
            emailVerified: u.emailVerified,
            disabled: u.disabled,
            metadata: u.metadata
          })),
          firestoreUsers: fsUsers,
          dashboards: [] as any[]
        };
        
        if (db) {
          const dashSnapshot = await db.collection('dashboards').get();
          debugData.dashboards = dashSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        }
        
        fs.writeFileSync(path.join(process.cwd(), 'users-debug.json'), JSON.stringify(debugData, null, 2));
      } catch (error: any) {
      console.error("[FIRESTORE] Connectivity check failed:", error.message);
      envStatus.FIRESTORE_ERROR = error.message;
      if (error.code === 16 || error.message?.includes('UNAUTHENTICATED')) {
        console.error("CRITICAL: Firestore Unauthenticated (Error 16). Check your Service Account credentials.");
      }
    }
    console.log('Firebase connectivity check complete.');
  }

  console.log("[ENV STATUS]", envStatus);
  try {
    fs.writeFileSync(path.join(__dirname, 'env-status.json'), JSON.stringify(envStatus, null, 2));
  } catch (e) {
    console.error("Failed to write env-status.json:", e);
  }

  console.log('Configuring session middleware...');
  app.set("trust proxy", 1); // Trust first proxy (Nginx)
  app.use(express.json());
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "sparkwavv-default-secret",
      resave: false,
      saveUninitialized: false,
      name: "sparkwavv.sid",
      cookie: { 
        secure: true,      // Required for SameSite=None
        sameSite: 'none',  // Required for cross-origin iframe
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      },
    })
  );
  console.log('Session middleware configured.');

  const getUserRole = async (uid: string, email?: string) => {
    console.log(`[AUTH] Getting role for ${uid} (${email})`);
    
    // 1. Bootstrap Super Admin
    if (email?.toLowerCase() === 'larry.culver1226@gmail.com') {
      console.log(`[AUTH] Identified Super Admin: ${email}`);
      return { role: ROLES.SUPER_ADMIN, tenantId: 'sparkwavv' };
    }
    
    // 2. Try Admin Project
    if (isFirebaseAdminConfigured && sparkwavvAdmin) {
      try {
        const db = getAdminDb();
        if (db) {
          const userDoc = await withTimeout(db.collection('admins').doc(uid).get(), 3000) as any;
          if (userDoc.exists) {
            const data = userDoc.data();
            const rawRole = data?.role || ROLES.USER;
            const role = typeof rawRole === 'string' ? rawRole : (rawRole?.role || ROLES.USER);
            const rawTenantId = data?.tenantId || 'sparkwavv';
            const tenantId = typeof rawTenantId === 'string' ? rawTenantId : (rawTenantId?.tenantId || 'sparkwavv');
            console.log(`[AUTH] Role from Admin Project Firestore: ${role} (${tenantId})`);
            return { role, tenantId };
          }
        }
      } catch (e: any) {
        console.warn(`[AUTH] Admin project role check failed or timed out: ${e.message}`);
      }
    }

    // 3. Try Sparkwavv Project
    if (isFirebaseAdminConfigured && sparkwavvAdmin) {
      try {
        const db = getFirestoreDb();
        if (db) {
          const userDoc = await withTimeout(db.collection('users').doc(uid).get(), 3000) as any;
          if (userDoc.exists) {
            const data = userDoc.data();
            const rawRole = data?.role || ROLES.USER;
            const role = typeof rawRole === 'string' ? rawRole : (rawRole?.role || ROLES.USER);
            const rawTenantId = data?.tenantId || 'sparkwavv';
            const tenantId = typeof rawTenantId === 'string' ? rawTenantId : (rawTenantId?.tenantId || 'sparkwavv');
            console.log(`[AUTH] Role from Sparkwavv Project Firestore: ${role} (${tenantId})`);
            return { role, tenantId };
          }
        }
      } catch (e: any) {
        console.warn(`[AUTH] Sparkwavv project role check failed or timed out: ${e.message}`);
      }
    }
    
    console.log(`[AUTH] No administrative role found for ${uid}. Defaulting to ${ROLES.USER}`);
    return { role: ROLES.USER, tenantId: 'sparkwavv' };
  };

  const setUserRole = async (uid: string, role: string, tenantId: string = 'sparkwavv') => {
    try {
      // 1. Set Custom Claims
      if (isFirebaseAdminConfigured && sparkwavvAdmin) {
        await sparkwavvAdmin.auth().setCustomUserClaims(uid, { role, tenantId });
      }
      
      // 2. Update Firestore
      await db.collection('users').doc(uid).set({ role, tenantId }, { merge: true });
      
      // 3. If it's an admin role, also update admins collection in admindb
      if ([ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.EDITOR, ROLES.VIEWER, ROLES.OPERATOR].includes(role as any)) {
        const adminDb = getAdminDb();
        if (adminDb) {
          await adminDb.collection('admins').doc(uid).set({ 
            uid, 
            role,
            tenantId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }
      }
      
      return true;
    } catch (error) {
      console.error(`[AUTH] Failed to set role for ${uid}:`, error);
      return false;
    }
  };

  const verifyToken = async (req: express.Request) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return null;

    try {
      // Try Admin Project First
      if (isFirebaseAdminConfigured && sparkwavvAdmin) {
        const decodedToken = await sparkwavvAdmin.auth().verifyIdToken(idToken);
        return decodedToken;
      }
    } catch (e: any) {
      console.warn(`[AUTH] Token verification failed: ${e.message}`);
    }
    return null;
  };

  const requireRole = (roles: string[], requiredEntryPoint?: 'admin' | 'operations') => {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const decodedToken = await verifyToken(req);
      
      if (!decodedToken) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      console.log(`[AUTH] requireRole check for ${decodedToken.email}. Roles: ${roles.join(', ')}`);

      let role: string = decodedToken.role || ROLES.USER;
      let tenantId: string = decodedToken.tenantId || 'sparkwavv';
      
      // Bootstrap Super Admin
      if (decodedToken.email?.toLowerCase() === 'larry.culver1226@gmail.com') {
        role = ROLES.SUPER_ADMIN;
        tenantId = 'sparkwavv';
        // Sync custom claim if not already set
        if (decodedToken.role !== ROLES.SUPER_ADMIN) {
          console.log(`[AUTH] Bootstrapping Super Admin role for ${decodedToken.email}`);
          await sparkwavvAdmin.auth().setCustomUserClaims(decodedToken.uid, { role: ROLES.SUPER_ADMIN, tenantId: 'sparkwavv' });
        }
      } else if (!decodedToken.role) {
        // Fallback to Firestore if no claim
        const result = await getUserRole(decodedToken.uid, decodedToken.email);
        role = result.role;
        tenantId = result.tenantId;
        // Sync claim for next time
        if (role !== ROLES.USER || tenantId !== 'sparkwavv') {
          await sparkwavvAdmin.auth().setCustomUserClaims(decodedToken.uid, { role, tenantId });
        }
      }

      // Check if user has one of the required roles
      if (!roles.includes(role)) {
        console.warn(`[AUTH] Access denied for ${decodedToken.email}. Role: ${role}, Required: ${roles.join(', ')}`);
        return res.status(403).json({ error: "Access Denied" });
      }

      // Entry point check (Operators strictly locked to operations)
      if (role === ROLES.OPERATOR && requiredEntryPoint === 'admin') {
        console.warn(`[AUTH] Operator ${decodedToken.email} attempted to access admin portal`);
        return res.status(403).json({ error: "Operators are restricted to the Operations Center" });
      }

      // Attach user info to request for later use
      (req as any).user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: role,
        tenantId: tenantId
      };

      return next();
    };
  };

  // RBAC Helpers & Routes
  if (isFirebaseAdminConfigured) {
    const db = getFirestoreDb();
    if (db) {
      console.log("Firestore initialized for project:", process.env.FIREBASE_PROJECT_ID);
      
      // Run migrations
      migrateDashboardsToFirestore(db).catch(err => console.error("Migration failed:", err));

      // Connectivity check
      db.collection('health').doc('check').set({ lastCheck: new Date() }, { merge: true })
        .then(() => console.log("Firestore connectivity verified."))
        .catch(err => {
          console.error("Firestore connectivity check failed:", err.message || err);
          if (err.code === 5) {
            console.error("CRITICAL: Firestore Database NOT FOUND. Please ensure you have clicked 'Create Database' in the Firebase Console for project:", process.env.FIREBASE_PROJECT_ID);
          }
        });

    }

    // Manual promotion for larry.culver1226@gmail.com
    const promoteSpecificUser = async (email: string) => {
      try {
        const userRecord = await sparkwavvAdmin.auth().getUserByEmail(email);
        const uid = userRecord.uid;
        
        // Update Firestore role
        await db.collection('users').doc(uid).set({
          role: ROLES.ADMIN,
          email: email,
          journeyStage: 'NONE',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log(`[AUTH] User ${email} promoted to ADMIN.`);

        // Update password if requested (Note: This only affects email/password login, not Google OAuth)
        const newPassword = "Be58qq95123!!!!!!";
        await sparkwavvAdmin.auth().updateUser(uid, {
          password: newPassword
        });
        console.log(`[AUTH] Password updated for ${email}.`);
        
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          console.log(`[AUTH] Promotion skipped: User ${email} has not registered yet.`);
        } else {
          console.error(`[AUTH] Error promoting user ${email}:`, error.message || error);
        }
      }
    };

    promoteSpecificUser('larry.culver1226@gmail.com');

    // Bootstrap Kwieri Tenant and Mark Workman
    const bootstrapPartnerEcosystem = async () => {
      try {
        const db = getFirestoreDb();
        if (!db) return;

        // 1. Create Kwieri Tenant
        const kwieriTenant = {
          id: 'kwieri',
          name: 'Kwieri',
          brand: 'kwieri',
          description: 'Strategic Role-Playing Partners for Career Growth',
          logoUrl: 'https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/3GWNqV7gyYunWoTZF4Vn/media/6794d8d06a58c403bd198b6c.png',
          primaryColor: '#0F172A'
        };
        await db.collection('tenants').doc('kwieri').set(kwieriTenant, { merge: true });
        console.log("[BOOTSTRAP] Kwieri tenant initialized.");

        // 2. Create Mark Workman (Kwieri Admin)
        const markEmail = 'markw@sparkwavv.com';
        try {
          let markUser;
          try {
            markUser = await sparkwavvAdmin.auth().getUserByEmail(markEmail);
          } catch (e) {
            // Create user if not exists
            markUser = await sparkwavvAdmin.auth().createUser({
              email: markEmail,
              password: 'PartnerPassword123!', // Temporary
              displayName: 'Mark Workman'
            });
          }

          const markUid = markUser.uid;
          await db.collection('users').doc(markUid).set({
            uid: markUid,
            email: markEmail,
            displayName: 'Mark Workman',
            role: ROLES.MENTOR, // Partners are mentors/coaches
            tenantId: 'kwieri',
            onboardingComplete: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          // Set custom claims
          await sparkwavvAdmin.auth().setCustomUserClaims(markUid, { role: ROLES.MENTOR, tenantId: 'kwieri' });
          console.log(`[BOOTSTRAP] Mark Workman (${markEmail}) initialized as Kwieri Mentor.`);
        } catch (e: any) {
          console.error("[BOOTSTRAP] Error initializing Mark Workman:", e.message);
        }
      } catch (error: any) {
        console.error("[BOOTSTRAP] Partner ecosystem bootstrap failed:", error.message);
      }
    };

    bootstrapPartnerEcosystem();

    // Configure SendGrid
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    } else {
      console.warn("[SENDGRID] API Key missing. Email features will be simulated.");
    }

    app.post("/api/log", (req, res) => {
      const { level, message, data } = req.body;
      const logMessage = `[CLIENT-${level}] ${message} ${data ? JSON.stringify(data) : ''}`;
      console.log(logMessage);
      // Also write to a file for persistence
      try {
        fs.appendFileSync('client-diagnostics.log', `${new Date().toISOString()} ${logMessage}\n`);
      } catch (e) {
        // Ignore file write errors
      }
      res.sendStatus(200);
    });

    app.post("/api/admin/login-v2", async (req, res) => {
      const { idToken, entryPoint } = req.body;
      console.log(`[ADMIN] Login attempt received. EntryPoint: ${entryPoint || 'default'}`);
      try {
        if (isFirebaseAdminConfigured && sparkwavvAdmin) {
          const decodedToken = await sparkwavvAdmin.auth().verifyIdToken(idToken);
          const { role, tenantId } = await getUserRole(decodedToken.uid, decodedToken.email);
          
          const allowedRoles = [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OPERATOR, ROLES.EDITOR];
          if (allowedRoles.includes(role)) {
            // Set Custom Claims for instant role detection on client
            await sparkwavvAdmin.auth().setCustomUserClaims(decodedToken.uid, { role, tenantId });
            
            await logEvent('INFO', 'AUTH', `Admin login successful: ${decodedToken.email}`, { uid: decodedToken.uid, role, entryPoint });
            
            return res.json({ 
              success: true, 
              role, 
              project: 'admin', 
              entryPoint: entryPoint || (role === ROLES.OPERATOR ? 'operations' : 'admin')
            });
          }
          console.warn(`[ADMIN] User ${decodedToken.email} has insufficient role: ${role}`);
          return res.status(403).json({ error: "Insufficient permissions" });
        }
        return res.status(500).json({ error: "Auth configuration error" });
      } catch (e: any) {
        console.warn(`[ADMIN] Login failed: ${e.message}`);
        return res.status(401).json({ error: "Authentication failed" });
      }
    });

    app.get("/api/admin/profile", async (req, res) => {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: "Unauthorized" });

      if (!isFirebaseAdminConfigured || !sparkwavvAdmin) {
        return res.status(503).json({ error: "Firebase Admin not configured" });
      }

      try {
        const decodedToken = await sparkwavvAdmin.auth().verifyIdToken(idToken);
        const { role, tenantId } = await getUserRole(decodedToken.uid, decodedToken.email);
        const entryPoint = (req.session as any).adminEntryPoint;
        
        console.log(`[AUTH] Profile requested for ${decodedToken.email}. Role: ${role}, Tenant: ${tenantId}, Session EntryPoint: ${entryPoint}`);
        
        res.json({
          uid: decodedToken.uid,
          email: decodedToken.email,
          role,
          tenantId,
          project: 'admin',
          entryPoint: entryPoint || null
        });
      } catch (e: any) {
        console.error(`[AUTH] Profile verification failed: ${e.message}`);
        res.status(401).json({ error: "Invalid token" });
      }
    });

    app.get("/api/admin/storage/metrics", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), async (req, res) => {
      try {
        const metrics = await getStorageMetrics();
        res.json(metrics);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/admin/storage/purge", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), async (req, res) => {
      try {
        const result = await purgeOldArtifacts();
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/admin/set-role", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), async (req, res) => {
      const { uid, role } = req.body;
      const success = await setUserRole(uid, role);
      res.json({ success });
    });

    app.post("/api/admin/set-validation-gate", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EDITOR]), async (req, res) => {
      const { userId, mode } = req.body;
      try {
        await db.collection('dashboards').doc(userId).set({ validationGateMode: mode }, { merge: true });
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to update validation gate" });
      }
    });

    app.post("/api/admin/create-user", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EDITOR]), async (req, res) => {
      const { 
        email, 
        password, 
        displayName, 
        role, 
        journeyStage,
        tenantId,
        generationalPersona,
        careerStageRole,
        hierarchicalRole,
        brandPersona,
        brandDNAAttributes
      } = req.body;
      const actor = (req as any).user;
      try {
        const userRecord = await sparkwavvAdmin.auth().createUser({
          email,
          password,
          displayName,
        });

        let sparkwavvId = null;
        if ((role || ROLES.USER) === ROLES.USER) {
          sparkwavvId = await generateSparkwavvId(db);
        }

        await db.collection('users').doc(userRecord.uid).set({
          uid: userRecord.uid,
          sparkwavvId,
          email,
          displayName,
          role: role || ROLES.USER,
          journeyStage: journeyStage || 'Dive-In',
          emailVerified: false,
          tenantId: tenantId || 'sparkwavv',
          generationalPersona,
          careerStageRole,
          hierarchicalRole,
          brandPersona,
          brandDNAAttributes,
          createdAt: new Date().toISOString(),
        });

        // Also create a dashboard for the user to ensure 1:1 mapping
        await createDefaultDashboard(db, userRecord.uid, journeyStage || 'Dive-In', sparkwavvId);

        await logSecurityEvent(db, actor, 'USER_CREATE', 'INFO', { uid: userRecord.uid, email }, { role: role || ROLES.USER }, req.ip);

        res.json({ success: true, uid: userRecord.uid });
      } catch (error: any) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/admin/update-user", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EDITOR]), async (req, res) => {
      const { 
        uid, 
        email,
        displayName, 
        role, 
        journeyStage,
        tenantId,
        generationalPersona,
        careerStageRole,
        hierarchicalRole,
        brandPersona,
        brandDNAAttributes,
        firstName,
        lastName,
        jobTitle,
        companyOrg,
        phone,
        programTrack,
        lifecycleStage,
        outcomesAttributes,
        feedbackQuote
      } = req.body;
      const actor = (req as any).user;
      try {
        const userDoc = await db.collection('users').doc(uid).get();
        const oldData = userDoc.data();
        
        const updateData: any = {};
        if (email !== undefined) updateData.email = email;
        if (displayName !== undefined) updateData.displayName = displayName;
        if (role !== undefined) updateData.role = role;
        if (journeyStage !== undefined) updateData.journeyStage = journeyStage;
        if (tenantId !== undefined) updateData.tenantId = tenantId;
        if (generationalPersona !== undefined) updateData.generationalPersona = generationalPersona;
        if (careerStageRole !== undefined) updateData.careerStageRole = careerStageRole;
        if (hierarchicalRole !== undefined) updateData.hierarchicalRole = hierarchicalRole;
        if (brandPersona !== undefined) updateData.brandPersona = brandPersona;
        if (brandDNAAttributes !== undefined) updateData.brandDNAAttributes = brandDNAAttributes;
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
        if (companyOrg !== undefined) updateData.companyOrg = companyOrg;
        if (phone !== undefined) updateData.phone = phone;
        if (programTrack !== undefined) updateData.programTrack = programTrack;
        if (lifecycleStage !== undefined) updateData.lifecycleStage = lifecycleStage;
        if (outcomesAttributes !== undefined) updateData.outcomesAttributes = outcomesAttributes;
        if (feedbackQuote !== undefined) updateData.feedbackQuote = feedbackQuote;

        await db.collection('users').doc(uid).set(updateData, { merge: true });
        
        // Also update Auth if record exists
        try {
          const authUpdate: any = {};
          if (displayName) authUpdate.displayName = displayName;
          if (email) authUpdate.email = email;

          if (Object.keys(authUpdate).length > 0) {
            await sparkwavvAdmin.auth().updateUser(uid, authUpdate);
          }
        } catch (authError: any) {
          if (authError.code === 'auth/user-not-found') {
            console.warn(`Auth record not found for UID: ${uid}. Skipping Auth update.`);
          } else {
            throw authError;
          }
        }

        if (role && oldData && oldData.role !== role) {
          await logSecurityEvent(db, actor, 'ROLE_CHANGE', 'WARNING', { uid, email: oldData.email }, { oldRole: oldData.role, newRole: role }, req.ip);
        } else {
          await logSecurityEvent(db, actor, 'USER_UPDATE', 'INFO', { uid, email: oldData?.email || 'unknown' }, { updatedFields: Object.keys(updateData) }, req.ip);
        }

        res.json({ success: true });
      } catch (error: any) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/invitations/accept", requireRole([ROLES.USER, ROLES.ADMIN]), async (req, res) => {
      const { invitationId } = req.body;
      const partnerUid = (req as any).user.uid;

      try {
        const db = getFirestoreDb();
        if (!db) return res.status(503).json({ error: "Firestore not available" });

        const inviteDoc = await db.collection('invitations').doc(invitationId).get();
        if (!inviteDoc.exists) {
          return res.status(404).json({ error: "Invitation not found" });
        }

        const inviteData = inviteDoc.data();
        if (inviteData?.status !== 'pending') {
          return res.status(400).json({ error: "Invitation is no longer pending" });
        }

        // Update invitation status
        await db.collection('invitations').doc(invitationId).update({
          status: 'accepted',
          acceptedAt: new Date().toISOString(),
          partnerUid: partnerUid
        });

        // Create partner access record
        const accessId = `${partnerUid}_${inviteData.senderId}`;
        await db.collection('partner_access').doc(accessId).set({
          id: accessId,
          partnerUid: partnerUid,
          userUid: inviteData.senderId,
          userName: inviteData.senderName,
          relationship: inviteData.relationship,
          grantedAt: new Date().toISOString()
        });

        res.json({ success: true, userUid: inviteData.senderId });
      } catch (error: any) {
        console.error("Error accepting invitation:", error);
        res.status(500).json({ error: error.message });
      }
    });

    // RPP Invitation System
    app.post("/api/invitations/send", requireRole([ROLES.USER, ROLES.ADMIN]), async (req, res) => {
      const { recipientEmail, recipientName, relationship } = req.body;
      const actor = (req as any).user;

      if (!recipientEmail || !recipientName) {
        return res.status(400).json({ error: "Recipient email and name are required" });
      }

      try {
        const db = getFirestoreDb();
        if (!db) return res.status(503).json({ error: "Firestore not available" });

        const invitationId = uuidv4();
        const invitation = {
          id: invitationId,
          senderId: actor.uid,
          senderName: actor.name || actor.email,
          recipientEmail,
          recipientName,
          relationship: relationship || "Partner",
          status: "pending",
          createdAt: new Date().toISOString()
        };

        await db.collection('invitations').doc(invitationId).set(invitation);

        // Send Email via SendGrid
        const msg = {
          to: recipientEmail,
          from: 'no-reply@sparkwavv.com', // Replace with verified sender
          subject: `Sparkwavv Invitation from ${invitation.senderName}`,
          text: `Hi ${recipientName}, ${invitation.senderName} has invited you to be their Relational Power Partner on Sparkwavv. Click here to join: ${process.env.APP_URL}/accept-invitation/${invitationId}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; background: #f9f9f9;">
              <h2>Sparkwavv Invitation</h2>
              <p>Hi <strong>${recipientName}</strong>,</p>
              <p><strong>${invitation.senderName}</strong> has invited you to be their <strong>Relational Power Partner</strong> on the Sparkwavv platform.</p>
              <p>As an RPP, you'll be able to view their career progress and provide support as they navigate their professional journey.</p>
              <div style="margin: 30px 0;">
                <a href="${process.env.APP_URL || 'http://localhost:3000'}/accept-invitation/${invitationId}" 
                   style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Accept Invitation
                </a>
              </div>
              <p style="color: #666; font-size: 12px;">If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          `,
        };

        if (process.env.SENDGRID_API_KEY) {
          await sgMail.send(msg);
          console.log(`[SENDGRID] Invitation sent to ${recipientEmail}`);
        } else {
          console.log(`[SIMULATION] Invitation email would be sent to ${recipientEmail}`);
        }

        res.json({ success: true, invitationId });
      } catch (error: any) {
        console.error("Error sending invitation:", error);
        res.status(500).json({ error: error.message });
      }
    });

    // Partner View: Get User Progress
    app.get("/api/partner/user-progress/:userId", requireRole([ROLES.USER, ROLES.ADMIN]), async (req, res) => {
      const partnerUid = (req as any).user.uid;
      const targetUserId = req.params.userId;

      try {
        const db = getFirestoreDb();
        if (!db) return res.status(503).json({ error: "Firestore not available" });

        // Verify partner access
        const accessId = `${partnerUid}_${targetUserId}`;
        const accessDoc = await db.collection('partner_access').doc(accessId).get();

        if (!accessDoc.exists && (req as any).user.role !== ROLES.ADMIN) {
          return res.status(403).json({ error: "You do not have access to this user's progress" });
        }

        // Fetch dashboard and user data
        const dashboard = await getDashboard(db, targetUserId);
        const userDoc = await db.collection('users').doc(targetUserId).get();
        const userData = userDoc.data();

        res.json({
          user: {
            displayName: userData?.displayName,
            journeyStage: userData?.journeyStage,
            role: userData?.role
          },
          dashboard
        });
      } catch (error: any) {
        console.error("Error fetching partner view data:", error);
        res.status(500).json({ error: error.message });
      }
    });

    app.get("/api/admin/identity-reconciliation", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), async (req, res) => {
      try {
        const db = getFirestoreDb();
        if (!db) return res.status(503).json({ error: "Firestore not initialized" });

        const [usersSnapshot, dashboardsSnapshot] = await Promise.all([
          db.collection('users').get(),
          db.collection('dashboards').get()
        ]);

        const users = usersSnapshot.docs.map((d: any) => ({ uid: d.id, ...d.data() }));
        const dashboards = dashboardsSnapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));

        const userIds = new Set(users.map(u => u.uid));
        const dashboardUserIds = new Set(dashboards.map(d => d.userId || d.id));

        const orphanedDashboards = dashboards.filter(d => !userIds.has(d.userId || d.id));
        const usersWithoutDashboards = users.filter(u => !dashboardUserIds.has(u.uid));

        res.json({
          orphanedDashboards,
          usersWithoutDashboards,
          stats: {
            totalUsers: users.length,
            totalDashboards: dashboards.length,
            orphans: orphanedDashboards.length,
            missing: usersWithoutDashboards.length
          }
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/admin/relink-identity", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), async (req, res) => {
      const { dashboardId, newUserId, sparkwavvId } = req.body;
      const actor = (req as any).user;

      try {
        const db = getFirestoreDb();
        if (!db) return res.status(503).json({ error: "Firestore not initialized" });

        const dashboardDoc = await db.collection('dashboards').doc(dashboardId).get();
        if (!dashboardDoc.exists) {
          return res.status(404).json({ error: "Dashboard not found" });
        }

        const dashboardData = dashboardDoc.data();
        const batch = db.batch();

        // 1. Create new dashboard document with new UID
        batch.set(db.collection('dashboards').doc(newUserId), {
          ...dashboardData,
          userId: newUserId,
          sparkwavvId: sparkwavvId || dashboardData.sparkwavvId,
          updatedAt: new Date().toISOString(),
          relinkedBy: actor.email
        });

        // 2. Delete old dashboard document
        batch.delete(db.collection('dashboards').doc(dashboardId));

        // 3. Update user document to ensure sparkwavvId matches
        if (sparkwavvId) {
          batch.update(db.collection('users').doc(newUserId), { sparkwavvId });
        }

        await batch.commit();
        await logSecurityEvent(db, actor, 'IDENTITY_RELINK', 'WARNING', { uid: newUserId, email: '' }, { dashboardId, sparkwavvId }, req.ip);

        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.delete("/api/admin/dashboards/:id", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), async (req, res) => {
      const { id } = req.params;
      const actor = (req as any).user;

      try {
        const db = getFirestoreDb();
        if (!db) return res.status(503).json({ error: "Firestore not initialized" });

        await db.collection('dashboards').doc(id).delete();
        await logSecurityEvent(db, actor, 'DASHBOARD_DELETE', 'WARNING', { uid: id, email: '' }, { dashboardId: id }, req.ip);

        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/admin/disable-user", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EDITOR]), async (req, res) => {
      const { uid, disabled } = req.body;
      try {
        if (isFirebaseAdminConfigured && sparkwavvAdmin) {
          await sparkwavvAdmin.auth().updateUser(uid, { disabled });
          await db.collection('users').doc(uid).set({ disabled }, { merge: true });
          
          const actor = (req as any).user;
          await logSecurityEvent(db, actor, 'USER_MODIFIED', 'INFO', { uid, email: 'unknown' }, { details: `User ${disabled ? 'disabled' : 'enabled'}` }, req.ip);
          
          res.json({ success: true });
        } else {
          res.status(503).json({ error: "Firebase Admin not configured" });
        }
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/admin/reset-password", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EDITOR]), async (req, res) => {
      const { uid, newPassword } = req.body;
      try {
        if (isFirebaseAdminConfigured && sparkwavvAdmin) {
          await sparkwavvAdmin.auth().updateUser(uid, { password: newPassword });
          
          const actor = (req as any).user;
          await logSecurityEvent(db, actor, 'USER_MODIFIED', 'INFO', { uid, email: 'unknown' }, { details: 'Password reset' }, req.ip);
          
          res.json({ success: true });
        } else {
          res.status(503).json({ error: "Firebase Admin not configured" });
        }
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/admin/delete-user", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), async (req, res) => {
      const { uid } = req.body;
      const actor = (req as any).user;
      try {
        if (!isFirebaseAdminConfigured || !sparkwavvAdmin) {
          return res.status(503).json({ error: "Firebase Admin not configured" });
        }

        if (uid === actor.uid) {
          return res.status(400).json({ error: "You cannot delete yourself." });
        }

        const db = getFirestoreDb();
        if (!db) {
          return res.status(503).json({ error: "Firestore not available" });
        }

        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.data();
        const targetEmail = userData?.email || 'unknown';
        const targetRole = userData?.role || ROLES.USER;

        // Prevent deleting Super Admin
        if (targetEmail.toLowerCase() === 'larry.culver1226@gmail.com' || targetRole === ROLES.SUPER_ADMIN) {
          return res.status(403).json({ error: "Super Admins cannot be deleted." });
        }

        // Prevent Admins from deleting other Admins (only Super Admin can)
        if (actor.role !== ROLES.SUPER_ADMIN && (targetRole === ROLES.ADMIN || targetRole === ROLES.SUPER_ADMIN)) {
          return res.status(403).json({ error: "Only Super Admins can delete other Admins." });
        }
        
        // Try to delete from Auth, but don't fail if they don't exist there
        try {
          await sparkwavvAdmin.auth().deleteUser(uid);
        } catch (authError: any) {
          if (authError.code !== 'auth/user-not-found') {
            throw authError;
          }
          console.warn(`[AUTH] User ${uid} not found in Auth during deletion, proceeding to delete from Firestore.`);
        }

        // Delete from Firestore users collection
        await db.collection('users').doc(uid).delete();
        
        // Delete from Firestore dashboards collection
        await db.collection('dashboards').doc(uid).delete();

        // Delete from Firestore wavvault collection
        await db.collection('wavvault').doc(uid).delete();

        // Delete from Firestore admins collection (if they were an admin)
        await db.collection('admins').doc(uid).delete();

        await logSecurityEvent(db, actor, 'USER_DELETE', 'CRITICAL', { uid, email: targetEmail }, {}, req.ip);

        res.json({ success: true });
      } catch (error: any) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/admin/programs", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EDITOR]), async (req, res) => {
      const { id, ...data } = req.body;
      try {
        if (id) {
          await db.collection('programs').doc(id).set(data, { merge: true });
        } else {
          await db.collection('programs').add({ ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() });
        }
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.delete("/api/admin/programs/:id", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), async (req, res) => {
      const { id } = req.params;
      try {
        await db.collection('programs').doc(id).delete();
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Programs & Cohorts APIs
    app.get("/api/admin/programs", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EDITOR, ROLES.VIEWER, ROLES.OPERATOR]), async (req, res) => {
      try {
        const snapshot = await db.collection('programs').get();
        const programs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(programs);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/admin/cohorts", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EDITOR]), async (req, res) => {
      const { id, ...data } = req.body;
      try {
        if (id) {
          await db.collection('cohorts').doc(id).set(data, { merge: true });
        } else {
          await db.collection('cohorts').add({ ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() });
        }
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.delete("/api/admin/cohorts/:id", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), async (req, res) => {
      const { id } = req.params;
      try {
        await db.collection('cohorts').doc(id).delete();
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get("/api/admin/cohorts", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EDITOR, ROLES.VIEWER, ROLES.OPERATOR]), async (req, res) => {
      try {
        const snapshot = await db.collection('cohorts').get();
        const cohorts = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            startDate: data.startDate?.toDate?.()?.toISOString() || data.startDate,
            endDate: data.endDate?.toDate?.()?.toISOString() || data.endDate,
          };
        });
        res.json(cohorts);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get("/api/admin/journeys", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EDITOR, ROLES.VIEWER, ROLES.OPERATOR]), async (req, res) => {
      try {
        const snapshot = await db.collection('journeys').get();
        const journeys = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            startedAt: data.startedAt?.toDate?.()?.toISOString() || data.startedAt,
            completedAt: data.completedAt?.toDate?.()?.toISOString() || data.completedAt,
            steps: data.steps?.map((s: any) => ({
              ...s,
              completedAt: s.completedAt?.toDate?.()?.toISOString() || s.completedAt
            }))
          };
        });
        res.json(journeys);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get("/api/admin/security-logs", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPERATOR]), async (req, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;
        
        const db = getAdminDb();
        if (!db) return res.status(503).json({ error: "Admin database not available" });
        
        let query = db.collection('security_logs').orderBy('timestamp', 'desc');
        
        const snapshot = await query.limit(limit).offset(offset).get();
        const logs = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp
          };
        });
        
        const totalSnapshot = await db.collection('security_logs').count().get();
        const total = totalSnapshot.data().count;
        
        res.json({ logs, total });
      } catch (error: any) {
        console.error("Error fetching security logs:", error);
        res.status(500).json({ error: error.message });
      }
    });

    // Diagnostic endpoint for Firebase
    app.get("/api/admin/diagnostics", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), async (req, res) => {
      try {
        const authUsers = isFirebaseAdminConfigured && sparkwavvAdmin ? await sparkwavvAdmin.auth().listUsers(10) : { users: [] };
        const firestoreUsers = db ? await db.collection('users').limit(10).get() : { size: 0 };
        
        res.json({
          isFirebaseAdminConfigured,
          firebaseAppletConfig: {
            ...firebaseAppletConfig,
            apiKey: firebaseAppletConfig.apiKey ? 'PRESENT' : 'MISSING'
          },
          env: {
            FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
            VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
            NODE_ENV: process.env.NODE_ENV
          },
          counts: {
            authUsers: authUsers.users.length,
            firestoreUsers: firestoreUsers.size
          },
          sampleUsers: authUsers.users.map(u => ({ uid: u.uid, email: u.email }))
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get("/api/admin/flagged-content", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EDITOR, ROLES.VIEWER, ROLES.OPERATOR]), async (req, res) => {
      try {
        const db = getAdminDb();
        if (!db) return res.status(503).json({ error: "Admin database not initialized" });
        
        const snapshot = await db.collection('flagged_content').orderBy('timestamp', 'desc').limit(50).get();
        const content = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
        }));
        
        res.json({ content });
      } catch (error: any) {
        console.error("Error fetching flagged content:", error);
        res.status(500).json({ error: "Failed to fetch flagged content", details: error.message });
      }
    });

    app.post("/api/admin/flagged-content/:id/approve", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EDITOR]), async (req, res) => {
      const { id } = req.params;
      const actor = (req as any).user;
      try {
        const db = getAdminDb();
        if (!db) return res.status(503).json({ error: "Admin database not initialized" });
        
        await db.collection('flagged_content').doc(id).update({ status: 'approved', approvedBy: actor.email, approvedAt: new Date().toISOString() });
        
        await logSecurityEvent(db, actor, 'CONTENT_APPROVE', 'INFO', { uid: 'N/A', email: 'N/A' }, { contentId: id }, req.ip);
        
        res.json({ success: true });
      } catch (error: any) {
        console.error("Error approving content:", error);
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/admin/flagged-content/:id/delete", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EDITOR]), async (req, res) => {
      const { id } = req.params;
      const actor = (req as any).user;
      try {
        const db = getAdminDb();
        if (!db) return res.status(503).json({ error: "Admin database not initialized" });
        
        await db.collection('flagged_content').doc(id).delete();
        
        await logSecurityEvent(db, actor, 'CONTENT_DELETE', 'WARNING', { uid: 'N/A', email: 'N/A' }, { contentId: id }, req.ip);
        
        res.json({ success: true });
      } catch (error: any) {
        console.error("Error deleting content:", error);
        res.status(500).json({ error: error.message });
      }
    });

    app.get("/api/admin/debug-users", requireRole([ROLES.SUPER_ADMIN]), async (req, res) => {
      try {
        const db = getFirestoreDb();
        const authResult = await sparkwavvAdmin?.auth().listUsers();
        const authUsers = authResult?.users.map(u => ({ uid: u.uid, email: u.email })) || [];
        
        let firestoreUsers: any[] = [];
        if (db) {
          const snapshot = await db.collection('users').get();
          firestoreUsers = snapshot.docs.map(d => ({ uid: d.id, email: d.data().email }));
        }
        
        res.json({
          projectId: firebaseAppletConfig.projectId,
          authCount: authUsers.length,
          firestoreCount: firestoreUsers.length,
          authUsers,
          firestoreUsers
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get("/api/admin/users-v2", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EDITOR, ROLES.VIEWER, ROLES.OPERATOR]), async (req, res) => {
      try {
        const db = getFirestoreDb();
        console.log(`[ADMIN] users-v2 called by ${(req as any).user?.email} (${(req as any).user?.uid})`);
        
        // 1. Get all users from Firebase Auth (with safety catch)
        let authUsers: any[] = [];
        try {
          if (isFirebaseAdminConfigured && sparkwavvAdmin) {
            console.log("[ADMIN] Listing users from Firebase Auth...");
            const listUsersResult = await sparkwavvAdmin.auth().listUsers();
            console.log(`[ADMIN] Found ${listUsersResult.users.length} raw users in Firebase Auth`);
            
            authUsers = await Promise.all(listUsersResult.users.map(async (u) => {
              try {
                const { role, tenantId } = await getUserRole(u.uid, u.email);
                return {
                  uid: u.uid,
                  email: u.email,
                  displayName: u.displayName || u.email?.split('@')[0] || 'Unknown User',
                  role,
                  tenantId,
                  emailVerified: u.emailVerified,
                  creationTime: u.metadata.creationTime,
                  source: 'auth'
                };
              } catch (roleError: any) {
                console.warn(`[ADMIN] Error getting role for user ${u.uid}:`, roleError.message);
                return {
                  uid: u.uid,
                  email: u.email,
                  displayName: u.displayName || u.email?.split('@')[0] || 'Unknown User',
                  role: ROLES.USER,
                  tenantId: 'sparkwavv',
                  emailVerified: u.emailVerified,
                  creationTime: u.metadata.creationTime,
                  source: 'auth'
                };
              }
            }));
            console.log(`[ADMIN] Processed ${authUsers.length} users from Auth`);
          } else {
            console.warn("[ADMIN] Firebase Admin not configured or sparkwavvAdmin is null");
          }
        } catch (authError: any) {
          console.error("[AUTH] Error listing users from Auth:", authError.message);
          // Continue with empty auth list
        }

        // 2. Get all users from Firestore (with safety catch)
        let firestoreUsers: any[] = [];
        try {
          if (db) {
            const databaseId = firebaseAppletConfig.firestoreDatabaseId || '(default)';
            console.log(`[ADMIN] Fetching users from Firestore database: ${databaseId}`);
            const firestoreUsersSnapshot = await db.collection('users').get();
            firestoreUsers = firestoreUsersSnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                ...data,
                uid: doc.id,
                email: data.email,
                displayName: data.displayName || (data.firstName ? `${data.firstName} ${data.lastName}` : (data.email?.split('@')[0] || doc.id)),
                role: typeof data.role === 'string' ? data.role : (data.role?.role || ROLES.USER),
                journeyStage: data.journeyStage || 'Dive-In',
                emailVerified: data.emailVerified || false,
                creationTime: data.createdAt || new Date().toISOString(),
                source: 'firestore',
                tenantId: typeof data.tenantId === 'string' ? data.tenantId : (data.tenantId?.tenantId || 'sparkwavv'),
              };
            });
            console.log(`[ADMIN] Found ${firestoreUsers.length} users in Firestore collection 'users'`);
          } else {
            console.warn("[ADMIN] Firestore DB not initialized for users-v2");
          }
        } catch (fsError: any) {
          console.warn("[FIRESTORE] Could not fetch users from Firestore:", fsError.message);
        }

        // 3. Merge them with Auth Users
        console.log("[ADMIN] Merging Auth and Firestore users...");
        const mergedUsersMap = new Map();
        
        authUsers.forEach(u => mergedUsersMap.set(u.uid, { ...u, source: 'auth' }));
        
        firestoreUsers.forEach(u => {
          if (mergedUsersMap.has(u.uid)) {
            const existing = mergedUsersMap.get(u.uid);
            // Merge carefully to avoid overwriting with undefined/null
            const merged = { ...existing };
            Object.keys(u).forEach(key => {
              // Prioritize Auth for emailVerified
              if (key === 'emailVerified') return;
              
              if (u[key] !== undefined && u[key] !== null && u[key] !== '') {
                merged[key] = u[key];
              }
            });
            merged.source = 'both';
            mergedUsersMap.set(u.uid, merged);
          } else {
            mergedUsersMap.set(u.uid, u);
          }
        });

        const finalUsers = Array.from(mergedUsersMap.values());
        console.log(`[ADMIN] Returning ${finalUsers.length} merged users`);
        
        // Debug: write to file to verify what's being sent to the frontend
        try {
          fs.writeFileSync(path.join(process.cwd(), 'users-v2-last-response.json'), JSON.stringify({
            timestamp: new Date().toISOString(),
            caller: (req as any).user?.email,
            count: finalUsers.length,
            users: finalUsers
          }, null, 2));
        } catch (e) {
          console.error("Failed to write users-v2 debug file:", e);
        }
        
        res.json({ users: finalUsers });
      } catch (error) {
        console.error("Error listing users:", error);
        res.status(500).json({ error: "Failed to list users. Check if Firebase is fully initialized." });
      }
    });

    app.post("/api/admin/promote", async (req, res) => {
      const { idToken, password } = req.body;
      if (password !== (process.env.ADMIN_PASSWORD || "sparkwavv-admin-secure-2026")) {
        return res.status(401).json({ error: "Invalid password" });
      }
      try {
        const decodedToken = await sparkwavvAdmin.auth().verifyIdToken(idToken);
        await setUserRole(decodedToken.uid, ROLES.ADMIN);
        res.json({ success: true });
      } catch (error) {
        res.status(401).json({ error: "Invalid token" });
      }
    });

    app.post("/api/user/init-role", async (req, res) => {
      const { 
        idToken, 
        userId, 
        email, 
        firstName, 
        lastName,
        jobTitle,
        companyOrg,
        phone,
        programTrack,
        lifecycleStage,
        outcomesAttributes,
        feedbackQuote
      } = req.body;
      try {
        const db = getFirestoreDb();
        if (!db) {
          throw new Error("Firestore not initialized");
        }

        const decodedToken = await sparkwavvAdmin.auth().verifyIdToken(idToken);
        const userEmail = email || decodedToken.email;
        const displayName = firstName && lastName ? `${firstName} ${lastName}` : (decodedToken.name || userEmail?.split('@')[0]);

        // Ensure sparkwavvId is generated for new self-registered users
        let sparkwavvId = null;
        const existingUser = await db.collection('users').doc(decodedToken.uid).get();
        if (existingUser.exists) {
          sparkwavvId = existingUser.data()?.sparkwavvId;
        }
        
        if (!sparkwavvId) {
          sparkwavvId = await generateSparkwavvId(db);
        }

        await db.collection('users').doc(decodedToken.uid).set({ 
          role: ROLES.USER,
          journeyStage: 'Dive-In',
          userId: userId || decodedToken.email,
          sparkwavvId,
          email: userEmail,
          tenantId: 'sparkwavv', // Default tenant
          emailVerified: decodedToken.email_verified || false,
          updatedAt: FieldValue.serverTimestamp(),
          firstName: firstName || '',
          lastName: lastName || '',
          displayName: displayName || '',
          jobTitle: jobTitle || '',
          companyOrg: companyOrg || '',
          phone: phone || '',
          programTrack: programTrack || '',
          lifecycleStage: lifecycleStage || '',
          outcomesAttributes: outcomesAttributes || '',
          feedbackQuote: feedbackQuote || '',
          createdAt: new Date().toISOString()
        }, { merge: true });
        res.json({ success: true });
      } catch (error: any) {
        if (error.code === 16 || error.message?.includes('UNAUTHENTICATED')) {
          console.error("CRITICAL: Firestore Unauthenticated (Error 16). This usually means your Service Account credentials (FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are missing, invalid, or belong to a different project.");
        }
        console.error("Error in init-role:", error);
        res.status(401).json({ success: false });
      }
    });

    app.get("/api/user/profile", async (req, res) => {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: "Unauthorized" });
      try {
        const db = getFirestoreDb();
        if (!db) {
          throw new Error("Firestore not initialized");
        }
        const decodedToken = await withTimeout(sparkwavvAdmin.auth().verifyIdToken(idToken), 5000);
        console.log(`[AUTH] Fetching profile for UID: ${decodedToken.uid} (${decodedToken.email})`);
        
        // Larry Bootstrap
        if (decodedToken.email?.toLowerCase() === 'larry.culver1226@gmail.com') {
          console.log(`[AUTH] Larry Culver detected. Bootstrapping super_admin profile.`);
          const larryProfile = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: ROLES.SUPER_ADMIN,
            displayName: "Larry Culver",
            onboardingComplete: true,
            tenantId: 'sparkwavv'
          };
          return res.json(larryProfile);
        }

        const userDoc = (await withTimeout(db.collection('users').doc(decodedToken.uid).get(), 5000)) as any;
        if (userDoc.exists) {
          const userData = userDoc.data();
          console.log(`[AUTH] Profile found for ${decodedToken.email}. Role: ${userData.role}`);
          res.json({ ...userData, uid: decodedToken.uid });
        } else {
          console.warn(`[AUTH] Profile NOT found for UID: ${decodedToken.uid} (${decodedToken.email})`);
          res.status(404).json({ error: "User not found" });
        }
      } catch (error: any) {
        if (error.code === 16 || error.message?.includes('UNAUTHENTICATED')) {
          console.error("CRITICAL: Firestore Unauthenticated (Error 16). Check your Service Account credentials.");
        }
        console.error(`Error fetching profile for token:`, error.message);
        res.status(401).json({ error: "Invalid token or request timed out" });
      }
    });

    app.patch("/api/user/profile", async (req, res) => {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: "Unauthorized" });
      try {
        const decodedToken = await sparkwavvAdmin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const updates = req.body;

        // Prevent updating sensitive fields via this route
        const forbiddenFields = ['role', 'tenantId', 'uid', 'email'];
        forbiddenFields.forEach(field => delete updates[field]);

        await db.collection('users').doc(uid).set({
          ...updates,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        const updatedDoc = await db.collection('users').doc(uid).get();
        res.json({ uid, ...updatedDoc.data() });
      } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: "Failed to update profile" });
      }
    });

    app.get("/api/user/wavvault-status", async (req, res) => {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: "Unauthorized" });
      try {
        const decodedToken = await withTimeout(sparkwavvAdmin.auth().verifyIdToken(idToken), 5000);
        const wavvaultDoc = (await withTimeout(db.collection('wavvault').doc(decodedToken.uid).get(), 5000)) as any;
        res.json({ exists: wavvaultDoc.exists });
      } catch (error) {
        console.error("Error fetching wavvault status:", error);
        res.status(401).json({ error: "Invalid token or request timed out" });
      }
    });

    app.get("/api/wavvault/user", requireRole([ROLES.USER, ROLES.ADMIN, ROLES.OPERATOR, ROLES.MENTOR, ROLES.AGENT]), async (req, res) => {
      const { userId } = req.query;
      const authenticatedUser = (req as any).user;

      if (userId !== authenticatedUser.uid && authenticatedUser.role !== ROLES.ADMIN) {
        return res.status(403).json({ error: "Forbidden: You can only view your own Wavvault data." });
      }

      try {
        const doc = (await withTimeout(db.collection('wavvault').doc(userId as string).get(), 5000)) as any;
        if (!doc.exists) {
          return res.status(404).json({ error: "Wavvault not found" });
        }
        res.json(doc.data());
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get("/api/wavvault/verify", requireRole([ROLES.USER, ROLES.ADMIN, ROLES.OPERATOR, ROLES.MENTOR, ROLES.AGENT]), async (req, res) => {
      const { userId } = req.query;
      const authenticatedUser = (req as any).user;

      if (userId !== authenticatedUser.uid && authenticatedUser.role !== ROLES.ADMIN) {
        return res.status(403).json({ error: "Forbidden: You can only verify your own Wavvault data." });
      }

      try {
        const doc = (await withTimeout(db.collection('wavvault').doc(userId as string).get(), 5000)) as any;
        if (!doc.exists) {
          return res.status(404).json({ error: "Wavvault not found" });
        }
        const result = await verifyWavvaultIntegrity(userId as string, doc.data());
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Wavvault Hybrid Data Access Routes
    app.post("/api/wavvault/user", requireRole([ROLES.USER, ROLES.ADMIN, ROLES.OPERATOR, ROLES.MENTOR, ROLES.AGENT]), async (req, res) => {
      const { userId } = req.body;
      const authenticatedUser = (req as any).user;

      if (userId !== authenticatedUser.uid && authenticatedUser.role !== ROLES.ADMIN) {
        return res.status(403).json({ error: "Forbidden: You can only update your own Wavvault data." });
      }

      try {
        const result = await writeUserWavvault(req.body);
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/wavvault/artifact", requireRole([ROLES.USER, ROLES.ADMIN, ROLES.OPERATOR, ROLES.MENTOR, ROLES.AGENT]), async (req, res) => {
      const { userId } = req.body;
      const authenticatedUser = (req as any).user;

      if (userId !== authenticatedUser.uid && authenticatedUser.role !== ROLES.ADMIN) {
        return res.status(403).json({ error: "Forbidden: You can only upload artifacts for yourself." });
      }

      try {
        const result = await writeArtifact(req.body);
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get("/api/wavvault/search", requireRole([ROLES.USER, ROLES.ADMIN, ROLES.OPERATOR, ROLES.MENTOR, ROLES.AGENT]), async (req, res) => {
      const { q, limit } = req.query;
      if (!q) return res.status(400).json({ error: "Query string 'q' is required" });
      try {
        const result = await searchSimilarWavvaults(q as string, limit ? parseInt(limit as string) : 5);
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get("/api/wavvault/chat", requireRole([ROLES.USER, ROLES.ADMIN, ROLES.OPERATOR, ROLES.MENTOR, ROLES.AGENT]), async (req, res) => {
      const { userId } = req.query;
      const authenticatedUser = (req as any).user;

      if (!userId) return res.status(400).json({ error: "UserId is required" });

      if (userId !== authenticatedUser.uid && authenticatedUser.role !== ROLES.ADMIN) {
        return res.status(403).json({ error: "Forbidden: You can only access your own chat history." });
      }

      try {
        const wavvaultDoc = await db.collection('wavvault').doc(userId as string).get();
        if (wavvaultDoc.exists) {
          res.json({ history: wavvaultDoc.data()?.chatHistory || [] });
        } else {
          res.json({ history: [] });
        }
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/wavvault/chat", requireRole([ROLES.USER, ROLES.ADMIN, ROLES.OPERATOR, ROLES.MENTOR, ROLES.AGENT]), async (req, res) => {
      const { userId, history } = req.body;
      const authenticatedUser = (req as any).user;

      if (!userId || !history) return res.status(400).json({ error: "UserId and history are required" });

      if (userId !== authenticatedUser.uid && authenticatedUser.role !== ROLES.ADMIN) {
        return res.status(403).json({ error: "Forbidden: You can only update your own chat history." });
      }

      try {
        await db.collection('wavvault').doc(userId).set({ chatHistory: history }, { merge: true });
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // --- Dynamic Asset Engine Routes ---

    app.post("/api/wavvault/analyze-delta", requireRole([ROLES.USER, ROLES.ADMIN, ROLES.OPERATOR, ROLES.MENTOR, ROLES.AGENT]), async (req, res) => {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: "Unauthorized" });

      try {
        const decodedToken = await sparkwavvAdmin.auth().verifyIdToken(idToken);
        const userId = decodedToken.uid;
        const currentData = req.body;

        const analysis = await analyzeWavvaultDelta(userId, currentData);
        res.json(analysis);
      } catch (error: any) {
        console.error("Error analyzing delta:", error);
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/wavvault/events", requireRole([ROLES.USER, ROLES.ADMIN, ROLES.OPERATOR, ROLES.MENTOR, ROLES.AGENT]), async (req, res) => {
      const { userId, event } = req.body;
      const user = (req as any).user;
      if (user?.uid !== userId && user?.role !== ROLES.ADMIN) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const db = admin.firestore();
      const eventId = db.collection('wavvault_events').doc().id;
      await db.collection('wavvault_events').doc(eventId).set({
        ...event,
        id: eventId,
        userId,
        serverTimestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true, id: eventId });
    });

    app.post("/api/wavvault/artifacts", requireRole([ROLES.USER, ROLES.ADMIN, ROLES.OPERATOR, ROLES.MENTOR, ROLES.AGENT]), async (req, res) => {
      const { userId, artifact } = req.body;
      const user = (req as any).user;
      if (user?.uid !== userId && user?.role !== ROLES.ADMIN) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const db = admin.firestore();
      const artifactId = db.collection('wavvault_artifacts').doc().id;
      await db.collection('wavvault_artifacts').doc(artifactId).set({
        ...artifact,
        id: artifactId,
        userId,
        serverTimestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true, id: artifactId });
    });

    app.get("/api/user-assets", requireRole([ROLES.USER, ROLES.ADMIN, ROLES.OPERATOR, ROLES.MENTOR, ROLES.AGENT]), async (req, res) => {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: "Unauthorized" });

      try {
        const decodedToken = await sparkwavvAdmin.auth().verifyIdToken(idToken);
        const userId = decodedToken.uid;
        const db = getFirestoreDb();
        if (!db) throw new Error("Firestore not initialized");

        const assetsSnapshot = await db.collection('user_assets')
          .where('userId', '==', userId)
          .orderBy('createdAt', 'desc')
          .get();

        const assets = assetsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ assets });
      } catch (error: any) {
        console.error("Error fetching assets:", error);
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/user-assets/lock", requireRole([ROLES.USER, ROLES.ADMIN, ROLES.OPERATOR, ROLES.MENTOR, ROLES.AGENT]), async (req, res) => {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: "Unauthorized" });

      try {
        const decodedToken = await sparkwavvAdmin.auth().verifyIdToken(idToken);
        const userId = decodedToken.uid;
        const { type, title, content, versionHash } = req.body;
        const db = getFirestoreDb();
        if (!db) throw new Error("Firestore not initialized");

        const assetId = uuidv4();
        const assetData = {
          userId,
          type,
          title,
          content,
          versionHash,
          isLocked: true,
          createdAt: new Date().toISOString()
        };

        await db.collection('user_assets').doc(assetId).set(assetData);
        res.json({ success: true, assetId });
      } catch (error: any) {
        console.error("Error locking asset:", error);
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/shares", requireRole([ROLES.USER, ROLES.ADMIN, ROLES.OPERATOR, ROLES.MENTOR, ROLES.AGENT]), async (req, res) => {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: "Unauthorized" });

      try {
        const decodedToken = await sparkwavvAdmin.auth().verifyIdToken(idToken);
        const userId = decodedToken.uid;
        const { assetId, expiresAt, maxViews, brandingPersona } = req.body;
        const db = getFirestoreDb();
        if (!db) throw new Error("Firestore not initialized");

        const shareId = uuidv4();
        const accessKey = uuidv4();
        const shareData = {
          userId,
          assetId,
          accessKey,
          expiresAt: expiresAt || null,
          maxViews: maxViews || null,
          viewCount: 0,
          brandingPersona: brandingPersona || 'Left Brain (Kick/Yin)',
          createdAt: new Date().toISOString()
        };

        await db.collection('shares').doc(shareId).set(shareData);
        res.json({ success: true, shareId, accessKey });
      } catch (error: any) {
        console.error("Error creating share:", error);
        res.status(500).json({ error: error.message });
      }
    });

    // Public Share Route (No authentication required, but requires valid shareId and accessKey)
    app.get("/api/shares/public/:shareId", async (req, res) => {
      const { shareId } = req.params;
      const { key } = req.query;

      try {
        const db = getFirestoreDb();
        if (!db) throw new Error("Firestore not initialized");

        const shareDoc = await db.collection('shares').doc(shareId).get();
        if (!shareDoc.exists) return res.status(404).json({ error: "Share not found" });

        const shareData = shareDoc.data() as any;
        if (shareData.accessKey !== key) return res.status(403).json({ error: "Invalid access key" });

        // Check expiration
        if (shareData.expiresAt && new Date(shareData.expiresAt) < new Date()) {
          return res.status(410).json({ error: "Share has expired" });
        }

        // Check view count
        if (shareData.maxViews && shareData.viewCount >= shareData.maxViews) {
          return res.status(410).json({ error: "View limit reached" });
        }

        // Increment view count
        await db.collection('shares').doc(shareId).update({
          viewCount: admin.firestore.FieldValue.increment(1)
        });

        // Fetch the associated asset
        const assetDoc = await db.collection('user_assets').doc(shareData.assetId).get();
        if (!assetDoc.exists) return res.status(404).json({ error: "Asset not found" });

        const assetData = assetDoc.data();
        
        // Fetch user brand persona if not in shareData
        const userDoc = await db.collection('users').doc(shareData.userId).get();
        const userData = userDoc.exists ? userDoc.data() : {};

        res.json({
          asset: assetData,
          brandingPersona: shareData.brandingPersona || userData?.brandPersona || 'Left Brain (Kick/Yin)',
          userName: userData?.displayName || 'A SPARKWavv Professional'
        });
      } catch (error: any) {
        console.error("Error fetching public share:", error);
        res.status(500).json({ error: error.message });
      }
    });

    // Skylar AI Agentic Routes
    app.post("/api/skylar/search-wavvault", requireRole([ROLES.USER, ROLES.ADMIN, ROLES.OPERATOR, ROLES.MENTOR, ROLES.AGENT]), async (req, res) => {
      const { query } = req.body;
      try {
        const results = await searchSimilarWavvaults(query, 3);
        const anonymizedResults = results.map((res: any) => ({
          role: res.role,
          journeyStage: res.journeyStage,
          strengths: res.strengths || [],
          careerStories: res.careerStories || [],
        }));
        res.json({ content: anonymizedResults });
      } catch (error: any) {
        console.error("[SKYLAR SEARCH ERROR]", error);
        res.status(500).json({ error: error.message || "Failed to search Wavvault." });
      }
    });

    app.post("/api/skylar/execute-action", requireRole([ROLES.USER, ROLES.ADMIN, ROLES.OPERATOR, ROLES.MENTOR, ROLES.AGENT]), async (req, res) => {
      const { userId, action, data } = req.body;
      const authenticatedUser = (req as any).user;

      if (userId !== authenticatedUser.uid && authenticatedUser.role !== ROLES.ADMIN) {
        return res.status(403).json({ error: "Forbidden: You can only execute actions for your own account." });
      }

      const db = getFirestoreDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      try {
        if (action === 'update_dashboard') {
          const { field, value, reasoning } = data;
          await db.collection('dashboards').doc(userId).set({ [field]: value }, { merge: true });
          
          // Special case: if updating discoveryProgress, sync to users collection
          if (field === 'discoveryProgress') {
            await db.collection('users').doc(userId).set({ journeyStage: value }, { merge: true });
          }

          await logSecurityEvent(null, authenticatedUser, 'AI_DASHBOARD_UPDATE', 'INFO', { uid: userId, email: authenticatedUser.email }, { field, value, reasoning });
          res.json({ success: true, message: `Updated ${field} to ${value}` });
        } else if (action === 'add_milestone') {
          const { title, description, targetDate, reasoning } = data;
          const milestone = {
            id: uuidv4(),
            title,
            description,
            targetDate,
            status: 'pending',
            createdAt: new Date().toISOString()
          };

          await db.collection('dashboards').doc(userId).update({
            milestones: admin.firestore.FieldValue.arrayUnion(milestone)
          });

          await logSecurityEvent(null, authenticatedUser, 'AI_MILESTONE_ADDITION', 'INFO', { uid: userId, email: authenticatedUser.email }, { milestone, reasoning });
          res.json({ success: true, message: `Added milestone: ${title}` });
        } else {
          res.status(400).json({ error: "Unknown action type" });
        }
      } catch (error: any) {
        console.error("[SKYLAR EXECUTION ERROR]", error);
        res.status(500).json({ error: error.message || "Failed to execute Skylar's proposal." });
      }
    });

    // RSS Sync Endpoint
    app.post("/api/skylar/rss-sync", requireRole([ROLES.ADMIN, ROLES.OPERATOR]), async (req, res) => {
      const db = getFirestoreDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const parser = new XMLParser();
      const results = [];

      try {
        for (const feed of RSS_FEEDS) {
          const response = await fetch(feed.url);
          const xmlData = await response.text();
          const jsonObj = parser.parse(xmlData);
          
          // Basic extraction of headlines and snippets
          const channel = jsonObj.rss?.channel || jsonObj.feed || {};
          const items = channel.item || channel.entry || [];
          const topItems = (Array.isArray(items) ? items : [items]).slice(0, 5).map((item: any) => ({
            title: item.title || item.title?.['#text'] || 'No Title',
            snippet: item.description || item.summary || item.content?.['#text'] || 'No Snippet',
            link: item.link || item.link?.['@_href'] || '',
            pubDate: item.pubDate || item.published || item.updated || new Date().toISOString()
          }));

          results.push({
            source: feed.name,
            items: topItems,
            updatedAt: new Date().toISOString()
          });
        }

        // Store in Firestore
        const batch = db.batch();
        const cacheRef = db.collection('market_cache').doc('daily_pulse');
        batch.set(cacheRef, { feeds: results, lastSync: new Date().toISOString() });
        await batch.commit();

        res.json({ success: true, message: "RSS feeds synced successfully", data: results });
      } catch (error: any) {
        console.error("[RSS SYNC ERROR]", error);
        res.status(500).json({ error: error.message || "Failed to sync RSS feeds." });
      }
    });

    // Validation Request Endpoint
    app.post("/api/skylar/request-validation", requireRole([ROLES.USER, ROLES.ADMIN]), async (req, res) => {
      const { userId, gateId, reasoning, userData } = req.body;
      const authenticatedUser = (req as any).user;

      if (userId !== authenticatedUser.uid && authenticatedUser.role !== ROLES.ADMIN) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const db = getFirestoreDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      try {
        const validationRequest = {
          id: uuidv4(),
          userId,
          userEmail: authenticatedUser.email,
          gateId,
          reasoning,
          userData,
          status: 'pending_review',
          createdAt: new Date().toISOString()
        };

        await db.collection('validationRequests').doc(validationRequest.id).set(validationRequest);
        
        // Update user dashboard status
        await db.collection('dashboards').doc(userId).set({ 
          validationStatus: 'Human Mentor Reviewing Progress',
          pendingGateId: gateId
        }, { merge: true });

        res.json({ success: true, message: "Validation request submitted to human mentors." });
      } catch (error: any) {
        console.error("[VALIDATION REQUEST ERROR]", error);
        res.status(500).json({ error: error.message || "Failed to submit validation request." });
      }
    });

    // Mentor Note Endpoint
    app.post("/api/user/mentor-note", requireRole([ROLES.ADMIN, ROLES.MENTOR, ROLES.OPERATOR]), async (req, res) => {
      const { userId, note, status } = req.body;
      const db = getFirestoreDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      try {
        await db.collection('dashboards').doc(userId).set({ 
          mentorNote: note,
          validationStatus: status || 'Reviewed by Mentor',
          updatedAt: new Date().toISOString()
        }, { merge: true });

        res.json({ success: true, message: "Mentor note saved successfully." });
      } catch (error: any) {
        console.error("[MENTOR NOTE ERROR]", error);
        res.status(500).json({ error: error.message || "Failed to save mentor note." });
      }
    });

    // Market Intelligence Endpoint (Hybrid)
    app.post("/api/skylar/market-intelligence", requireRole([ROLES.USER, ROLES.ADMIN]), async (req, res) => {
      const { industry, role } = req.body;
      const db = getFirestoreDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      try {
        // 1. Check Cache
        const cacheDoc = await db.collection('market_cache').doc('daily_pulse').get();
        let cacheData = cacheDoc.exists ? cacheDoc.data() : null;
        
        // Filter cache for relevant industry if possible
        let relevantCache = cacheData?.feeds?.filter((f: any) => 
          f.source.toLowerCase().includes(industry.toLowerCase()) || 
          f.items.some((i: any) => i.title.toLowerCase().includes(industry.toLowerCase()))
        ) || [];

        res.json({ 
          cache: relevantCache, 
          message: relevantCache.length > 0 ? "Found relevant cached data." : "No relevant cached data found. Suggesting live search."
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // --- VERTEX AI (TRACK B) ENDPOINTS ---

    /**
     * Phase 1: Managed RAG (Vertex AI Search)
     * DNA Pattern Matcher Endpoint
     */
    app.post("/api/skylar/patterns", requireRole([ROLES.USER, ROLES.ADMIN, ROLES.OPERATOR]), async (req, res) => {
      const { query } = req.body;
      const authenticatedUser = (req as any).user;

      try {
        const results = await vertexService.searchWavvault(query, authenticatedUser.role === ROLES.ADMIN ? undefined : authenticatedUser.uid);
        
        if (!results) {
          return res.status(503).json({ 
            error: "Vertex AI Search is currently unavailable or not configured.",
            fallback: "Falling back to standard vector search..."
          });
        }

        res.json({ success: true, results });
      } catch (error: any) {
        console.error("[VERTEX PATTERNS ERROR]", error);
        res.status(500).json({ error: error.message || "Failed to find DNA patterns." });
      }
    });

    /**
     * Manual Trigger for Vertex AI Search Sync
     */
    app.post("/api/skylar/sync-wavvault", requireRole([ROLES.ADMIN, ROLES.OPERATOR]), async (req, res) => {
      try {
        const result = await syncWavvaultToVertex();
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    /**
     * Phase 3: Sector Intelligence (Model Garden)
     * Healthcare Insight Endpoint (MedLM)
     */
    app.post("/api/skylar/healthcare", requireRole([ROLES.USER, ROLES.ADMIN]), async (req, res) => {
      const { prompt } = req.body;
      const authenticatedUser = (req as any).user;

      try {
        // Check if user is in Healthcare sector
        const db = getFirestoreDb();
        const userDoc = await db.collection('users').doc(authenticatedUser.uid).get();
        const userData = userDoc.data();

        if (userData?.specializedSector !== 'Healthcare' && authenticatedUser.role !== ROLES.ADMIN) {
          return res.status(403).json({ error: "MedLM access is restricted to the Healthcare sector." });
        }

        const insight = await vertexService.getHealthcareInsight(prompt);
        res.json({ success: true, insight });
      } catch (error: any) {
        console.error("[VERTEX HEALTHCARE ERROR]", error);
        res.status(500).json({ error: error.message || "Failed to get healthcare insight." });
      }
    });

    /**
     * Phase 2: Philip Lobkowicz Coaching (Fine-Tuned Model)
     */
    app.post("/api/skylar/coaching", requireRole([ROLES.USER, ROLES.ADMIN]), async (req, res) => {
      const { prompt } = req.body;
      try {
        const advice = await vertexService.getLobkowiczCoaching(prompt);
        res.json({ success: true, advice });
      } catch (error: any) {
        console.error("[VERTEX COACHING ERROR]", error);
        res.status(500).json({ error: error.message || "Failed to get strategic coaching advice." });
      }
    });
  }

  // Registration API
  app.post("/api/register", (req, res) => {
    const { email, name } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const token = uuidv4();
    const expires = Date.now() + 30 * 60 * 1000; // 30 minutes from now

    registrationTokens.set(token, { email, expires });

    // Simulate sending email
    const confirmationLink = `${req.protocol}://${req.get("host")}/api/confirm?token=${token}`;
    
    console.log("-----------------------------------------");
    console.log(`To: ${email}`);
    console.log(`Subject: Confirm Your SPARKWavv Registration`);
    console.log(`Hello ${name || "User"},`);
    console.log(`Please confirm your SPARKWavv account by clicking the link below:`);
    console.log(confirmationLink);
    console.log(`This link will expire in 30 minutes.`);
    console.log("-----------------------------------------");

    res.json({ success: true, message: "Registration email sent" });
  });

  app.get("/api/confirm", (req, res) => {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).send("Invalid token");
    }

    const registration = registrationTokens.get(token);

    if (!registration) {
      return res.status(400).send("Registration link not found or already used");
    }

    if (Date.now() > registration.expires) {
      registrationTokens.delete(token);
      return res.status(400).send("Registration link has expired (30 minutes limit)");
    }

    // Success!
    registrationTokens.delete(token);
    
    // Redirect back to the app with a confirmation flag
    res.redirect("/?registration_confirmed=true");
  });

  // User Dashboard API
  app.get("/api/user/dashboard", async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];

    if (!idToken) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decodedToken = await withTimeout(sparkwavvAdmin.auth().verifyIdToken(idToken), 5000);
      let userId = decodedToken.uid;
      
      if (!isFirebaseAdminConfigured) {
        return res.status(503).json({ error: "Firebase Admin not configured" });
      }

      const db = getFirestoreDb();
      if (!db) return res.status(503).json({ error: "Firestore not initialized" });
      
      // Fetch user profile first to get the authoritative journeyStage, displayName, and sparkwavvId
      let authoritativeStage = 'Dive-In';
      let userDisplayName = '';
      let userSparkwavvId = '';
      let userRole: string = ROLES.USER;

      try {
        const userDoc = (await withTimeout(db.collection('users').doc(userId).get(), 3000)) as any;
        if (userDoc.exists) {
          const userData = userDoc.data();
          authoritativeStage = userData?.journeyStage || 'Ignition';
          userDisplayName = userData?.displayName || (userData?.firstName ? `${userData.firstName} ${userData.lastName}` : '');
          userSparkwavvId = userData?.sparkwavvId || '';
          userRole = userData?.role || ROLES.USER;
        }
        
        // Fallback to decoded token if still empty
        if (!userDisplayName && decodedToken) {
          userDisplayName = decodedToken.name || decodedToken.email?.split('@')[0] || 'User';
        }
      } catch (e) {
        console.warn("[API] Failed to fetch user profile for stage sync:", e);
      }

      // Allow admins and mentors to view other user dashboards via query param
      const requestedUserId = req.query.userId as string;
      if (requestedUserId && requestedUserId !== userId && requestedUserId !== userSparkwavvId) {
        // Check if current user has permission
        const isAuthorized = 
          userRole === ROLES.ADMIN || 
          userRole === ROLES.SUPER_ADMIN || 
          userRole === ROLES.EDITOR ||
          (userRole === ROLES.MENTOR && (await (async () => {
            const targetDoc = await db.collection('users').doc(requestedUserId).get();
            return targetDoc.exists && targetDoc.data()?.tenantId === decodedToken.tenantId;
          })()));

        if (isAuthorized) {
          console.log(`🛡️ [Dashboard] ${userRole} ${userId} accessing dashboard for ${requestedUserId}`);
          userId = requestedUserId;
          
          // Re-fetch target user's sparkwavvId for dashboard lookup
          try {
            const targetDoc = (await withTimeout(db.collection('users').doc(userId).get(), 3000)) as any;
            if (targetDoc.exists) {
              userSparkwavvId = targetDoc.data()?.sparkwavvId || '';
            }
          } catch (e) {
            console.warn("[API] Failed to fetch target user profile:", e);
          }
        } else {
          console.warn(`🚫 [Dashboard] Unauthorized access attempt by ${userId} to ${requestedUserId}`);
          return res.status(403).json({ error: "Forbidden" });
        }
      }

      let dashboard = await getDashboard(db, userId, userSparkwavvId);

      if (!dashboard) {
        dashboard = await createDefaultDashboard(db, userId, authoritativeStage, userSparkwavvId);
      }

      const dynamicScores = calculateDynamicScores({ ...dashboard, discoveryProgress: authoritativeStage });

      // Add a flag to the response if we're in fallback mode
      res.json({
        ...dashboard,
        ...dynamicScores,
        displayName: userDisplayName || dashboard.displayName,
        discoveryProgress: authoritativeStage, // Strictly enforce the authoritative stage from the user profile
        _persistenceStatus: isFirestoreInitialized ? 'active' : 'fallback'
      });
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  app.post("/api/user/dashboard", async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decodedToken = await sparkwavvAdmin.auth().verifyIdToken(idToken);
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ error: "Data is required" });
      }

      if (!isFirebaseAdminConfigured) {
        return res.status(503).json({ error: "Firebase Admin not configured" });
      }

      const db = getFirestoreDb();
      if (!db) return res.status(503).json({ error: "Firestore not initialized" });
      const success = await saveDashboard(db, decodedToken.uid, data);
      
      res.json({ 
        success, 
        persistenceStatus: isFirestoreInitialized ? 'active' : 'fallback' 
      });
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // User Insights API
  app.get("/api/user-insights", async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decodedToken = await withTimeout(sparkwavvAdmin.auth().verifyIdToken(idToken), 5000);
      const userId = decodedToken.uid;
      
      const db = getFirestoreDb();
      if (!db) return res.status(503).json({ error: "Firestore not initialized" });

      let query = db.collection('user_insights').where('userId', '==', userId);
      
      const status = req.query.status as string;
      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.orderBy('timestamp', 'desc').get();

      const insights = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json(insights);
    } catch (error: any) {
      console.error("[API] Error fetching user insights:", error.message);
      res.status(500).json({ error: "Failed to fetch insights" });
    }
  });

  app.post("/api/user-insights", async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decodedToken = await withTimeout(sparkwavvAdmin.auth().verifyIdToken(idToken), 5000);
      const userId = decodedToken.uid;
      const { insight } = req.body;

      if (!insight) {
        return res.status(400).json({ error: "Insight data is required" });
      }

      const db = getFirestoreDb();
      if (!db) return res.status(503).json({ error: "Firestore not initialized" });

      const insightData = {
        ...insight,
        userId,
        timestamp: insight.timestamp || new Date().toISOString()
      };

      let docRef;
      if (insight.id) {
        docRef = db.collection('user_insights').doc(insight.id);
        await docRef.set(insightData, { merge: true });
      } else {
        docRef = await db.collection('user_insights').add(insightData);
      }

      res.json({ success: true, id: docRef.id });
    } catch (error: any) {
      console.error("[API] Error saving user insight:", error.message);
      res.status(500).json({ error: "Failed to save insight" });
    }
  });

  // User Assets API
  app.get("/api/user-assets", async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decodedToken = await withTimeout(sparkwavvAdmin.auth().verifyIdToken(idToken), 5000);
      const userId = decodedToken.uid;
      
      const db = getFirestoreDb();
      if (!db) return res.status(503).json({ error: "Firestore not initialized" });

      const type = req.query.type as string;
      let query = db.collection('user_assets').where('userId', '==', userId);
      
      if (type) {
        query = query.where('type', '==', type);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').get();

      const assets = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json(assets);
    } catch (error: any) {
      console.error("[API] Error fetching user assets:", error.message);
      res.status(500).json({ error: "Failed to fetch assets" });
    }
  });

  app.post("/api/user-assets", async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decodedToken = await withTimeout(sparkwavvAdmin.auth().verifyIdToken(idToken), 5000);
      const userId = decodedToken.uid;
      const { asset } = req.body;

      if (!asset) {
        return res.status(400).json({ error: "Asset data is required" });
      }

      const db = getFirestoreDb();
      if (!db) return res.status(503).json({ error: "Firestore not initialized" });

      const assetData = {
        ...asset,
        userId,
        createdAt: asset.createdAt || new Date().toISOString()
      };

      let docRef;
      if (asset.id) {
        docRef = db.collection('user_assets').doc(asset.id);
        await docRef.set(assetData, { merge: true });
      } else {
        docRef = await db.collection('user_assets').add(assetData);
      }

      res.json({ success: true, id: docRef.id });
    } catch (error: any) {
      console.error("[API] Error saving user asset:", error.message);
      res.status(500).json({ error: "Failed to save asset" });
    }
  });

  // Cinematic Brand Synthesis Endpoints
  app.post("/api/brand/synthesize", requireRole([ROLES.USER, ROLES.ADMIN]), async (req, res) => {
    const { pillars, strengths, skillsCloud } = req.body;
    const userId = (req as any).user.uid;

    try {
      const db = getFirestoreDb();
      if (!db) return res.status(503).json({ error: "Database not available" });

      const secretId = uuidv4(); // Secret URL ID
      const brandData = {
        userId,
        pillars,
        strengths,
        skillsCloud,
        secretId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to a dedicated collection for brand narratives
      await db.collection('brand_narratives').doc(userId).set(brandData);
      
      // Also update the dashboard with the secretId for easy access
      await db.collection('dashboards').doc(userId).set({ brandSecretId: secretId }, { merge: true });

      res.json({ success: true, secretId });
    } catch (error: any) {
      console.error("Error saving brand synthesis:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/brand/public/:secretId", async (req, res) => {
    const { secretId } = req.params;

    try {
      const db = getFirestoreDb();
      if (!db) return res.status(503).json({ error: "Database not available" });

      const snapshot = await db.collection('brand_narratives').where('secretId', '==', secretId).limit(1).get();
      
      if (snapshot.empty) {
        return res.status(404).json({ error: "Brand narrative not found" });
      }

      const brandData = snapshot.docs[0].data();
      
      // Fetch user display name for the public page
      const userDoc = await db.collection('users').doc(brandData.userId).get();
      const userData = userDoc.exists ? userDoc.data() : {};

      res.json({
        ...brandData,
        displayName: userData?.displayName || 'A SPARKWavv Professional'
      });
    } catch (error: any) {
      console.error("Error fetching public brand narrative:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/user/milestones", requireRole([ROLES.USER, ROLES.ADMIN]), async (req, res) => {
    const { milestoneId, completed } = req.body;
    const userId = (req as any).user.uid;

    if (!milestoneId) {
      return res.status(400).json({ error: "Milestone ID is required" });
    }

    try {
      const db = getFirestoreDb();
      if (!db) return res.status(503).json({ error: "Firestore not available" });

      const dashboardRef = db.collection('dashboards').doc(userId);
      const dashboardDoc = await dashboardRef.get();

      if (!dashboardDoc.exists) {
        // If dashboard doesn't exist, we might need to create it or just return error
        // For now, let's try to create a default one if it's missing
        await createDefaultDashboard(db, userId);
        const newDoc = await dashboardRef.get();
        if (!newDoc.exists) return res.status(404).json({ error: "Dashboard not found" });
        
        const milestones = newDoc.data()?.milestones || [];
        const updatedMilestones = milestones.map((m: any) => 
          m.id === milestoneId ? { ...m, completed } : m
        );
        await dashboardRef.update({ milestones: updatedMilestones });
        return res.json({ success: true });
      }

      const dashboardData = dashboardDoc.data();
      const milestones = dashboardData?.milestones || [];
      
      const updatedMilestones = milestones.map((m: any) => 
        m.id === milestoneId ? { ...m, completed } : m
      );

      await dashboardRef.update({ milestones: updatedMilestones });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error updating milestone:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/user/stage", requireRole([ROLES.USER, ROLES.ADMIN]), async (req, res) => {
    const { nextStage } = req.body;
    const userId = (req as any).user.uid;

    if (!nextStage) {
      return res.status(400).json({ error: "Next stage is required" });
    }

    try {
      const db = getFirestoreDb();
      if (!db) return res.status(503).json({ error: "Firestore not available" });

      const batch = db.batch();
      
      const userRef = db.collection('users').doc(userId);
      const dashboardRef = db.collection('dashboards').doc(userId);

      batch.update(userRef, { journeyStage: nextStage });
      batch.update(dashboardRef, { discoveryProgress: nextStage });

      await batch.commit();

      res.json({ success: true, nextStage });
    } catch (error: any) {
      console.error("Error updating journey stage:", error);
      res.status(500).json({ error: error.message });
    }
  });

    // --- Partner Ecosystem Routes ---

    // Public: Apply to join the Partner Program
    app.post("/api/partner/apply", async (req, res) => {
      try {
        const db = getFirestoreDb();
        if (!db) return res.status(503).json({ error: "Database not available" });

        const application = {
          ...req.body,
          id: uuidv4(),
          status: 'pending',
          createdAt: new Date().toISOString()
        };

        await db.collection('partner_applications').doc(application.id).set(application);
        
        // Notify Sparkwavv Admin (Larry)
        const adminEmail = 'larry.culver1226@gmail.com';
        if (process.env.SENDGRID_API_KEY) {
          const msg = {
            to: adminEmail,
            from: process.env.SKYLAR_FROM_EMAIL || 'skylar@sparkwavv.com',
            subject: `New Partner Application: ${application.companyName}`,
            text: `A new partner application has been submitted by ${application.contactName} (${application.contactEmail}) from ${application.companyName}.`,
            html: `<h3>New Partner Application</h3>
                   <p><strong>Company:</strong> ${application.companyName}</p>
                   <p><strong>Contact:</strong> ${application.contactName} (${application.contactEmail})</p>
                   <p><strong>Methodology:</strong> ${application.methodology}</p>
                   <p>View applications in the Admin Dashboard.</p>`
          };
          await sgMail.send(msg);
        }

        res.json({ success: true, id: application.id });
      } catch (error: any) {
        console.error("Error submitting partner application:", error);
        res.status(500).json({ error: error.message });
      }
    });

    // Admin: List partner applications
    app.get("/api/admin/partner-applications", requireRole([ROLES.ADMIN, ROLES.SUPER_ADMIN]), async (req, res) => {
      try {
        const db = getFirestoreDb();
        if (!db) return res.status(503).json({ error: "Database not available" });

        const snapshot = await db.collection('partner_applications').orderBy('createdAt', 'desc').get();
        const applications = snapshot.docs.map((doc: any) => doc.data());
        res.json(applications);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Partner: Propose a change (DNA shift or Milestone)
    app.post("/api/partner/suggestions", requireRole([ROLES.MENTOR, ROLES.ADMIN]), async (req, res) => {
      try {
        const db = getFirestoreDb();
        if (!db) return res.status(503).json({ error: "Database not available" });

        const { userId, type, content } = req.body;
        const partner = (req as any).user;

        // Verify partner has 'propose' permission for this user
        const accessId = `${partner.tenantId}_${userId}`;
        const accessDoc = await db.collection('partner_access').doc(accessId).get();
        
        if (!accessDoc.exists || !accessDoc.data()?.permissions.includes('propose')) {
          return res.status(403).json({ error: "You do not have permission to propose changes for this user." });
        }

        const suggestion = {
          id: uuidv4(),
          userId,
          partnerTenantId: partner.tenantId,
          partnerUid: partner.uid,
          type,
          content,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await db.collection('partner_suggestions').doc(suggestion.id).set(suggestion);

        // Notify User via Email
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (userData?.email && process.env.SENDGRID_API_KEY) {
          const msg = {
            to: userData.email,
            from: process.env.SKYLAR_FROM_EMAIL || 'skylar@sparkwavv.com',
            subject: `New Suggestion from your Partner at ${partner.tenantId}`,
            text: `Hi ${userData.displayName || 'there'},\n\nYour partner has proposed a new ${type.replace('_', ' ')} for your journey. Log in to Sparkwavv to review and accept it.\n\nBest,\nSkylar`,
            html: `<p>Hi ${userData.displayName || 'there'},</p>
                   <p>Your partner has proposed a new <strong>${type.replace('_', ' ')}</strong> for your journey.</p>
                   <p>Log in to Sparkwavv to review and accept it.</p>
                   <p>Best,<br>Skylar</p>`
          };
          await sgMail.send(msg);
        }

        res.json({ success: true, id: suggestion.id });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // User: Get suggestions
    app.get("/api/user/suggestions", async (req, res) => {
      try {
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) return res.status(401).json({ error: "Unauthorized" });
        const decodedToken = await sparkwavvAdmin.auth().verifyIdToken(idToken);

        const db = getFirestoreDb();
        if (!db) return res.status(503).json({ error: "Database not available" });

        const snapshot = await db.collection('partner_suggestions')
          .where('userId', '==', decodedToken.uid)
          .where('status', '==', 'pending')
          .get();
        
        const suggestions = snapshot.docs.map((doc: any) => doc.data());
        res.json(suggestions);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // User: Respond to suggestion
    app.post("/api/user/suggestions/:id/respond", async (req, res) => {
      try {
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) return res.status(401).json({ error: "Unauthorized" });
        const decodedToken = await sparkwavvAdmin.auth().verifyIdToken(idToken);

        const { status, synthesisNote } = req.body;
        const suggestionId = req.params.id;

        const db = getFirestoreDb();
        if (!db) return res.status(503).json({ error: "Database not available" });

        const suggestionRef = db.collection('partner_suggestions').doc(suggestionId);
        const suggestionDoc = await suggestionRef.get();

        if (!suggestionDoc.exists || suggestionDoc.data()?.userId !== decodedToken.uid) {
          return res.status(404).json({ error: "Suggestion not found" });
        }

        const suggestionData = suggestionDoc.data();

        if (status === 'accepted') {
          // 1. Apply the change
          if (suggestionData.type === 'dna_shift') {
            // Update user's DNA attributes or persona
            const { field, value } = suggestionData.content;
            await db.collection('users').doc(decodedToken.uid).update({
              [field]: value,
              updatedAt: new Date().toISOString()
            });
          } else if (suggestionData.type === 'milestone') {
            // Add or update milestone in dashboard
            const dashboardRef = db.collection('dashboards').doc(decodedToken.uid);
            const dashboardDoc = await dashboardRef.get();
            if (dashboardDoc.exists) {
              const milestones = dashboardDoc.data()?.milestones || [];
              const newMilestone = { ...suggestionData.content, id: uuidv4(), completed: false };
              await dashboardRef.update({
                milestones: [...milestones, newMilestone],
                updatedAt: new Date().toISOString()
              });
            }
          }
        }

        await suggestionRef.update({
          status,
          synthesisNote: synthesisNote || null,
          updatedAt: new Date().toISOString()
        });

        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Tenant Branding
    app.get("/api/tenant/:id", async (req, res) => {
      try {
        const db = getFirestoreDb();
        if (!db) return res.status(503).json({ error: "Database not available" });

        const doc = await db.collection('tenants').doc(req.params.id).get();
        if (!doc.exists) return res.status(404).json({ error: "Tenant not found" });

        res.json(doc.data());
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/tenant/:id/settings", requireRole([ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MENTOR]), async (req, res) => {
      try {
        const user = (req as any).user;
        if (user.tenantId !== req.params.id && user.role !== ROLES.SUPER_ADMIN) {
          return res.status(403).json({ error: "Unauthorized to manage this tenant" });
        }

        const db = getFirestoreDb();
        if (!db) return res.status(503).json({ error: "Database not available" });

        await db.collection('tenants').doc(req.params.id).set(req.body, { merge: true });
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Partner: Get client roster
    app.get("/api/partner/clients", requireRole([ROLES.MENTOR, ROLES.ADMIN]), async (req, res) => {
      try {
        const db = getFirestoreDb();
        if (!db) return res.status(503).json({ error: "Database not available" });

        const partner = (req as any).user;
        
        // Get all users associated with this tenant
        const snapshot = await db.collection('users')
          .where('tenantId', '==', partner.tenantId)
          .get();
        
        const clients = snapshot.docs.map((doc: any) => {
          const data = doc.data();
          return {
            uid: data.uid,
            displayName: data.displayName,
            email: data.email,
            journeyStage: data.journeyStage,
            updatedAt: data.updatedAt
          };
        });

        // Also fetch permissions for these clients
        const accessSnapshot = await db.collection('partner_access')
          .where('tenantId', '==', partner.tenantId)
          .get();
        
        const accessMap: Record<string, string[]> = {};
        accessSnapshot.docs.forEach((doc: any) => {
          const data = doc.data();
          accessMap[data.userUid] = data.permissions;
        });

        const clientsWithPermissions = clients.map(client => ({
          ...client,
          permissions: accessMap[client.uid] || ['read'] // Default to read
        }));

        res.json(clientsWithPermissions);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // --- End Partner Ecosystem Routes ---

  // Admin Auth API
  app.get("/api/auth/status", async (req, res) => {
    let firestoreStatus = 'unknown';
    if (isFirebaseAdminConfigured) {
      try {
        const db = getFirestoreDb();
        if (db) {
          await db.collection('health').doc('check').get();
          firestoreStatus = 'connected';
        }
      } catch (error: any) {
        firestoreStatus = error.code === 5 ? 'not_found' : 'error';
      }
    }

    res.json({
      client: !!process.env.VITE_FIREBASE_API_KEY,
      admin: isFirebaseAdminConfigured,
      firestore: firestoreStatus,
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "not set"
    });
  });

  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || "sparkwavv-admin-secure-2026";

    if (password === adminPassword) {
      (req.session as any).isAdmin = true;
      console.log(`[ADMIN] Login successful - session ID: ${req.sessionID}`);
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid password" });
    }
  });

  app.get("/api/admin/check", (req, res) => {
    if ((req.session as any).isAdmin) {
      res.json({ isAdmin: true });
    } else {
      res.json({ isAdmin: false });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false });
      }
      res.json({ success: true });
    });
  });

  // Admin Data API
  app.get("/api/admin/env-status", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]), async (req, res) => {
    const apiKey = getGeminiApiKey();
    const masked = apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : "missing";
    
    res.json({
      ...envStatus,
      GEMINI_API_KEY_MASKED: masked,
      GEMINI_API_KEY_LENGTH: apiKey.length,
      GEMINI_API_KEY_SOURCE: apiKey ? "detected" : "missing"
    });
  });

  app.get("/api/admin/stats", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EDITOR, ROLES.VIEWER]), async (req, res) => {
    let userStats = {
      total: 0,
      active: 0,
      newToday: 0,
      pendingVerification: 0,
    };

    if (isFirebaseAdminConfigured && sparkwavvAdmin) {
      try {
        const listUsersResult = await sparkwavvAdmin.auth().listUsers();
        const authUsers = listUsersResult.users;
        
        // Fetch Firestore users to get journeyStage
        const db = getFirestoreDb();
        let firestoreUsersMap = new Map();
        if (db) {
          const fsSnapshot = await db.collection('users').get();
          fsSnapshot.docs.forEach(doc => firestoreUsersMap.set(doc.id, doc.data()));
        }

        // Count unique users across Auth
        const allUserIds = new Set([
          ...authUsers.map(u => u.uid)
        ]);

        const total = allUserIds.size;
        
        // Verified means emailVerified AND not in Dive-In
        const verified = authUsers.filter(u => {
          const fsData = firestoreUsersMap.get(u.uid);
          const journeyStage = fsData?.journeyStage || 'Dive-In';
          return u.emailVerified && journeyStage !== 'Dive-In';
        }).length;
        
        // Pending means email NOT verified
        const pending = authUsers.filter(u => !u.emailVerified).length;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newToday = authUsers.filter(u => u.metadata.creationTime && new Date(u.metadata.creationTime) >= today).length;

        userStats = {
          total,
          active: verified,
          newToday,
          pendingVerification: pending,
        };
        console.log(`[ADMIN] Stats calculated:`, userStats);
      } catch (error) {
        console.error("Error fetching Firebase users for stats:", error);
      }
    } else {
      // Fallback mock data if Firebase is not configured
      userStats = {
        total: 1240,
        active: 450,
        newToday: 12,
        pendingVerification: 5,
      };
    }

    // Mock data for the dashboard
    const statsResponse = {
      resources: {
        cpuUsage: 42,
        memoryUsage: 65,
        storageUsage: 28,
        networkTraffic: 120, // MB/s
      },
      users: userStats,
      content: {
        totalPosts: 5420,
        flagged: 8,
        pendingReview: 15,
      },
      system: {
        status: "Healthy",
        uptime: "14 days, 6 hours",
        lastBackup: "2 hours ago",
      },
      engagement: {
        avgSessionDuration: "12m 45s",
        bounceRate: "24.5%",
        retentionRate: "68%",
        topModules: [
          { name: "Skylar Discovery", views: 1240, engagement: 85 },
          { name: "Wavvault Storage", views: 850, engagement: 62 },
          { name: "Brand Ignition", views: 920, engagement: 78 }
        ]
      },
      sentiment: {
        positive: 72,
        neutral: 22,
        negative: 6,
        trends: [
          { day: "Mon", score: 65 },
          { day: "Tue", score: 68 },
          { day: "Wed", score: 75 },
          { day: "Thu", score: 72 },
          { day: "Fri", score: 80 },
          { day: "Sat", score: 85 },
          { day: "Sun", score: 82 }
        ]
      }
    };
    res.json(statsResponse);
  });

  app.get("/api/admin/users", requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EDITOR, ROLES.VIEWER, ROLES.OPERATOR]), async (req, res) => {
    if (!isFirebaseAdminConfigured) {
      return res.json({ users: [] });
    }

    try {
      if (!sparkwavvAdmin) throw new Error("Sparkwavv Admin not initialized");
      const listUsersResult = await sparkwavvAdmin.auth().listUsers();
      console.log(`[ADMIN] Fetched ${listUsersResult.users.length} users from Firebase.`);
      const users = listUsersResult.users.map(u => ({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName || u.email?.split('@')[0] || 'Unknown User',
        emailVerified: u.emailVerified,
        creationTime: u.metadata.creationTime,
        lastSignInTime: u.metadata.lastSignInTime,
      }));
      res.json({ users });
    } catch (error: any) {
      console.error("Error fetching Firebase users list:", error);
      res.status(500).json({ error: "Failed to fetch users", details: error.message });
    }
  });

  // LinkedIn OAuth Routes
  app.get('/api/auth/linkedin/url', (req, res) => {
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    const redirectUri = `${appUrl}/auth/linkedin/callback`;
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.LINKEDIN_CLIENT_ID || '',
      redirect_uri: redirectUri,
      state: uuidv4(),
      scope: 'openid profile email',
    });

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
    res.json({ url: authUrl });
  });

  app.get(['/auth/linkedin/callback', '/auth/linkedin/callback/'], async (req, res) => {
    const { code, error, error_description } = req.query;

    if (error) {
      return res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${error_description || error}' }, '*');
                window.close();
              }
            </script>
            <p>Authentication error: ${error_description || error}</p>
          </body>
        </html>
      `);
    }

    if (!code) {
      return res.status(400).send('No code provided');
    }

    try {
      const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
      const redirectUri = `${appUrl}/auth/linkedin/callback`;

      // Exchange code for access token
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: redirectUri,
          client_id: process.env.LINKEDIN_CLIENT_ID || '',
          client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange code');
      }

      // Fetch user profile from LinkedIn
      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
      });

      const profileData = await profileResponse.json();
      
      // Automatic Linking/Login with Firebase
      let firebaseCustomToken = null;
      if (isFirebaseAdminConfigured && sparkwavvAdmin && profileData.email) {
        try {
          let userRecord;
          try {
            userRecord = await sparkwavvAdmin.auth().getUserByEmail(profileData.email);
          } catch (e: any) {
            if (e.code === 'auth/user-not-found') {
              // Create new user if doesn't exist
              userRecord = await sparkwavvAdmin.auth().createUser({
                email: profileData.email,
                displayName: profileData.name,
                photoURL: profileData.picture,
                emailVerified: true,
              });
            } else {
              throw e;
            }
          }

          // Update Firestore profile with LinkedIn info
          const db = getFirestoreDb();
          if (db) {
            await db.collection('users').doc(userRecord.uid).set({
              linkedinId: profileData.sub,
              linkedinProfile: profileData,
              photoURL: profileData.picture || userRecord.photoURL,
              displayName: profileData.name || userRecord.displayName,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
          }

          // Generate custom token for login
          firebaseCustomToken = await sparkwavvAdmin.auth().createCustomToken(userRecord.uid);
        } catch (authErr) {
          console.error('Error linking LinkedIn to Firebase:', authErr);
        }
      }

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  provider: 'linkedin',
                  token: ${firebaseCustomToken ? `'${firebaseCustomToken}'` : 'null'}
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error('LinkedIn OAuth Error:', err);
      res.status(500).send(`Authentication failed: ${err.message}`);
    }
  });

  // API 404 catch-all
  app.all("/api/*", (req, res) => {
    console.log(`[API] 404 - ${req.method} ${req.url}`);
    res.status(404).json({ error: "API route not found" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log('Starting Vite server...');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: "spa",
    });
    console.log('Vite server created.');
    app.use(vite.middlewares);
    console.log('Vite middlewares attached.');
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  console.log(`Attempting to listen on port ${PORT}...`);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Schedule Wavvault sync every 24 hours (Track B)
    setInterval(() => {
      console.log('Running scheduled 24-hour Wavvault sync to Vertex AI Search...');
      syncWavvaultToVertex().catch(err => console.error('Scheduled sync failed:', err));
    }, 24 * 60 * 60 * 1000);
  });
}

startServer();
