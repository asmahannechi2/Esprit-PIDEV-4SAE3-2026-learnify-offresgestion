import { Component, OnInit } from '@angular/core';
import { CertificateRequestService } from '../../core/services/certificate-request.service';
import { CertificateRequest } from '../../core/models/certificate-request.model';

@Component({
  selector: 'app-my-requests',
  templateUrl: './my-requests.component.html',
  styleUrl: './my-requests.component.scss',
  standalone: false,
})
export class MyRequestsComponent implements OnInit {
  requests: CertificateRequest[] = [];
  isLoading = false;
  isSubmitting = false;
  error = '';
  successMsg = '';
  showForm = false;

  newNotes = '';
  newCourseId: number | null = null;

  // Mock student ID — replace with AuthService.currentUser.id in production
  private studentId = 1;

  constructor(private requestService: CertificateRequestService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.requestService.getByStudent(this.studentId).subscribe({
      next: (data) => { this.requests = data; this.isLoading = false; },
      error: () => {
        // Fallback mock data for demo
        this.requests = [
          {
            id: 1, studentId: 1, courseId: 1, status: 'APPROVED',
            requestDate: '2024-03-01', courseName: 'French B1 Course',
            notes: 'Please issue my certificate', reviewerName: 'Admin John',
            reviewedAt: '2024-03-05'
          },
          {
            id: 2, studentId: 1, courseId: 2, status: 'PENDING',
            requestDate: '2024-04-10', courseName: 'Spanish A2 Course',
            notes: 'Requesting certificate after final exam'
          },
        ];
        this.isLoading = false;
      }
    });
  }

  submitRequest(): void {
    if (!this.newCourseId) return;
    this.isSubmitting = true;
    this.error = '';
    const payload: Omit<CertificateRequest, 'id'> = {
      studentId: this.studentId,
      courseId: this.newCourseId,
      status: 'PENDING',
      notes: this.newNotes,
      requestDate: new Date().toISOString().split('T')[0],
    };
    this.requestService.create(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showForm = false;
        this.newNotes = '';
        this.newCourseId = null;
        this.successMsg = 'Your certificate request has been submitted successfully!';
        setTimeout(() => this.successMsg = '', 5000);
        this.load();
      },
      error: (err) => {
        this.error = 'Failed to submit request: ' + err.message;
        this.isSubmitting = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'APPROVED': return 'bg-success';
      case 'REJECTED': return 'bg-danger';
      case 'PENDING': return 'bg-warning text-dark';
      default: return 'bg-secondary';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'APPROVED': return 'bi-check-circle-fill';
      case 'REJECTED': return 'bi-x-circle-fill';
      case 'PENDING': return 'bi-clock-fill';
      default: return 'bi-question-circle';
    }
  }

  get pendingCount(): number { return this.requests.filter(r => r.status === 'PENDING').length; }
  get approvedCount(): number { return this.requests.filter(r => r.status === 'APPROVED').length; }
}
