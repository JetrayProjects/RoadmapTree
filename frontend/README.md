# Node Road

A web application for creating and sharing visual learning roadmaps. Built with React Flow, Firebase, and Next.js.

## Features

- **Visual Roadmap Builder** - Create learning paths using an intuitive node-based editor
- **Multiple Resources Per Node** - Add YouTube videos, PDFs, documents, articles, and links to each node
- **Google Authentication** - Quick and secure sign-in
- **Public/Private Roadmaps** - Share your knowledge or keep it private
- **Explore Gallery** - Browse roadmaps created by others
- **Dashboard** - Track your created roadmaps and statistics

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Flow Library**: React Flow
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Hosting**: Vercel (ready)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/JetrayProjects/NodeRoad.git
cd NodeRoad/frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** with Google provider
4. Enable **Firestore Database**
5. Enable **Storage** (for file uploads)
6. Create a web app in project settings
7. Copy the configuration values

### 4. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase values:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 5. Set Up Firestore Rules

In Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own profile
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Roadmaps - public read, authenticated write
    match /roadmaps/{roadmapId} {
      allow read: if resource.data.isPublic == true || 
                    (request.auth != null && request.auth.uid == resource.data.creatorId);
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.creatorId;
      
      // Nodes and edges follow roadmap permissions
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

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start building roadmaps.

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Home page
│   │   ├── create/page.tsx    # Create roadmap
│   │   ├── roadmaps/page.tsx  # Explore gallery
│   │   ├── roadmap/[id]/     # View roadmap
│   │   └── dashboard/        # User dashboard
│   ├── components/           # React components
│   │   ├── CustomNodes.tsx   # React Flow node types
│   │   ├── NodeEditor.tsx     # Node editing panel
│   │   ├── RoadmapEditor.tsx  # Main editor component
│   │   └── Providers.tsx      # Context providers
│   ├── contexts/              # React contexts
│   │   └── AuthContext.tsx    # Authentication
│   └── lib/                   # Utilities
│       ├── firebase.ts        # Firebase configuration
│       └── types.ts           # TypeScript types
├── public/                   # Static assets
└── package.json
```

## Usage

### Creating a Roadmap

1. Sign in with Google
2. Click "Create" in the navigation
3. Add a title and description
4. Use the toolbar to add nodes:
   - **Resource Node** - Contains learning materials
   - **Milestone Node** - Checkpoint/goal marker
   - **Text Node** - Notes and context
5. Double-click a node to edit and add resources
6. Drag from node handles to create connections
7. Click "Save Roadmap" when done

### Adding Resources to Nodes

Each resource node can contain multiple resources:
- **YouTube** - Video tutorials
- **PDF** - Documents and guides
- **Word Doc** - Downloadable files
- **Article** - Blog posts and references
- **Link** - Any URL

### Node Types

| Type | Purpose | Supports Resources |
|------|---------|-------------------|
| Resource | Learning materials | ✓ Multiple |
| Milestone | Goals/Checkpoints | ✗ |
| Text | Notes/Tips | ✗ |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

```bash
npm install -g vercel
vercel
```

### Manual Build

```bash
npm run build
npm start
```

## Future Features

- [ ] Stripe integration for paid roadmaps
- [ ] Rating and review system
- [ ] Comments on roadmaps
- [ ] Bookmark/save functionality
- [ ] Progress tracking
- [ ] Pre-built roadmap templates
- [ ] Mobile app

## License

MIT

---

Built with ❤️ for learners everywhere.
