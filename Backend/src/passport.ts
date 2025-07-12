import passport from "passport";
import passportGoogle from "passport-google-oauth20";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, PROD } from "../secrets";
const GoogleStrategy = passportGoogle.Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID!,
      clientSecret: GOOGLE_CLIENT_SECRET!,
      callbackURL: PROD ? 'https://node-backend-pkkemnazlq-og.a.run.app/auth/google/redirect' : 'http://localhost:8000/auth/google/redirect',
      scope: ['profile', 'email'] // Request email scope
    },
    (accessToken, refreshToken, profile, done) => {
      done(null, profile)
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user); // not safe for production — too much data in the session
});

passport.deserializeUser((obj: any, done) => {
  done(null, obj);
});