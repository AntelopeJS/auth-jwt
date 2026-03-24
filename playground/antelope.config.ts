import { defineConfig } from "@antelopejs/interface-core/config";

export default defineConfig({
  name: "playground",
  modules: {
    playground: {
      source: {
        type: "local",
        path: ".",
        installCommand: ["npx tsc"],
      },
    },
    "auth-jwt": {
      source: {
        type: "local",
        path: "..",
        installCommand: ["npx tsc"],
      },
      config: {
        secret: "dev",
      },
    },
    "@antelopejs/api": {
      source: {
        type: "package",
        package: "@antelopejs/api",
        version: "1.0.0",
      },
      config: {
        servers: [
          {
            protocol: "http",
            port: "5010",
          },
        ],
      },
    },
  },
  envOverrides: {
    JWT_SECRET: "modules.auth-jwt.config.secret",
  },
});
