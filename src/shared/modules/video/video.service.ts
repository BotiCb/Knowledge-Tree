import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { FirebaseService } from '../firebase/firebase.service';
import * as ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';

// Correct import for ffprobe-static
import * as ffprobeStatic from 'ffprobe-static';

@Injectable()
export class VideoService {
  constructor(private readonly firebaseService: FirebaseService) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
    ffmpeg.setFfprobePath(ffprobeStatic.path); // Correct access to ffprobe-static
  }

  async streamVideo(fileUrl: string, res: Response) {
    const relativeUrl = fileUrl.replace('https://storage.googleapis.com/knowledgetree-31838.appspot.com/', '');
    const file = this.firebaseService.getStorageInstance().bucket().file(relativeUrl);

    const [fileMetadata] = await file.getMetadata();
    const fileSize = fileMetadata.size;

    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    });

    file.createReadStream().pipe(res);
  }

  async getVideoLength(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const duration = metadata.format.duration;
          resolve(duration);
        }
      });
    });
  }

  async getVideoLengthFromFirebase(fileUrl: string): Promise<number> {
    const relativeUrl = fileUrl.replace('https://storage.googleapis.com/knowledgetree-31838.appspot.com/', '');
    const tempFilePath = path.join(os.tmpdir(), uuidv4() + path.extname(relativeUrl));
    await this.firebaseService.getStorageInstance().bucket().file(relativeUrl).download({ destination: tempFilePath });

    try {
      const duration = Math.floor(await this.getVideoLength(tempFilePath));
      return duration;
    } catch (error) {
      console.error('Error getting video length:', error);
      throw error;
    } finally {
      // Clean up temporary file
      fs.unlinkSync(tempFilePath);
    }
  }
}
