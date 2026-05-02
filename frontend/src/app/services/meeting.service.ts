import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Meeting {
  id: number;
  applicationId: number;
  meetingDate: string;
  durationMinutes: number;
  meetingLink: string;
  notes?: string;
  assignedToId: number;
  assignedToName: string;
  meetRoomName?: string;
  evaluation?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  applicationJobTitle?: string;
  teacherName?: string;
  jobTitle?: string;
  scoreTechnical?: number;
  scoreCommunication?: number;
  scoreEnglish?: number;
  recommendation?: string;
}

export interface NextMeeting {
  meetingId: number;
  applicationId: number;
  jobTitle: string;
  meetingDate: string;
  meetingLink: string;
  assignedToName: string;
}

/**
 * POST /api/meetings — si `evaluatorId` absent, le backend utilise l’utilisateur du JWT.
 */
export interface ScheduleMeetingRequest {
  applicationId: number;
  meetingDate: string;
  durationMinutes?: number;
  meetingLink?: string;
  notes?: string;
  evaluatorId?: number;
  evaluatorName?: string;
}

@Injectable({ providedIn: 'root' })
export class MeetingService {
  private base = `${environment.apiBase}/meetings`;

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  scheduleMeeting(req: ScheduleMeetingRequest): Observable<Meeting> {
    const body: Record<string, unknown> = {
      applicationId: req.applicationId,
      meetingDate: req.meetingDate,
    };
    if (req.durationMinutes != null) body['durationMinutes'] = req.durationMinutes;
    if (req.meetingLink != null && req.meetingLink !== '') body['meetingLink'] = req.meetingLink;
    if (req.notes != null && String(req.notes).trim() !== '') body['notes'] = req.notes;
    if (req.evaluatorId != null && !Number.isNaN(Number(req.evaluatorId))) {
      body['evaluatorId'] = Number(req.evaluatorId);
      body['evaluatorName'] = (req.evaluatorName && req.evaluatorName.trim()) || 'Évaluateur';
    }
    return this.http.post<Meeting>(this.base, body, { headers: this.authHeaders() });
  }

  updateMeeting(id: number, req: Partial<ScheduleMeetingRequest>): Observable<Meeting> {
    return this.http.put<Meeting>(`${this.base}/${id}`, req, { headers: this.authHeaders() });
  }

  deleteMeeting(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`, { headers: this.authHeaders() });
  }

  getMeetingsByApplication(applicationId: number): Observable<Meeting[]> {
    return this.http.get<Meeting[]>(`${this.base}/application/${applicationId}`, { headers: this.authHeaders() });
  }

  getMyMeetings(): Observable<Meeting[]> {
    return this.http.get<Meeting[]>(`${this.base}/my`, { headers: this.authHeaders() });
  }

  getNextMeeting(): Observable<NextMeeting> {
    return this.http.get<NextMeeting>(`${this.base}/next`, { headers: this.authHeaders() });
  }

  getAllMeetings(): Observable<Meeting[]> {
    return this.http.get<Meeting[]>(this.base, { headers: this.authHeaders() });
  }

  getByRoomName(roomName: string): Observable<Meeting> {
    return this.http.get<Meeting>(`${this.base}/room/${roomName}`, { headers: this.authHeaders() });
  }

  saveEvaluation(id: number, evaluation: any): Observable<Meeting> {
    return this.http.patch<Meeting>(`${this.base}/${id}/evaluation`, evaluation, { headers: this.authHeaders() });
  }
}


