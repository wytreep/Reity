import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import axios from 'axios';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  code?: string;
  resetUrl?: string;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = this.config.get<string>('MAIL_HOST');
    const user = this.config.get<string>('MAIL_USER');
    const pass = this.config.get<string>('MAIL_PASSWORD');
    const port = this.config.get<number>('MAIL_PORT', 587);

    // Solo configurar transporter si no son valores por defecto o placeholders
    if (user && pass && pass !== 'your_app_password' && !user.includes('no-reply@reity.app')) {
      this.transporter = nodemailer.createTransport({
        host: host || 'smtp.gmail.com',
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`Mailer configurado con SMTP: ${host || 'smtp.gmail.com'}`);
    }
  }

  async send(options: MailOptions): Promise<void> {
    const resendApiKey = this.config.get<string>('RESEND_API_KEY');
    const fromAddress  = this.config.get<string>('MAIL_FROM', 'Reity <onboarding@resend.dev>');

    // ── 1. Intentar enviar vía Resend API (si está configurada la API KEY) ─
    if (resendApiKey && resendApiKey.trim() !== '' && !resendApiKey.includes('your_')) {
      try {
        const response = await axios.post(
          'https://api.resend.com/emails',
          {
            from: fromAddress,
            to: [options.to],
            subject: options.subject,
            html: options.html,
          },
          {
            headers: {
              Authorization: `Bearer ${resendApiKey.trim()}`,
              'Content-Type': 'application/json',
            },
            timeout: 8000,
          },
        );
        this.logger.log(`✅ Email enviado exitosamente a ${options.to} vía Resend API (id: ${response.data?.id})`);
        return;
      } catch (err: any) {
        const resendErr = err.response?.data?.message || err.message;
        this.logger.warn(`⚠️ Error con Resend API: ${resendErr}. Pasando a fallback.`);
      }
    }

    // ── 2. Intentar enviar vía SMTP (si está configurado) ───────────────
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          html: options.html,
        });
        this.logger.log(`✅ Email enviado exitosamente a ${options.to} vía SMTP (id: ${info.messageId})`);
        return;
      } catch (err: any) {
        this.logger.warn(`⚠️ Error enviando email por SMTP: ${err.message}. Pasando a modo desarrollo/consola.`);
      }
    }

    // ── 3. Modo Desarrollo / Fallback Seguro (Consola & Ethereal) ────────
    this.logger.log(`=======================================================`);
    this.logger.log(`📧 [EMAIL INTERCEPTADO - MODO DESARROLLO / FALLBACK]`);
    this.logger.log(`   Destinatario: ${options.to}`);
    this.logger.log(`   Asunto:       ${options.subject}`);
    if (options.code) {
      this.logger.log(`   🔑 CÓDIGO DE RECUPERACIÓN (6 DÍGITOS): ${options.code}`);
    }
    if (options.resetUrl) {
      this.logger.log(`   🔗 ENLACE DE RECUPERACIÓN: ${options.resetUrl}`);
    }
    this.logger.log(`=======================================================`);

    // Intentar generar preview en Ethereal en segundo plano para facilidad de prueba
    try {
      const testAccount = await nodemailer.createTestAccount();
      const etherealTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      const info = await etherealTransporter.sendMail({
        from: 'Reity Dev <no-reply@reity.app>',
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        this.logger.log(`🌐 Preview web del email en Ethereal: ${previewUrl}`);
      }
    } catch {
      // Si no hay internet para Ethereal, la información ya quedó registrada en la consola arriba
    }
  }

  /** Template: recuperación de contraseña con código OTP y enlace */
  resetPasswordTemplate(fullName: string, resetUrl: string, code?: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recupera tu contraseña - Reity</title>
      </head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#0B0F19;color:#F8FAFC;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0F19;padding:40px 16px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#131B2E;border-radius:20px;border:1px solid #1E293B;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.4);">
                <!-- Header / Logo -->
                <tr>
                  <td style="background:linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #818CF8 100%);padding:36px 32px;text-align:center;">
                    <h1 style="margin:0;color:#FFFFFF;font-size:32px;font-weight:800;letter-spacing:-1px;">Reity</h1>
                    <p style="margin:6px 0 0;color:#E0E7FF;font-size:14px;font-weight:500;">Finanzas Personales Inteligentes</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding:40px 32px;">
                    <p style="color:#94A3B8;font-size:15px;margin:0 0 10px;">Hola, <strong style="color:#FFFFFF;">${fullName}</strong></p>
                    <h2 style="color:#FFFFFF;font-size:22px;font-weight:700;margin:0 0 16px;letter-spacing:-0.5px;">Recuperación de contraseña</h2>
                    <p style="color:#94A3B8;font-size:15px;line-height:1.6;margin:0 0 28px;">
                      Recibimos una solicitud para restablecer la contraseña de tu cuenta Reity. Utiliza el siguiente código de 6 dígitos en tu aplicación móvil o pulsa el botón para continuar.
                    </p>

                    ${code ? `
                    <!-- 6-digit Code Box -->
                    <div style="background-color:#0B0F19;border:1.5px dashed #4F46E5;border-radius:14px;padding:20px;text-align:center;margin:0 0 28px 0;">
                      <span style="display:block;color:#A5B4FC;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Tu código de seguridad</span>
                      <span style="font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:800;letter-spacing:10px;color:#38BDF8;display:inline-block;padding-left:10px;">${code}</span>
                      <span style="display:block;color:#64748B;font-size:12px;margin-top:8px;">Válido por 15 minutos</span>
                    </div>
                    ` : ''}

                    <!-- Direct Link Button -->
                    <div style="text-align:center;margin:0 0 28px 0;">
                      <a href="${resetUrl}"
                         style="display:inline-block;background-color:#4F46E5;color:#FFFFFF;text-decoration:none;
                                padding:14px 36px;border-radius:12px;font-size:15px;font-weight:600;
                                box-shadow:0 4px 14px rgba(79,70,229,0.4);">
                        Restablecer contraseña
                      </a>
                    </div>

                    <div style="background-color:rgba(239,68,68,0.1);border-left:3px solid #EF4444;padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 24px 0;">
                      <p style="color:#FCA5A5;font-size:13px;line-height:1.5;margin:0;">
                        ⚠️ Si no solicitaste este cambio, ignora este mensaje. Tu cuenta sigue protegida.
                      </p>
                    </div>

                    <p style="color:#64748B;font-size:13px;line-height:1.5;margin:0;">
                      Este enlace y código expirarán automáticamente en 15 minutos por tu seguridad.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:24px 32px;background-color:#0D1322;border-top:1px solid #1E293B;text-align:center;">
                    <p style="color:#475569;font-size:12px;margin:0;">
                      © 2026 Reity · Seguridad y Control Financiero · Colombia
                    </p>
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

  /** Template: bienvenida, confirmación de cuenta y políticas de privacidad */
  welcomeEmailTemplate(fullName: string, email: string, date: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido a Reity</title>
      </head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#0B0F19;color:#F8FAFC;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0F19;padding:40px 16px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#131B2E;border-radius:20px;border:1px solid #1E293B;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.4);">
                <!-- Header / Logo -->
                <tr>
                  <td style="background:linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%);padding:36px 32px;text-align:center;">
                    <h1 style="margin:0;color:#FFFFFF;font-size:32px;font-weight:800;letter-spacing:-1px;">¡Bienvenido a Reity!</h1>
                    <p style="margin:6px 0 0;color:#D1FAE5;font-size:14px;font-weight:500;">Tu cuenta ha sido creada exitosamente</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding:40px 32px;">
                    <p style="color:#94A3B8;font-size:15px;margin:0 0 10px;">Hola, <strong style="color:#FFFFFF;">${fullName}</strong></p>
                    <h2 style="color:#FFFFFF;font-size:20px;font-weight:700;margin:0 0 16px;letter-spacing:-0.5px;">Registro confirmado</h2>
                    <p style="color:#94A3B8;font-size:15px;line-height:1.6;margin:0 0 24px;">
                      Te damos la bienvenida a la plataforma que te permite controlar tus gastos, presupuestos, metas de ahorro y monitorear el impacto real de la inflación en Colombia.
                    </p>

                    <!-- Info Box -->
                    <div style="background-color:#0B0F19;border:1px solid #1E293B;border-radius:14px;padding:18px 20px;margin:0 0 28px 0;">
                      <p style="color:#64748B;font-size:12px;text-transform:uppercase;font-weight:700;margin:0 0 8px;letter-spacing:1px;">Detalles de la cuenta</p>
                      <p style="color:#E2E8F0;font-size:14px;margin:0 0 6px;">📧 <strong>Correo:</strong> ${email}</p>
                      <p style="color:#E2E8F0;font-size:14px;margin:0;">📅 <strong>Fecha de registro:</strong> ${date}</p>
                    </div>

                    <!-- Privacy & Policies Section -->
                    <div style="background-color:#1E293B;border-radius:14px;padding:20px;margin:0 0 28px 0;">
                      <h3 style="color:#38BDF8;font-size:15px;font-weight:700;margin:0 0 10px;">🔒 Tratamiento de Datos y Privacidad (Ley 1581 de 2012)</h3>
                      <ul style="color:#94A3B8;font-size:13px;line-height:1.6;margin:0;padding-left:18px;">
                        <li style="margin-bottom:6px;"><strong>Confidencialidad absoluta:</strong> Tu información financiera y registros de transacciones están cifrados y son de uso estrictamente privado.</li>
                        <li style="margin-bottom:6px;"><strong>No venta de datos:</strong> No comercializamos ni transferimos tus datos a terceros con fines publicitarios.</li>
                        <li style="margin-bottom:6px;"><strong>Derechos ARCO:</strong> Como titular de la información, puedes consultar, actualizar o solicitar la eliminación de tus datos en cualquier momento.</li>
                        <li><strong>Seguridad reforzada:</strong> Tus contraseñas son protegidas con algoritmos de hashing seguro (Bcrypt con 12 rondas de complejidad).</li>
                      </ul>
                    </div>

                    <!-- Security Tips -->
                    <div style="background-color:rgba(99,102,241,0.1);border-left:3px solid #6366F1;padding:14px 16px;border-radius:0 8px 8px 0;margin:0 0 24px 0;">
                      <p style="color:#C7D2FE;font-size:13px;line-height:1.5;margin:0;">
                        💡 <strong>Recomendación de seguridad:</strong> Habilita la autenticación biométrica (huella o Face ID) en la aplicación para un acceso más seguro.
                      </p>
                    </div>

                    <p style="color:#64748B;font-size:13px;line-height:1.5;margin:0;">
                      Si no fuiste tú quien creó esta cuenta, por favor contáctanos de inmediato para revocar el acceso.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:24px 32px;background-color:#0D1322;border-top:1px solid #1E293B;text-align:center;">
                    <p style="color:#475569;font-size:12px;margin:0;">
                      © 2026 Reity · Cumplimiento Habeas Data y Seguridad Financiera · Colombia
                    </p>
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

