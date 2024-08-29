import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { FileUploadService } from './file-upload.service';

@Module({
  imports: [FirebaseModule],
  providers: [FileUploadService],
  exports: [FileUploadService],
})
export class FileUploadModule {}
