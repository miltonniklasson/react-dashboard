// Centralized environment variable access & validation.
// Fails fast with clear guidance instead of cryptic Firebase auth/invalid-api-key.

interface RequiredEnv {
  VITE_FIREBASE_API_KEY: string;
  VITE_FIREBASE_AUTH_DOMAIN: string;
  VITE_FIREBASE_PROJECT_ID: string;
  VITE_FIREBASE_STORAGE_BUCKET: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  VITE_FIREBASE_APP_ID: string;
}

function readEnv(): RequiredEnv {
  const keys: (keyof RequiredEnv)[] = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const missing: string[] = [];
  const values = {} as RequiredEnv;

  for (const k of keys) {
    const v = (import.meta as any).env[k];
    if (v === undefined || v === '' || v === 'your_api_key' || (typeof v === 'string' && v.includes('your_project'))) {
      missing.push(k);
    } else {
      (values as any)[k] = v;
    }
  }

  if (missing.length) {
    const hint = [
      'Ensure you created hosting/.env.local with the real Firebase web app config from Firebase Console > Project Settings > General > Your apps',
      'Restart the dev server after adding/changing env variables',
      'All frontend-exposed vars must be prefixed with VITE_',
    ].join('\n - ');
    throw new Error(`Missing or placeholder Firebase env vars: ${missing.join(', ')}\n - ${hint}`);
  }

  return values;
}

export const ENV = readEnv();

export const ENV_PUBLIC_DEBUG = {
  projectId: ENV.VITE_FIREBASE_PROJECT_ID,
  authDomain: ENV.VITE_FIREBASE_AUTH_DOMAIN,
  apiKeyPreview: ENV.VITE_FIREBASE_API_KEY.slice(0, 6) + '…'
};

// Optional reCAPTCHA site key (invisible v2). Add to hosting/.env.local as VITE_RECAPTCHA_SITE_KEY=... to enable bot checks.
export const RECAPTCHA_SITE_KEY: string | undefined = (import.meta as any).env.VITE_RECAPTCHA_SITE_KEY;
// Optional override for Cloud Functions origin (use emulator or custom domain)
export const FUNCTIONS_ORIGIN: string = (import.meta as any).env.VITE_FUNCTIONS_ORIGIN || `https://us-central1-${ENV.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net`;
