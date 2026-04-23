# Quick Start Guide - Node Road

## Prerequisites
- Node.js 18+ installed
- Firebase account

## Step 1: Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Create a new project
3. Enable **Authentication** → Google provider
4. Enable **Firestore Database**
5. Go to Project Settings → Add Web App
6. Copy Firebase config

## Step 2: Configure Environment
```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local` with your Firebase values from Step 1.

## Step 3: Update Firestore Rules
In Firebase Console → Firestore → Rules, paste:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /roadmaps/{roadmapId} {
      allow read: if resource.data.isPublic == true || 
                    (request.auth != null && request.auth.uid == resource.data.creatorId);
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.creatorId;
      match /nodes/{nodeId} {
        allow read: if get(/databases/$(database)/documents/roadmaps/$(roadmapId)).data.isPublic == true || 
                      (request.auth != null && request.auth.uid == get(/databases/$(database)/documents/roadmaps/$(roadmapId)).data.creatorId);
        allow write: if request.auth != null && request.auth.uid == get(/databases/$(database)/documents/roadmaps/$(roadmapId)).data.creatorId;
      }
      match /edges/{edgeId} {
        allow read: if get(/databases/$(database)/documents/roadmaps/$(roadmapId)).data.isPublic == true || 
                      (request.auth != null && request.auth.uid == get(/databases/$(database)/documents/roadmaps/$(roadmapId)).data.creatorId);
        allow write: if request.auth != null && request.auth.uid == get(/databases/$(database)/documents/roadmaps/$(roadmapId)).data.creatorId;
      }
    }
    match /progress/{progressId} {
      allow read, write: if request.auth != null && progressId.matches(request.auth.uid + '_.*');
    }
  }
}
```

## Step 4: Run Development Server
```bash
cd frontend
npm run dev
```

## Step 5: Open Browser
Navigate to **http://localhost:3000**

---

**Troubleshooting:**
- If you see a blank page, check browser console for Firebase errors
- Ensure all environment variables are set correctly in `.env.local`
- Make sure Firestore rules are saved (click Publish)