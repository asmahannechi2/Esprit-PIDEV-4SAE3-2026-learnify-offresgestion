import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

function isJwtExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

/** Rôle issu du JWT (claim `role` ou premier élément de `roles`) — même source que le job-service. */
export function jwtRoleFromAccessToken(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as Record<string, any>;
    
    // Check standard role claim
    let r = payload['role'] ?? (Array.isArray(payload['roles']) ? payload['roles'][0] : null);
    

    
    if (r == null) return '';
    return String(r).toUpperCase();
  } catch {
    return '';
  }
}

/**
 * Guard for protected routes requiring authentication.
 * Optionally checks that the user has the expected role.
 *
 * Usage in routes:
 *   canActivate: [authGuard]              — any authenticated user
 *   canActivate: [adminGuard]             — ADMIN role only
 */
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token') || '';

  if (!token || isJwtExpired(token)) {
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
  }
  return true;
};

/**
 * Guard for /admin routes — requires valid JWT + ADMIN role.
 * Le rôle dans le JWT est la source de vérité pour le backend ; `localStorage` peut être désynchronisé.
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token') || '';
  const stored = (localStorage.getItem('role') || '').toUpperCase();

  if (!token || isJwtExpired(token)) {
    return router.createUrlTree(['/auth/login'], {
      queryParams: { role: 'admin', returnUrl: state.url }
    });
  }

  const jwtRole = jwtRoleFromAccessToken(token);
  if (jwtRole) {
    if (jwtRole !== 'ADMIN') {
      return router.createUrlTree(['/']);
    }
    if (jwtRole !== stored) {
      localStorage.setItem('role', jwtRole);
    }
  } else if (stored !== 'ADMIN') {
    return router.createUrlTree(['/']);
  }

  return true;
};
