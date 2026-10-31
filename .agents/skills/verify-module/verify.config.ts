import type { VerifyConfig } from "@antelopejs/tooling-configs/verify";

import { configJourneys } from "./journeys-config.ts";
import { keypairJourneys } from "./journeys-keypair.ts";
import { lifetimeJourneys } from "./journeys-lifetime.ts";
import { rejectionJourneys } from "./journeys-rejection.ts";
import { secretJourneys } from "./journeys-secret.ts";
import { sessionJourneys } from "./journeys-session.ts";
import { smokeJourneys } from "./journeys-smoke.ts";
import { BASE_CONFIG } from "./session.ts";

const config: VerifyConfig = {
  doors: {
    data: null,
    format: {
      globs: ["src/jwt.ts"],
      funnels: ["src/jwt.ts"],
      containments: ["secret/secret-roundtrip"],
      why: "every token the module signs is carried by clients and verified later, here or by another implementation: the algorithm, the header and the claims it writes decide whether tokens issued before a release still verify and whether other parties can read them",
    },
    contract: {
      globs: ["package.json"],
      funnels: [],
      containments: [],
      why: "the config keys (`secret`, `signKey`, `verifyKey`, `signOptions`, `verifyOptions`), `antelopeJs.defaultConfig` and the interface range `antelopeJs.implements` and `dependencies` declare",
    },
    outbound: null,
    exposure: {
      globs: ["src/jwt.ts", "src/implementations/auth/index.ts"],
      funnels: ["src/jwt.ts"],
      containments: [],
      why: "every request an application authenticates is decided here: a verification that accepts a forged, expired or unsigned token lets callers in as someone else, and the sessions it grants stay valid until the token expires",
    },
    publish: {
      globs: ["package.json", ".release-it.json", "changelogen.config.json", ".github/workflows/release.yml"],
      funnels: [],
      containments: [],
      why: "the package name and release workflow claim @antelopejs/auth-jwt on npm",
    },
  },
  moduleConfig() {
    return BASE_CONFIG;
  },
  journeys: { ...secretJourneys, ...sessionJourneys, ...rejectionJourneys, ...lifetimeJourneys, ...keypairJourneys, ...configJourneys, ...smokeJourneys },
};

export default config;
