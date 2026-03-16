import express from "express";
import { createServer as createViteServer } from "vite";
import session from "express-session";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import sgMail from "@sendgrid/mail";
import { CONFIRMED_USERS, MOCK_PROGRAMS, MOCK_COHORTS, MOCK_JOURNEYS } from './src/mockDatabase';
import { writeUserWavvault, writeArtifact, searchSimilarWavvaults, getStorageMetrics, purgeOldArtifacts } from './src/services/wavvaultService';
import { logEvent } from './src/services/loggingService';
import { ROLES, JOURNEY_STAGES, TENANTS } from './src/constants';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DASHBOARD_DATA_FILE = path.join(__dirname, 'user-dashboards.json');

// RBAC Roles
// Using imported ROLES from constants

let isFirestoreInitialized = true;

async function getDashboard(db_unused: any, userId: string) {
  if (!isFirebaseAdminConfigured || !userId || !isFirestoreInitialized) {
    return null;
  }

  const db = getFirestoreDb();
  if (!db) return null;

  try {
    const doc = await withTimeout(db.collection('dashboards').doc(userId).get());
    return doc.exists ? doc.data() : null;
  } catch (error: any) {
    if (error.message === 'Firestore operation timed out') {
      console.error(`[FIRESTORE] Timeout getting dashboard for ${userId}`);
      return null;
    }
    if (error.code === 5) {
      console.warn("Firestore Error 5 (NOT_FOUND): Database not initialized. Falling back to in-memory defaults.");
      isFirestoreInitialized = false;
      return null;
    }
    console.error(`Error getting dashboard for ${userId}:`, error.message || error);
    return null;
  }
}

async function saveDashboard(db_unused: any, userId: string, data: any) {
  if (!isFirebaseAdminConfigured || !isFirestoreInitialized || !userId) {
    return false;
  }
  const db = getFirestoreDb();
  if (!db) return false;
  
  try {
    // 1. Save to dashboards collection
    await withTimeout(db.collection('dashboards').doc(userId).set(data, { merge: true }));
    
    // 2. If discoveryProgress is provided, sync it to journeyStage in users collection
    if (data.discoveryProgress) {
      await withTimeout(db.collection('users').doc(userId).set({
        journeyStage: data.discoveryProgress
      }, { merge: true }));
    }
    
    return true;
  } catch (error: any) {
    if (error.message === 'Firestore operation timed out') {
      console.error(`[FIRESTORE] Timeout saving dashboard for ${userId}`);
      return false;
    }
    if (error.code === 5) {
      console.warn("Firestore Error 5 (NOT_FOUND): Database not initialized. Persistence disabled.");
      isFirestoreInitialized = false;
      return false;
    }
    console.error(`Error saving dashboard for ${userId}:`, error.message || error);
    return false;
  }
}

