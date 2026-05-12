
import admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function migrateAuth() {
    console.log('🚀 Starting Auth Migration...');

    // 1. Source (Sandbox)
    const sandboxConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));
    const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (!saJson) {
        console.error('❌ Missing FIREBASE_SERVICE_ACCOUNT_JSON for source (sandbox) auth.');
        return;
    }

    const sa = JSON.parse(saJson);
    const sourceApp = admin.initializeApp({
        credential: admin.credential.cert(sa),
        projectId: sa.project_id
    }, 'source-auth');

    // 2. Destination (Prod)
    const saJsonProd = process.env.PROD_FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!saJsonProd) {
        console.error('❌ Missing PROD_FIREBASE_SERVICE_ACCOUNT_JSON for destination.');
        return;
    }

    const saProd = JSON.parse(saJsonProd);
    console.log(`📡 Connecting to Destination Auth: ${saProd.project_id}`);
    const destApp = admin.initializeApp({
        credential: admin.credential.cert(saProd),
        projectId: saProd.project_id
    }, 'dest-auth');

    const sourceAuth = sourceApp.auth();
    const destAuth = destApp.auth();

    try {
        console.log('📬 Listing users from source...');
        const listUsersResult = await sourceAuth.listUsers(100);
        const users = listUsersResult.users;

        console.log(`✨ Found ${users.length} users.`);

        for (const user of users) {
            console.log(`👤 Processing user: ${user.email} (${user.uid})`);
            try {
                // Try to create user in destination
                // Note: We can't easily copy password hashes without full export, but for Google users it works.
                await destAuth.createUser({
                    uid: user.uid,
                    email: user.email,
                    emailVerified: user.emailVerified,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    disabled: user.disabled,
                    // metadata: user.metadata // Can't set metadata directly in createUser for UID import sometimes
                });
                console.log(`   ✅ Created user in destination.`);
            } catch (err: any) {
                if (err.code === 'auth/uid-already-exists' || err.code === 'auth/email-already-exists') {
                    console.log(`   ⚠️ User already exists in destination. Skipping.`);
                } else {
                    console.error(`   ❌ Failed to create user: ${err.message}`);
                }
            }
        }

        console.log('🎉 Auth Migration Complete.');
    } catch (e: any) {
        console.error('💥 Migration Error:', e.message);
    } finally {
        await sourceApp.delete();
        await destApp.delete();
    }
}

migrateAuth();
