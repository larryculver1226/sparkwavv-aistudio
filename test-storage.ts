import admin from "firebase-admin";

const projectId = "sparkwavv-prod";
const storageBucket = "sparkwavv-prod.firebasestorage.app";

admin.initializeApp({
  projectId,
  storageBucket
});

async function test() {
  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file("test.txt");
    await file.save("Hello World");
    console.log("Successfully uploaded test file via admin SDK");
  } catch (e) {
    console.error("Failed to upload via admin SDK:", e);
  }
}

test();
