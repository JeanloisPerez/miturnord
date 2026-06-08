import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as dns from 'dns';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const smtpLogin = this.configService.get<string>('BREVO_SMTP_LOGIN');
    const smtpKey = this.configService.get<string>('BREVO_API_KEY');

    if (!smtpLogin) {
      this.logger.warn('⚠️  BREVO_SMTP_LOGIN no está configurado en .env. Los correos NO se enviarán.');
    }

     

this.transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  family: 4, // Fuerza IPv4
  auth: {
    user: process.env.BREVO_SMTP_LOGIN,
    pass: process.env.BREVO_API_KEY,
  },
});
  }

  async sendAppointmentConfirmation(
    toEmail: string,
    toName: string,
    appointmentDate: string,
    serviceName: string,
    institutionName: string,
  ): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: `"MiTurnoRD" <jeanloisdelacruz@gmail.com>`,
        to: `"${toName}" <${toEmail}>`,
        subject: `Confirmación de cita en ${institutionName}`,
        html: `
          <html>
            <body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.6; background-color: #f9fafb; margin: 0; padding: 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 0;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                      <tr>
                        <td style="background-color: #2563eb; padding: 30px; text-align: center;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">MiTurnoRD</h1>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 40px 30px;">
                          <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Confirmación de Cita</h2>
                          <p style="margin: 0 0 24px 0;">Hola ${toName},</p>
                          <p style="margin: 0 0 32px 0;">Tu cita ha sido confirmada satisfactoriamente. A continuación los detalles de tu reservación en <strong>${institutionName}</strong>:</p>
                          
                          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding-bottom: 12px; color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Fecha y Hora</td>
                              </tr>
                              <tr>
                                <td style="padding-bottom: 24px; color: #1e293b; font-size: 16px; font-weight: 500;">${appointmentDate}</td>
                              </tr>
                              <tr>
                                <td style="padding-bottom: 12px; color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Servicio</td>
                              </tr>
                              <tr>
                                <td style="color: #1e293b; font-size: 16px; font-weight: 500;">${serviceName}</td>
                              </tr>
                            </table>
                          </div>

                          <p style="margin: 32px 0 0 0; font-size: 14px; color: #64748b;">
                            Si necesitas realizar cambios en tu reservación, puedes gestionarlos directamente desde tu panel de usuario en nuestra plataforma.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 24px 30px; background-color: #f1f5f9; text-align: center; border-top: 1px solid #e2e8f0;">
                          <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                            &copy; ${new Date().getFullYear()} MiTurnoRD. Todos los derechos reservados.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      });

      this.logger.log(`Correo enviado a ${toEmail} — messageId: ${info.messageId}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error enviando correo a ${toEmail}:`, errorMessage);
      return false;
    }
  }

  async sendAppointmentReminder(
    toEmail: string,
    toName: string,
    appointmentDate: string,
    serviceName: string,
    institutionName: string,
  ): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: `"MiTurnoRD" <jeanloisdelacruz@gmail.com>`,
        to: `"${toName}" <${toEmail}>`,
        subject: `Recordatorio: Cita mañana en ${institutionName}`,
        html: `
          <html>
            <body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.6; background-color: #f9fafb; margin: 0; padding: 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 0;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                      <tr>
                        <td style="background-color: #2563eb; padding: 30px; text-align: center;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">MiTurnoRD</h1>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 40px 30px;">
                          <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Recordatorio de Cita</h2>
                          <p style="margin: 0 0 24px 0;">Hola ${toName},</p>
                          <p style="margin: 0 0 32px 0;">Este es un recordatorio de tu cita programada para el día de mañana en <strong>${institutionName}</strong>:</p>
                          
                          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding-bottom: 12px; color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Fecha y Hora</td>
                              </tr>
                              <tr>
                                <td style="padding-bottom: 24px; color: #1e293b; font-size: 16px; font-weight: 500;">${appointmentDate}</td>
                              </tr>
                              <tr>
                                <td style="padding-bottom: 12px; color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Institución</td>
                              </tr>
                              <tr>
                                <td style="padding-bottom: 24px; color: #1e293b; font-size: 16px; font-weight: 500;">${institutionName}</td>
                              </tr>
                              <tr>
                                <td style="padding-bottom: 12px; color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Servicio</td>
                              </tr>
                              <tr>
                                <td style="color: #1e293b; font-size: 16px; font-weight: 500;">${serviceName}</td>
                              </tr>
                            </table>
                          </div>

                          <p style="margin: 32px 0 0 0; font-size: 14px; color: #64748b;">
                            Si no puedes asistir, por favor cancela o reprograma con antelación desde nuestro portal para permitir que otros usuarios aprovechen el turno.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 24px 30px; background-color: #f1f5f9; text-align: center; border-top: 1px solid #e2e8f0;">
                          <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                            &copy; ${new Date().getFullYear()} MiTurnoRD. Todos los derechos reservados.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      });

      this.logger.log(`Recordatorio enviado a ${toEmail} — messageId: ${info.messageId}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error enviando recordatorio a ${toEmail}:`, errorMessage);
      return false;
    }
  }

  async sendReviewInvitation(
    toEmail: string,
    toName: string,
    serviceName: string,
    institutionName: string,
  ): Promise<boolean> {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
    try {
      const info = await this.transporter.sendMail({
        from: `"MiTurnoRD" <jeanloisdelacruz@gmail.com>`,
        to: `"${toName}" <${toEmail}>`,
        subject: `¿Cómo fue tu experiencia en ${institutionName}? Valoración y Reseña`,
        html: `
          <html>
            <body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.6; background-color: #f9fafb; margin: 0; padding: 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 0;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                      <tr>
                        <td style="background-color: #2563eb; padding: 30px; text-align: center;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">MiTurnoRD</h1>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 40px 30px;">
                          <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Queremos escuchar tu opinión</h2>
                          <p style="margin: 0 0 24px 0;">Hola ${toName},</p>
                          <p style="margin: 0 0 24px 0;">Hemos notado que tu cita de <strong>${serviceName}</strong> en <strong>${institutionName}</strong> ha finalizado. Esperamos que hayas recibido un servicio excepcional.</p>
                          <p style="margin: 0 0 32px 0;">Te invitamos a tomarte un minuto para dejar una valoración y una breve reseña sobre tu experiencia. Tu opinión ayuda a otros usuarios a elegir mejor y a las instituciones a seguir mejorando.</p>
                          
                          <div style="text-align: center; margin: 32px 0;">
                            <a href="${frontendUrl}/citas" 
                               style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37,99,235,0.2);">
                              Valorar mi Servicio ahora
                            </a>
                          </div>

                          <p style="margin: 32px 0 0 0; font-size: 14px; color: #64748b; text-align: center;">
                            ¡Muchas gracias por formar parte de MiTurnoRD!
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 24px 30px; background-color: #f1f5f9; text-align: center; border-top: 1px solid #e2e8f0;">
                          <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                            &copy; ${new Date().getFullYear()} MiTurnoRD. Todos los derechos reservados.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      });

      this.logger.log(`Invitación de valoración enviada a ${toEmail} — messageId: ${info.messageId}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error enviando invitación de valoración a ${toEmail}:`, errorMessage);
      return false;
    }
  }
}
