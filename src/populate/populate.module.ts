import { Module } from '@nestjs/common';
import { PopulateController } from './populate.controller';
import { PopulateService } from './populate.service';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [PopulateController],
  providers: [PopulateService],
})
export class PopulateModule {}
