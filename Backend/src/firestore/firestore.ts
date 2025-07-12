// src/firebase.ts
import admin from 'firebase-admin';
import serviceAccount from '../../firestore-sa.json'; // adjust path as needed

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export const COLLECTION = '(default)'

export const db = admin.firestore();
