import { interrupted, refused, type Journey } from "@antelopejs/tooling-configs/verify";

import { BASE_CONFIG, withModule } from "./session.ts";

const moduleDev: Journey = {
  title: "the module loads from its local source next to the API module, the consumer sees the auth interface, and Ctrl+C stops it",
  entryPoint: "`ajs project dev` on a project that installs the module as `local` and the API module from the registry",
  async run(context) {
    await withModule(context, BASE_CONFIG, async (session) => {
      const surface = await context.http("implemented interfaces", `http://127.0.0.1:${session.app.port}/surface`, { method: "POST", body: "{}" });
      context.expect(surface.folder, [
        { name: "the consumer loaded the auth interface", pass: surface.status === 200 && surface.body.includes("@antelopejs/interface-auth"), detail: surface.body.slice(0, 300) },
      ]);
      const stopped = await context.stop("SIGINT", session.app);
      context.expect(stopped.folder, [interrupted(stopped)]);
      const after = await context.http("port after stop", `http://127.0.0.1:${session.app.port}/health`);
      context.expect(after.folder, [refused(after)]);
      const api = await context.http("API port after stop", `${session.base}/session/me`);
      context.expect(api.folder, [refused(api)]);
    });
  },
};

export const smokeJourneys = { "module-dev": moduleDev };
