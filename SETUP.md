# Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "tinder-matchmaking-app")
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Firebase Services

#### Authentication
1. Go to "Authentication" → "Sign-in method"
2. Enable "Email/Password" provider
3. Click "Save"

#### Firestore Database
1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode"
4. Select a location for your database

#### Storage
1. Go to "Storage"
2. Click "Get started"
3. Choose "Start in test mode"
4. Select a location for your storage

### 3. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon (</>) to add a web app
4. Enter app nickname (e.g., "Tinder App")
5. Copy the Firebase configuration object

### 4. Set Up Environment Variables

1. **Create `.env` file** in the project root:
   ```bash
   cp env.example .env
   ```

2. **Edit `.env` file** with your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_actual_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_actual_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
   VITE_FIREBASE_APP_ID=your_actual_app_id
   ```

### 5. Start the App

```bash
npm run dev
```

The app will be available at `http://localhost:5174/`

## 🔒 Security Rules

### Firestore Rules
Copy and paste these rules in your Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read other users' profiles for matching
    match /users/{userId} {
      allow read: if request.auth != null;
    }
    
    // Matches are readable by both users
    match /matches/{matchId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.users;
    }
    
    // Messages are readable by matched users
    match /messages/{matchId}/messages/{messageId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/matches/$(matchId)).data.users;
    }
  }
}
```

### Storage Rules
Copy and paste these rules in your Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload their own profile photos
    match /photos/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    // Users can read all photos (for matching)
    match /{allPaths=**} {
      allow read: if request.auth != null;
    }
  }
}
```

## 🎉 You're Ready!

Your Tinder-style matchmaking app is now ready to use! Create accounts, set up profiles, and start matching! 💕
