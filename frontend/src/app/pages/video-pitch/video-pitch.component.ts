import { Component, ElementRef, OnInit, ViewChild, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationService } from '../../services/application.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-video-pitch',
  templateUrl: './video-pitch.component.html',
  styleUrl: './video-pitch.component.scss',
  standalone: false
})
export class VideoPitchComponent implements OnInit, OnDestroy {
  @ViewChild('videoPreview') videoPreview!: ElementRef<HTMLVideoElement>;
  
  applicationId: number | null = null;
  isRecording = false;
  recordedBlob: Blob | null = null;
  previewUrl: string | null = null;
  mediaRecorder: MediaRecorder | null = null;
  stream: MediaStream | null = null;
  chunks: Blob[] = [];
  
  recordingTime = 0;
  timerInterval: any;
  maxTime = 60; // 60 seconds limit
  
  loading = false;
  error: string | null = null;
  /** True après getUserMedia — évite clic sans effet si la caméra n’est pas prête. */
  cameraReady = false;
  cameraStarting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private applicationService: ApplicationService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.applicationId = +id;
    } else {
      this.toast.error('Candidature introuvable.');
      this.router.navigate(['/job-offers']);
    }
    
    // Defer the camera start to ensure the view child is ready if needed, or just start it
    setTimeout(() => this.startCamera(), 500);
  }

  ngOnDestroy(): void {
    this.stopCamera();
    this.stopTimer();
  }

  async startCamera() {
    this.cameraStarting = true;
    this.cameraReady = false;
    this.cdr.markForCheck();
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true,
      });
      if (this.videoPreview && this.videoPreview.nativeElement) {
        this.videoPreview.nativeElement.srcObject = this.stream;
        this.videoPreview.nativeElement.muted = true; // Prevents echo during recording
        await this.videoPreview.nativeElement.play().catch(() => undefined);
      }
      this.cameraReady = !!this.stream;
    } catch (err) {
      console.error('Error accessing camera:', err);
      this.error = "Impossible d'accéder à la caméra ou au micro. Vérifiez vos permissions.";
      this.toast.error(this.error);
      this.cameraReady = false;
    } finally {
      this.cameraStarting = false;
      this.cdr.markForCheck();
    }
  }

  /** Codec supporté par le navigateur pour MediaRecorder (évite échec silencieux). */
  private pickRecorderOptions(): MediaRecorderOptions | undefined {
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];
    for (const mimeType of candidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mimeType)) {
        return { mimeType };
      }
    }
    return undefined;
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.cameraReady = false;
  }

  startRecording() {
    if (!this.stream) {
      this.toast.warning('La caméra n’est pas prête. Attendez la fin du chargement ou réessayez.');
      return;
    }
    if (typeof MediaRecorder === 'undefined') {
      this.toast.error('L’enregistrement vidéo n’est pas disponible dans ce navigateur. Utilisez Chrome ou Edge à jour.');
      return;
    }

    const opts = this.pickRecorderOptions();
    try {
      this.chunks = [];
      this.mediaRecorder = opts
        ? new MediaRecorder(this.stream, opts)
        : new MediaRecorder(this.stream);
    } catch (e) {
      console.error('MediaRecorder:', e);
      this.toast.error('Impossible de démarrer l’enregistrement. Essayez un autre navigateur ou vérifiez les permissions.');
      return;
    }

    const outMime = opts?.mimeType || this.mediaRecorder.mimeType || 'video/webm';

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };

    this.mediaRecorder.onerror = (ev) => {
      console.error('MediaRecorder error', ev);
      this.toast.error('Erreur pendant l’enregistrement.');
      this.isRecording = false;
      this.stopTimer();
      this.cdr.markForCheck();
    };

    this.mediaRecorder.onstop = () => {
      const fromChunk = this.chunks[0]?.type;
      const raw = fromChunk || this.mediaRecorder?.mimeType || outMime || 'video/webm';
      const blobType = raw.startsWith('video/') ? raw.split(';')[0].trim() : 'video/webm';
      this.recordedBlob = new Blob(this.chunks, { type: blobType });
      this.previewUrl = URL.createObjectURL(this.recordedBlob);
      this.isRecording = false; // Transition only when the blob is generated
      
      if (this.videoPreview && this.videoPreview.nativeElement) {
        this.videoPreview.nativeElement.srcObject = null;
        this.videoPreview.nativeElement.src = this.previewUrl;
        this.videoPreview.nativeElement.muted = false;
        this.videoPreview.nativeElement.controls = true;
        this.videoPreview.nativeElement.loop = true;
        this.videoPreview.nativeElement.play();
      }
      this.cdr.detectChanges(); // Force UI update
    };
    
    // Timeslice : certains navigateurs n’émettent des chunks qu’avec un intervalle
    try {
      this.mediaRecorder.start(250);
    } catch {
      this.mediaRecorder.start();
    }
    this.isRecording = true;
    this.startTimer();
    this.cdr.markForCheck();
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      // We do NOT set isRecording = false here, we wait for the onstop callback
      this.stopTimer();
    }
  }

  startTimer() {
    this.recordingTime = 0;
    this.timerInterval = setInterval(() => {
      this.recordingTime++;
      if (this.recordingTime >= this.maxTime) {
        this.stopRecording();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  get formattedTime(): string {
    const mins = Math.floor(this.recordingTime / 60);
    const secs = this.recordingTime % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  retake() {
    this.recordedBlob = null;
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
    this.recordingTime = 0;
    if (this.videoPreview && this.videoPreview.nativeElement) {
      this.videoPreview.nativeElement.src = '';
      this.videoPreview.nativeElement.controls = false;
    }
    this.startCamera();
  }

  submitPitch() {
    if (!this.recordedBlob || !this.applicationId) return;
    
    this.loading = true;
    const ext = this.recordedBlob.type.includes('mp4') ? 'mp4' : 'webm';
    const mime = this.recordedBlob.type || (ext === 'mp4' ? 'video/mp4' : 'video/webm');
    const file = new File([this.recordedBlob], `pitch_${this.applicationId}.${ext}`, { type: mime });
    
    this.applicationService.updateApplicationVideo(this.applicationId, file).subscribe({
      next: () => {
        this.toast.success('Pitch vidéo enregistré avec succès !');
        this.router.navigate(['/job-offers']);
      },
      error: (err: any) => {
        console.error('Upload error:', err);
        this.toast.error('Erreur lors de l\'envoi de la vidéo (Vérifiez votre connexion ou la taille du fichier).');
        this.loading = false;
      }
    });
  }

  skip() {
    this.router.navigate(['/job-offers']);
  }
}
