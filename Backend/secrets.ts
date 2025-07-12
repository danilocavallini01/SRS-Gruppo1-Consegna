import e from "express";

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
export const COOKIE_KEY = process.env.COOKIE_KEY as string;
export const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID as string;
export const GOOGLE_PUBSUB_TOPIC = process.env.GOOGLE_PUBSUB_TOPIC as string;
export const GOOGLE_SHARED_USER_BUCKET = process.env.GOOGLE_SHARED_USER_BUCKET as string;
export const GOOGLE_LOCATION = process.env.GOOGLE_LOCATION as string
export const JWT_SECRET = process.env.JWT_SECRET as string;
export const PROD = (process.env.ENV !== 'DEV') as boolean;
export const DUMMY = (process.env.DUMMY === 'TRUE') as boolean
export const GOOGLE_BILLING_CREDENTIALS = process.env.GOOGLE_BILLING_CREDENTIALS as string