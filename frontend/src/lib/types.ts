export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  isCreator: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Resource {
  id: string;
  type: 'youtube' | 'pdf' | 'doc' | 'article' | 'link';
  url: string;
  title: string;
  storagePath?: string;
}

export interface RoadmapNode {
  id: string;
  roadmapId: string;
  type: 'resource' | 'milestone' | 'text';
  title: string;
  description: string;
  position: { x: number; y: number };
  estimatedTimeMinutes: number;
  resources: Resource[];
  prerequisites: string[];
  order: number;
}

export interface RoadmapEdge {
  id: string;
  roadmapId: string;
  sourceNodeId: string;
  targetNodeId: string;
}

export interface Roadmap {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creator?: User;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTimeMinutes: number;
  isPublic: boolean;
  isPaid: boolean;
  priceUSD: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  stats: {
    views: number;
    saves: number;
    averageRating: number;
    totalRatings: number;
  };
}

export interface Comment {
  id: string;
  roadmapId: string;
  userId: string;
  user?: User;
  content: string;
  createdAt: Date;
  parentId?: string;
}

export interface Rating {
  id: string;
  roadmapId: string;
  userId: string;
  rating: number;
  createdAt: Date;
}

export interface Bookmark {
  userId: string;
  roadmapId: string;
  addedAt: Date;
}

export interface Progress {
  userId: string;
  roadmapId: string;
  completedNodeIds: string[];
  startedAt: Date;
  lastUpdatedAt: Date;
  completedAt?: Date;
}
