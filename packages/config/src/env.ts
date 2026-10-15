export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  appBaseUrl: string;
  apiBaseUrl: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  jwtSecret: string;
  sessionExpirySeconds: number;
  databaseUrl: string;
  redisUrl: string;
  github: {
    appId: number;
    clientId: string;
    clientSecret: string;
    privateKey: string;
    webhookSecret: string;
  };
  ai: {
    provider: 'openai' | 'anthropic' | 'google' | 'mock';
    apiKey: string;
    modelId: string;
    embeddingModelId: string;
    embeddingDim: number;
  };
  storage: {
    endpoint: string;
    port: number;
    useSsl: boolean;
    accessKey: string;
    secretKey: string;
    bucket: string;
    region: string;
  };
  worker: {
    concurrency: number;
    maxFileSizeBytes: number;
    embeddingBatchSize: number;
  };
}

export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  return {
    nodeEnv: (env.NODE_ENV as AppConfig['nodeEnv']) || 'development',
    port: parseInt(env.PORT || '4000', 10),
    appBaseUrl: env.APP_BASE_URL || 'http://localhost:3000',
    apiBaseUrl: env.API_BASE_URL || 'http://localhost:4000',
    logLevel: (env.LOG_LEVEL as AppConfig['logLevel']) || 'info',
    jwtSecret: env.JWT_SECRET || 'dev_secret_key_change_in_production_min32chars',
    sessionExpirySeconds: parseInt(env.SESSION_EXPIRY_SECONDS || '86400', 10),
    databaseUrl: env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/copilot_dev',
    redisUrl: env.REDIS_URL || 'redis://localhost:6379/0',
    github: {
      appId: parseInt(env.GITHUB_APP_ID || '0', 10),
      clientId: env.GITHUB_APP_CLIENT_ID || '',
      clientSecret: env.GITHUB_APP_CLIENT_SECRET || '',
      privateKey: env.GITHUB_APP_PRIVATE_KEY || '',
      webhookSecret: env.GITHUB_WEBHOOK_SECRET || 'dev_webhook_secret',
    },
    ai: {
      provider: (env.AI_PROVIDER as AppConfig['ai']['provider']) || 'mock',
      apiKey: env.AI_PROVIDER_API_KEY || 'mock-key',
      modelId: env.AI_MODEL_ID || 'mock-model-v1',
      embeddingModelId: env.EMBEDDING_MODEL_ID || 'text-embedding-3-small',
      embeddingDim: parseInt(env.EMBEDDING_DIM || '1536', 10),
    },
    storage: {
      endpoint: env.OBJECT_STORAGE_ENDPOINT || 'http://localhost:9000',
      port: parseInt(env.OBJECT_STORAGE_PORT || '9000', 10),
      useSsl: env.OBJECT_STORAGE_USE_SSL === 'true',
      accessKey: env.OBJECT_STORAGE_ACCESS_KEY || 'minioadmin',
      secretKey: env.OBJECT_STORAGE_SECRET_KEY || 'minioadmin',
      bucket: env.OBJECT_STORAGE_BUCKET || 'copilot-artifacts',
      region: env.OBJECT_STORAGE_REGION || 'us-east-1',
    },
    worker: {
      concurrency: parseInt(env.WORKER_CONCURRENCY || '5', 10),
      maxFileSizeBytes: parseInt(env.MAX_FILE_SIZE_BYTES || '1048576', 10),
      embeddingBatchSize: parseInt(env.EMBEDDING_BATCH_SIZE || '64', 10),
    },
  };
}

