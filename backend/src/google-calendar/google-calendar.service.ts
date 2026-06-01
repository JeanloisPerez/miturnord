import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private getOAuth2Client() {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_CALLBACK_URL');

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  generateAuthUrl(userId: string): string {
    const oauth2Client = this.getOAuth2Client();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/calendar'],
      state: userId, // Pass userId in state to identify the user on callback
    });
  }

  async getTokensFromCode(code: string) {
    const oauth2Client = this.getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  }

  async saveTokens(userId: string, tokens: any) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        google_access_token: tokens.access_token || null,
        google_refresh_token: tokens.refresh_token || null,
        google_calendar_id: 'primary',
      },
    });
  }

  private async getAuthenticatedClient(user: { id: string; google_access_token: string | null; google_refresh_token: string | null }) {
    const oauth2Client = this.getOAuth2Client();
    
    oauth2Client.setCredentials({
      access_token: user.google_access_token || undefined,
      refresh_token: user.google_refresh_token || undefined,
    });

    // Handle token refresh automatically if expired
    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.access_token) {
        this.logger.log(`Refreshing Google access token for user ${user.id}`);
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            google_access_token: tokens.access_token,
            ...(tokens.refresh_token && { google_refresh_token: tokens.refresh_token }),
          },
        });
      }
    });

    return oauth2Client;
  }

  async getBusySlots(userId: string, start: Date, end: Date): Promise<{ start: Date; end: Date }[]> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.google_refresh_token) return [];

    try {
      const auth = await this.getAuthenticatedClient(user);
      const calendar = google.calendar({ version: 'v3', auth });

      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: start.toISOString(),
          timeMax: end.toISOString(),
          items: [{ id: user.google_calendar_id || 'primary' }],
        },
      });

      const busyItems = response.data.calendars?.[user.google_calendar_id || 'primary']?.busy || [];
      return busyItems.map((b) => ({
        start: new Date(b.start!),
        end: new Date(b.end!),
      }));
    } catch (error) {
      this.logger.error(`Error querying freebusy from Google for user ${userId}`, error);
      return [];
    }
  }

  async createEvent(appointment: any): Promise<string | null> {
    // Find all users (owners/staff) with connected Google Calendars for this institution
    const staffMembers = await this.prisma.institutionUser.findMany({
      where: {
        institution_id: appointment.institution_id,
        user: {
          NOT: { google_refresh_token: null },
        },
      },
      include: { user: true },
    });

    if (staffMembers.length === 0) return null;

    // We'll create the event on the primary owner/staff's calendar
    const primaryStaff = staffMembers[0].user;
    try {
      const auth = await this.getAuthenticatedClient(primaryStaff);
      const calendar = google.calendar({ version: 'v3', auth });

      const startDate = new Date(appointment.date);
      const endDate = new Date(startDate.getTime() + appointment.service.duration * 60 * 1000);

      const attendees: any[] = [];
      const recipientEmail = appointment.user?.email || appointment.walk_in_email;
      if (recipientEmail) {
        attendees.push({ email: recipientEmail, displayName: appointment.user?.full_name || appointment.walk_in_name || 'Cliente' });
      }

      const response = await calendar.events.insert({
        calendarId: primaryStaff.google_calendar_id || 'primary',
        sendUpdates: 'all', // Send email updates to attendees automatically
        requestBody: {
          summary: `MiTurnoRD - Cita: ${appointment.service.name}`,
          description: `Cita reservada en la plataforma MiTurnoRD.\nCliente: ${appointment.user?.full_name || appointment.walk_in_name || 'Cliente'}\nServicio: ${appointment.service.name}\nNotas: ${appointment.notes || 'Ninguna'}`,
          location: appointment.branch ? `${appointment.branch.name} - ${appointment.branch.address || ''}, ${appointment.branch.city || ''}` : appointment.institution.name,
          start: { dateTime: startDate.toISOString() },
          end: { dateTime: endDate.toISOString() },
          attendees,
        },
      });

      return response.data.id || null;
    } catch (error) {
      this.logger.error(`Failed to create Google Calendar event for appointment ${appointment.id}`, error);
      return null;
    }
  }

  async updateEvent(appointment: any, googleEventId: string): Promise<boolean> {
    const staffMembers = await this.prisma.institutionUser.findMany({
      where: {
        institution_id: appointment.institution_id,
        user: {
          NOT: { google_refresh_token: null },
        },
      },
      include: { user: true },
    });

    if (staffMembers.length === 0) return false;

    const primaryStaff = staffMembers[0].user;
    try {
      const auth = await this.getAuthenticatedClient(primaryStaff);
      const calendar = google.calendar({ version: 'v3', auth });

      const startDate = new Date(appointment.date);
      const endDate = new Date(startDate.getTime() + appointment.service.duration * 60 * 1000);

      const attendees: any[] = [];
      const recipientEmail = appointment.user?.email || appointment.walk_in_email;
      if (recipientEmail) {
        attendees.push({ email: recipientEmail, displayName: appointment.user?.full_name || appointment.walk_in_name || 'Cliente' });
      }

      await calendar.events.patch({
        calendarId: primaryStaff.google_calendar_id || 'primary',
        eventId: googleEventId,
        sendUpdates: 'all',
        requestBody: {
          start: { dateTime: startDate.toISOString() },
          end: { dateTime: endDate.toISOString() },
          attendees,
        },
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to update Google Calendar event ${googleEventId}`, error);
      return false;
    }
  }

  async deleteEvent(appointment: any, googleEventId: string): Promise<boolean> {
    const staffMembers = await this.prisma.institutionUser.findMany({
      where: {
        institution_id: appointment.institution_id,
        user: {
          NOT: { google_refresh_token: null },
        },
      },
      include: { user: true },
    });

    if (staffMembers.length === 0) return false;

    const primaryStaff = staffMembers[0].user;
    try {
      const auth = await this.getAuthenticatedClient(primaryStaff);
      const calendar = google.calendar({ version: 'v3', auth });

      await calendar.events.delete({
        calendarId: primaryStaff.google_calendar_id || 'primary',
        eventId: googleEventId,
        sendUpdates: 'all',
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to delete Google Calendar event ${googleEventId}`, error);
      return false;
    }
  }
}
