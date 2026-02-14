import { MongoMemoryServer } from 'mongodb-memory-server-core';

interface LocalModuleSource {
  type: 'local';
  path: string;
}

interface GitModuleSource {
  type: 'git';
  remote: string;
  branch: string;
  installCommand: string[];
}

interface APIConfigServer {
  protocol: string;
  port: string;
}

interface ProjectModuleConfig {
  cacheFolder: string;
  modules: {
    local: {
      source: LocalModuleSource;
      config: {
        secret: string;
      };
    };
    mongodb: {
      source: GitModuleSource;
      config: {
        url: string;
      };
    };
    database_decorators: {
      source: GitModuleSource;
    };
    api: {
      source: GitModuleSource;
      config: {
        servers: APIConfigServer[];
      };
    };
  };
}

let mongoServer: MongoMemoryServer | undefined;

export async function setup(): Promise<ProjectModuleConfig> {
  mongoServer = await MongoMemoryServer.create();

  return {
    cacheFolder: '.antelope/cache',
    modules: {
      local: {
        source: {
          type: 'local',
          path: '.',
        },
        config: {
          secret: 'test-secret-key-for-jwt',
        },
      },
      mongodb: {
        source: {
          type: 'git',
          remote: 'https://github.com/AntelopeJS/mongodb.git',
          branch: 'main',
          installCommand: ['pnpm i', 'npx tsc'],
        },
        config: {
          url: mongoServer.getUri(),
        },
      },
      database_decorators: {
        source: {
          type: 'git',
          remote: 'https://github.com/AntelopeJS/database-decorators.git',
          branch: 'main',
          installCommand: ['pnpm i', 'npx tsc'],
        },
      },
      api: {
        source: {
          type: 'git',
          remote: 'https://github.com/AntelopeJS/api.git',
          branch: 'main',
          installCommand: ['pnpm i', 'npx tsc'],
        },
        config: {
          servers: [
            {
              protocol: 'http',
              port: '5010',
            },
          ],
        },
      },
    },
  };
}

export async function cleanup(): Promise<void> {
  if (!mongoServer) {
    return;
  }

  await mongoServer.stop();
  mongoServer = undefined;
}
