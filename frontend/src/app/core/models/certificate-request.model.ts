export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CertificateRequest {
  id?: number;
  studentId: number;
  courseId: number;
  certificateId?: number;
  requestDate?: string;
  status: RequestStatus;
  rejectionReason?: string;
  reviewedBy?: number;
  reviewedAt?: string;
  notes?: string;
  studentName?: string;
  studentEmail?: string;
  courseName?: string;
  reviewerName?: string;
  createdAt?: string;
  updatedAt?: string;
}
