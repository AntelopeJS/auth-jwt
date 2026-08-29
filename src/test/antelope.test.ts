import { defineConfig } from "@antelopejs/interface-core/config";

export default defineConfig({
  name: "auth-jwt-test",
  cacheFolder: ".antelope/cache",
  modules: {
    local: {
      source: { type: "local", path: "." },
      config: { secret: "test-secret-key-for-jwt" },
    },
    api: {
      source: {
        type: "package",
        package: "@antelopejs/api",
        version: "1.2.4",
      },
      config: {
        servers: [{ protocol: "http", host: "127.0.0.1", port: 5010 }],
      },
    },
  },
  test: {
    folder: "dist/test",
  },
});
