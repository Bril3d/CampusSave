import admin from "firebase-admin";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localKeyPath = path.resolve(__dirname, "../serviceAccountKey.json");
const envKeyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : null;

const targetKeyPath = (envKeyPath && fs.existsSync(envKeyPath))
  ? envKeyPath
  : (fs.existsSync(localKeyPath) ? localKeyPath : null);

if (!admin.apps.length) {
  if (targetKeyPath) {
    const sa = JSON.parse(fs.readFileSync(targetKeyPath, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(sa),
      projectId: sa.project_id,
    });
  } else {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
