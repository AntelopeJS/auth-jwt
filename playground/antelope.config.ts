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
        type: "local",
        path: "../../api",
        installCommand: ["pnpm install", "npx tsc"],
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
