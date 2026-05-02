import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApplicationService, Application } from '../../services/application.service';
import { MeetingService, ScheduleMeetingRequest } from '../../services/meeting.service';
import { UserService, TutorRef } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-applications',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="crud-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Applications</h1>
          <p class="page-subtitle">
            @if (jobId) {
              Candidatures pour cette offre (job #{{ jobId }})
            } @else {
              Toutes les candidatures — cliquez sur un n° d’offre pour filtrer
            }
          </p>
        </div>
        <a routerLink="/admin/jobs" class="btn-admin outline">
          <i class="ti ti-arrow-left"></i> Back to Jobs
        </a>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              @if (!jobId) {
                <th>Offre (job)</th>
              }
              <th>Tutor</th>
              <th>Applied</th>
              <th>Match Score</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let app of applications">
              @if (!jobId) {
                <td>
                  <a [routerLink]="['/admin/applications/job', app.jobId]" class="job-link">#{{ app.jobId }}</a>
                </td>
              }
              <td>
                <strong>{{ app.teacherName }}</strong>
                <div class="sub">{{ app.motivation | slice:0:80 }}{{ (app.motivation?.length || 0) > 80 ? '...' : '' }}</div>
              </td>
              <td>{{ app.appliedAt | date:'mediumDate' }}</td>
              <td>
                <div class="score-bar">
                  <div class="score-fill" [style.width.%]="app.matchScore"></div>
                  <span>{{ app.matchScore }}%</span>
                </div>
              </td>
              <td>
                <span class="badge" [attr.data-status]="app.status">{{ app.status }}</span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn-action accept" (click)="updateStatus(app, 'ACCEPTED')" title="Accept" [disabled]="app.status === 'ACCEPTED'">
                    <i class="ti ti-check"></i>
                  </button>
                  <button class="btn-action reject" (click)="updateStatus(app, 'REJECTED')" title="Reject" [disabled]="app.status === 'REJECTED'">
                    <i class="ti ti-x"></i>
                  </button>
                  <button class="btn-action schedule" (click)="openSchedule(app)" title="Schedule Meeting" *ngIf="app.status === 'ACCEPTED'">
                    <i class="ti ti-calendar-plus"></i>
                  </button>
                  <button class="btn-action view" (click)="viewCv(app)" title="View CV">
                    <i class="ti ti-file-text"></i>
                  </button>
                  <button class="btn-action view" (click)="viewCertificat(app)" title="View Certificate" *ngIf="app.certificatPath">
                    <i class="ti ti-certificate"></i>
                  </button>
                  <button class="btn-action video" (click)="viewVideo(app)" title="View Video Pitch" *ngIf="app.videoPitchPath">
                    <i class="ti ti-video"></i>
                  </button>
                </div>
              </td>

            </tr>
            <tr *ngIf="applications.length === 0">
              <td [attr.colspan]="jobId ? 5 : 6" class="empty-state">
                <i class="ti ti-users"></i>
                <p>No applications yet</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Planifier une réunion (même principe que Learn / admin-meeting-form) -->
      @if (showScheduleModal && selectedApp) {
        <div class="modal-overlay" (click)="closeSchedule()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3><i class="ti ti-calendar-plus"></i> Planifier une réunion</h3>
              <button class="modal-close" (click)="closeSchedule()"><i class="ti ti-x"></i></button>
            </div>
            <div class="modal-body">
              <p class="modal-intro">Candidature : <strong>#{{ selectedApp.id }}</strong> — {{ selectedApp.teacherName }}</p>
              <div class="form-group">
                <label for="sched-eval">Évaluateur (optionnel)</label>
                <select id="sched-eval" [(ngModel)]="meetingForm.evaluatorId" name="schedEval" class="form-control">
                  <option [ngValue]="null">— Par défaut : compte connecté —</option>
                  <option *ngFor="let u of evaluators" [ngValue]="u.id">{{ u.name }} ({{ u.email }})</option>
                </select>
              </div>
              <div class="form-group">
                <label for="sched-date">Date et heure *</label>
                <input id="sched-date" type="datetime-local" [(ngModel)]="meetingForm.meetingDate" name="schedDate" class="form-control" />
              </div>
              <div class="form-group">
                <label for="sched-notes">Notes</label>
                <textarea id="sched-notes" [(ngModel)]="meetingForm.notes" name="schedNotes" rows="3" class="form-control"></textarea>
              </div>
              @if (scheduleSuccess) {
                <div class="alert success"><i class="ti ti-check-circle"></i> Réunion créée.</div>
              }
              @if (scheduleError) {
                <div class="alert error"><i class="ti ti-alert-circle"></i> {{ scheduleError }}</div>
              }
            </div>
            <div class="modal-footer">
              <button class="btn-admin outline" (click)="closeSchedule()">Annuler</button>
              <button class="btn-admin primary" (click)="submitSchedule()" [disabled]="scheduling">
                <i class="ti ti-check"></i> {{ scheduling ? 'Enregistrement...' : 'Créer' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .crud-page { animation: fadeIn 0.3s ease; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .page-title { font-family: var(--font-family); font-size: 28px; font-weight: 700; color: var(--color-primary); margin: 0; }
    .page-subtitle { font-size: 15px; color: var(--color-gray-500); margin: 6px 0 0; }
    .btn-admin { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.25s ease; border: none; text-decoration: none; i { font-size: 18px; } &.primary { background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color: #fff; box-shadow: 0 4px 15px rgba(61,61,96,0.3); &:hover { box-shadow: 0 8px 25px rgba(61,61,96,0.4); transform: translateY(-2px); } &:disabled { opacity: 0.6; cursor: not-allowed; transform: none; } } &.outline { background: var(--color-white); color: var(--color-primary); border: 2px solid rgba(61,61,96,0.1); &:hover { border-color: rgba(61,61,96,0.25); background: rgba(61,61,96,0.04); } } }
    .table-container { background: var(--color-white); border-radius: 20px; box-shadow: var(--shadow-card); overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; th, td { padding: 16px 20px; text-align: left; vertical-align: middle; } th { background: rgba(61,61,96,0.03); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-gray-500); } td { border-bottom: 1px solid rgba(61,61,96,0.06); font-size: 14px; color: var(--color-primary); } tr:last-child td { border-bottom: none; } }
    .sub { font-size: 12px; color: var(--color-gray-500); margin-top: 4px; }
    .score-bar { display: flex; align-items: center; gap: 8px; width: 120px; }
    .score-fill { height: 6px; border-radius: 3px; background: linear-gradient(90deg, var(--color-primary), var(--color-secondary)); flex-shrink: 0; }
    .score-bar span { font-size: 12px; font-weight: 600; color: var(--color-primary); }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; &[data-status="PENDING"] { background: rgba(245,158,11,0.1); color: #d97706; } &[data-status="ACCEPTED"] { background: rgba(16,185,129,0.1); color: #10b981; } &[data-status="REJECTED"] { background: rgba(200,70,48,0.1); color: var(--color-cta); } }
    .action-buttons { display: flex; gap: 8px; }
    .btn-action { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 10px; border: none; cursor: pointer; transition: all 0.2s; i { font-size: 18px; } 
      &.accept { background: rgba(16,185,129,0.1); color: #10b981; &:hover { background: rgba(16,185,129,0.2); } &:disabled { opacity: 0.4; cursor: not-allowed; } } 
      &.reject { background: rgba(200,70,48,0.1); color: var(--color-cta); &:hover { background: rgba(200,70,48,0.2); } &:disabled { opacity: 0.4; cursor: not-allowed; } } 
      &.schedule { background: rgba(59,130,246,0.1); color: #3b82f6; &:hover { background: rgba(59,130,246,0.2); } } 
      &.view { background: rgba(107,114,128,0.1); color: #6b7280; &:hover { background: rgba(107,114,128,0.2); } }
      &.video { background: rgba(147,51,234,0.1); color: #9333ea; &:hover { background: rgba(147,51,234,0.2); } }
    }

    .empty-state { text-align: center; padding: 60px 20px !important; color: var(--color-gray-400); i { font-size: 48px; margin-bottom: 16px; display: block; } }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .modal-content { background: var(--color-white); border-radius: 20px; width: 100%; max-width: 500px; box-shadow: var(--shadow-2xl); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid rgba(61,61,96,0.08); h3 { font-size: 18px; font-weight: 700; color: var(--color-primary); margin: 0; display: flex; align-items: center; gap: 8px; } }
    .modal-close { width: 32px; height: 32px; border: none; background: rgba(61,61,96,0.06); border-radius: 8px; cursor: pointer; }
    .modal-body { padding: 24px; }
    .modal-footer { display: flex; gap: 12px; justify-content: flex-end; padding: 16px 24px; border-top: 1px solid rgba(61,61,96,0.08); }
    .form-group { margin-bottom: 16px; label { display: block; font-size: 14px; font-weight: 600; color: var(--color-primary); margin-bottom: 8px; } }
    .form-control { width: 100%; padding: 12px 16px; border: 2px solid rgba(61,61,96,0.1); border-radius: 12px; font-size: 14px; &:focus { outline: none; border-color: var(--color-primary); } }
    .alert { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-radius: 12px; margin-top: 16px; font-size: 14px; i { font-size: 20px; } &.success { background: rgba(16,185,129,0.1); color: #10b981; } &.error { background: rgba(200,70,48,0.1); color: var(--color-cta); } }
    .modal-intro { font-size: 14px; color: var(--color-gray-500); margin: 0 0 16px; line-height: 1.5; }
    .job-link { font-weight: 700; color: var(--color-primary); text-decoration: none; &:hover { text-decoration: underline; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class AdminApplicationsComponent implements OnInit {
  private appService = inject(ApplicationService);
  private meetingService = inject(MeetingService);
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  /** Défini si l’URL est `/admin/applications/job/:jobId` ; sinon liste globale. */
  jobId: number | null = null;
  applications: Application[] = [];
  showScheduleModal = false;
  selectedApp: Application | null = null;
  scheduling = false;
  scheduleSuccess = false;
  scheduleError = '';
  evaluators: TutorRef[] = [];

  meetingForm = {
    evaluatorId: null as number | null,
    meetingDate: '',
    notes: '',
  };

  ngOnInit(): void {
    this.userService.getTutors().subscribe({ next: (list) => (this.evaluators = list ?? []) });

    this.route.paramMap.subscribe((params) => {
      const jid = params.get('jobId');
      this.jobId = jid ? +jid : null;
      if (this.jobId) {
        this.appService.getApplicationsByJob(this.jobId).subscribe({
          next: (apps: Application[]) => (this.applications = apps ?? []),
          error: () => (this.applications = []),
        });
      } else {
        this.appService.getAll().subscribe({
          next: (apps: Application[]) => (this.applications = apps ?? []),
          error: () => (this.applications = []),
        });
      }
    });
  }

  updateStatus(app: Application, status: 'ACCEPTED' | 'REJECTED'): void {
    this.appService.updateStatus(app.id, status).subscribe({
      next: (updated: Application) => {
        app.status = updated.status;
        if (updated.scheduledMeetingId != null) {
          app.scheduledMeetingId = updated.scheduledMeetingId;
          app.scheduledMeetingAt = updated.scheduledMeetingAt;
          app.scheduledMeetRoomName = updated.scheduledMeetRoomName;
        }
        if (status === 'ACCEPTED' && updated.scheduledMeetingId != null) {
          const room = updated.scheduledMeetRoomName ? ` Salle : ${updated.scheduledMeetRoomName}.` : '';
          this.toast.success(
            `Candidature acceptée. Un entretien a été créé automatiquement (comme sur Learn).${room}`,
          );
        } else if (status === 'ACCEPTED') {
          this.toast.success('Candidature acceptée.');
        } else {
          this.toast.success('Candidature refusée.');
        }
      },
      error: (err: unknown) => {
        const msg =
          (err as { error?: { message?: string } })?.error?.message ||
          'Impossible de mettre à jour le statut (vérifiez d’être connecté en admin et que le job-service répond).';
        this.toast.error(msg);
      },
    });
  }

  openSchedule(app: Application): void {
    this.selectedApp = app;
    this.showScheduleModal = true;
    this.scheduleSuccess = false;
    this.scheduleError = '';
    const d = new Date();
    d.setMinutes(d.getMinutes() + 60);
    this.meetingForm = { evaluatorId: null, meetingDate: d.toISOString().slice(0, 16), notes: '' };
  }

  closeSchedule(): void {
    this.showScheduleModal = false;
    this.selectedApp = null;
  }

  submitSchedule(): void {
    if (!this.selectedApp) return;
    if (!this.meetingForm.meetingDate?.trim()) {
      this.scheduleError = 'La date et l’heure sont requises.';
      return;
    }
    this.scheduling = true;
    this.scheduleError = '';
    const evId = this.meetingForm.evaluatorId != null ? Number(this.meetingForm.evaluatorId) : NaN;
    const ev = !Number.isNaN(evId) ? this.evaluators.find((u) => u.id === evId) : undefined;

    let meetingDate = this.meetingForm.meetingDate.trim();
    if (meetingDate.length <= 16) meetingDate = meetingDate + ':00';

    const req: ScheduleMeetingRequest = {
      applicationId: this.selectedApp.id,
      meetingDate,
      durationMinutes: 60,
      meetingLink: '',
      notes: this.meetingForm.notes?.trim() || undefined,
    };
    if (ev != null && !Number.isNaN(evId)) {
      req.evaluatorId = evId;
      req.evaluatorName = ev.name?.trim() || 'Évaluateur';
    }

    this.meetingService.scheduleMeeting(req).subscribe({
      next: () => { this.scheduling = false; this.scheduleSuccess = true; },
      error: (e: any) => { this.scheduling = false; this.scheduleError = e?.error?.message || 'Failed to schedule meeting.'; }
    });
  }

  viewCv(app: Application): void {
    this.appService.getCvBlob(app.id).subscribe({
      next: (blob) => this.openBlob(blob, 'application/pdf'),
      error: (err) => console.error('Failed to open CV', err)
    });
  }

  viewCertificat(app: Application): void {
    this.appService.getCertificatBlob(app.id).subscribe({
      next: (blob) => this.openBlob(blob, blob.type || 'application/pdf'),
      error: (err) => console.error('Failed to open Certificat', err)
    });
  }

  viewVideo(app: Application): void {
    this.appService.getVideoPitchBlob(app.id).subscribe({
      next: (blob) => this.openBlob(blob, 'video/webm'),
      error: (err) => console.error('Failed to open Video', err)
    });
  }

  private openBlob(blob: Blob, type: string): void {
    const displayBlob = new Blob([blob], { type });
    const url = URL.createObjectURL(displayBlob);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
}

