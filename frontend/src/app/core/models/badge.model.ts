export type BadgeLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
export type BadgeStatus = 'LOCKED' | 'EARNED' | 'PUBLISHED';

export interface Badge {
  id?: number;
  name: string;
  description: string;
  imageUrl: string;
  level: BadgeLevel;
  criteria: string;
  courseId: number;
  certificateId?: number;
  studentId?: number;
  courseName?: string;
  studentName?: string;
  studentEmail?: string;
  earnedDate?: string;
  status: BadgeStatus;
  isPublishedToLinkedIn?: boolean;
  linkedInShareUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}
