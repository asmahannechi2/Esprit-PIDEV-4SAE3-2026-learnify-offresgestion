import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CoreModule } from '../core/core.module';
import { PaymentRecommendationComponent } from '../shared/components/payment-recommendation/payment-recommendation.component';

import { ClubsComponent } from '../pages/clubs/clubs.component';
import { MessengerComponent } from '../pages/messenger/messenger.component';
import { PreevaluationShellComponent } from '../pages/preevaluation/preevaluation-shell.component';
import { PreevaluationIntroComponent } from '../pages/preevaluation/preevaluation-intro.component';
import { PreevaluationProfileComponent } from '../pages/preevaluation/preevaluation-profile.component';
import { PreevaluationTestComponent } from '../pages/preevaluation/preevaluation-test.component';
import { PreevaluationResultComponent } from '../pages/preevaluation/preevaluation-result.component';
import { PreevaluationCheatingTerminatedComponent } from '../pages/preevaluation/preevaluation-cheating-terminated.component';
import { PaymentComponent } from '../pages/payment/payment.component';
import { CertificateComponent } from '../pages/certificate/certificate.component';
import { FeedbackComponent } from '../pages/feedback/feedback.component';
import { CvComponent } from '../pages/cv/cv.component';
import { JobOffersComponent } from '../pages/job-offers/job-offers.component';
import { VideoPitchComponent } from '../pages/video-pitch/video-pitch.component';
import { MyApplicationsComponent } from '../pages/my-applications/my-applications.component';
import { RateTutorComponent } from '../pages/rate-tutor/rate-tutor.component';
import { QuizComponent } from '../pages/quiz/quiz.component';
import { ScheduleComponent } from '../pages/schedule/schedule.component';

// Badges & Certificate Requests (CODE4)
import { BadgesComponent } from '../pages/badges/badges.component';
import { MyRequestsComponent } from '../pages/my-requests/my-requests.component';

@NgModule({
  declarations: [
    ClubsComponent,
    MessengerComponent,
    PreevaluationShellComponent,
    PreevaluationIntroComponent,
    PreevaluationProfileComponent,
    PreevaluationTestComponent,
    PreevaluationResultComponent,
    PreevaluationCheatingTerminatedComponent,
    PaymentComponent,
    CertificateComponent,
    FeedbackComponent,
    CvComponent,
    JobOffersComponent,
    VideoPitchComponent,
    MyApplicationsComponent,
    RateTutorComponent,
    QuizComponent,
    ScheduleComponent,
    BadgesComponent,
    MyRequestsComponent,
  ],
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, CoreModule, PaymentRecommendationComponent],
  exports: [
    ClubsComponent,
    MessengerComponent,
    PreevaluationShellComponent,
    PreevaluationIntroComponent,
    PreevaluationProfileComponent,
    PreevaluationTestComponent,
    PreevaluationResultComponent,
    PreevaluationCheatingTerminatedComponent,
    PaymentComponent,
    CertificateComponent,
    FeedbackComponent,
    CvComponent,
    JobOffersComponent,
    VideoPitchComponent,
    MyApplicationsComponent,
    RateTutorComponent,
    QuizComponent,
    ScheduleComponent,
    BadgesComponent,
    MyRequestsComponent,
  ],
})
export class FeaturesModule {}
