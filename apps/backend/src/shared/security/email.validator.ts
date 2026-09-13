import { BadRequestException } from '@nestjs/common';
import * as dns from 'dns';

const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com',
  'mailinator.com',
  '10minutemail.com',
  'guerrillamail.com',
  'trashmail.com',
  'yopmail.com',
  'sharklasers.com',
  'getairmail.com',
  'throwawaymail.com',
  'dispostable.com',
  'temp-mail.org',
  'nada.ltd',
  'generator.email',
]);

/**
 * Valida que el email tenga formato válido, no pertenezca a dominios desechables
 * y tenga registros MX activos para recibir correo real.
 */
export async function validateRealEmail(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  
  // 1. Sintaxis RFC básica
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(normalized)) {
    throw new BadRequestException('El formato del correo electrónico no es válido');
  }

  const parts = normalized.split('@');
  if (parts.length !== 2) {
    throw new BadRequestException('Formato de correo electrónico incorrecto');
  }

  const domain = parts[1];

  // 2. Comprobar dominios temporales / falsos
  if (DISPOSABLE_DOMAINS.has(domain)) {
    throw new BadRequestException('No se permiten correos electrónicos temporales o desechables');
  }

  // 3. Comprobar registros MX del dominio vía DNS
  try {
    const mxRecords = await dns.promises.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      throw new BadRequestException(`El dominio @${domain} no tiene servidores de correo activos para recibir mensajes`);
    }
  } catch (error: any) {
    // Si la consulta DNS falla porque el dominio no existe o no tiene MX
    if (error?.code === 'ENOTFOUND' || error?.code === 'NODATA' || error?.code === 'SERVFAIL') {
      throw new BadRequestException(`El dominio @${domain} no existe o no puede recibir correos`);
    }
    // En caso de problemas de red locales o timeout DNS, no bloquear si la sintaxis es válida
  }
}
