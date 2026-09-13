import { BadRequestException } from '@nestjs/common';

export interface PasswordStrength {
  score:    number;   // 0-4
  label:    'Muy débil' | 'Débil' | 'Media' | 'Fuerte' | 'Muy fuerte';
  feedback: string[];
}

/**
 * Valida y evalúa la fortaleza de una contraseña.
 * Score: 0 = inaceptable, 4 = muy fuerte
 */
export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Agrega al menos una letra mayúscula');
  if (/[a-z]/.test(password)) score++;
  else feedback.push('Agrega al menos una letra minúscula');
  if (/\d/.test(password)) score++;
  else feedback.push('Agrega al menos un número');
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  else feedback.push('Agrega un carácter especial (!@#$%...)');
  if (password.length < 8) feedback.push('Mínimo 8 caracteres');

  // Penalizar patrones comunes
  const common = ['123456', 'password', 'qwerty', 'abc123', '111111'];
  if (common.some((p) => password.toLowerCase().includes(p))) {
    score = Math.max(0, score - 2);
    feedback.push('Evita contraseñas comunes o secuencias obvias');
  }

  const labels: PasswordStrength['label'][] = [
    'Muy débil', 'Débil', 'Media', 'Fuerte', 'Muy fuerte',
  ];

  return {
    score:    Math.min(4, score),
    label:    labels[Math.min(4, score)],
    feedback,
  };
}

/**
 * Lanza BadRequestException si la contraseña no cumple el mínimo.
 */
export function enforcePasswordPolicy(password: string): void {
  const { score, feedback } = validatePasswordStrength(password);
  if (score < 2) {
    throw new BadRequestException({
      message: 'La contraseña no cumple los requisitos de seguridad',
      feedback,
    });
  }
}
