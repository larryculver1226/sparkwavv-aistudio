import express from "express";
import { createServer as createViteServer } from "vite";
import session from "express-session";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import admin from "firebase-admin";
import fs from "fs";
import { writeUserWavvault, writeArtifact, searchSimilarWavvaults } from './src/services/wavvaultService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DASHBOARD_DATA_FILE = path.join(__dirname, 'user-dashboards.json');

// RBAC Roles
const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  OPERATOR: 'operator',
  MENTOR: 'mentor',
  AGENT: 'agent'
};

// Ensure the dashboard data file exists
if (!fs.existsSync(DASHBOARD_DATA_FILE)) {
  fs.writeFileSync(DASHBOARD_DATA_FILE, JSON.stringify({}));
}

function getUserDashboards() {
  try {
    const data = fs.readFileSync(DASHBOARD_DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

function saveUserDashboard(userId: string, data: any) {
  const dashboards = getUserDashboards();
  dashboards[userId] = data;
  fs.writeFileSync(DASHBOARD_DATA_FILE, JSON.stringify(dashboards, null, 2));
}

function createDefaultDashboard(userId: string) {
  const defaultDashboard = {
    userId,
    careerHappiness: 82,
    strengths: [
      { name: "Empathetic Listener", value: 92 },
      { name: "Strategic Thinker", value: 85 },
      { name: "Continuous Learner", value: 78 },
      { name: "Collaborative Leader", value: 91 }
    ],
    discoveryProgress: 'map',
    resumeStatus: "Resume Process: Reviewing from last update",
    careerProfileStatus: "Career Profile: Updated 2 days ago",
    jobMatches: [
      { title: "Senior UX Designer", company: "TechFlow", matchScore: 94 },
      { title: "Product Strategist", company: "Sparkwavv", matchScore: 88 },
      { title: "AI Experience Lead", company: "FutureMind", matchScore: 82 }
    ],
    aiCompanion: {
      name: "Skylar",
      status: "Online",
      message: "Ready to help you with your career journey!"
    }
  };
  saveUserDashboard(userId, defaultDashboard);
  return defaultDashboard;
}

// In-memory store for registration tokens
// In a real app, use a database (Redis/PostgreSQL)
const registrationTokens = new Map<string, { email: string; expires: number }>();

// Initialize Firebase Admin
let isFirebaseAdminConfigured = false;
try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    isFirebaseAdminConfigured = true;
    console.log("Firebase Admin initialized successfully.");
  } else {
    console.warn("Firebase Admin credentials missing. Backend auth features will be limited.");
  }
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
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
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || '',
  USER_COUNT: 0,
};

if (isFirebaseAdminConfigured) {
  try {
    const listUsersResult = await admin.auth().listUsers();
    envStatus.USER_COUNT = listUsersResult.users.length;
  } catch (error) {
    console.error("Error fetching user count for diagnostics:", error);
  }
}

console.log("[ENV STATUS]", envStatus);
fs.writeFileSync(path.join(__dirname, 'env-status.json'), JSON.stringify(envStatus, null, 2));

async function startServer() {
  const app = express();
  const PORT = 3000;

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

  // RBAC Helpers & Routes
  if (isFirebaseAdminConfigured) {
    const db = admin.firestore();
    
    const getUserRole = async (uid: string) => {
      try {
        const userDoc = await db.collection('users').doc(uid).get();
        return userDoc.exists ? (userDoc.data()?.role || ROLES.USER) : ROLES.USER;
      } catch (error) {
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

    const requireRole = (roles: string[]) => {
      return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) {
          if ((req.session as any).isAdmin && roles.includes(ROLES.ADMIN)) return next();
          return res.status(401).json({ error: "Unauthorized" });
        }
        try {
          const decodedToken = await admin.auth().verifyIdToken(idToken);
          const role = await getUserRole(decodedToken.uid);
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

    app.post("/api/admin/login-v2", async (req, res) => {
      const { idToken } = req.body;
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const role = await getUserRole(decodedToken.uid);
        if (role === ROLES.ADMIN) {
          (req.session as any).isAdmin = true;
          (req.session as any).uid = decodedToken.uid;
          res.json({ success: true, role });
        } else {
          res.status(403).json({ success: false, message: "Not an admin" });
        }
      } catch (error) {
        res.status(401).json({ success: false });
      }
    });

    app.post("/api/admin/set-role", requireRole([ROLES.ADMIN]), async (req, res) => {
      const { uid, role } = req.body;
      const success = await setUserRole(uid, role);
      res.json({ success });
    });

    app.get("/api/admin/users-v2", requireRole([ROLES.ADMIN, ROLES.OPERATOR]), async (req, res) => {
      try {
        const listUsersResult = await admin.auth().listUsers();
        const users = await Promise.all(listUsersResult.users.map(async (u) => ({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName || u.email?.split('@')[0],
          role: await getUserRole(u.uid),
          emailVerified: u.emailVerified,
          creationTime: u.metadata.creationTime,
        })));
        res.json({ users });
      } catch (error) {
        res.status(500).json({ error: "Failed" });
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
      const { idToken } = req.body;
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        if (!userDoc.exists) await setUserRole(decodedToken.uid, ROLES.USER);
        res.json({ success: true });
      } catch (error) {
        res.status(401).json({ success: false });
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
    console.log(`Subject: Confirm Your Sparkwavv Registration`);
    console.log(`Hello ${name || "User"},`);
    console.log(`Please confirm your Sparkwavv account by clicking the link below:`);
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
    // In a real app, we'd verify the Firebase ID token from the Authorization header
    // For this demo, we'll use a query param or session if available
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const dashboards = getUserDashboards();
    let dashboard = dashboards[userId];

    if (!dashboard) {
      dashboard = createDefaultDashboard(userId);
    }

    res.json(dashboard);
  });

  app.post("/api/user/dashboard", async (req, res) => {
    const { userId, data } = req.body;
    if (!userId || !data) {
      return res.status(400).json({ error: "User ID and data are required" });
    }
    saveUserDashboard(userId, data);
    res.json({ success: true });
  });

  // Admin Auth API
  app.get("/api/auth/status", (req, res) => {
    res.json({
      client: !!process.env.VITE_FIREBASE_API_KEY,
      admin: isFirebaseAdminConfigured,
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
  app.get("/api/admin/env-status", (req, res) => {
    if (!(req.session as any).isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    res.json(envStatus);
  });

  app.get("/api/admin/stats", async (req, res) => {
    console.log(`[API] GET /api/admin/stats - isAdmin: ${(req.session as any).isAdmin}`);
    if (!(req.session as any).isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    let userStats = {
      total: 0,
      active: 0,
      newToday: 0,
      pendingVerification: 0,
    };

    if (isFirebaseAdminConfigured) {
      try {
        const listUsersResult = await admin.auth().listUsers();
        const users = listUsersResult.users;
        const total = users.length;
        const verified = users.filter(u => u.emailVerified).length;
        const pending = total - verified;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newToday = users.filter(u => u.metadata.creationTime && new Date(u.metadata.creationTime) >= today).length;

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

  app.get("/api/admin/users", async (req, res) => {
    console.log(`[API] GET /api/admin/users - isAdmin: ${(req.session as any).isAdmin}`);
    if (!(req.session as any).isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }

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

  // API 404 catch-all
  app.all("/api/*", (req, res) => {
    console.log(`[API] 404 - ${req.method} ${req.url}`);
    res.status(404).json({ error: "API route not found" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
