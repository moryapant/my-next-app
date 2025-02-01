import { Timestamp } from 'firebase/firestore';

export interface SubFapp {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  createdAt: Timestamp;
  createdBy: string;
  isPublic: boolean;
  memberCount: number;
} 