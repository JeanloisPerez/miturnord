import { Module } from '@nestjs/common';
import { InstitutionTypesService } from './institution-types.service';
import { InstitutionTypesController } from './institution-types.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [InstitutionTypesController],
    providers: [InstitutionTypesService],
    exports: [InstitutionTypesService],
})
export class InstitutionTypesModule { }
