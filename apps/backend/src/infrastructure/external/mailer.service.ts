import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('MAIL_HOST', 'smtp.gmail.com'),
      port: this.config.get<number>('MAIL_PORT', 587),
      secure: false, // STARTTLS
      auth: {
        user: this.config.get('MAIL_USER'),
        pass: this.config.get('MAIL_PASSWORD'),
      },
    });
  }

  async send(options: MailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.config.get('MAIL_FROM', 'Reity <no-reply@reity.app>'),
        ...options,
      });
      this.logger.log(`Email enviado a: ${options.to}`);
    } catch (err) {
      this.logger.error(`Error enviando email a ${options.to}:`, err.message);
      throw err;
    }
  }

  /** Template: recuperación de contraseña */
  resetPasswordTemplate(fullName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#0F172A;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:40px 20px;">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#1E293B;border-radius:16px;overflow:hidden;">
                <!-- Header -->
                <tr>
                  <td style="background:#6366F1;padding:32px;text-align:center;">
                    <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Reity</h1>
                    <p style="margin:4px 0 0;color:#C7D2FE;font-size:13px;">Finanzas Personales Inteligentes</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px 32px;">
                    <p style="color:#94A3B8;font-size:14px;margin:0 0 8px;">Hola, <strong style="color:#F8FAFC;">${fullName}</strong></p>
                    <h2 style="color:#F8FAFC;font-size:22px;margin:0 0 16px;">Recupera tu contraseña</h2>
                    <p style="color:#94A3B8;font-size:15px;line-height:1.6;margin:0 0 32px;">
                      Recibimos una solicitud para restablecer la contraseña de tu cuenta Reity.
                      Este enlace es válido por <strong style="color:#F8FAFC;">15 minutos</strong>.
                    </p>
                    <div style="text-align:center;margin-bottom:32px;">
                      <a href="${resetUrl}"
                         style="display:inline-block;background:#6366F1;color:#fff;text-decoration:none;
                                padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;">
                        Restablecer contraseña
                      </a>
                    </div>
                    <p style="color:#475569;font-size:13px;line-height:1.5;margin:0;">
                      Si no solicitaste esto, puedes ignorar este email.
                      Tu contraseña no cambiará.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding:20px 32px;border-top:1px solid #334155;text-align:center;">
                    <p style="color:#475569;font-size:12px;margin:0;">© 2026 Reity · Colombia</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}
