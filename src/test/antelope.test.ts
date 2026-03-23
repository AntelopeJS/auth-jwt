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
        type: "local",
        path: "../mongodb",
        installCommand: ["pnpm install", "npx tsc"],
      },
    },
    database_decorators: {
      source: {
        type: "local",
        path: "../database-decorators",
        installCommand: ["pnpm install", "npx tsc"],
      },
    },
    api: {
      source: {
        type: "local",
        path: "../api",
        installCommand: ["pnpm install", "npx tsc"],
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
