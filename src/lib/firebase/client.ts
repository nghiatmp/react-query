import { getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

export const emulatorMode = process.env.NEXT_PUBLIC_FIREBASE_EMULATORS === "true";
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
export const firebaseConfigured = emulatorMode || Object.values(config).every(Boolean);
let services: { auth: ReturnType<typeof getAuth>; db: ReturnType<typeof getFirestore> } | undefined;

/** Called by effects and query functions only; never initializes browser auth on SSR. */
export function getFirebase() {
  if (typeof window === "undefined") throw new Error("Firebase chỉ dùng ở trình duyệt");
  if (!firebaseConfigured) throw new Error("Chưa cấu hình Firebase. Bạn vẫn có thể dùng bản demo.");
  if (!services) {
    // Never reuse production configuration in emulator mode, even when a real
    // project's public config is present in .env.local.
    const app = getApps().find(a => a.name === "meal-planner") ?? initializeApp(emulatorMode ? {
      apiKey: "demo-api-key", authDomain: "demo-meal-planner.firebaseapp.com",
      projectId: "demo-meal-planner", appId: "demo-app",
    } : config, "meal-planner");
    const auth = getAuth(app);
    const db = getFirestore(app);
    if (emulatorMode) {
      connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
      connectFirestoreEmulator(db, "127.0.0.1", 8080);
    }
    services = { auth, db };
  }
  return services;
}
