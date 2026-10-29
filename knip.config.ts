import { antelopeKnipConfig } from "@antelopejs/tooling-configs/knip";

export default antelopeKnipConfig({
  ignoreBinaries: ["ajs"],
  ignoreDependencies: ["chai", "@types/chai", "@types/mocha"],
});
