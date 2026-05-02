import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiBaseService } from './api-base.service';

export interface UserDto {
  id: number;
  fullName: string;
  email: string;
  role: string;
  status: string;
  joinedDate?: string;
}

/** Réponse GET /api/users/tutors — même usage que Learn (`getTeachers`) pour l’évaluateur d’entretien. */
export interface TutorRef {
  id: number;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private api: ApiBaseService) {}

  list(page = 0, size = 10) { return this.api.get<any>('/admin/users', { page, size }); }
  get(id: number) { return this.api.get<UserDto>(`/admin/users/${id}`); }

  /**
   * Tuteurs (rôle TUTOR) — liste pour l’évaluateur optionnel.
   * Normalise la réponse (name / firstName+lastName) car le JSON peut varier.
   */
  getTutors(): Observable<TutorRef[]> {
    return this.api.get<Record<string, unknown>[]>('/users/tutors').pipe(
      map((rows) =>
        (rows ?? [])
          .map((x) => {
            const first = String(x['firstName'] ?? '');
            const last = String(x['lastName'] ?? '');
            const combined = [first, last].filter(Boolean).join(' ').trim();
            const name =
              String(x['name'] ?? x['fullName'] ?? '').trim() ||
              combined ||
              String(x['email'] ?? '');
            return {
              id: Number(x['id']),
              name,
              email: String(x['email'] ?? ''),
            };
          })
          .filter((r) => !Number.isNaN(r.id)),
      ),
      catchError(() => of([])),
    );
  }
}
