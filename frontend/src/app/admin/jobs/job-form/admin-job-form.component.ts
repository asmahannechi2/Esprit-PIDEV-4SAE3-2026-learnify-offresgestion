import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { JobService } from '../../../services/job.service';
import { ToastService } from '../../../services/toast.service';

/**
 * Formulaire aligné sur Learn/template/src/app/admin/jobs/admin-job-form (mêmes champs et libellés).
 */
@Component({
  selector: 'app-admin-job-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-job-form.component.html',
  styleUrl: './admin-job-form.component.scss',
})
export class AdminJobFormComponent implements OnInit {
  isEdit = false;
  id: number | null = null;
  loading = true;
  saving = false;
  error = '';

  titre = '';
  nbPlaces: number | null = null;
  description = '';
  requirements = '';
  deadline = '';
  /** Publication programmée (création uniquement) — envoyé comme `opensAt` (Learn). */
  scheduledOpensAt = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jobService: JobService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.id = +idParam;
      this.jobService.getJobById(this.id).subscribe({
        next: (job) => {
          this.titre = job.titre ?? '';
          this.nbPlaces = job.nbPlaces ?? null;
          this.description = job.description ?? '';
          this.requirements = job.requirements ?? '';
          this.deadline = job.deadline ? job.deadline.slice(0, 16) : '';
          this.loading = false;
        },
        error: () => {
          this.error = 'Offre introuvable';
          this.loading = false;
        },
      });
    } else {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      this.deadline = d.toISOString().slice(0, 16);
      this.loading = false;
    }
  }

  submit(f: NgForm): void {
    this.error = '';
    if (f.invalid) {
      f.form.markAllAsTouched();
      return;
    }
    if (!this.titre?.trim()) {
      this.error = 'Le titre est requis';
      return;
    }
    const nb = this.nbPlaces != null ? Number(this.nbPlaces) : 0;
    if (isNaN(nb) || nb < 1) {
      this.error = 'Nombre de places invalide (min. 1)';
      return;
    }
    if (!this.deadline?.trim()) {
      this.error = 'La date limite est requise';
      return;
    }
    this.saving = true;

    const deadlineDate = new Date(this.deadline);
    const deadlineStr = deadlineDate.toISOString().split('.')[0];

    const payload: Parameters<JobService['createJob']>[0] = {
      titre: this.titre.trim(),
      nbPlaces: nb,
      description: this.description.trim(),
      requirements: this.requirements.trim(),
      deadline: deadlineStr,
    };

    if (!this.isEdit && this.scheduledOpensAt?.trim()) {
      const opensDate = new Date(this.scheduledOpensAt);
      const opensStr = opensDate.toISOString().split('.')[0];
      // Send both to be absolutely sure
      payload.scheduledPublicationAt = opensStr;
      payload.opensAt = opensStr;
    }

    if (this.isEdit && this.id != null) {
      this.jobService.updateJob(this.id, payload).subscribe({
        next: () => {
          this.saving = false;
          this.toast.success('Offre mise à jour');
          void this.router.navigate(['/admin/jobs']);
        },
        error: (err) => {
          this.error = err?.error?.message || 'Erreur lors de la mise à jour';
          this.saving = false;
          this.toast.error(this.error);
        },
      });
    } else {
      this.jobService.createJob(payload).subscribe({
        next: () => {
          this.saving = false;
          this.toast.success('Offre créée');
          void this.router.navigate(['/admin/jobs']);
        },
        error: (err) => {
          this.error = err?.error?.message || 'Erreur lors de la création';
          this.saving = false;
          this.toast.error(this.error);
        },
      });
    }
  }
}
