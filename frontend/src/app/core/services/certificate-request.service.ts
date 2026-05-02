import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CertificateRequest } from '../models/certificate-request.model';

const BASE = '/api/certificate-requests';

@Injectable({ providedIn: 'root' })
export class CertificateRequestService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<CertificateRequest[]> {
    return this.http.get<any>(BASE).pipe(map(r => r.data ?? r));
  }

  getById(id: number): Observable<CertificateRequest> {
    return this.http.get<any>(`${BASE}/${id}`).pipe(map(r => r.data ?? r));
  }

  getByStudent(studentId: number): Observable<CertificateRequest[]> {
    return this.http.get<any>(`${BASE}/student/${studentId}`).pipe(map(r => r.data ?? r));
  }

  getByStatus(status: string): Observable<CertificateRequest[]> {
    return this.http.get<any>(`${BASE}/status/${status}`).pipe(map(r => r.data ?? r));
  }

  create(request: Omit<CertificateRequest, 'id'>): Observable<CertificateRequest> {
    return this.http.post<CertificateRequest>(BASE, request);
  }

  approve(id: number, reviewedBy: number): Observable<CertificateRequest> {
    return this.http.put<CertificateRequest>(`${BASE}/${id}/approve`, { reviewedBy });
  }

  reject(id: number, reviewedBy: number, rejectionReason: string): Observable<CertificateRequest> {
    return this.http.put<CertificateRequest>(`${BASE}/${id}/reject`, { reviewedBy, rejectionReason });
  }

  update(id: number, request: Partial<CertificateRequest>): Observable<CertificateRequest> {
    return this.http.put<CertificateRequest>(`${BASE}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }

  getPendingCount(): Observable<number> {
    return this.http.get<any>(`${BASE}/count/pending`).pipe(map(r => r.data ?? r));
  }
}
