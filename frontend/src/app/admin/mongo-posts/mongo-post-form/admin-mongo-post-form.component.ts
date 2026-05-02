import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { MongoPostService } from '../../../services/mongo-post.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-admin-mongo-post-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-mongo-post-form.component.html',
  styleUrl: './admin-mongo-post-form.component.scss',
})
export class AdminMongoPostFormComponent implements OnInit {
  isEdit = false;
  postId: string | null = null;
  loading = true;
  saving = false;
  error = '';

  title = '';
  excerpt = '';
  content = '';
  authorLabel = '';
  status: 'draft' | 'published' = 'draft';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mongoPostService: MongoPostService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.postId = idParam;
      this.mongoPostService.getById(idParam).subscribe({
        next: (p) => {
          this.title = p.title ?? '';
          this.excerpt = p.excerpt ?? '';
          this.content = p.content ?? '';
          this.authorLabel = p.authorLabel ?? '';
          this.status = p.status === 'published' ? 'published' : 'draft';
          this.loading = false;
        },
        error: () => {
          this.error = 'Post introuvable';
          this.loading = false;
        },
      });
    } else {
      this.loading = false;
    }
  }

  submit(f: NgForm): void {
    this.error = '';
    if (f.invalid) {
      f.form.markAllAsTouched();
      return;
    }
    if (!this.title?.trim()) {
      this.error = 'Le titre est requis';
      return;
    }
    this.saving = true;
    const payload = {
      title: this.title.trim(),
      excerpt: this.excerpt?.trim() ?? '',
      content: this.content ?? '',
      authorLabel: this.authorLabel?.trim() ?? '',
      status: this.status,
    };
    if (this.isEdit && this.postId) {
      this.mongoPostService.update(this.postId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.toast.show('Post enregistré', 'success');
          this.router.navigate(['/admin/mongo-posts']);
        },
        error: (err) => {
          this.saving = false;
          this.error = err?.error?.error || 'Erreur lors de la mise à jour';
        },
      });
    } else {
      this.mongoPostService.create(payload).subscribe({
        next: () => {
          this.saving = false;
          this.toast.show('Post créé', 'success');
          this.router.navigate(['/admin/mongo-posts']);
        },
        error: (err) => {
          this.saving = false;
          this.error = err?.error?.error || 'Erreur lors de la création';
        },
      });
    }
  }
}
