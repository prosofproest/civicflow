# CivicFlow — Firebase Setup & Configuration Guide

This guide details the step-by-step procedure for provisioning and configuring Firebase Authentication, Cloud Firestore, and the Firebase Admin SDK for CivicFlow.

---

## 1. Create a Firebase Project
1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or select an existing Google Cloud project).
3. Name your project (e.g. `civicflow-prod` or `civicflow-dev`).
4. (Optional) Configure Google Analytics according to team preference.
5. Click **Create Project**.

---

## 2. Enable Authentication Providers
1. In the Firebase Console left navigation, select **Build > Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab:
   - **Email/Password**:
     - Click **Email/Password**.
     - Enable the **Email/Password** toggle (keep *Email link (passwordless sign-in)* disabled).
     - Click **Save**.
   - **Google**:
     - Click **Add new provider** and select **Google**.
     - Enable the **Google** toggle.
     - Select a Project support email.
     - Click **Save**.
4. In the **Authorized domains** section (under the *Settings* tab in Authentication):
   - Ensure `localhost` is listed for local development.
   - Add your production domain when deploying.

---

## 3. Create Cloud Firestore Database
1. In the Firebase Console, select **Build > Firestore Database**.
2. Click **Create database**.
3. Select **Firestore Native mode** (Enterprise / standard).
4. Choose a region close to your primary municipal jurisdiction (e.g., `asia-south1` or `us-central1`).
5. In the security rules setup prompt, select **Start in production mode** (our repository provides hardened `firestore.rules`).
6. Click **Enable**.

---

## 4. Obtain Firebase Web Client Configuration
1. In Project Overview, click the **Web** icon (`</>`) to register a web app.
2. Enter App nickname: `CivicFlow Web`.
3. Click **Register app**.
4. Copy the values from the `firebaseConfig` object:
   - `apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `authDomain` → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `appId` → `NEXT_PUBLIC_FIREBASE_APP_ID`

---

## 5. Generate Firebase Admin Service Account Credentials
1. In the Firebase Console, click the **Settings gear** icon next to *Project Overview* and choose **Project settings**.
2. Open the **Service accounts** tab.
3. Verify that **Firebase Admin SDK** is selected with Node.js.
4. Click **Generate new private key**, then confirm with **Generate key**.
5. A JSON file will download containing your service account credentials:
   - `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY` (ensure newline characters `\n` are preserved or properly escaped).

---

## 6. Configure Local Environment Variables
Create a `.env.local` file in the root of the repository (never committed to Git) and populate the values:

```bash
# Firebase Client Configuration (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here

# Firebase Admin SDK Configuration (Server-Side Only — Secret)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# Future Phases
GROQ_API_KEY=
GROQ_MODEL=
ENABLE_GROQ_VISION=false
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## 7. Deploy Firestore Security Rules
Deploy the repo's `firestore.rules` using the Firebase CLI:
```bash
npx -y firebase-tools@latest deploy --only firestore:rules --project your_project_id
```
Alternatively, copy the contents of `firestore.rules` directly into the Firestore **Rules** tab in the Firebase Console and click **Publish**.
