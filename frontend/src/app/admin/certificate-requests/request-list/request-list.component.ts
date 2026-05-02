import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CertificateRequestService } from '../../../core/services/certificate-request.service';
import { CertificateRequest } from '../../../core/models/certificate-request.model';

@Component({
  selector: 'app-request-list',
  templateUrl: './request-list.component.html',
  styleUrl: './request-list.component.scss',
  standalone: false,
})
export class RequestListComponent implements OnInit {
  requests: CertificateRequest[] = [];
  filtered: CertificateRequest[] = [];
  isLoading = false;
  error = '';
  searchTerm = '';
  filterStatus = 'ALL';

  statusOptions = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

  constructor(
    private requestService: CertificateRequestService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = '';
    this.requestService.getAll().subscribe({
      next: (data) => { this.requests = data; this.applyFilters(); this.isLoading = false; },
      error: (err) => { this.error = 'Failed to load requests: ' + err.message; this.isLoading = false; }
    });
  }

  applyFilters(): void {
    this.filtered = this.requests.filter(r => {
      const matchStatus = this.filterStatus === 'ALL' || r.status === this.filterStatus;
      const term = this.searchTerm.toLowerCase();
      const matchSearch = !term ||
        r.studentName?.toLowerCase().includes(term) ||
        r.courseName?.toLowerCase().includes(term) ||
        r.studentEmail?.toLowerCase().includes(term);
      return matchStatus && matchSearch;
    });
  }

  approve(req: CertificateRequest): void {
    if (!confirm(`Approve certificate request for ${req.studentName ?? 'Student ' + req.studentId}?`)) return;
    this.requestService.approve(req.id!, 1).subscribe({
      next: () => this.load(),
      error: (err) => { this.error = 'Failed to approve: ' + err.message; }
    });
  }

  reject(req: CertificateRequest): void {
    const reason = prompt('Enter rejection reason:');
    if (reason === null) return;
    this.requestService.reject(req.id!, 1, reason).subscribe({
      next: () => this.load(),
      error: (err) => { this.error = 'Failed to reject: ' + err.message; }
    });
  }

  delete(req: CertificateRequest): void {
    if (!confirm(`Delete this request?`)) return;
    this.requestService.delete(req.id!).subscribe({
      next: () => this.load(),
      error: (err) => { this.error = 'Failed to delete: ' + err.message; }
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
}
