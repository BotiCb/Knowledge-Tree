import { Module } from '@nestjs/common';
import { VideoService } from './video.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({ imports: [FirebaseModule], providers: [VideoService], exports: [VideoService] })
export class VideoModule {}
