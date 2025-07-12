// src/routes/auth.ts
import { Router } from 'express';
import { COLLECTION, db } from '../firestore/firestore';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PROD } from '../../secrets';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /auth/register
router.post('/register', async (req, res): Promise<any> => {
  const { email, password } = req.body;

  console.log('Register requested received')

  const userRef = db.collection(COLLECTION).doc(email);
  const userDoc = await userRef.get();

  if (userDoc.exists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await userRef.set({ email, password: hashedPassword });

  res.status(201).json({ message: 'User registered' });
});

// POST /auth/login
router.post('/login', async (req, res): Promise<any> => {
  const { email, password } = req.body;

  const userRef = db.collection(COLLECTION).doc(email);
  const userDoc = await userRef.get();

  console.log('Login requested received')

  if (!userDoc.exists) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const userData = userDoc.data();
  const passwordMatch = await bcrypt.compare(password, userData!.password);

  if (!passwordMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '24h' });

  res.cookie("token", token, {
    httpOnly: true,
    secure: PROD, // Set to true in production (requires HTTPS)
    maxAge: 24 * 60 * 60 * 1000, // 24h in ms
    sameSite: PROD ? 'none' : 'lax'
  });

  res.cookie("istokenset", "is set", {
    httpOnly: false,
    secure: PROD, // Set to true in production (requires HTTPS)
    maxAge: 24 * 60 * 60 * 1000, // 24h in ms
    sameSite: PROD ? 'none' : 'lax'
  });

  res.json({ token: token });
});

export default router;
