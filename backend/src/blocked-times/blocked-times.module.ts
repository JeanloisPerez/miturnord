import { Module } from '@nestjs/common';
import { BlockedTimesController } from './blocked-times.controller';
import { BlockedTimesService } from './blocked-times.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [BlockedTimesController],
    providers: [BlockedTimesService],
    exports: [BlockedTimesService],
})
export class BlockedTimesModule { }
