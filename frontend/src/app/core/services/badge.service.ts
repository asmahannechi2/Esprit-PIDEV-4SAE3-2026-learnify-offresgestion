import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Badge } from '../models/badge.model';

const BASE = '/api/badges';

@Injectable({ providedIn: 'root' })
export class BadgeService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Badge[]> {
    return this.http.get<any>(BASE).pipe(map(r => r.data ?? r));
  }

  getById(id: number): Observable<Badge> {
    return this.http.get<any>(`${BASE}/${id}`).pipe(map(r => r.data ?? r));
  }

  getByStudent(studentId: number): Observable<Badge[]> {
    return this.http.get<any>(`${BASE}/student/${studentId}`).pipe(map(r => r.data ?? r));
  }

  getByCourse(courseId: number): Observable<Badge[]> {
    return this.http.get<any>(`${BASE}/course/${courseId}`).pipe(map(r => r.data ?? r));
  }

  create(badge: Omit<Badge, 'id'>): Observable<Badge> {
    return this.http.post<Badge>(BASE, badge);
  }

  update(id: number, badge: Partial<Badge>): Observable<Badge> {
    return this.http.put<Badge>(`${BASE}/${id}`, badge);
  }

  awardToStudent(badgeId: number, studentId: number): Observable<Badge> {
    return this.http.post<Badge>(`${BASE}/${badgeId}/award`, { studentId });
  }

  markPublishedToLinkedIn(id: number): Observable<Badge> {
    return this.http.put<Badge>(`${BASE}/${id}/linkedin-published`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }

  /** Builds the LinkedIn "Add Certification" deep link */
  buildLinkedInShareUrl(badge: Badge, verifyUrl: string): string {
    const params = new URLSearchParams({
      startTask: 'CERTIFICATION_NAME',
      name: badge.name,
      organizationId: '0',
      issueYear: badge.earnedDate ? new Date(badge.earnedDate).getFullYear().toString() : new Date().getFullYear().toString(),
      issueMonth: badge.earnedDate ? (new Date(badge.earnedDate).getMonth() + 1).toString() : (new Date().getMonth() + 1).toString(),
      certUrl: verifyUrl,
      certId: badge.id?.toString() ?? '',
    });
    return `https://www.linkedin.com/profile/add?${params.toString()}`;
  }
}
