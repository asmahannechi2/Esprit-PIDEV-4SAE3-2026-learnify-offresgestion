import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Job, JobService, JobWithScore } from '../../services/job.service';
import { AuthService } from '../../services/auth.service';
import { Application, ApplicationService } from '../../services/application.service';
import { ToastService } from '../../services/toast.service';

export interface JobOffer {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  requiredLevel: string;
  description: string;
  postedDate: string;
  matchScore?: number;
}

@Component({
  selector: 'app-job-offers',
  templateUrl: './job-offers.component.html',
  styleUrl: './job-offers.component.scss',
  standalone: false,
})
export class JobOffersComponent implements OnInit {
  jobOffers: JobOffer[] = [];
  loadError = '';
  showingRecommended = false;
  hasCv = false;
  hasCvLoading = false;
  savedJobIds = new Set<number>();
  savingFavoriteId: number | null = null;
  favoriteJobs: JobOffer[] = [];
  loadingFavorites = false;
  showFavoritesDropdown = false;
  myApplicationByJobId = new Map<number, Application>();
  showApplicationModal = false;
  selectedJob: JobOffer | null = null;
  selectedApplicationId: number | null = null;
  applicationMotivation = '';
  applicationCvFile: File | null = null;
  applicationCertFile: File | null = null;
  applying = false;
  applicationError = '';

  constructor(
    private jobService: JobService,
    private applications: ApplicationService,
    private toast: ToastService,
    private router: Router,
    public auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadJobOffers();
    if (this.auth.hasRole('TUTOR') || this.auth.hasRole('CANDIDATE')) {
      this.hasCvLoading = true;
      this.jobService.hasMyCv().subscribe({
        next: (res) => { this.hasCv = res.hasCv; this.hasCvLoading = false; },
        error: () => { this.hasCvLoading = false; },
      });
      this.loadSavedJobIds();
      this.loadMyApplications();
    }
  }

  private loadMyApplications(): void {
    this.applications.getMyApplications().subscribe({
      next: (list) => {
        this.myApplicationByJobId = new Map();
        (list ?? []).forEach((app) => this.myApplicationByJobId.set(app.jobId, app));
      },
      error: () => (this.myApplicationByJobId = new Map()),
    });
  }

  hasApplied(jobId: number): boolean {
    return this.myApplicationByJobId.has(jobId);
  }

  getMyApplicationForJob(jobId: number): Application | undefined {
    return this.myApplicationByJobId.get(jobId);
  }

  private loadSavedJobIds(): void {
    this.jobService.getSavedJobIds().subscribe({
      next: (ids) => (this.savedJobIds = new Set(ids ?? [])),
      error: () => (this.savedJobIds = new Set()),
    });
  }

  isSaved(jobId: number): boolean {
    return this.savedJobIds.has(jobId);
  }

  openFavoritesDropdown(): void {
    this.showFavoritesDropdown = true;
    this.loadFavoriteJobs();
  }

  loadFavoriteJobs(): void {
    if (!this.auth.hasRole('TUTOR') && !this.auth.hasRole('CANDIDATE')) return;
    this.loadingFavorites = true;
    this.jobService.getSavedJobs().subscribe({
      next: (jobs) => {
        this.favoriteJobs = jobs.map((j) => this.toOfferVM(j));
        this.loadingFavorites = false;
      },
      error: () => (this.loadingFavorites = false),
    });
  }

