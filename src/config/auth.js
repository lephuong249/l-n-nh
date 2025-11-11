export const verifyConfig = {
  secret: process.env.VERIFY_TOKEN_SECRET || process.env.JWT_SECRET,
  expiry: process.env.VERIFY_TOKEN_EXPIRES_IN || "30d",
};

export const resetConfig = {
  secret: process.env.RESET_TOKEN_SECRET || process.env.JWT_SECRET,
  expiry: process.env.RESET_TOKEN_EXPIRES_IN || "15m",
};

// Validate required environment variables
const requiredGoogleVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI'];
const requiredFacebookVars = ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET', 'FACEBOOK_CALLBACK_URL'];

const missingGoogleVars = requiredGoogleVars.filter(varName => !process.env[varName]);
const missingFacebookVars = requiredFacebookVars.filter(varName => !process.env[varName]);

if (missingGoogleVars.length > 0) {
  console.error(`Missing Google OAuth environment variables: ${missingGoogleVars.join(', ')}`);
}

if (missingFacebookVars.length > 0) {
  console.error(`Missing Facebook OAuth environment variables: ${missingFacebookVars.join(', ')}`);
}

// Only export configs if all required variables are present
export const googleConfig = missingGoogleVars.length === 0 ? {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_REDIRECT_URI, 
} : null;

export const facebookConfig = missingFacebookVars.length === 0 ? {
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: process.env.FACEBOOK_CALLBACK_URL,
  profileFields: ["id", "displayName", "emails"],
} : null;

