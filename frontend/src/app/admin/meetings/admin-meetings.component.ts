import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MeetingService, Meeting, ScheduleMeetingRequest } from '../../services/meeting.service';
import { ApplicationService, Application } from '../../services/application.service';
import { UserService, TutorRef } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-meetings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="crud-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Interview Board</h1>
          <p class="page-subtitle">Manage and launch scheduled recruitment meetings</p>
        </div>
        <button class="btn-admin primary" (click)="openAddModal()">
          <i class="ti ti-plus"></i> Manual Schedule
        </button>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Application</th>
              <th>Candidate & Position</th>
              <th>Scheduled</th>
              <th>Evaluation / Scores</th>
              <th>Meeting Link</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of meetings" class="meeting-row">
              <td>
                <span class="app-id">#{{ m.applicationId }}</span>
              </td>
              <td>
                <div class="candidate-info">
                  <span class="name">{{ m.teacherName }}</span>
                  <span class="job">{{ m.jobTitle || 'English Position' }}</span>
                </div>
              </td>
              <td>
                <div class="date-info">
                   <span class="date">{{ m.meetingDate | date:'mediumDate' }}</span>
                   <span class="time">{{ m.meetingDate | date:'shortTime' }}</span>
                </div>
              </td>
              <td>
                @if (m.scoreTechnical || m.scoreCommunication || m.scoreEnglish) {
                  <div class="score-pills">
                    <span class="score-pill tech" title="Technical">{{ m.scoreTechnical }}/5</span>
                    <span class="score-pill comm" title="Communication">{{ m.scoreCommunication }}/5</span>
                    <span class="score-pill eng" title="English">{{ m.scoreEnglish }}/5</span>
                  </div>
                  @if (m.recommendation) {
                    <span class="badge-rec" [class]="m.recommendation.toLowerCase()">
                      {{ m.recommendation }}
                    </span>
                  }
                } @else {
                  <span class="text-muted italic">Pending Review</span>
                }
              </td>
              <td>
                @if (m.meetRoomName) {
                    <button class="btn-launch" (click)="launchMeeting(m.meetRoomName)">
                      <i class="ti ti-player-play"></i> Launch Meet
                    </button>
                } @else if (m.meetingLink) {
                    <a [href]="m.meetingLink" target="_blank" class="link-external">
                      <i class="ti ti-external-link"></i> External Link
                    </a>
                } @else {
                    <span class="text-muted">Not Set</span>
                }
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon edit" (click)="openEditModal(m)" title="Evaluation & Reschedule">
                    <i class="ti ti-checklist text-success" *ngIf="m.scoreTechnical != null"></i>
                    <i class="ti ti-edit" *ngIf="m.scoreTechnical == null"></i>
                  </button>
                  <button class="btn-icon delete" (click)="confirmDelete(m)" title="Cancel Meeting">
                    <i class="ti ti-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="meetings.length === 0">
              <td colspan="6" class="empty-state">
                <i class="ti ti-calendar-event"></i>
                <p>No interviews found in the pipeline.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add / Edit Modal -->
      @if (showModal) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content large" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>
                <i class="ti" [class.ti-plus]="!editingMeeting" [class.ti-edit]="editingMeeting"></i>
                {{ editingMeeting ? 'Manage Interview' : 'Planifier une réunion' }}
              </h3>
              <button class="modal-close" (click)="closeModal()"><i class="ti ti-x"></i></button>
            </div>
            <div class="modal-body">
              @if (!editingMeeting) {
                <p class="modal-intro">Choisir la candidature et la date. L’évaluateur est optionnel (par défaut : vous).</p>
                <div class="form-group">
                  <label for="meet-app">Candidature *</label>
                  <select id="meet-app" [(ngModel)]="ngModel" (ngModelChange)="onAppSelect($event)" name="meetApp" class="form-control">
                    <option [ngValue]="null" disabled>— Choisir une candidature acceptée —</option>
                    <option *ngFor="let app of acceptedApps" [ngValue]="app.id">
                      #{{ app.id }} – {{ app.teacherName }} ({{ app.jobTitle }})
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="meet-eval">Évaluateur (optionnel)</label>
                  <select id="meet-eval" [(ngModel)]="form.evaluatorId" name="meetEval" class="form-control">
                    <option [ngValue]="null">— Par défaut : compte connecté —</option>
                    <option *ngFor="let u of evaluators" [ngValue]="u.id">{{ u.name }} ({{ u.email }})</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="meet-date">Date et heure *</label>
                  <input id="meet-date" type="datetime-local" [(ngModel)]="form.meetingDate" name="meetDate" class="form-control" />
                </div>
                <div class="form-group">
                  <label for="meet-notes">Notes</label>
                  <textarea id="meet-notes" [(ngModel)]="form.notes" name="meetNotes" class="form-control" rows="3"></textarea>
                </div>
              }

              <div class="section-divider" *ngIf="editingMeeting">Evaluation & Scores</div>
              <div class="form-grid" *ngIf="editingMeeting">
                <div class="form-group">
                  <label>Technical Score (1-5)</label>
                  <input type="number" [(ngModel)]="form.scoreTechnical" class="form-control" min="0" max="5">
                </div>
                <div class="form-group">
                  <label>Communication (1-5)</label>
                  <input type="number" [(ngModel)]="form.scoreCommunication" class="form-control" min="0" max="5">
                </div>
                <div class="form-group">
                  <label>English Level (1-5)</label>
                  <input type="number" [(ngModel)]="form.scoreEnglish" class="form-control" min="0" max="5">
                </div>
                <div class="form-group">
                  <label>Overall Recommendation</label>
                  <select [(ngModel)]="form.recommendation" class="form-control">
                    <option value="">— Select —</option>
                    <option value="HIRE">Highly Recommended</option>
                    <option value="REJECT">Not Recommended</option>
                    <option value="PENDING">Waitlist / Consider</option>
                  </select>
                </div>
              </div>

              <div class="section-divider" *ngIf="editingMeeting">Schedule Details</div>
              <div class="form-grid" *ngIf="editingMeeting">
                <div class="form-group">
                  <label>Date & Time</label>
                  <input type="datetime-local" [(ngModel)]="form.meetingDate" class="form-control">
                </div>
                <div class="form-group">
                  <label>Duration (min)</label>
                  <input type="number" [(ngModel)]="form.durationMinutes" class="form-control" min="15" step="15">
                </div>
              </div>

              <div class="form-group" *ngIf="editingMeeting">
                <label>Interview Notes</label>
                <textarea [(ngModel)]="form.notes" rows="3" class="form-control" placeholder="Prep notes or interview feedback..."></textarea>
              </div>

            </div>
            <div class="modal-footer">
              <button class="btn-admin outline" (click)="closeModal()">{{ editingMeeting ? 'Cancel' : 'Annuler' }}</button>
              <button class="btn-admin primary" (click)="saveMeeting()" [disabled]="processing">
                <i class="ti ti-check"></i> {{ processing ? (editingMeeting ? 'Processing...' : 'Enregistrement...') : (editingMeeting ? 'Save Changes' : 'Créer') }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Delete Confirmation -->
      @if (showDeleteModal && toDelete) {
        <div class="modal-overlay" (click)="cancelDelete()">
          <div class="modal-content confirm" (click)="$event.stopPropagation()">
            <div class="confirm-icon"><i class="ti ti-alert-triangle"></i></div>
            <h3>Cancel Interview?</h3>
            <p>This will remove the meeting scheduled for <strong>{{ toDelete.meetingDate | date:'medium' }}</strong>. The tutor will be notified.</p>
            <div class="modal-footer centered">
              <button class="btn-admin outline" (click)="cancelDelete()">Keep Meeting</button>
              <button class="btn-admin danger" (click)="doDelete()" [disabled]="processing">
                 <i class="ti ti-trash"></i> {{ processing ? 'Cancelling...' : 'Cancel Interview' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .crud-page { animation: fadeIn 0.4s ease-out; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
    .page-title { font-size: 32px; font-weight: 800; color: #1e293b; margin: 0; background: linear-gradient(135deg, #1e293b, #334155); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .page-subtitle { color: #64748b; margin: 4px 0 0; font-size: 16px; }

    .btn-admin { display: inline-flex; align-items: center; gap: 10px; padding: 12px 24px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); border: none; 
      &.primary { background: #2563eb; color: #fff; box-shadow: 0 4px 12px rgba(37,99,235,0.2); &:hover { background: #1d4ed8; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(37,99,235,0.3); } }
      &.outline { background: #fff; border: 2px solid #e2e8f0; color: #475569; &:hover { background: #f8fafc; border-color: #cbd5e1; } }
      &.danger { background: #ef4444; color: #fff; &:hover { background: #dc2626; transform: translateY(-2px); } }
      &:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }
    }

    .table-container { background: #fff; border-radius: 24px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid rgba(0,0,0,0.05); }
    .data-table { width: 100%; border-collapse: collapse; 
      th { padding: 20px 24px; background: #f8fafc; text-align: left; font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; }
      td { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
      tr:last-child td { border-bottom: none; }
      .meeting-row:hover { background: #fbfcfe; }
    }

    .app-id { font-family: 'Courier New', monospace; font-weight: 700; color: #2563eb; background: rgba(37,99,235,0.08); padding: 4px 8px; border-radius: 6px; }
    .candidate-info { display: flex; flex-direction: column; .name { font-weight: 700; color: #1e293b; font-size: 15px; } .job { font-size: 12px; color: #64748b; margin-top: 2px; } }
    .date-info { display: flex; flex-direction: column; .date { font-weight: 600; color: #1e293b; } .time { font-size: 12px; color: #94a3b8; } }
    .duration-badge { display: inline-flex; align-items: center; gap: 6px; background: #f1f5f9; color: #475569; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }

    .score-pills { display: flex; gap: 6px; margin-bottom: 8px; }
    .score-pill { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; 
      &.tech { background: #eff6ff; color: #2563eb; }
      &.comm { background: #f0fdf4; color: #16a34a; }
      &.eng { background: #faf5ff; color: #9333ea; }
    }
    .badge-rec { padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 800; letter-spacing: 0.02em; 
      &.hire { background: #d1fae5; color: #065f46; }
      &.reject { background: #fee2e2; color: #991b1b; }
      &.pending { background: #fef3c7; color: #92400e; }
    }

    .btn-launch { background: #10b981; color: #fff; border: none; padding: 10px 18px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; &:hover { background: #059669; transform: scale(1.03); } }
    .link-external { color: #3b82f6; text-decoration: none; font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 6px; &:hover { text-decoration: underline; } }

    .action-buttons { display: flex; gap: 10px; }
    .btn-icon { width: 38px; height: 38px; border-radius: 12px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; i { font-size: 18px; }
      &.edit { background: #f1f5f9; color: #475569; &:hover { background: #e2e8f0; color: #1e293b; } }
      &.delete { background: #fee2e2; color: #ef4444; &:hover { background: #fecaca; } }
    }

    .section-divider { margin: 24px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #f1f5f9; color: #94a3b8; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }

    /* Modal Styles */
    .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; animation: fadeIn 0.2s ease; }
    .modal-content { background: #fff; border-radius: 28px; width: 100%; max-width: 550px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.2); 
      &.large { max-width: 650px; }
      &.confirm { text-align: center; padding: 40px; }
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 24px 32px; border-bottom: 1px solid #f1f5f9; h3 { margin: 0; font-size: 20px; font-weight: 800; color: #1e293b; display: flex; align-items: center; gap: 12px; } }
    .modal-close { background: #f1f5f9; border: none; width: 36px; height: 36px; border-radius: 10px; cursor: pointer; color: #64748b; &:hover { background: #e2e8f0; color: #1e293b; } }
    .modal-body { padding: 32px; overflow-y: auto; max-height: 70vh; }
    .modal-footer { display: flex; gap: 12px; justify-content: flex-end; padding: 20px 32px; background: #f8fafc; border-bottom-left-radius: 28px; border-bottom-right-radius: 28px; &.centered { justify-content: center; border-radius: 0; background: transparent; } }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .form-group { margin-bottom: 20px; label { display: block; font-size: 14px; font-weight: 700; color: #475569; margin-bottom: 8px; } }
    .form-control { width: 100%; padding: 14px 18px; border: 2px solid #f1f5f9; border-radius: 14px; font-size: 15px; color: #1e293b; transition: all 0.2s; &:focus { border-color: #2563eb; outline: none; background: #fff; } }
    .modal-intro { font-size: 14px; color: #64748b; margin: 0 0 20px; line-height: 1.5; }

    .confirm-icon { width: 80px; height: 80px; background: #fef2f2; color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px; margin: 0 auto 24px; }
    .confirm h3 { font-size: 24px; font-weight: 800; color: #1e293b; margin-bottom: 12px; }
    .confirm p { color: #64748b; line-height: 1.6; margin-bottom: 32px; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class AdminMeetingsComponent implements OnInit {
  private meetingService = inject(MeetingService);
  private appService = inject(ApplicationService);
  private userService = inject(UserService);
  private toast = inject(ToastService);
  private router = inject(Router);

  meetings: Meeting[] = [];
  acceptedApps: Application[] = [];
  evaluators: TutorRef[] = [];
  
  showModal = false;
  editingMeeting: Meeting | null = null;
  processing = false;

  showDeleteModal = false;
  toDelete: Meeting | null = null;

  ngModel: any = null;

  form = {
    applicationId: null as number | null,
    evaluatorId: null as number | null,
    meetingDate: '',
    durationMinutes: 60,
    notes: '',
    meetRoomName: '',
    scoreTechnical: null as number | null,
    scoreCommunication: null as number | null,
    scoreEnglish: null as number | null,
    recommendation: ''
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.meetingService.getAllMeetings().subscribe({
      next: (m: Meeting[]) => this.meetings = m ?? [],
      error: () => this.meetings = []
    });
    
    this.appService.getAll().subscribe({
      next: (apps: Application[]) => {
        this.acceptedApps = apps.filter(a => a.status === 'ACCEPTED');
      }
    });

    this.userService.getTutors().subscribe({ next: (list) => (this.evaluators = list ?? []) });
  }

  launchMeeting(roomName: string): void {
    if (!roomName) return;
    this.router.navigate(['/meet-room', roomName]);
  }

  onAppSelect(id: number): void {
    this.form.applicationId = id;
    this.ngModel = id;
  }

  openAddModal(): void {
    this.editingMeeting = null;
    this.ngModel = null;
    const d = new Date();
    d.setMinutes(d.getMinutes() + 60);
    this.form = {
      applicationId: null,
      evaluatorId: null,
      meetingDate: d.toISOString().slice(0, 16),
      durationMinutes: 60,
      notes: '',
      meetRoomName: '',
      scoreTechnical: null,
      scoreCommunication: null,
      scoreEnglish: null,
      recommendation: ''
    };
    this.showModal = true;
  }

  openEditModal(m: Meeting): void {
    this.editingMeeting = m;
    let dateStr = '';
    if (m.meetingDate) {
      const d = new Date(m.meetingDate);
      dateStr = d.toISOString().substring(0, 16);
    }
    
    this.form = {
      applicationId: m.applicationId,
      evaluatorId: m.assignedToId ?? null,
      meetingDate: dateStr,
      durationMinutes: m.durationMinutes || 60,
      notes: m.notes || '',
      meetRoomName: m.meetRoomName || '',
      scoreTechnical: m.scoreTechnical ?? null,
      scoreCommunication: m.scoreCommunication ?? null,
      scoreEnglish: m.scoreEnglish ?? null,
      recommendation: m.recommendation || ''
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingMeeting = null;
    this.ngModel = null;
  }

  saveMeeting(): void {
    if (!this.form.meetingDate) {
      this.toast.error('Date and time are required.');
      return;
    }

    this.processing = true;
    const userId = Number(localStorage.getItem('userId') || 0);

    // Format date to ISO with seconds
    const scheduleDate = new Date(this.form.meetingDate);
    let ds = scheduleDate.toISOString().split('.')[0];
    if (ds.length <= 16) ds += ':00';
    const formattedDate = ds;

    if (this.editingMeeting) {
      const req = {
        meetingDate: formattedDate,
        durationMinutes: this.form.durationMinutes,
        notes: this.form.notes,
        evaluatorId: userId,
        scoreTechnical: this.form.scoreTechnical,
        scoreCommunication: this.form.scoreCommunication,
        scoreEnglish: this.form.scoreEnglish,
        recommendation: this.form.recommendation
      };
      this.meetingService.updateMeeting(this.editingMeeting.id, req as any).subscribe({
        next: () => {
          this.toast.success('Meeting updated successfully');
          this.loadData();
          this.closeModal();
          this.processing = false;
        },
        error: (err: any) => {
          console.error('Update error:', err);
          this.toast.error('Update failed: ' + (err.error || 'Server error'));
          this.processing = false;
        }
      });
    } else {
      if (!this.form.applicationId) {
        this.toast.error('Veuillez choisir une candidature.');
        this.processing = false;
        return;
      }
      const evId = this.form.evaluatorId != null ? Number(this.form.evaluatorId) : NaN;
      const ev = !Number.isNaN(evId) ? this.evaluators.find((u) => u.id === evId) : undefined;
      const req: ScheduleMeetingRequest = {
        applicationId: this.form.applicationId,
        meetingDate: formattedDate,
        durationMinutes: 60,
        notes: this.form.notes?.trim() || undefined,
        meetingLink: '',
      };
      if (ev != null && !Number.isNaN(evId)) {
        req.evaluatorId = evId;
        req.evaluatorName = ev.name?.trim() || 'Évaluateur';
      }

      this.meetingService.scheduleMeeting(req).subscribe({
        next: () => {
          this.toast.success('Meeting scheduled successfully');
          this.loadData();
          this.closeModal();
          this.processing = false;
        },
        error: (err: any) => {
          console.error('Schedule error:', err);
          this.toast.error('Failed to schedule: ' + (err.error || 'Server error'));
          this.processing = false;
        }
      });
    }
  }

  confirmDelete(m: Meeting): void { this.toDelete = m; this.showDeleteModal = true; }
  cancelDelete(): void { this.toDelete = null; this.showDeleteModal = false; }
  
  doDelete(): void {
    if (!this.toDelete) return;
    this.processing = true;
    this.meetingService.deleteMeeting(this.toDelete.id).subscribe({
      next: () => {
        this.toast.success('Meeting cancelled');
        this.meetings = this.meetings.filter(m => m.id !== this.toDelete!.id);
        this.cancelDelete();
        this.processing = false;
      },
      error: () => {
        this.toast.error('Failed to cancel meeting');
        this.processing = false;
        this.cancelDelete();
      }
    });
  }
}
