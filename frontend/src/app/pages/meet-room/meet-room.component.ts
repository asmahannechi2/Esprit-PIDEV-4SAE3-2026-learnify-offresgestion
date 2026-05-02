import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MeetingService, Meeting } from '../../services/meeting.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

declare var JitsiMeetExternalAPI: any;

@Component({
  selector: 'app-meet-room',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="meet-wrapper" [class.sidebar-open]="showSidebar">
      <div class="meet-overlay-header">
         <div class="left-head">
           <button class="btn-exit" (click)="goBack()">
              <i class="ti ti-arrow-left"></i> Quitter
           </button>
           <div class="room-info">
             <span class="room-title">{{ meeting?.applicationJobTitle || 'Entretien' }}</span>
             <span class="room-prof" *ngIf="meeting?.teacherName">Candidat : {{ meeting?.teacherName }}</span>
           </div>
         </div>
         
         <div class="right-head">
           <button *ngIf="isAdmin" class="btn-toggle-eval" (click)="toggleSidebar()">
             <i class="ti ti-clipboard-check"></i> 
             {{ showSidebar ? 'Fermer Évaluation' : 'Ouvrir Évaluation' }}
           </button>
         </div>
      </div>

      <div class="meet-main-content">
        <div #jitsiContainer class="jitsi-iframe-container"></div>
        
        <!-- Sidebar Evaluation -->
        <div class="meet-sidebar" *ngIf="showSidebar && isAdmin">
          <div class="sidebar-header">
            <h3>Évaluation du Candidat</h3>
            <p>Remplissez les critères pendant l'entretien</p>
          </div>
          
          <div class="sidebar-body">
            <div class="eval-group">
              <label>Linguistique (Grammaire / Lexique)</label>
              <div class="rating-stars">
                <input type="number" [(ngModel)]="evalData.scoreTechnical" min="1" max="5" class="form-input">
              </div>
            </div>
 
            <div class="eval-group">
              <label>Prononciation & Fluidité</label>
              <div class="rating-stars">
                <input type="number" [(ngModel)]="evalData.scoreCommunication" min="1" max="5" class="form-input">
              </div>
            </div>
 
            <div class="eval-group">
              <label>Compétences Pédagogiques (ESL)</label>
              <div class="rating-stars">
                <input type="number" [(ngModel)]="evalData.scoreEnglish" min="1" max="5" class="form-input">
              </div>
            </div>

            <div class="eval-group">
              <label>Recommandation</label>
              <select [(ngModel)]="evalData.recommendation" class="form-input">
                <option value="FAVORABLE">Favorable</option>
                <option value="RESERVE">Sous réserve</option>
                <option value="DEFAVORABLE">Défavorable</option>
              </select>
            </div>

            <div class="eval-group">
              <label>Commentaires / Notes</label>
              <textarea [(ngModel)]="evalData.notes" rows="5" class="form-input" placeholder="Points forts, points faibles..."></textarea>
            </div>
          </div>

          <div class="sidebar-footer">
            <button class="btn-save-eval" (click)="saveEvaluation()" [disabled]="saving">
              <i class="ti ti-device-floppy"></i> 
              {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .meet-wrapper {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 9999;
      background: #000;
      display: flex;
      flex-direction: column;
    }
    .meet-overlay-header {
      height: 70px;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #1a1a1a;
      color: #fff;
      border-bottom: 1px solid #333;
    }
    .left-head { display: flex; align-items: center; gap: 24px; }
    .room-info { display: flex; flex-direction: column; }
    .room-title { font-weight: 600; font-size: 1.1rem; color: #fff; }
    .room-prof { font-size: 0.85rem; color: #94a3b8; }

    .btn-exit {
      background: #334155;
      color: white;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      display: flex; align-items: center; gap: 8px;
      transition: all 0.2s;
      &:hover { background: #1e293b; }
    }

    .btn-toggle-eval {
      background: #2563eb;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      display: flex; align-items: center; gap: 8px;
      transition: all 0.3s;
      &:hover { background: #1d4ed8; transform: translateY(-1px); }
    }

    .meet-main-content {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    .jitsi-iframe-container {
      flex: 1;
      background: #000;
    }

    .meet-sidebar {
      width: 350px;
      background: #f8fafc;
      border-left: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    .sidebar-header {
      padding: 24px;
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      h3 { margin: 0; font-size: 1.2rem; color: #1e293b; }
      p { margin: 4px 0 0; font-size: 0.85rem; color: #64748b; }
    }

    .sidebar-body {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }

    .eval-group {
      margin-bottom: 20px;
      label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.9rem; color: #475569; }
    }

    .form-input {
      width: 100%;
      padding: 10px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.95rem;
      &:focus { border-color: #2563eb; outline: none; }
    }

    .sidebar-footer {
      padding: 24px;
      background: #fff;
      border-top: 1px solid #e2e8f0;
    }

    .btn-save-eval {
      width: 100%;
      background: #10b981;
      color: white;
      border: none;
      padding: 12px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      transition: background 0.2s;
      &:hover { background: #059669; }
      &:disabled { background: #94a3b8; cursor: not-allowed; }
    }
  `]
})
export class MeetRoomComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('jitsiContainer') jitsiContainer!: ElementRef;
  
  private meetingService = inject(MeetingService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  roomName: string = '';
  meeting: Meeting | null = null;
  api: any;
  isAdmin = false;
  showSidebar = false;
  saving = false;

  evalData = {
    scoreTechnical: 0,
    scoreCommunication: 0,
    scoreEnglish: 0,
    recommendation: 'FAVORABLE',
    notes: ''
  };

  ngOnInit(): void {
    this.roomName = this.route.snapshot.paramMap.get('roomName') || '';
    this.isAdmin = this.auth.hasRole('ADMIN');
    this.loadMeeting();
  }

  loadMeeting(): void {
    if (this.roomName) {
      this.meetingService.getByRoomName(this.roomName).subscribe({
        next: (m: Meeting) => {
          this.meeting = m;
          if (m.scoreTechnical) this.evalData.scoreTechnical = m.scoreTechnical;
          if (m.scoreCommunication) this.evalData.scoreCommunication = m.scoreCommunication;
          if (m.scoreEnglish) this.evalData.scoreEnglish = m.scoreEnglish;
          if (m.recommendation) this.evalData.recommendation = m.recommendation;
          if (m.notes) this.evalData.notes = m.notes;
        }
      });
    }
  }

  ngAfterViewInit(): void {
    if (this.roomName) {
      setTimeout(() => this.initMeet(), 500);
    }
  }

  initMeet(): void {
    const domain = 'meet.jit.si';
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    const options = {
      roomName: this.roomName,
      width: '100%',
      height: '100%',
      parentNode: this.jitsiContainer.nativeElement,
      configOverwrite: {
        startWithAudioMuted: false,
        disableInviteFunctions: true,
        prejoinPageEnabled: false,
        lobbyModeEnabled: false,
        disableModeratorIndicator: true,
        defaultRemoteDisplayName: 'Candidat',
        enableWelcomePage: false,
        enableNoisyDetection: false
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false,
        DISPLAY_WELCOME_FOOTER: false,
        MOBILE_APP_PROMO: false
      },
      userInfo: {
          displayName: currentUser.name || 'Admin Learnify'
      }
    };
    this.api = new JitsiMeetExternalAPI(domain, options);
  }

  toggleSidebar(): void {
    this.showSidebar = !this.showSidebar;
  }

  saveEvaluation(): void {
    if (!this.meeting) return;
    this.saving = true;
    this.meetingService.saveEvaluation(this.meeting.id, this.evalData).subscribe({
      next: () => {
        this.saving = false;
        this.toast.success('Évaluation enregistrée avec succès');
      },
      error: () => {
        this.saving = false;
        this.toast.error("Erreur lors de l'enregistrement");
      }
    });
  }

  goBack(): void {
    window.history.back();
  }

  ngOnDestroy(): void {
    if (this.api) {
      this.api.dispose();
    }
  }
}
