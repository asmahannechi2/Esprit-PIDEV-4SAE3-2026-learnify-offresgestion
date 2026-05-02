import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BadgeService } from '../../../core/services/badge.service';
import { Badge } from '../../../core/models/badge.model';

@Component({
  selector: 'app-badge-list',
  templateUrl: './badge-list.component.html',
  styleUrl: './badge-list.component.scss',
  standalone: false,
})
export class BadgeListComponent implements OnInit {
  badges: Badge[] = [];
  filtered: Badge[] = [];
  isLoading = false;
  error = '';
  searchTerm = '';
  filterLevel = 'ALL';

  levels = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

  constructor(private badgeService: BadgeService, private router: Router) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.error = '';
    this.badgeService.getAll().subscribe({
      next: (data) => { this.badges = data; this.applyFilters(); this.isLoading = false; },
      error: (err) => { this.error = 'Failed to load badges: ' + err.message; this.isLoading = false; }
    });
  }

  applyFilters(): void {
    this.filtered = this.badges.filter(b => {
      const matchLevel = this.filterLevel === 'ALL' || b.level === this.filterLevel;
      const term = this.searchTerm.toLowerCase();
      const matchSearch = !term || b.name.toLowerCase().includes(term) || b.courseName?.toLowerCase().includes(term);
      return matchLevel && matchSearch;
    });
  }

  edit(badge: Badge): void {
    this.router.navigate(['/admin/badges', badge.id, 'edit']);
  }

  delete(badge: Badge): void {
    if (!confirm(`Delete badge "${badge.name}"?`)) return;
    this.badgeService.delete(badge.id!).subscribe({
      next: () => this.load(),
      error: (err) => { this.error = 'Failed to delete: ' + err.message; }
    });
  }

  getLevelClass(level: string): string {
    switch (level) {
      case 'BEGINNER': return 'bg-info text-dark';
      case 'INTERMEDIATE': return 'bg-primary';
      case 'ADVANCED': return 'bg-warning text-dark';
      case 'EXPERT': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'EARNED': return 'bg-success';
      case 'PUBLISHED': return 'bg-primary';
      case 'LOCKED': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }
}
