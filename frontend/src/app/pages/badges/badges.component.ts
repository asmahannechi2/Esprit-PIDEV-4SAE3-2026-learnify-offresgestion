import { Component, OnInit } from '@angular/core';
import { BadgeService } from '../../core/services/badge.service';
import { Badge } from '../../core/models/badge.model';
import { AiService } from '../../ai/services/ai.service';

interface AiNextBadge {
  badgeName: string;
  course: string;
  readyPercent: number;
  missing: string[];
  tip: string;
}

@Component({
  selector: 'app-badges',
  templateUrl: './badges.component.html',
  styleUrl: './badges.component.scss',
  standalone: false,
})
export class BadgesComponent implements OnInit {
  badges: Badge[] = [];
  isLoading = false;
  shareSuccess = '';

  // Modal
  selectedBadge: Badge | null = null;
  showModal = false;

  // AI recommendation
  aiRecommendation: AiNextBadge | null = null;
  loadingAi = false;
  showAiPanel = false;

  private studentId = 1;

  constructor(private badgeService: BadgeService, private aiService: AiService) {}

  ngOnInit(): void { this.loadBadges(); }

  loadBadges(): void {
    this.isLoading = true;
    this.badgeService.getByStudent(this.studentId).subscribe({
      next: (data) => {
        this.badges = data?.length ? data : this.getMockBadges();
        this.isLoading = false;
      },
      error: () => { this.badges = this.getMockBadges(); this.isLoading = false; }
    });
  }

  // ── Modal ──────────────────────────────────────────────
  openModal(badge: Badge): void { this.selectedBadge = badge; this.showModal = true; }
  closeModal(): void { this.showModal = false; this.selectedBadge = null; }

  // ── Download badge as image (canvas) ──────────────────
  downloadBadge(badge: Badge): void {
    const canvas = document.createElement('canvas');
    canvas.width = 500; canvas.height = 500;
    const ctx = canvas.getContext('2d')!;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 500, 500);
    grad.addColorStop(0, this.getLevelColor(badge.level));
    grad.addColorStop(1, '#6610f2');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(250, 250, 250, 0, Math.PI * 2);
    ctx.fill();

    // Inner white circle
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(250, 250, 200, 0, Math.PI * 2);
    ctx.fill();

    // Border ring
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(250, 250, 220, 0, Math.PI * 2);
    ctx.stroke();

    // Icon emoji
    ctx.font = '120px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(this.getLevelEmoji(badge.level), 250, 200);

    // Badge name
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(badge.name, 250, 320);

    // Level
    ctx.font = '18px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(badge.level, 250, 360);

    // Platform
    ctx.font = '14px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('LearnifyEnglish', 250, 420);

    // Download
    const link = document.createElement('a');
    link.download = `badge-${badge.name.replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  // ── AI Next Badge Recommendation ──────────────────────
  getAiRecommendation(): void {
    if (this.showAiPanel) { this.showAiPanel = false; return; }
    this.showAiPanel = true;
    if (this.aiRecommendation) return;

    this.loadingAi = true;
    const earnedCourses = this.badges.map(b => b.courseName ?? b.courseId.toString());

    this.aiService.chat(
      `I have earned badges for these courses: ${earnedCourses.join(', ')}. 
       Based on this, recommend the next badge I should aim for on a language learning platform. 
       Reply in JSON only with this structure: 
       {"badgeName":"...","course":"...","readyPercent":75,"missing":["...","..."],"tip":"..."}`
    ).subscribe({
      next: (res: any) => {
        try {
          const text: string = res?.response ?? res?.message ?? JSON.stringify(res);
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          this.aiRecommendation = jsonMatch ? JSON.parse(jsonMatch[0]) : this.getMockAiRec();
        } catch {
          this.aiRecommendation = this.getMockAiRec();
        }
        this.loadingAi = false;
      },
      error: () => { this.aiRecommendation = this.getMockAiRec(); this.loadingAi = false; }
    });
  }

  private getMockAiRec(): AiNextBadge {
    return {
      badgeName: 'English C1 Expert',
      course: 'English C1 Course',
      readyPercent: 75,
      missing: ['Complete 2 more quizzes', 'Achieve grade ≥ 90%', 'Finish all course modules'],
      tip: 'You\'re very close! Focus on the advanced grammar modules and practice speaking exercises to reach the C1 level.'
    };
  }

  // ── LinkedIn Share ─────────────────────────────────────
  shareOnLinkedIn(badge: Badge): void {
    const verifyUrl = `${window.location.origin}/verify-badge/${badge.id}`;
    window.open(this.badgeService.buildLinkedInShareUrl(badge, verifyUrl), '_blank', 'width=600,height=600');
    badge.isPublishedToLinkedIn = true;
    this.shareSuccess = `"${badge.name}" shared on LinkedIn!`;
    setTimeout(() => this.shareSuccess = '', 4000);
    if (badge.id) this.badgeService.markPublishedToLinkedIn(badge.id).subscribe();
  }

  // ── Helpers ────────────────────────────────────────────
  getLevelColor(level: string): string {
    switch (level) {
      case 'BEGINNER':     return '#17a2b8';
      case 'INTERMEDIATE': return '#0d6efd';
      case 'ADVANCED':     return '#ffc107';
      case 'EXPERT':       return '#dc3545';
      default:             return '#6c757d';
    }
  }

  getLevelIcon(level: string): string {
    switch (level) {
      case 'BEGINNER':     return 'bi-star';
      case 'INTERMEDIATE': return 'bi-star-half';
      case 'ADVANCED':     return 'bi-star-fill';
      case 'EXPERT':       return 'bi-trophy-fill';
      default:             return 'bi-award';
    }
  }

  getLevelEmoji(level: string): string {
    switch (level) {
      case 'BEGINNER':     return '⭐';
      case 'INTERMEDIATE': return '🏅';
      case 'ADVANCED':     return '🥇';
      case 'EXPERT':       return '🏆';
      default:             return '🎖️';
    }
  }

  get earnedCount(): number { return this.badges.filter(b => b.status === 'EARNED' || b.status === 'PUBLISHED').length; }
  get sharedCount(): number { return this.badges.filter(b => b.isPublishedToLinkedIn).length; }

  private getMockBadges(): Badge[] {
    return [
      { id: 1, name: 'B1 French Achiever',  description: 'Completed the French B1 course with excellence', imageUrl: '', level: 'INTERMEDIATE', criteria: 'Grade ≥ 80%', courseId: 1, courseName: 'French B1 Course',  earnedDate: '2024-03-10', status: 'EARNED',  isPublishedToLinkedIn: false },
      { id: 2, name: 'Spanish Explorer',    description: 'Completed the Spanish A2 course',               imageUrl: '', level: 'BEGINNER',     criteria: 'Course completion', courseId: 2, courseName: 'Spanish A2 Course', earnedDate: '2024-02-15', status: 'EARNED',  isPublishedToLinkedIn: true  },
      { id: 3, name: 'English Expert',      description: 'Mastered the English C1 advanced course',       imageUrl: '', level: 'ADVANCED',     criteria: 'Grade ≥ 90%', courseId: 3, courseName: 'English C1 Course', earnedDate: '2024-01-20', status: 'EARNED',  isPublishedToLinkedIn: false },
    ];
  }
}
