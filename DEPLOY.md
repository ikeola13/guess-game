# Deploying Guess Game

- **Frontend:** Netlify (Next.js, mobile-only layout)
- **Backend:** Firestore only (Spark/free plan works)

No Cloud Functions. No Blaze plan required.

---

## Architecture

| Layer | Service |
|-------|---------|
| UI | Netlify (max 430px mobile shell) |
| Database | Firestore (`rooms` collection) |
| Game logic | Client-side (writes directly to Firestore) |

The secret answer is stored in Firestore but **never shown in the UI** until the game ends.

---

## 1. Firebase setup

1. [Firebase Console](https://console.firebase.google.com/) → your project
2. Enable **Firestore** (production mode)
3. Copy web app config into `.env.local`

---

## 2. Deploy Firestore rules

```bash
npm run firebase:login
npm run deploy:firebase
```

This only deploys security rules — works on the **free Spark plan**.

---

## 3. Deploy frontend to Netlify

1. Push repo to GitHub
2. [Netlify](https://app.netlify.com/) → Import from Git
3. Add env vars (same as `.env.local`):
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
4. Deploy

Or via CLI:

```bash
netlify login
netlify init
netlify deploy --prod
```

---

## 4. Local development

```bash
npm run dev
```

With Firestore emulator:

```bash
# .env.local
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true

npm run dev
```

---

## Storage

| Storage | Purpose |
|---------|---------|
| **localStorage** | Player ID + name |
| **sessionStorage** | Active room code |
| **Firestore** | Live game state |
