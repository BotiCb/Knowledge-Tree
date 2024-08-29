import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { extname } from 'path';
import { config } from 'src/shared/config/config';

@Injectable()
export class FileUploadService {
  constructor(private readonly firebaseService: FirebaseService) {}

  private async uploadFile(file: Express.Multer.File, folder, privateRead: boolean = false): Promise<string> {
    const storage = this.firebaseService.getStorageInstance();
    const bucket = storage.bucket();
    const extension = extname(file.originalname);
    const fileName = `${folder}/${Date.now()}${extension}`;
    const fileUpload = bucket.file(fileName);
    const privacy = privateRead ? 'private' : 'publicRead';
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
      predefinedAcl: privacy,
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        reject(error);
      });
      stream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
        resolve(publicUrl);
      });

      stream.end(file.buffer);
    });
  }

  async deleteFile(fileUrl: string) {
    try {
      const relativePath = fileUrl.replace('https://storage.googleapis.com/knowledgetree-31838.appspot.com/', '');
      const storage = this.firebaseService.getStorageInstance();
      const bucket = storage.bucket();
      bucket.deleteFiles({
        prefix: relativePath,
      });
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  async uploadProfilePicture(file: Express.Multer.File, oldPictureUrl?: string): Promise<string> {
    if (oldPictureUrl && oldPictureUrl !== '') {
      await this.deleteFile(oldPictureUrl);
    }
    const url = await this.uploadFile(file, 'profile-pictures');
    return url;
  }

  async uploadCourseIndexPhoto(file: Express.Multer.File, oldPictureUrl?: string): Promise<string> {
    if (oldPictureUrl && oldPictureUrl !== config.get('plain.courseIndexPhotoUrl')) {
      await this.deleteFile(oldPictureUrl);
    }
    return this.uploadFile(file, 'course-index-photos');
  }

  async uploadSectionVideo(file: Express.Multer.File, oldVideoUrl?: string): Promise<string> {
    if (oldVideoUrl && oldVideoUrl !== '') {
      await this.deleteFile(oldVideoUrl);
    }
    return this.uploadFile(file, 'section-videos', true);
  }
}
