import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseAppletConfig: any = {};
try {
  const configPath = path.resolve(__dirname, '../../firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseAppletConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (error) {
  console.warn('LoggingService: Could not read firebase-applet-config.json', error);
}

const getDb = () => {
  const databaseId = firebaseAppletConfig.firestoreDatabaseId;
  if (databaseId) {
    return getFirestore(admin.app(), databaseId);
  }
  return getFirestore(admin.app());
};

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
export type LogService = 'AUTH' | 'API' | 'FIRESTORE' | 'STORAGE' | 'SYSTEM';

export interface SystemLog {
  id: string;
  timestamp: admin.firestore.FieldValue;
  level: LogLevel;
  serviceName: LogService;
  message: string;
  details?: any;
}

/**
 * Logs a system event to Firestore
 */
export const logEvent = async (
  level: LogLevel,
  serviceName: LogService,
  message: string,
  details?: any
) => {
  try {
    const db = getDb();
    const logId = uuidv4();
    const log: SystemLog = {
      id: logId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      level,
      serviceName,
      message,
      details: details || {},
    };

    await db.collection('system_logs').doc(logId).set(log);
    console.log(`[${serviceName}] [${level}] ${message}`);
  } catch (error) {
    console.error('Failed to log system event:', error);
  }
};
