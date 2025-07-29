const { MongoMemoryServer } = require('mongodb-memory-server-core');

let mongod;

module.exports.setup = async function () {
  mongod = await MongoMemoryServer.create();

  return {
    cacheFolder: '.antelope/cache',
    modules: {
      local: {
        source: {
          type: 'local',
          path: '.',
        },
        config: {
          secret: 'test-secret-key-for-jwt'
        }
      },
      mongodb: {
        source: {
          // type: 'git',
          // remote: 'git@github.com:AntelopeJS/mongodb.git',
          // branch: 'main',
          type: 'local',
          path: '/home/glastis/projects/antelopejs/mongodb',
          installCommand: ['pnpm i', 'npx tsc'],
        },
        config: {
          url: mongod.getUri(),
        },
      },
      database_decorators: {
        source: {
          type: 'git',
          remote: 'git@github.com:AntelopeJS/database-decorators.git',
          branch: 'main',
          installCommand: ['pnpm i', 'npx tsc'],
        },
      },
      api: {
        source: {
          type: 'git',
          remote: 'git@github.com:AntelopeJS/api.git',
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
};

module.exports.cleanup = async function () {
  await mongod.stop();
};
