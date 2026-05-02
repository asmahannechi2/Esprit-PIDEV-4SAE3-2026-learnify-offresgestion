import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MongoPost {
  id: string;
  title: string;
  content?: string;
  excerpt?: string;
  status: 'draft' | 'published';
  authorLabel?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MongoPostPayload {
  title: string;
  content?: string;
  excerpt?: string;
  status?: 'draft' | 'published';
  authorLabel?: string;
}

@Injectable({ providedIn: 'root' })
export class MongoPostService {
  private readonly base = `${environment.apiBase}/mongo-events/posts`;

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  list(): Observable<MongoPost[]> {
    return this.http.get<MongoPost[]>(this.base, { headers: this.authHeaders() });
  }

  getById(id: string): Observable<MongoPost> {
    return this.http.get<MongoPost>(`${this.base}/${id}`, { headers: this.authHeaders() });
  }

  create(body: MongoPostPayload): Observable<MongoPost> {
    return this.http.post<MongoPost>(this.base, body, { headers: this.authHeaders() });
  }

  update(id: string, body: Partial<MongoPostPayload>): Observable<MongoPost> {
    return this.http.put<MongoPost>(`${this.base}/${id}`, body, { headers: this.authHeaders() });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`, { headers: this.authHeaders() });
  }
}
