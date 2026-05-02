import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MongoPost, MongoPostService } from '../../../services/mongo-post.service';

@Component({
  selector: 'app-admin-mongo-posts-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="crud-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Posts MongoDB</h1>
          <p class="page-subtitle">Articles gérés par le microservice mongo-event-service</p>
        </div>
        <div class="header-actions">
          <a routerLink="/admin/mongo-posts/create" class="btn-admin primary">
            <i class="ti ti-plus"></i> Nouveau post
          </a>
        </div>
      </div>

      <div class="filters-bar">
        <div class="search-box">
          <i class="ti ti-search"></i>
          <input type="text" placeholder="Rechercher par titre..." [(ngModel)]="searchTerm" (input)="filter()">
        </div>
        <select [(ngModel)]="statusFilter" (change)="filter()" class="filter-select">
          <option value="">Tous les statuts</option>
          <option value="draft">Brouillon</option>
          <option value="published">Publié</option>
        </select>
      </div>

      @if (loadError) {
        <div class="alert-error">{{ loadError }}</div>
      }

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Statut</th>
              <th>Auteur (libellé)</th>
              <th>Mise à jour</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of filtered">
              <td><strong>{{ p.title }}</strong></td>
              <td>
                <span class="badge" [attr.data-status]="p.status">{{ p.status === 'published' ? 'Publié' : 'Brouillon' }}</span>
              </td>
              <td>{{ p.authorLabel || '—' }}</td>
              <td>{{ p.updatedAt | date:'short' }}</td>
              <td>
                <div class="action-buttons">
                  <a [routerLink]="['/admin/mongo-posts/edit', p.id]" class="btn-action edit"><i class="ti ti-pencil"></i></a>
                  <button type="button" class="btn-action delete" (click)="confirmDelete(p)"><i class="ti ti-trash"></i></button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filtered.length === 0 && !loadError">
              <td colspan="5" class="empty-state">
                <i class="ti ti-article"></i>
                <p>Aucun post</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      @if (showDeleteModal) {
        <div class="modal-overlay" (click)="cancelDelete()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Supprimer le post</h3>
              <button type="button" class="modal-close" (click)="cancelDelete()"><i class="ti ti-x"></i></button>
            </div>
            <div class="modal-body">
              <p>Confirmer la suppression de <strong>{{ toDelete?.title }}</strong> ?</p>
              <p class="warning-text">Cette action est irréversible.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-admin outline" (click)="cancelDelete()">Annuler</button>
              <button type="button" class="btn-admin danger" (click)="doDelete()"><i class="ti ti-trash"></i> Supprimer</button>
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
    .btn-admin { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.25s ease; border: none; text-decoration: none; i { font-size: 18px; } &.primary { background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color: #fff; box-shadow: 0 4px 15px rgba(61,61,96,0.3); &:hover { box-shadow: 0 8px 25px rgba(61,61,96,0.4); transform: translateY(-2px); } } &.outline { background: var(--color-white); color: var(--color-primary); border: 2px solid rgba(61,61,96,0.1); &:hover { border-color: rgba(61,61,96,0.25); background: rgba(61,61,96,0.04); } } &.danger { background: var(--color-cta); color: #fff; &:hover { background: #d96a5a; } } }
    .alert-error { background: rgba(200,70,48,0.1); color: var(--color-cta); padding: 12px 16px; border-radius: 12px; margin-bottom: 16px; font-size: 14px; }
    .filters-bar { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .search-box { position: relative; flex: 1; min-width: 250px; i { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--color-gray-400); } input { width: 100%; padding: 12px 14px 12px 44px; border: 2px solid rgba(61,61,96,0.1); border-radius: 12px; font-size: 14px; &:focus { outline: none; border-color: var(--color-primary); } } }
    .filter-select { padding: 12px 16px; border: 2px solid rgba(61,61,96,0.1); border-radius: 12px; font-size: 14px; background: var(--color-white); cursor: pointer; min-width: 150px; &:focus { outline: none; border-color: var(--color-primary); } }
    .table-container { background: var(--color-white); border-radius: 20px; box-shadow: var(--shadow-card); overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; th, td { padding: 16px 20px; text-align: left; } th { background: rgba(61,61,96,0.03); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-gray-500); } td { border-bottom: 1px solid rgba(61,61,96,0.06); font-size: 14px; color: var(--color-primary); } tr:last-child td { border-bottom: none; } tr:hover td { background: rgba(61,61,96,0.02); } }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: rgba(61,61,96,0.08); color: var(--color-primary); &[data-status="published"] { background: rgba(16,185,129,0.1); color: #10b981; } &[data-status="draft"] { background: rgba(245,158,11,0.12); color: #b45309; } }
    .action-buttons { display: flex; gap: 8px; }
    .btn-action { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 10px; border: none; cursor: pointer; transition: all 0.2s; text-decoration: none; i { font-size: 18px; } &.edit { background: rgba(246,189,96,0.15); color: #b8860b; &:hover { background: rgba(246,189,96,0.25); } } &.delete { background: rgba(200,70,48,0.1); color: var(--color-cta); &:hover { background: rgba(200,70,48,0.2); } } }
    .empty-state { text-align: center; padding: 60px 20px !important; color: var(--color-gray-400); i { font-size: 48px; margin-bottom: 16px; display: block; } }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .modal-content { background: var(--color-white); border-radius: 20px; width: 100%; max-width: 450px; box-shadow: var(--shadow-2xl); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid rgba(61,61,96,0.08); h3 { font-size: 18px; font-weight: 700; color: var(--color-primary); margin: 0; } }
    .modal-close { width: 32px; height: 32px; border: none; background: rgba(61,61,96,0.06); border-radius: 8px; cursor: pointer; }
    .modal-body { padding: 24px; p { margin: 0 0 8px; } .warning-text { font-size: 13px; color: var(--color-cta); } }
    .modal-footer { display: flex; gap: 12px; justify-content: flex-end; padding: 16px 24px; border-top: 1px solid rgba(61,61,96,0.08); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class AdminMongoPostsListComponent implements OnInit {
  private readonly postsApi = inject(MongoPostService);
  searchTerm = '';
  statusFilter = '';
  posts: MongoPost[] = [];
  filtered: MongoPost[] = [];
  loadError = '';
  showDeleteModal = false;
  toDelete: MongoPost | null = null;

  ngOnInit(): void {
    this.postsApi.list().subscribe({
      next: (list) => {
        this.posts = list ?? [];
        this.filter();
        this.loadError = '';
      },
      error: () => {
        this.loadError = 'Impossible de charger les posts. Vérifiez que mongo-event-service (8090) et l’API Gateway (8080) sont démarrés, et que la route /api/mongo-events/** est active.';
        this.posts = [];
        this.filtered = [];
      }
    });
  }

  filter(): void {
    let list = [...this.posts];
    if (this.searchTerm) {
      const t = this.searchTerm.toLowerCase();
      list = list.filter((p) => (p.title || '').toLowerCase().includes(t));
    }
    if (this.statusFilter) {
      list = list.filter((p) => p.status === this.statusFilter);
    }
    this.filtered = list;
  }

  confirmDelete(p: MongoPost): void {
    this.toDelete = p;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.toDelete = null;
    this.showDeleteModal = false;
  }

  doDelete(): void {
    if (!this.toDelete) return;
    this.postsApi.delete(this.toDelete.id).subscribe({
      next: () => {
        this.posts = this.posts.filter((p) => p.id !== this.toDelete!.id);
        this.filter();
        this.cancelDelete();
      },
      error: () => this.cancelDelete()
    });
  }
}
