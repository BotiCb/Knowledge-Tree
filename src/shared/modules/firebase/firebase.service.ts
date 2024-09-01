import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { config } from 'src/shared/config/config'; // Adjust the path as necessary

@Injectable()
export class FirebaseService {
  private storage: admin.storage.Storage;

  constructor() {
    const serviceAccount: admin.ServiceAccount = {
      projectId: config.get('firebase.service_account.project_id'),
      privateKey: config.get('firebase.service_account.private_key').replace(/\\n/g, '\n'),
      clientEmail: config.get('firebase.service_account.client_email'),
    };

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


