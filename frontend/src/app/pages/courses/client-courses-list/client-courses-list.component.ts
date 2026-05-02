import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService, Course } from '../../../core/data.service';
import { CourseService } from '../../../services/course.service';
import { SessionService } from '../../../services/session.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { AdminManagementService } from '../../../services/admin-management.service';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { FooterComponent } from '../../../components/footer/footer.component';

@Component({
  selector: 'app-client-courses-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="client-page">
      <div class="page-hero">
        <div class="container">
          <h1 class="hero-title">Explore Our <span class="highlight">Courses</span></h1>
          <p class="hero-subtitle">Master English with expert-led courses designed for all levels</p>
        </div>
      </div>
      <div class="container">
        @if (completionMessage) {
          <div class="completion-toast">
            <i class="ti ti-circle-check"></i> {{ completionMessage }}
          </div>
        }
        <div class="filters-bar">
          <div class="search-box">
            <i class="ti ti-search"></i>
            <input type="text" placeholder="Search courses..." [(ngModel)]="searchTerm" (input)="filterCourses()">
          </div>
          <div class="filter-group">
            <select [(ngModel)]="selectedLevel" (change)="filterCourses()" class="filter-select">
              <option value="">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Elementary">Elementary</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Upper Intermediate">Upper Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Proficient">Proficient</option>
            </select>
            <select [(ngModel)]="selectedCategory" (change)="filterCourses()" class="filter-select">
              <option value="">All Categories</option>
              <option value="Grammar">Grammar</option>
              <option value="Speaking">Speaking</option>
              <option value="Business English">Business English</option>
              <option value="Exam Preparation">Exam Preparation</option>
            </select>
          </div>
        </div>
        <div class="courses-grid">
          @for (course of filteredCourses; track course.id) {
            <div class="course-card">
              <div class="card-image">
                <img [src]="course.thumbnail || course.image" [alt]="course.title">
                <div class="card-badge" [attr.data-level]="dataService.getCourseLevelLabel(course.level)">{{ dataService.getCourseLevelLabel(course.level) }}</div>
              </div>
              <div class="card-content">
                <div class="card-category">{{ course.category }}</div>
                <h3 class="card-title"><a [routerLink]="['/courses', course.id]">{{ course.title }}</a></h3>
                <p class="card-description">{{ course.description }}</p>
                <div class="card-meta">
                  <span class="meta-item"><i class="ti ti-clock"></i> {{ course.duration ? formatDuration(course.duration) : '—' }}</span>
                  <span class="meta-item"><i class="ti ti-users"></i> {{ course.studentsCount ?? 0 }} Students</span>
                </div>
                <div class="card-footer">
                  <div class="price">\${{ course.price }}</div>
                  @if (isEnrolled(course.id)) {
                    <div class="enrolled-actions">
                      <a [routerLink]="['/courses', course.id]" class="btn-go-to-course">Go to Course</a>
                      <button class="btn-complete" (click)="completeCourse(course)" [disabled]="completingCourseId === course.id">
                        {{ completingCourseId === course.id ? 'Sending...' : 'Mark Complete' }}
                      </button>
                    </div>
                  } @else {
                    <a [routerLink]="['/courses', course.id]" class="btn-enroll">View Details</a>
                  }
                </div>
              </div>
            </div>
          } @empty {
            <div class="no-results">
              <i class="ti ti-book"></i>
              <h3>No courses found</h3>
              <p>Try adjusting your filters or search term</p>
            </div>
          }
        </div>
      </div>
    </div>
    <app-footer></app-footer>
  `,
  styles: [`
    .client-page { min-height: 100vh; background: var(--color-background); }
    .page-hero { background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%); padding: 80px 0 60px; text-align: center; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .hero-title { font-family: var(--font-family); font-size: 48px; font-weight: 800; color: #fff; margin: 0 0 16px; }
    .highlight { color: var(--color-accent); }
    .hero-subtitle { font-size: 18px; color: rgba(255, 255, 255, 0.85); margin: 0; }
    .filters-bar { display: flex; gap: 20px; justify-content: space-between; align-items: center; padding: 24px; background: var(--color-white); border-radius: 20px; margin: -40px auto 40px; position: relative; z-index: 10; box-shadow: var(--shadow-card); }
    .search-box { display: flex; align-items: center; gap: 12px; flex: 1; max-width: 400px; background: var(--color-background); border-radius: 12px; padding: 12px 16px; i { color: var(--color-gray-400); } input { border: none; background: none; outline: none; font-size: 14px; width: 100%; font-family: var(--font-family); } }
    .filter-group { display: flex; gap: 12px; }
    .filter-select { padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(61, 61, 96, 0.1); background: var(--color-background); font-size: 14px; font-family: var(--font-family); cursor: pointer; &:focus { outline: 2px solid var(--color-accent); } }
    .courses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 28px; padding-bottom: 60px; }
    .course-card { background: var(--color-white); border-radius: 20px; overflow: hidden; box-shadow: var(--shadow-card); transition: all 0.3s ease; &:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(61, 61, 96, 0.15); } }
    .card-image { position: relative; height: 200px; overflow: hidden; img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; } &:hover img { transform: scale(1.05); } }
    .card-badge { position: absolute; top: 16px; right: 16px; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; &[data-level="Beginner"] { background: #10b981; color: #fff; } &[data-level="Intermediate"] { background: #f59e0b; color: #fff; } &[data-level="Advanced"] { background: #ef4444; color: #fff; } }
    .card-content { padding: 24px; }
    .card-category { font-size: 12px; font-weight: 600; color: var(--color-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .card-title { font-size: 20px; font-weight: 700; color: var(--color-primary); margin: 0 0 12px; line-height: 1.4; a { color: inherit; text-decoration: none; &:hover { color: var(--color-accent); } } }
    .card-description { font-size: 14px; color: var(--color-gray-500); line-height: 1.6; margin: 0 0 16px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .card-meta { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .meta-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--color-gray-500); i { font-size: 16px; color: var(--color-secondary); } }
    .card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid rgba(61, 61, 96, 0.08); }
    .price { font-size: 24px; font-weight: 800; color: var(--color-primary); }
    .btn-enroll { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: linear-gradient(135deg, var(--color-cta), #e05540); color: #fff; border-radius: 12px; font-size: 14px; font-weight: 600; text-decoration: none; transition: all 0.3s ease; &:hover { transform: scale(1.05); box-shadow: 0 8px 20px rgba(200, 70, 48, 0.3); } }
    .enrolled-actions { display: flex; flex-direction: column; gap: 8px; align-items: flex-end; }
    .btn-go-to-course { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: linear-gradient(135deg, #10b981, #059669); color: #fff; border-radius: 12px; font-size: 14px; font-weight: 600; text-decoration: none; transition: all 0.3s ease; &:hover { transform: scale(1.05); box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3); } }
    .btn-complete { padding: 8px 16px; background: none; border: 1px solid #10b981; color: #10b981; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; font-family: var(--font-family); &:hover:not(:disabled) { background: #10b981; color: #fff; } &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .no-results { grid-column: 1 / -1; text-align: center; padding: 80px 20px; i { font-size: 64px; color: var(--color-gray-300); margin-bottom: 24px; } h3 { font-size: 24px; color: var(--color-primary); margin: 0 0 12px; } p { color: var(--color-gray-500); } }
    .completion-toast { display: flex; align-items: center; gap: 10px; background: #d1fae5; border: 1px solid #10b981; color: #065f46; border-radius: 12px; padding: 14px 20px; margin-bottom: 20px; font-size: 14px; font-weight: 500; i { font-size: 20px; color: #10b981; } }
    @media (max-width: 768px) { .filters-bar { flex-direction: column; .search-box { max-width: 100%; } .filter-group { width: 100%; select { flex: 1; } } } .courses-grid { grid-template-columns: 1fr; } }
  `]
})
export class ClientCoursesListComponent implements OnInit {
  dataService = inject(DataService);
  private courseService = inject(CourseService);
  private session = inject(SessionService);
  private enrollmentService = inject(EnrollmentService);
  private userService = inject(AdminManagementService);
  private allCourses: Course[] = [];
  filteredCourses: Course[] = [];
  searchTerm = '';
  selectedLevel = '';
  selectedCategory = '';
  completingCourseId: number | null = null;
  completionMessage = '';
  currentUserId: number = 0;

  private resolveUserId(): void {
    const cached = Number(localStorage.getItem('userId'));
    if (cached > 0) {
      this.currentUserId = cached;
      return;
    }
    this.userService.getMe().subscribe({
      next: u => {
        if (u.id) {
          localStorage.setItem('userId', String(u.id));
          this.currentUserId = u.id;
        }
      },
      error: () => {}
    });
  }

  isEnrolled(courseId: number): boolean {
    return this.enrollmentService.isEnrolled(this.currentUserId, courseId);
  }

  ngOnInit(): void {
    this.resolveUserId();
    this.dataService.getCourses().subscribe({
      next: courses => {
        this.allCourses = courses;
        this.filteredCourses = [...courses];
      },
      error: err => console.error('Error loading courses:', err)
    });
  }

  completeCourse(course: Course): void {
    if (!this.currentUserId) { alert('Please log in first.'); return; }
    const user = this.session.getCurrentUser();
    const userName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
    const userEmail = user?.email ?? localStorage.getItem('email') ?? '';

    this.completingCourseId = course.id;
    this.courseService.completeCourse(course.id, {
      userId: this.currentUserId,
      userName,
      userEmail,
      courseTitle: course.title
    }).subscribe({
      next: () => {
        this.completingCourseId = null;
        this.completionMessage = `Certificate for "${course.title}" will be sent to ${userEmail}.`;
        setTimeout(() => this.completionMessage = '', 6000);
      },
      error: () => {
        this.completingCourseId = null;
        alert('Failed to generate certificate. Please try again.');
      }
    });
  }

  filterCourses(): void {
    this.filteredCourses = this.allCourses.filter(course => {
      const levelLabel = this.dataService.getCourseLevelLabel(course.level);
      const matchesSearch = !this.searchTerm ||
        course.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (course.description ?? '').toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesLevel    = !this.selectedLevel    || levelLabel === this.selectedLevel;
      const matchesCategory = !this.selectedCategory || course.category === this.selectedCategory;
      return matchesSearch && matchesLevel && matchesCategory;
    });
  }

  formatDuration(minutes: number): string {
    const weeks = minutes / (7 * 24 * 60);
    if (Number.isInteger(weeks) && weeks >= 1) return `${weeks}w`;
    const hours = minutes / 60;
    if (Number.isInteger(hours) && hours >= 1) return `${hours}h`;
    return `${minutes}min`;
  }
}
