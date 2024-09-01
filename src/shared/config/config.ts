import * as convict from 'convict';
import * as dotenv from 'dotenv';

dotenv.config();

interface FirebaseServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

interface Config {
  server: {
    port: number;
    runSeeders: boolean;
    debugMode: boolean;
    targetLanguage: string;
  };
  db: {
    url: string;
  };
  auth: {
    jwtSecret: string;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    fromEmail: string;
  };
  firebase: {
    service_account: FirebaseServiceAccount;
  };
  plain: {
    courseIndexPhotoUrl: string;
  };
  testMode: boolean;
  clients: {
    web: {
      frontendUrl: string;
    };
  };
}

export const config = convict<Config>({
  server: {
    port: {
      doc: 'The port to bind',
      format: 'port',
      default: 3000,
      env: 'PORT',
    },
    runSeeders: {
      doc: 'If this value is true, run the seeders at start.',
      format: Boolean,
      default: false,
      env: 'RUN_SEEDERS',
    },
    debugMode: {
      doc: 'If this value is true, the logger is turned on.',
      format: Boolean,
      default: false,
      env: 'DEBUG_MODE',
    },
    targetLanguage: {
      doc: 'Application language',
      default: 'EN',
      format: String,
      env: 'TARGET_LANGUAGE',
    },
  },
  db: {
    url: {
      doc: 'The access url for mongodb',
      format: String,
      default: null,
      env: 'MONGO_DB_ACCESS_URL',
    },
  },
  auth: {
    jwtSecret: {
      doc: 'The secret used for signing JWT tokens',
      format: String,
      default: '',
      env: 'JWT_SIGNING_SECRET',
    },
  },
  email: {
    smtpHost: {
      doc: 'SMTP server host',
      format: String,
      default: '',
      env: 'SMTP_HOST',
    },
    smtpPort: {
      doc: 'SMTP server port',
      format: 'port',
      default: 587,
      env: 'SMTP_PORT',
    },
    smtpUser: {
      doc: 'SMTP server user',
      format: String,
      default: '',
      env: 'SMTP_USER',
    },
    smtpPass: {
      doc: 'SMTP server password',
      format: String,
      default: '',
      env: 'SMTP_PASS',
    },
    fromEmail: {
      doc: 'From email address',
      format: String,
      default: '',
      env: 'FROM_EMAIL',
    },
  },
  plain: {
    courseIndexPhotoUrl: {
      doc: 'URL for the course index photo',
      format: String,
      default: '',
      env: 'COURSE_INDEX_PHOTO_URL',
    },
  },
  firebase: {
    service_account: {
      type: {
        doc: 'Firebase service account type',
        format: String,
        default: '',
        env: 'FIREBASE_TYPE',
      },
      project_id: {
        doc: 'Firebase project ID',
        format: String,
        default: '',
        env: 'FIREBASE_PROJECT_ID',
      },
      private_key_id: {
        doc: 'Firebase private key ID',
        format: String,
        default: '',
        env: 'FIREBASE_PRIVATE_KEY_ID',
      },
      private_key: {
        doc: 'Firebase private key',
        format: String,
        default: '',
        env: 'FIREBASE_PRIVATE_KEY',
      },
      client_email: {
        doc: 'Firebase client email',
        format: String,
        default: '',
        env: 'FIREBASE_CLIENT_EMAIL',
      },
      client_id: {
        doc: 'Firebase client ID',
        format: String,
        default: '',
        env: 'FIREBASE_CLIENT_ID',
      },
      auth_uri: {
        doc: 'Firebase auth URI',
        format: String,
        default: '',
        env: 'FIREBASE_AUTH_URI',
      },
      token_uri: {
        doc: 'Firebase token URI',
        format: String,
        default: '',
        env: 'FIREBASE_TOKEN_URI',
      },
      auth_provider_x509_cert_url: {
        doc: 'Firebase auth provider X509 cert URL',
        format: String,
        default: '',
        env: 'FIREBASE_AUTH_PROVIDER_X509_CERT_URL',
      },
      client_x509_cert_url: {
        doc: 'Firebase client X509 cert URL',
        format: String,
        default: '',
        env: 'FIREBASE_CLIENT_X509_CERT_URL',
      },
      universe_domain: {
        doc: 'Firebase universe domain',
        format: String,
        default: '',
        env: 'FIREBASE_UNIVERSE_DOMAIN',
      },
    },
  },
  clients: {
    web: {
      frontendUrl: {
        doc: 'The url of the frontend',
        format: String,
        default: 'http://localhost:3000',
        env: 'FRONTEND_URL',
      },
    },
  },
  testMode: {
    format: Boolean,
    default: false,
    env: 'TEST_MODE',
  },
});

config.validate({ allowed: 'strict' });
