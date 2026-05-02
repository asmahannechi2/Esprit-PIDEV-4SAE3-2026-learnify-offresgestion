import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getOrCreateDeviceId } from '../utils/device';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = `${environment.apiGatewayUrl}/api/auth`;

  constructor(private http: HttpClient) { }

  registerStudent(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register/student`, data);
  }

  registerCandidate(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register/candidate`, data);
  }

  login(data: any): Observable<any> {
    const payload = {
      email: data.email,
      password: data.password,
      role: (data.role || '').toUpperCase(),

      deviceId: getOrCreateDeviceId(),
      userAgent: navigator.userAgent,
      platform: (navigator as any).platform || '',
      language: navigator.language || '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    };

    return this.http.post(`${this.baseUrl}/login`, payload);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/forgot-password`, { email }, { responseType: 'text' as const });
  }

  resetPassword(data: { email: string; pin: string; newPassword: string; confirmNewPassword: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/reset-password`, data, { responseType: 'text' as const });
  }

  unblockRequest(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/unblock-request`, { email }, { responseType: 'text' as const });
  }

  unblockVerify(email: string, pin: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/unblock-verify`, { email, pin }, { responseType: 'text' as const });
  }

  confirmDevice(token: string) {
    return this.http.post<any>(
      `${this.baseUrl}/device/confirm?token=${encodeURIComponent(token)}`,
      {}
    );
  }

  rejectDevice(token: string) {
    return this.http.post<any>(
      `${this.baseUrl}/device/reject?token=${encodeURIComponent(token)}`,
      {}
    );
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  /**
   * Rôle courant : le login enregistre `role` et `session_user`, pas toujours la clé `user`.
   * Compat Learn : TEACHER ≈ TUTOR côté intégré.
   */
  hasRole(role: string): boolean {
    const want = role.toUpperCase();
    const same = (stored: string | undefined | null) => {
      const r = (stored || '').toUpperCase();
      if (!r) return false;
      if (r === want) return true;
      if (want === 'TEACHER' && r === 'TUTOR') return true;
      if (want === 'TUTOR' && r === 'TEACHER') return true;
      return false;
    };

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        if (same(JSON.parse(userStr).role)) return true;
      } catch {
        /* ignore */
      }
    }
    if (same(localStorage.getItem('role'))) return true;

    const sessionRaw = localStorage.getItem('session_user');
    if (sessionRaw) {
      try {
        if (same(JSON.parse(sessionRaw).role)) return true;
      } catch {
        /* ignore */
      }
    }
    return false;
  }

  getStoredUserId(): number | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const id = JSON.parse(userStr).id;
        if (id != null && !Number.isNaN(Number(id))) return Number(id);
      } catch {
        /* ignore */
      }
    }
    const uid = localStorage.getItem('userId');
    if (uid && /^\d+$/.test(uid)) return Number(uid);
    return null;
  }
}

