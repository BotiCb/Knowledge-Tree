import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private storage: admin.storage.Storage;

  constructor() {
    // Initialize Firebase with your service account credentials
    const serviceAccount = require('../../../../firebase-service-account.json');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'knowledgetree-31838.appspot.com', // Your Firebase Storage bucket name
    });

    this.storage = admin.storage();
  }

  getStorageInstance(): admin.storage.Storage {
    return this.storage;
  }
}
