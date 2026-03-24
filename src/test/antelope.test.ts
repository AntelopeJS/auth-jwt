import { defineConfig } from "@antelopejs/interface-core/config";
import { MongoMemoryServer } from "mongodb-memory-server-core";

let mongod: MongoMemoryServer;

export default defineConfig({
  name: "auth-jwt-test",
  cacheFolder: ".antelope/cache",
  modules: {
    local: {
      source: { type: "local", path: "." },
      config: { secret: "test-secret-key-for-jwt" },
    },
    mongodb: {
      source: {
        type: "package",
        package: "@antelopejs/mongodb",
        version: "1.0.0",
      },
    },
    database_decorators: {
      source: {
        type: "package",
        package: "@antelopejs/database-decorators",
        version: "1.0.0",
      },
    },
    api: {
      source: {
        type: "package",
        package: "@antelopejs/api",
        version: "1.0.0",
      },
      config: {
        servers: [{ protocol: "http", host: "127.0.0.1", port: 5010 }],
      },
    },
  },
  test: {
    folder: "dist/test",
    async setup() {
      mongod = await MongoMemoryServer.create();
      return {
        modules: {
          mongodb: {
            config: { url: mongod.getUri() },
          },
        },
      };
    },
    async cleanup() {
      await mongod.stop();
    },
  },
});