async function logSecurityEvent(
  db_unused: any,
  actor: { uid: string; email: string; role: string },
  actionType: string,
  severity: 'INFO' | 'WARNING' | 'CRITICAL',
  target?: { uid: string; email: string },
  details: any = {},
  ipAddress: string = 'unknown'
) {
  if (!isFirebaseAdminConfigured || !isFirestoreInitialized) return;
  const db = getFirestoreDb();
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

async function createDefaultDashboard(db_unused: any, userId: string, initialStage: string = 'Ignition') {
  const db = getFirestoreDb();
  if (!db) return;
  const defaultDashboard = {
    userId,
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
      { id: 'ledger', label: 'Accomplishment Ledger', completed: false, week: 1 },
      { id: 'stories', label: 'Five Stories', completed: false, week: 2 },
      { id: 'heroic', label: 'Heroic Deed', completed: false, week: 3 },
      { id: 'vault', label: 'Attribute Vault', completed: false, week: 4 },
      { id: 'questions', label: '21 Questions', completed: false, week: 5 },
      { id: 'prioritize', label: 'Prioritize Exercise', completed: false, week: 6 },
      { id: 'pie', label: 'Pie of Life', completed: false, week: 7 },
      { id: 'perfect', label: 'Perfect Day', completed: false, week: 8 },
      { id: 'extinguishers', label: 'Extinguishers', completed: false, week: 9 },
      { id: 'launchpad', label: 'Discovery Launchpad', completed: false, week: 10 },
      { id: 'branding', label: 'Branding Synthesis', completed: false, week: 11 },
      { id: 'matching', label: 'Triple-Factor Match', completed: false, week: 12 }
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

async function migrateMockUsersToFirestore(db: admin.firestore.Firestore) {
  try {
    const usersCollection = db.collection('users');
    const dashboardsCollection = db.collection('dashboards');
    
    // Check if migration already happened
    const snapshot = await usersCollection.where('migratedFromMock', '==', true).limit(1).get();
    if (!snapshot.empty) {
      console.log("[MIGRATION] Mock users already migrated.");
      return;
    }

    const batch = db.batch();
    let count = 0;

    for (const user of CONFIRMED_USERS) {
      const userRef = usersCollection.doc(user.userId);
      const dashboardRef = dashboardsCollection.doc(user.userId);

      batch.set(userRef, {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: ROLES.USER,
        jobTitle: user.jobTitle,
        companyOrg: user.companyOrg,
        programTrack: user.programTrack,
        lifecycleStage: user.lifecycleStage,
        outcomesAttributes: user.outcomesAttributes,
        feedbackQuote: user.feedbackQuote,
        userId: user.userId,
        tenantId: user.tenantId || 'sparkwavv',
        generationalPersona: user.generationalPersona,
        careerStageRole: user.careerStageRole,
        hierarchicalRole: user.hierarchicalRole,
        brandPersona: user.brandPersona,
        brandDNAAttributes: user.brandDNAAttributes,
        journeyStage: user.journeyStage || 'Dive-In',
        migratedFromMock: true
      }, { merge: true });

      batch.set(dashboardRef, {
        userId: user.userId,
        tenantId: user.tenantId || 'sparkwavv',
        careerHappiness: Math.floor(Math.random() * 20) + 75,
        strengths: [
          { name: "Empathetic Listener", value: 92 },
          { name: "Strategic Thinker", value: 85 },
          { name: "Continuous Learner", value: 78 },
          { name: "Collaborative Leader", value: 91 }
        ],
        discoveryProgress: user.journeyStage || 'Dive-In',
        resumeStatus: "Resume Process: Completed",
        careerProfileStatus: "Career Profile: Optimized",
        jobMatches: [
          { title: user.jobTitle, company: user.companyOrg || "SPARKWavv Partner", matchScore: 98 }
        ],
        aiCompanion: {
          name: "Skylar",
          status: "Online",
          message: `Hello ${user.firstName}! I've analyzed your ${user.jobTitle} profile.`
        }
      }, { merge: true });

      count++;
    }

    await batch.commit();
    console.log(`[MIGRATION] Successfully migrated ${count} mock users to Firestore.`);

    // Migrate Programs
    const programsCollection = db.collection('programs');
    const programsSnapshot = await programsCollection.limit(1).get();
    if (programsSnapshot.empty) {
      const pBatch = db.batch();
      MOCK_PROGRAMS.forEach(p => {
        pBatch.set(programsCollection.doc(p.id), p);
      });
      await pBatch.commit();
      console.log(`[MIGRATION] Successfully migrated ${MOCK_PROGRAMS.length} mock programs.`);
    }

    // Migrate Cohorts
    const cohortsCollection = db.collection('cohorts');
    const cohortsSnapshot = await cohortsCollection.limit(1).get();
    if (cohortsSnapshot.empty) {
      const cBatch = db.batch();
      MOCK_COHORTS.forEach(c => {
        const data = {
          ...c,
          startDate: admin.firestore.Timestamp.fromDate(new Date(c.startDate)),
          endDate: admin.firestore.Timestamp.fromDate(new Date(c.endDate))
        };
        cBatch.set(cohortsCollection.doc(c.id), data);
      });
      await cBatch.commit();
      console.log(`[MIGRATION] Successfully migrated ${MOCK_COHORTS.length} mock cohorts.`);
    }

    // Migrate Journeys
    const journeysCollection = db.collection('journeys');
    const journeysSnapshot = await journeysCollection.limit(1).get();
    if (journeysSnapshot.empty) {
      const jBatch = db.batch();
      MOCK_JOURNEYS.forEach(j => {
        const data = {
          ...j,
          startedAt: admin.firestore.Timestamp.fromDate(new Date(j.startedAt)),
          completedAt: j.completedAt ? admin.firestore.Timestamp.fromDate(new Date(j.completedAt)) : null,
          steps: j.steps.map(s => ({
            ...s,
            completedAt: s.completedAt ? admin.firestore.Timestamp.fromDate(new Date(s.completedAt)) : null
          }))
        };
        jBatch.set(journeysCollection.doc(j.id), data);
      });
      await jBatch.commit();
      console.log(`[MIGRATION] Successfully migrated ${MOCK_JOURNEYS.length} mock journeys.`);
    }
  } catch (error) {
    console.error("[MIGRATION] Error migrating mock users:", error);
  }
}

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

try {
  const configPath = path.join(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseAppletConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (error) {
  console.warn("Could not read firebase-applet-config.json:", error);
}

try {
  const projectId = firebaseAppletConfig.projectId || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || firebaseAppletConfig.clientEmail;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY || firebaseAppletConfig.privateKey;

  if (projectId && clientEmail && privateKey) {
    // Check for project ID mismatch
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PROJECT_ID !== firebaseAppletConfig.projectId) {
      console.warn(`[AUTH] Project ID mismatch! Env: ${process.env.FIREBASE_PROJECT_ID}, Config: ${firebaseAppletConfig.projectId}. Using Config.`);
    }
    
    // Check for client email mismatch
    if (clientEmail.includes(process.env.FIREBASE_PROJECT_ID || '')) {
       if (process.env.FIREBASE_PROJECT_ID !== firebaseAppletConfig.projectId) {
         console.warn(`[AUTH] Client email (${clientEmail}) likely belongs to the WRONG project (${process.env.FIREBASE_PROJECT_ID}). Expected: ${firebaseAppletConfig.projectId}`);
       }
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    isFirebaseAdminConfigured = true;
    console.log("Firebase Admin initialized successfully for project:", projectId);
  } else {
    console.warn("Firebase Admin credentials missing. Backend auth features will be limited.");
    console.log("Missing:", {
      projectId: !projectId,
      clientEmail: !clientEmail,
      privateKey: !privateKey
    });
  }
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
}

// Function to get Firestore instance with correct database ID
function getFirestoreDb() {
  if (!isFirebaseAdminConfigured) return null;
  // Use database ID from config if available, otherwise default
  const databaseId = firebaseAppletConfig.firestoreDatabaseId;
  try {
    const firestore = databaseId ? getFirestore(admin.app(), databaseId) : getFirestore(admin.app());
    return firestore;
  } catch (e) {
    console.error("[FIRESTORE] Failed to get Firestore instance:", e);
    return null;
  }
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
const envStatus = {
  VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY || '',
  VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || '',
  VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID || '',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'PRESENT' : 'MISSING',
  USER_COUNT: 0,
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  if (isFirebaseAdminConfigured) {
    try {
      const listUsersResult = await admin.auth().listUsers();
      envStatus.USER_COUNT = listUsersResult.users.length;
    } catch (error) {
      console.error("Error fetching user count for diagnostics:", error);
    }
  }

  console.log("[ENV STATUS]", envStatus);
  try {
    fs.writeFileSync(path.join(__dirname, 'env-status.json'), JSON.stringify(envStatus, null, 2));
  } catch (e) {
    console.error("Failed to write env-status.json:", e);
  }

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

  const requireRole = (roles: string[]) => {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      const isMockRequest = req.headers['x-mock-user'] === 'true';

      if (isMockRequest && idToken === 'mock-token') {
        const userId = req.query.userId as string;
        if (userId) {
          (req as any).user = { uid: userId, role: ROLES.USER, email: `${userId}@mock.com` };
          return next();
        }
      }

      if (!idToken) {
        if ((req.session as any).isAdmin && roles.includes(ROLES.ADMIN)) return next();
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (!isFirebaseAdminConfigured) {
        return res.status(503).json({ error: "Firebase Admin not configured" });
      }
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        
        // Admin override check
        let role: string = ROLES.USER;
        if (decodedToken.email === 'larry.culver1226@gmail.com') {
          role = ROLES.ADMIN;
        } else {
          try {
            const db = getFirestoreDb();
            if (db) {
              const userDoc = await db.collection('users').doc(decodedToken.uid).get();
              role = userDoc.exists ? (userDoc.data()?.role || ROLES.USER) : ROLES.USER;
            }
          } catch (fsError) {
            console.warn("[AUTH] Firestore role check failed, defaulting to USER role.");
            role = ROLES.USER;
          }
        }
        
        if (roles.includes(role)) {
          (req as any).user = { ...decodedToken, role };
          return next();
        }
        res.status(403).json({ error: "Forbidden" });
      } catch (error) {
        res.status(401).json({ error: "Invalid token" });
      }
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
      migrateMockUsersToFirestore(db);
    }

    // Manual promotion for larry.culver1226@gmail.com
    const promoteSpecificUser = async (email: string) => {
      try {
        const userRecord = await admin.auth().getUserByEmail(email);
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
        await admin.auth().updateUser(uid, {
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

    // Configure SendGrid
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    } else {
      console.warn("[SENDGRID] API Key missing. Email features will be simulated.");
    }

    const getUserRole = async (uid: string) => {
      try {
        // Hardcoded override for the primary admin email
        const userRecord = await admin.auth().getUser(uid);
        if (userRecord.email === 'larry.culver1226@gmail.com') {
          // Ensure admin has journeyStage: NONE
          await db.collection('users').doc(uid).set({ journeyStage: 'NONE' }, { merge: true });
          return ROLES.ADMIN;
        }

        const userDoc = await db.collection('users').doc(uid).get();
        return userDoc.exists ? (userDoc.data()?.role || ROLES.USER) : ROLES.USER;
      } catch (error) {
        // Even in error state, check if this is the admin UID
        try {
          const userRecord = await admin.auth().getUser(uid);
          if (userRecord.email === 'larry.culver1226@gmail.com') return ROLES.ADMIN;
        } catch (e) {}
        return ROLES.USER;
      }
    };

    const setUserRole = async (uid: string, role: string) => {
      try {
        await db.collection('users').doc(uid).set({ role }, { merge: true });
        return true;
      } catch (error) {
        return false;
      }
    };

    app.post("/api/admin/login-v2", async (req, res) => {
      const { idToken } = req.body;
      try {
        if (!isFirebaseAdminConfigured) {
          console.error("[AUTH] Admin SDK not configured");
          return res.status(500).json({ success: false, error: "Server auth misconfigured" });
        }
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const role = await getUserRole(decodedToken.uid);
        if (role === ROLES.ADMIN) {
          (req.session as any).isAdmin = true;
          (req.session as any).uid = decodedToken.uid;
          await logEvent('INFO', 'AUTH', `Admin login successful: ${decodedToken.email}`, { uid: decodedToken.uid });
          res.json({ success: true, role });
        } else {
          console.warn(`[AUTH] Non-admin login attempt: ${decodedToken.email} (Role: ${role})`);
          await logEvent('WARN', 'AUTH', `Unauthorized admin login attempt: ${decodedToken.email}`);
          res.status(403).json({ success: false, message: "Not an admin" });
        }
      } catch (error: any) {
        console.error("[AUTH] Token verification failed:", error.message || error);
        await logEvent('ERROR', 'AUTH', `Login failed: ${error.message}`);
        res.status(401).json({ success: false, error: error.message });
      }
    });

    app.get("/api/admin/storage/metrics", requireRole([ROLES.ADMIN]), async (req, res) => {
      try {
        const metrics = await getStorageMetrics();
        res.json(metrics);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/admin/storage/purge", requireRole([ROLES.ADMIN]), async (req, res) => {
      try {
        const result = await purgeOldArtifacts();
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/admin/set-role", requireRole([ROLES.ADMIN]), async (req, res) => {
      const { uid, role } = req.body;
      const success = await setUserRole(uid, role);
      res.json({ success });
    });

    app.post("/api/admin/set-validation-gate", requireRole([ROLES.ADMIN]), async (req, res) => {
      const { userId, mode } = req.body;
      try {
        await db.collection('dashboards').doc(userId).set({ validationGateMode: mode }, { merge: true });
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to update validation gate" });
      }
    });

    app.post("/api/admin/create-user", requireRole([ROLES.ADMIN]), async (req, res) => {
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
        const userRecord = await admin.auth().createUser({
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
          tenantId: tenantId || 'sparkwavv',
          generationalPersona,
          careerStageRole,
          hierarchicalRole,
          brandPersona,
          brandDNAAttributes,
          createdAt: new Date().toISOString(),
        });

        // Also create a dashboard for the user to ensure 1:1 mapping
        await db.collection('dashboards').doc(userRecord.uid).set({
          userId: userRecord.uid,
          sparkwavvId,
          tenantId: tenantId || 'sparkwavv',
          careerHappiness: 50,
          discoveryProgress: '0%',
          createdAt: new Date().toISOString(),
        });

        await logSecurityEvent(db, actor, 'USER_CREATE', 'INFO', { uid: userRecord.uid, email }, { role: role || ROLES.USER }, req.ip);

        res.json({ success: true, uid: userRecord.uid });
      } catch (error: any) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/admin/update-user", requireRole([ROLES.ADMIN]), async (req, res) => {
      const { 
        uid, 
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
        const userDoc = await db.collection('users').doc(uid).get();
        const oldData = userDoc.data();
        
        const updateData: any = {};
        if (displayName) updateData.displayName = displayName;
        if (role) updateData.role = role;
        if (journeyStage) updateData.journeyStage = journeyStage;
        if (tenantId) updateData.tenantId = tenantId;
        if (generationalPersona) updateData.generationalPersona = generationalPersona;
        if (careerStageRole) updateData.careerStageRole = careerStageRole;
        if (hierarchicalRole) updateData.hierarchicalRole = hierarchicalRole;
        if (brandPersona) updateData.brandPersona = brandPersona;
        if (brandDNAAttributes) updateData.brandDNAAttributes = brandDNAAttributes;

        await db.collection('users').doc(uid).set(updateData, { merge: true });
        
        // Also update Auth display name if provided
        if (displayName) {
          await admin.auth().updateUser(uid, { displayName });
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

    app.post("/api/admin/delete-user", requireRole([ROLES.ADMIN]), async (req, res) => {
      const { uid } = req.body;
      const actor = (req as any).user;
      try {
        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.data();
        
        await admin.auth().deleteUser(uid);
        await db.collection('users').doc(uid).delete();

        await logSecurityEvent(db, actor, 'USER_DELETE', 'CRITICAL', { uid, email: userData?.email || 'unknown' }, {}, req.ip);

        res.json({ success: true });
      } catch (error: any) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: error.message });
      }
    });

    // Programs & Cohorts APIs
    app.get("/api/admin/programs", requireRole([ROLES.ADMIN, ROLES.OPERATOR]), async (req, res) => {
      try {
        const snapshot = await db.collection('programs').get();
        const programs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(programs);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get("/api/admin/cohorts", requireRole([ROLES.ADMIN, ROLES.OPERATOR]), async (req, res) => {
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

    app.get("/api/admin/journeys", requireRole([ROLES.ADMIN, ROLES.OPERATOR]), async (req, res) => {
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

    app.get("/api/admin/security-logs", requireRole([ROLES.ADMIN, ROLES.OPERATOR]), async (req, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;
        
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

    app.get("/api/admin/flagged-content", requireRole([ROLES.ADMIN, ROLES.OPERATOR]), async (req, res) => {
      if (!isFirebaseAdminConfigured) {
        return res.json({ content: [] });
      }
      try {
        const db = getFirestoreDb();
        if (!db) return res.status(503).json({ error: "Firestore not initialized" });
        
        const snapshot = await db.collection('flagged_content').orderBy('timestamp', 'desc').limit(50).get();
        const content = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ content });
      } catch (error: any) {
        console.error("Error fetching flagged content:", error);
        res.status(500).json({ error: "Failed to fetch flagged content", details: error.message });
      }
    });

    app.get("/api/admin/users-v2", requireRole([ROLES.ADMIN, ROLES.OPERATOR]), async (req, res) => {
      try {
        // 1. Get all users from Firebase Auth
        const listUsersResult = await admin.auth().listUsers();
        const authUsers = await Promise.all(listUsersResult.users.map(async (u) => ({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName || u.email?.split('@')[0],
          role: await getUserRole(u.uid),
          emailVerified: u.emailVerified,
          creationTime: u.metadata.creationTime,
          source: 'auth'
        })));

        // 2. Get all users from Firestore (with safety catch)
        let firestoreUsers: any[] = [];
        try {
          const firestoreUsersSnapshot = await db.collection('users').get();
          firestoreUsers = firestoreUsersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              uid: doc.id,
              email: data.email,
              displayName: data.displayName || (data.firstName ? `${data.firstName} ${data.lastName}` : (data.email?.split('@')[0] || doc.id)),
              role: data.role || ROLES.USER,
              journeyStage: data.journeyStage || 'Dive-In',
              emailVerified: true,
              creationTime: data.createdAt || new Date().toISOString(),
              source: 'firestore',
              ...data
            };
          });
        } catch (fsError: any) {
          console.warn("[FIRESTORE] Could not fetch users from Firestore (likely uninitialized):", fsError.message);
          // Continue with just auth users
        }

        // 3. Merge them with Mock Users
        const mergedUsersMap = new Map();
        
        // Add Mock Users first as base
        CONFIRMED_USERS.forEach(u => {
          mergedUsersMap.set(u.userId, {
            uid: u.userId,
            email: u.email,
            displayName: `${u.firstName} ${u.lastName}`,
            role: ROLES.USER,
            journeyStage: u.journeyStage || 'Dive-In',
            emailVerified: true,
            creationTime: new Date().toISOString(),
            source: 'mock',
            ...u
          });
        });

        authUsers.forEach(u => mergedUsersMap.set(u.uid, { ...mergedUsersMap.get(u.uid), ...u, source: mergedUsersMap.has(u.uid) ? 'both' : 'auth' }));
        
        firestoreUsers.forEach(u => {
          if (mergedUsersMap.has(u.uid)) {
            const existing = mergedUsersMap.get(u.uid);
            // Merge carefully to avoid overwriting with undefined/null
            const merged = { ...existing };
            Object.keys(u).forEach(key => {
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

        res.json({ users: Array.from(mergedUsersMap.values()) });
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
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        await setUserRole(decodedToken.uid, ROLES.ADMIN);
        res.json({ success: true });
      } catch (error) {
        res.status(401).json({ error: "Invalid token" });
      }
    });

    app.post("/api/user/init-role", async (req, res) => {
      const { idToken, userId, email, firstName, lastName } = req.body;
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userEmail = email || decodedToken.email;
        const displayName = firstName && lastName ? `${firstName} ${lastName}` : (decodedToken.name || userEmail?.split('@')[0]);

        await db.collection('users').doc(decodedToken.uid).set({ 
          role: ROLES.USER,
          journeyStage: 'Dive-In',
          userId: userId || decodedToken.email,
          email: userEmail,
          firstName: firstName || '',
          lastName: lastName || '',
          displayName: displayName || '',
          createdAt: new Date().toISOString()
        }, { merge: true });
        res.json({ success: true });
      } catch (error) {
        console.error("Error in init-role:", error);
        res.status(401).json({ success: false });
      }
    });

    app.get("/api/user/profile", async (req, res) => {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: "Unauthorized" });
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        if (userDoc.exists) {
          res.json(userDoc.data());
        } else {
          res.status(404).json({ error: "User not found" });
        }
      } catch (error) {
        res.status(401).json({ error: "Invalid token" });
      }
    });

    app.get("/api/user/wavvault-status", async (req, res) => {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: "Unauthorized" });
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const wavvaultDoc = await db.collection('wavvault').doc(decodedToken.uid).get();
        res.json({ exists: wavvaultDoc.exists });
      } catch (error) {
        res.status(401).json({ error: "Invalid token" });
      }
    });

    // Wavvault Hybrid Data Access Routes
    app.post("/api/wavvault/user", async (req, res) => {
      try {
        const result = await writeUserWavvault(req.body);
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/wavvault/artifact", async (req, res) => {
      try {
        const result = await writeArtifact(req.body);
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get("/api/wavvault/search", async (req, res) => {
      const { q, limit } = req.query;
      if (!q) return res.status(400).json({ error: "Query string 'q' is required" });
      try {
        const result = await searchSimilarWavvaults(q as string, limit ? parseInt(limit as string) : 5);
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get("/api/wavvault/chat", async (req, res) => {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: "UserId is required" });
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

    app.post("/api/wavvault/chat", async (req, res) => {
      const { userId, history } = req.body;
      if (!userId || !history) return res.status(400).json({ error: "UserId and history are required" });
      try {
        await db.collection('wavvault').doc(userId).set({ chatHistory: history }, { merge: true });
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
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
    const isMockRequest = req.headers['x-mock-user'] === 'true';

    if (isMockRequest && idToken === 'mock-token') {
      const requestedUserId = req.query.userId as string;
      if (requestedUserId) {
        const db = getFirestoreDb();
        if (!db) return res.status(503).json({ error: "Firestore not initialized" });
        
        // Even for mock requests, try to get the authoritative stage if it exists in Firestore
        let authoritativeStage = 'Ignition';
        let userDisplayName = '';
        try {
          const userDoc = await withTimeout(db.collection('users').doc(requestedUserId).get(), 2000);
          if (userDoc.exists) {
            const userData = userDoc.data();
            authoritativeStage = userData?.journeyStage || 'Ignition';
            userDisplayName = userData?.displayName || (userData?.firstName ? `${userData.firstName} ${userData.lastName}` : '');
          } else {
            // Fallback to mock database if not in Firestore
            const mockUser = CONFIRMED_USERS.find(u => u.userId === requestedUserId);
            if (mockUser) {
              authoritativeStage = mockUser.journeyStage || 'Ignition';
              userDisplayName = `${mockUser.firstName} ${mockUser.lastName}`;
            }
          }
        } catch (e) {
          const mockUser = CONFIRMED_USERS.find(u => u.userId === requestedUserId);
          if (mockUser) {
            authoritativeStage = mockUser.journeyStage || 'Ignition';
            userDisplayName = `${mockUser.firstName} ${mockUser.lastName}`;
          }
        }

        let dashboard = await getDashboard(db, requestedUserId);
        if (!dashboard) dashboard = await createDefaultDashboard(db, requestedUserId, authoritativeStage);
        
        const dynamicScores = calculateDynamicScores({ ...dashboard, discoveryProgress: authoritativeStage });

        return res.json({ 
          ...dashboard, 
          ...dynamicScores,
          displayName: userDisplayName || dashboard.displayName,
          discoveryProgress: authoritativeStage,
          _persistenceStatus: 'mock' 
        });
      }
    }

    if (!idToken) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      let userId = decodedToken.uid;
      
      if (!isFirebaseAdminConfigured) {
        return res.status(503).json({ error: "Firebase Admin not configured" });
      }

      const db = getFirestoreDb();
      if (!db) return res.status(503).json({ error: "Firestore not initialized" });
      
      // Allow admins to view other user dashboards via query param
      const requestedUserId = req.query.userId as string;
      if (requestedUserId && requestedUserId !== userId) {
        try {
          // Use a timeout for the role check too
          const userDoc = await withTimeout(db.collection('users').doc(userId).get(), 3000);
          const role = userDoc.exists ? (userDoc.data()?.role || ROLES.USER) : ROLES.USER;
          if (role === ROLES.ADMIN) {
            userId = requestedUserId;
          } else {
            return res.status(403).json({ error: "Forbidden" });
          }
        } catch (e: any) {
          console.warn("[API] Dashboard role check failed or timed out:", e.message);
          if (e.code === 5) isFirestoreInitialized = false;
          // If firestore fails or times out, we just use the logged in user's ID
        }
      }

      // Fetch user profile first to get the authoritative journeyStage and displayName
      let authoritativeStage = 'Ignition';
      let userDisplayName = '';
      try {
        const userDoc = await withTimeout(db.collection('users').doc(userId).get(), 3000);
        if (userDoc.exists) {
          const userData = userDoc.data();
          authoritativeStage = userData?.journeyStage || 'Ignition';
          userDisplayName = userData?.displayName || (userData?.firstName ? `${userData.firstName} ${userData.lastName}` : '');
        }
        
        // Fallback to decoded token if still empty
        if (!userDisplayName && decodedToken) {
          userDisplayName = decodedToken.name || decodedToken.email?.split('@')[0] || 'User';
        }
      } catch (e) {
        console.warn("[API] Failed to fetch user profile for stage sync:", e);
      }

      let dashboard = await getDashboard(db, userId);

      if (!dashboard) {
        dashboard = await createDefaultDashboard(db, userId, authoritativeStage);
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
      const decodedToken = await admin.auth().verifyIdToken(idToken);
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
  app.get("/api/admin/env-status", requireRole([ROLES.ADMIN]), async (req, res) => {
    res.json(envStatus);
  });

  app.get("/api/admin/stats", requireRole([ROLES.ADMIN]), async (req, res) => {
    let userStats = {
      total: 0,
      active: 0,
      newToday: 0,
      pendingVerification: 0,
    };

    if (isFirebaseAdminConfigured) {
      try {
        const listUsersResult = await admin.auth().listUsers();
        const authUsers = listUsersResult.users;
        
        // Count unique users across Auth and Mock
        const allUserIds = new Set([
          ...authUsers.map(u => u.uid),
          ...CONFIRMED_USERS.map(u => u.userId)
        ]);

        const total = allUserIds.size;
        const verified = authUsers.filter(u => u.emailVerified).length + CONFIRMED_USERS.length;
        const pending = Math.max(0, total - verified);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newToday = authUsers.filter(u => u.metadata.creationTime && new Date(u.metadata.creationTime) >= today).length;

        userStats = {
          total,
          active: verified,
          newToday,
          pendingVerification: pending,
        };
        console.log(`[ADMIN] Stats calculated (including mock):`, userStats);
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

  app.get("/api/admin/users", requireRole([ROLES.ADMIN, ROLES.OPERATOR]), async (req, res) => {
    if (!isFirebaseAdminConfigured) {
      return res.json({ users: [] });
    }

    try {
      const listUsersResult = await admin.auth().listUsers();
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
      if (isFirebaseAdminConfigured && profileData.email) {
        try {
          let userRecord;
          try {
            userRecord = await admin.auth().getUserByEmail(profileData.email);
          } catch (e: any) {
            if (e.code === 'auth/user-not-found') {
              // Create new user if doesn't exist
              userRecord = await admin.auth().createUser({
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
          firebaseCustomToken = await admin.auth().createCustomToken(userRecord.uid);
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
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
