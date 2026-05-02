import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Application {
  id: number;
  jobId: number;
  teacherId: number;
  teacherName: string;
  motivation: string;
  cvPath: string;
  certificatPath?: string;
  videoPitchPath?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  appliedAt: string;
  jobTitle?: string;
  matchScore: number;
  /** Renseignés quand le back crée un meeting à l’acceptation (job-service). */
  scheduledMeetingId?: number;
  scheduledMeetingAt?: string;
  scheduledMeetRoomName?: string;
}


@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private base = `${environment.apiBase}/applications`;

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  /** TUTOR: Apply to a job. motivation + cv as multipart form */
  apply(jobId: number, motivation: string, cvFile?: File, certificat?: File): Observable<Application> {
    const form = new FormData();
    form.append('jobId', String(jobId));
    if (motivation) form.append('motivation', motivation);
    if (cvFile) form.append('cv', cvFile);
    if (certificat) form.append('certificat', certificat);
    return this.http.post<Application>(this.base, form, { headers: this.authHeaders() });
  }

  /** TUTOR: Get my applications */
  getMyApplications(): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.base}/my`, { headers: this.authHeaders() });
  }

  /** ADMIN: Get all applications for a job */
  getApplicationsByJob(jobId: number): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.base}/job/${jobId}`, { headers: this.authHeaders() });
  }

  /**
   * ADMIN: mise à jour du statut (ACCEPTED / REJECTED).
   * PATCH sans corps évite les cas limites (PUT + `{}` / Content-Type) derrière certains proxies ; l’API expose aussi PUT.
   */
  updateStatus(applicationId: number, status: 'ACCEPTED' | 'REJECTED'): Observable<Application> {
    return this.http.patch<Application>(
      `${this.base}/${applicationId}/status?status=${status}`,
      null,
      { headers: this.authHeaders() },
    );
  }

  /** Upload video pitch */
  uploadVideoPitch(applicationId: number, videoFile: File): Observable<Application> {
    const form = new FormData();
    form.append('video', videoFile);
    return this.http.post<Application>(`${this.base}/${applicationId}/video-pitch`, form, { headers: this.authHeaders() });
  }

  updateApplicationVideo(id: number, video: File): Observable<Application> {
    return this.uploadVideoPitch(id, video);
  }



  /** ADMIN: Get all applications */
  getAll(): Observable<Application[]> {
    return this.http.get<Application[]>(this.base, { headers: this.authHeaders() });
  }

  /** Get file as Blob */

  getFileBlob(applicationId: number, type: 'cv' | 'certificat' | 'video-pitch'): Observable<Blob> {
    return this.http.get(`${this.base}/${applicationId}/files/${type}`, {
      headers: this.authHeaders(),
      responseType: 'blob'
    });
  }

  getCvBlob(id: number): Observable<Blob> { return this.getFileBlob(id, 'cv'); }
  getCertificatBlob(id: number): Observable<Blob> { return this.getFileBlob(id, 'certificat'); }
  getVideoPitchBlob(id: number): Observable<Blob> { return this.getFileBlob(id, 'video-pitch'); }

  /** Delete an application */
  deleteApplication(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`, { headers: this.authHeaders() });
  }
}


