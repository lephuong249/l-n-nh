import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { googleConfig, facebookConfig} from "./auth.js";
import AuthService from "../modules/auth/auth.service.js";

// GOOGLE - Only configure if all required variables are present
if (googleConfig) {
  passport.use(
    new GoogleStrategy(
      googleConfig,
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("Google profile:", profile);
          const result = await AuthService.loginWithGoogle(profile);
          return done(null, result); // req.user = { user, token }
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  // Google OAuth strategy not configured - missing environment variables
}

// FACEBOOK - Only configure if all required variables are present
if (facebookConfig) {
  passport.use(
    new FacebookStrategy(
      facebookConfig,
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("Facebook profile:", profile);
          const result = await AuthService.loginWithFacebook(profile);
          return done(null, result);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  // Facebook OAuth strategy not configured - missing environment variables
}

// Passport serialization (required even when not using sessions)
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

export default passport;
