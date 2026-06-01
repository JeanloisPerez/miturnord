import { Controller, Get, Post, Query, Res, UseGuards, Request } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GoogleCalendarService } from './google-calendar.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('google-calendar')
export class GoogleCalendarController {
  constructor(
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('connect')
  async connect(@Request() req) {
    const userId = req.user.sub;
    const url = this.googleCalendarService.generateAuthUrl(userId);
    return { url };
  }

  @UseGuards(JwtAuthGuard)
  @Post('disconnect')
  async disconnect(@Request() req) {
    const userId = req.user.sub;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        google_access_token: null,
        google_refresh_token: null,
        google_calendar_id: null,
      },
    });
    return { success: true };
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') userId: string,
    @Res() res: Response,
  ) {
    try {
      const tokens = await this.googleCalendarService.getTokensFromCode(code);
      await this.googleCalendarService.saveTokens(userId, tokens);

      // Redirect back to frontend owner profile view
      return res.redirect('/owner/profile?sync=success');
    } catch (error) {
      console.error('Google Calendar OAuth callback error:', error);
      return res.redirect('/owner/profile?sync=error');
    }
  }
}
