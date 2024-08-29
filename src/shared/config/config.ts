import * as convict from 'convict';
import * as yaml from 'js-yaml';
import * as fs from 'fs';


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
      format: String,
      default: '',
      env: 'COURSE_INDEX_PHOTO_URL',
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
});

convict.addParser({ extension: ['yml', 'yaml'], parse: yaml.load });
const envFilePath = './.env.yml';
if (fs.existsSync(envFilePath)) {
  config.loadFile(envFilePath);
}
config.validate({ allowed: 'strict' });
