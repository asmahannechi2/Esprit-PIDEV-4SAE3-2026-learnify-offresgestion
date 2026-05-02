import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BadgeService } from '../../../core/services/badge.service';

@Component({
  selector: 'app-badge-form',
  templateUrl: './badge-form.component.html',
  styleUrl: './badge-form.component.scss',
  standalone: false,
})
export class BadgeFormComponent implements OnInit {
  form!: FormGroup;
  isEditing = false;
  badgeId?: number;
  isLoading = false;
  isSaving = false;
  error = '';

  levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
  statuses = ['LOCKED', 'EARNED', 'PUBLISHED'];

  constructor(
    private fb: FormBuilder,
    private badgeService: BadgeService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      imageUrl: [''],
      level: ['BEGINNER', Validators.required],
      criteria: ['', Validators.required],
      courseId: ['', [Validators.required, Validators.min(1)]],
      certificateId: [''],
      studentId: [''],
      status: ['LOCKED', Validators.required],
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      this.badgeId = +id;
      this.loadBadge();
    }
  }

  loadBadge(): void {
    this.isLoading = true;
    this.badgeService.getById(this.badgeId!).subscribe({
      next: (b) => { this.form.patchValue(b); this.isLoading = false; },
      error: (err) => { this.error = 'Failed to load badge: ' + err.message; this.isLoading = false; }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving = true;
    this.error = '';
    const data = this.form.value;
    const op = this.isEditing
      ? this.badgeService.update(this.badgeId!, data)
      : this.badgeService.create(data);

    op.subscribe({
      next: () => { this.isSaving = false; this.router.navigate(['/admin/badges']); },
      error: (err) => { this.error = 'Failed to save badge: ' + err.message; this.isSaving = false; }
    });
  }

  cancel(): void { this.router.navigate(['/admin/badges']); }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }
}
