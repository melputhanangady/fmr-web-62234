# Tinder-style Matchmaking Web App

A modern dating app built with React, Vite, Firebase, and Tailwind CSS.

## Features

- 🔐 Email/Password Authentication
- 👤 User Profile & Onboarding
- 💕 Discover Queue with Like/Pass functionality
- 🎯 Smart Matching Algorithm
- 💬 Real-time 1:1 Chat
- 🎨 Modern, Responsive UI

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Routing**: React Router v6
- **Notifications**: React Hot Toast

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "tinder-matchmaking-app")
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication

1. In your Firebase project, go to "Authentication" → "Sign-in method"
2. Enable "Email/Password" provider
3. Click "Save"

### 3. Create Firestore Database

1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll add security rules later)
4. Select a location for your database

### 4. Enable Storage

1. Go to "Storage"
2. Click "Get started"
3. Choose "Start in test mode"
4. Select a location for your storage

### 5. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon (</>) to add a web app
4. Enter app nickname (e.g., "Tinder App")
5. Copy the Firebase configuration object

### 6. Environment Variables

1. Copy `env.example` to `.env`
2. Fill in your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Firestore Security Rules

Add these security rules to your Firestore database:

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

## Storage Security Rules

Add these rules to your Firebase Storage:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload their own profile photos
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
│   ├── Auth/          # Login/Signup pages
│   ├── Onboarding/    # Profile setup
│   ├── Discover/      # Discover queue
│   ├── Matches/       # Matches list
│   ├── Chat/          # Chat room
│   └── Profile/       # User settings
├── contexts/          # React contexts
├── services/          # Firebase services
├── hooks/             # Custom hooks
├── utils/             # Utility functions
└── config/            # Configuration files
```

## Development

The app includes:

- **Authentication Flow**: Login/Signup with email validation
- **Onboarding**: Multi-step profile creation with photo upload
- **Discover Queue**: Tinder-style card interface with Like/Pass
- **Matching Logic**: Automatic match creation on mutual likes
- **Real-time Chat**: Firestore-powered messaging
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details