  scrollToJob(jobId: number): void {
    this.showFavoritesDropdown = false;
    const el = document.getElementById('job-' + jobId);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  toggleFavorite(job: JobOffer): void {
    if (!this.auth.isAuthenticated() || this.savingFavoriteId === job.id) return;
    this.savingFavoriteId = job.id;
    const isCurrentlySaved = this.savedJobIds.has(job.id);
    const request = isCurrentlySaved
      ? this.jobService.unsaveJob(job.id)
      : this.jobService.saveJob(job.id);
    request.subscribe({
      next: () => {
        if (isCurrentlySaved) this.savedJobIds.delete(job.id);
        else this.savedJobIds.add(job.id);
        this.savedJobIds = new Set(this.savedJobIds);
        this.savingFavoriteId = null;
        if (this.showFavoritesDropdown) this.loadFavoriteJobs();
      },
      error: () => (this.savingFavoriteId = null),
    });
  }

  private loadJobOffers(): void {
    this.loadError = '';
    const isTeacher = this.auth.hasRole('TUTOR') || this.auth.hasRole('CANDIDATE');
    if (isTeacher) {
      this.jobService.getRankedJobs().subscribe({
        next: (list: JobWithScore[]) => {
          this.showingRecommended = true;
          this.jobOffers = list.map((item) => this.toOfferVM(item, item.matchScore));
        },
        error: () => {
          this.showingRecommended = false;
          this.loadOpenJobsFallback();
        },
      });
    } else {
      this.showingRecommended = false;
      this.loadOpenJobsFallback();
    }
  }

  private loadOpenJobsFallback(): void {
    this.jobService.getAllJobs().subscribe({
      next: (jobs: Job[]) => {
        this.jobOffers = jobs.map((j) => this.toOfferVM(j));
      },
      error: (e) => {
        console.error('Failed to load job offers', e);
        this.jobOffers = [];
        this.loadError =
          e?.error?.message ??
          e?.message ??
          'Erreur lors du chargement des offres. Vérifiez que le backend tourne et que vous êtes connecté.';
      },
    });
  }

  private toOfferVM(job: Job, matchScore?: number): JobOffer {
    return {
      id: job.id,
      title: job.titre,
      company: 'Antigravity Academy',
      location: job.location || 'Tunis / Remote',
      type: 'Full-time',
      requiredLevel: job.subject || 'All levels',
      description: job.description ?? '',
      postedDate: job.createdAt ? String(job.createdAt).substring(0, 10) : '',
      matchScore,
    };
  }

  openApplicationModal(job: JobOffer): void {
    if (!this.auth.isAuthenticated()) {
      this.toast.info('Veuillez vous connecter pour postuler.');
      this.router.navigateByUrl('/auth/login');
      return;
    }
    this.selectedJob = job;
    const existing = this.getMyApplicationForJob(job.id);
    if (existing) {
      this.selectedApplicationId = existing.id;
      this.applicationMotivation = existing.motivation ?? '';
    } else {
      this.selectedApplicationId = null;
      this.applicationMotivation = '';
    }
    this.applicationCvFile = null;
    this.applicationCertFile = null;
    this.applicationError = '';
    this.showApplicationModal = true;
  }

  closeApplicationModal(): void {
    if (this.applying) return;
    this.showApplicationModal = false;
    this.selectedJob = null;
    this.selectedApplicationId = null;
  }

  get isEditingApplication(): boolean {
    return this.selectedApplicationId !== null;
  }

  onCvSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.applicationCvFile = input.files?.[0] ?? null;
  }

  onCertSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.applicationCertFile = input.files?.[0] ?? null;
  }

  onMotivationInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    this.applicationMotivation = el?.value ?? '';
  }

  submitApplication(): void {
    if (!this.selectedJob || this.applying) return;
    if (!this.applicationMotivation.trim()) {
      this.applicationError = 'Merci de décrire brièvement votre motivation.';
      return;
    }
    this.applicationError = '';
    this.applying = true;

    const motivation = this.applicationMotivation.trim();
    const isEdit = this.selectedApplicationId !== null;

    // Use unified apply method (it handles existence/routing)
    this.applications.apply(
        this.selectedJob.id,
        motivation,
        this.applicationCvFile || undefined,
        this.applicationCertFile || undefined
    ).subscribe({
      next: (res) => {
        this.applying = false;
        this.showApplicationModal = false;
        this.selectedJob = null;
        this.selectedApplicationId = null;
        this.toast.success(isEdit ? 'Candidature modifiée avec succès.' : 'Candidature envoyée avec succès.');
        this.loadMyApplications();
        
        // Go to video pitch after success
        if (!isEdit && res?.id) {
          this.router.navigate(['/video-pitch', res.id]);
        }
      },
      error: (err) => {
        this.applying = false;
        const msg = err?.error?.message || err?.message || 'Erreur lors de l\'envoi de la candidature.';
        this.applicationError = msg;
        this.toast.error(msg);
      },
    });
  }

  viewJob(job: JobOffer): void {
    console.log('View job:', job.title);
  }

  confirmDeleteApplication(jobId: number): void {
    const app = this.myApplicationByJobId.get(jobId);
    if (!app) return;
    
    if (confirm('Are you sure you want to withdraw your application?')) {
      this.applications.deleteApplication(app.id).subscribe({
        next: () => {
          this.toast.success('Application withdrawn.');
          this.myApplicationByJobId.delete(jobId);
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Withdraw failed.');
        }
      });
    }
  }
}

