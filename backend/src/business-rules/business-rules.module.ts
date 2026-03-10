import { Module } from '@nestjs/common';
import { BusinessRulesController } from './business-rules.controller';
import { BusinessRulesService } from './business-rules.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [BusinessRulesController],
    providers: [BusinessRulesService],
    exports: [BusinessRulesService],
})
export class BusinessRulesModule { }
