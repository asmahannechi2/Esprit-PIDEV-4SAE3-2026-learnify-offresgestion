import { Component } from '@angular/core';
import { AiService } from '../../ai/services/ai.service';
import { JobRecommendation } from '../../ai/models/ai.models';

interface CertCard {
  id: number;
  course: string;
  date: string;
  completed: boolean;
  grade: number;
  verificationCode: string;
  generating?: boolean;
  successMsg?: string;
  emailSent?: boolean;
  errorMsg?: string;
  loadingJobs?: boolean;
  jobs?: JobRecommendation[];
  showJobs?: boolean;
}

@Component({
  selector: 'app-certificate',
  templateUrl: './certificate.component.html',
  styleUrl: './certificate.component.scss',
  standalone: false,
})
export class CertificateComponent {
  certificates: CertCard[] = [
    { id: 1, course: 'French B1 Course',  date: '2024-03-10', completed: true,  grade: 88, verificationCode: 'CERT-2024-FR-B1-88421' },
    { id: 2, course: 'Spanish A2 Course', date: '2024-02-15', completed: true,  grade: 92, verificationCode: 'CERT-2024-ES-A2-73910' },
    { id: 3, course: 'English C1 Course', date: '',           completed: false, grade: 0,  verificationCode: '' },
  ];

  verifyCode = '';
  verifyResult: CertCard | null = null;
  verifyError = '';

  constructor(private aiService: AiService) {}

  getJobRecommendations(cert: CertCard): void {
    if (cert.showJobs) { cert.showJobs = false; return; }
    if (cert.jobs && cert.jobs.length > 0) { cert.showJobs = true; return; }
    cert.loadingJobs = true;
    cert.showJobs = true;
    this.aiService.recommendJobs({ courseName: cert.course, grade: cert.grade }).subscribe({
      next: (jobs) => { cert.jobs = jobs; cert.loadingJobs = false; },
      error: () => { cert.jobs = this.getMockJobs(cert.course); cert.loadingJobs = false; }
    });
  }

  private getMockJobs(course: string): JobRecommendation[] {
    const map: Record<string, JobRecommendation[]> = {
      'French B1 Course': [
        { jobTitle: 'French Language Teacher', description: 'Teach French to beginners and intermediate students in schools or online.', requiredSkills: ['French B1+', 'Communication', 'Patience'], salaryRange: '$30,000 – $55,000/yr', matchScore: 92 },
        { jobTitle: 'Bilingual Customer Support', description: 'Assist French-speaking customers via chat, email or phone.', requiredSkills: ['French', 'English', 'Problem Solving'], salaryRange: '$28,000 – $45,000/yr', matchScore: 88 },
        { jobTitle: 'French Content Translator', description: 'Translate documents, articles and marketing content.', requiredSkills: ['French B1+', 'Writing', 'Attention to Detail'], salaryRange: '$35,000 – $60,000/yr', matchScore: 85 },
      ],
      'Spanish A2 Course': [
        { jobTitle: 'Spanish Tutor', description: 'Provide one-on-one or group Spanish lessons online or in person.', requiredSkills: ['Spanish A2+', 'Teaching', 'Patience'], salaryRange: '$25,000 – $50,000/yr', matchScore: 90 },
        { jobTitle: 'Travel & Tourism Guide', description: 'Guide Spanish-speaking tourists in local attractions.', requiredSkills: ['Spanish', 'Local Knowledge', 'Communication'], salaryRange: '$28,000 – $42,000/yr', matchScore: 83 },
        { jobTitle: 'Bilingual Sales Representative', description: 'Sell products or services to Spanish-speaking markets.', requiredSkills: ['Spanish', 'Sales', 'Negotiation'], salaryRange: '$35,000 – $65,000/yr', matchScore: 80 },
      ],
    };
    return map[course] ?? [
      { jobTitle: 'Language Instructor', description: 'Teach the language you mastered to new learners.', requiredSkills: ['Language Proficiency', 'Communication'], salaryRange: '$30,000 – $55,000/yr', matchScore: 88 },
      { jobTitle: 'Content Localization Specialist', description: 'Adapt content for different language markets.', requiredSkills: ['Language Skills', 'Cultural Awareness'], salaryRange: '$40,000 – $70,000/yr', matchScore: 82 },
      { jobTitle: 'International Relations Officer', description: 'Manage communications with international partners.', requiredSkills: ['Multilingual', 'Diplomacy', 'Writing'], salaryRange: '$45,000 – $80,000/yr', matchScore: 78 },
    ];
  }

  getQrUrl(code: string): string {
    const verifyUrl = `${window.location.origin}/certificate?verify=${code}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(verifyUrl)}`;
  }

  sendEmailNotification(cert: CertCard): void {
    const verifyUrl = `${window.location.origin}/certificate?verify=${cert.verificationCode}`;

    const message =
`Congratulations! 🎉

Your certificate for "${cert.course}" has been generated successfully on LearnifyEnglish.

📋 Certificate Details:
  • Course: ${cert.course}
  • Grade: ${cert.grade}%
  • Completion Date: ${new Date(cert.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
  • Verification Code: ${cert.verificationCode}

🔗 Verify your certificate at:
${verifyUrl}

Keep up the great work and continue learning!
— LearnifyEnglish Team`;

    cert.emailSent = false;
    cert.errorMsg = '';

    (window as any).emailjs.send(
      'service_als3l0',
      'template_jgu4s4d',
      {
        email:   'tahersahbi7@gmail.com',
        subject: `🎓 Your Certificate for ${cert.course} is Ready!`,
        message: message,
      }
    ).then(
      () => {
        cert.emailSent = true;
        setTimeout(() => cert.emailSent = false, 5000);
      },
      (error: any) => {
        cert.errorMsg = 'Failed to send email. Please try again.';
        console.error('EmailJS error:', error);
      }
    );
  }

