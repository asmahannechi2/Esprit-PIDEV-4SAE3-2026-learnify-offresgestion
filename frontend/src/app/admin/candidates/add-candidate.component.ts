import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AdminManagementService } from '../../services/admin-management.service';

@Component({
  selector: 'app-add-candidate',
  standalone: false,
  templateUrl: './add-candidate.component.html',
  styleUrls: ['./add-candidate.component.css'],
})
export class AddCandidateComponent {
  loading = false;
  msg = '';
  err = '';

  form;

  constructor(private fb: FormBuilder, private adminService: AdminManagementService) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  submit(): void {
    this.msg = '';
    this.err = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.err = 'Merci de remplir correctement tous les champs.';
      return;
    }

    const v = this.form.value;
    this.loading = true;
    this.adminService
      .createCandidate({
        firstName: v.firstName!.trim(),
        lastName: v.lastName!.trim(),
        email: v.email!.trim(),
        password: v.password!,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.err = '';
          this.msg = 'Compte candidat créé. La personne peut se connecter avec cet e-mail et le mot de passe.';
          this.form.reset();
          setTimeout(() => {
            this.msg = '';
          }, 6000);
        },
        error: (e: any) => {
          this.loading = false;
          this.msg = '';
          const apiMsg = e?.error?.message || e?.error?.error;
          if (e?.status === 401) {
            this.err = 'Non autorisé. Connecte-toi avec un compte Admin (onglet Admin).';
          } else if (e?.status === 403) {
            this.err =
              'Accès refusé. Déconnecte-toi puis reconnecte-toi en Admin, ou vide les cookies pour ce site.';
          } else if (e?.status === 409) {
            this.err = apiMsg || 'Cette adresse e-mail est déjà utilisée.';
          } else {
            this.err = apiMsg || 'Échec de la création du compte candidat.';
          }
        },
      });
  }
}