  generateCertificate(cert: CertCard): void {
    if (!cert.completed) return;
    cert.generating = true;
    cert.successMsg = '';

    setTimeout(() => {
      this.openCertificateWindow(cert);
      cert.generating = false;
      cert.successMsg = 'Certificate opened — use Print → Save as PDF';
      setTimeout(() => (cert.successMsg = ''), 5000);
    }, 800);
  }

  verifyCertificate(): void {
    const code = this.verifyCode.trim().toUpperCase();
    this.verifyResult = null;
    this.verifyError = '';
    if (!code) return;
    const found = this.certificates.find(c => c.verificationCode.toUpperCase() === code);
    found ? (this.verifyResult = found) : (this.verifyError = 'Certificate not found. Please check the code and try again.');
  }

  private openCertificateWindow(cert: CertCard): void {
    const win = window.open('', '_blank');
    if (!win) return;
    const verifyUrl = `${window.location.origin}/certificate?verify=${cert.verificationCode}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(verifyUrl)}`;

    win.document.write(`<!DOCTYPE html>
<html><head>
  <meta charset="UTF-8">
  <title>Certificate — ${cert.course}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',sans-serif;background:#f5f5f0;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:40px}
    .cert{width:860px;background:#fffdf7;padding:64px 80px;border:14px solid #1a1a2e;outline:5px solid #c9a84c;outline-offset:-22px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.2);position:relative}
    .logo{font-size:20px;font-weight:700;color:#1a1a2e;letter-spacing:3px;margin-bottom:32px}
    .cert-title{font-family:'Playfair Display',serif;font-size:52px;color:#1a1a2e;margin-bottom:6px}
    .cert-sub{font-size:13px;color:#888;letter-spacing:4px;text-transform:uppercase;margin-bottom:44px}
    .presented{font-size:15px;color:#999;margin-bottom:12px}
    .student-name{font-family:'Playfair Display',serif;font-size:42px;color:#c9a84c;border-bottom:2px solid #c9a84c;display:inline-block;padding-bottom:8px;margin-bottom:36px}
    .for-completing{font-size:14px;color:#999;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px}
    .course-name{font-size:26px;font-weight:700;color:#1a1a2e;margin-bottom:10px}
    .grade{font-size:15px;color:#555;margin-bottom:8px}
    .date{font-size:14px;color:#999;margin-bottom:40px}
    hr{border:none;border-top:1px solid #e0d9c8;margin:0 0 32px}
    .footer{display:flex;justify-content:space-between;align-items:flex-end}
    .sig{text-align:center}
    .sig-line{width:150px;border-top:1px solid #555;margin:0 auto 8px}
    .sig-name{font-size:13px;font-weight:600;color:#333}
    .sig-role{font-size:11px;color:#999;margin-top:2px}
    .seal{width:84px;height:84px;border-radius:50%;background:linear-gradient(135deg,#1a1a2e,#2d2d5e);color:#c9a84c;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:9px;font-weight:700;letter-spacing:1px;text-align:center;border:3px solid #c9a84c}
    .bottom-row{display:flex;justify-content:center;align-items:center;gap:40px;margin-top:28px;padding-top:20px;border-top:1px solid #e0d9c8}
    .verify-code{font-size:11px;color:#bbb;letter-spacing:1px}
    .qr-wrap{display:flex;flex-direction:column;align-items:center;gap:4px}
    .qr-wrap img{width:80px;height:80px;border:2px solid #e0d9c8;border-radius:6px;padding:3px;background:#fff}
    .qr-label{font-size:9px;color:#bbb;letter-spacing:2px;text-transform:uppercase}
    @media print{body{background:white;padding:0}.cert{box-shadow:none}}
  </style>
</head>
<body>
  <div class="cert">
    <div class="logo">🎓 &nbsp; L E A R N I F Y E N G L I S H</div>
    <div class="cert-title">Certificate</div>
    <div class="cert-sub">of Completion</div>
    <div class="presented">This certificate is proudly presented to</div>
    <div class="student-name">Taher</div>
    <div class="for-completing">for successfully completing</div>
    <div class="course-name">${cert.course}</div>
    <div class="grade">Final Grade: <strong>${cert.grade}%</strong></div>
    <div class="date">Issued on ${new Date(cert.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    <hr>
    <div class="footer">
      <div class="sig"><div class="sig-line"></div><div class="sig-name">Dr. Sarah Johnson</div><div class="sig-role">Academic Director</div></div>
      <div class="seal"><div>✦</div><div>OFFICIAL</div><div>CERT</div><div>✦</div></div>
      <div class="sig"><div class="sig-line"></div><div class="sig-name">LearnifyEnglish</div><div class="sig-role">Platform Director</div></div>
    </div>
    <div class="bottom-row">
      <div class="verify-code">Verification Code: ${cert.verificationCode}</div>
      <div class="qr-wrap">
        <img src="${qrUrl}" alt="QR Code" />
        <div class="qr-label">SCAN TO VERIFY</div>
      </div>
    </div>
  <script>window.onload=()=>window.print();</script>
</body></html>`);
    win.document.close();
  }
}
