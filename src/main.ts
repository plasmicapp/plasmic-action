import * as core from "@actions/core";
import {
  SyncAction,
  Language,
  Platform,
  Scheme,
  RunAction,
  PlasmicAction,
} from "./actions";
import { initSentry, captureException } from "./sentry";
import { setOutputs } from "./util";

async function run(): Promise<void> {
  try {
    const options = {
      run: core.getInput("run") as RunAction,
      githubToken: core.getInput("github_token"),
      projectId: core.getInput("project_id"),
      projectApiToken: core.getInput("project_api_token"),
      platform: core.getInput("platform") as Platform,
      language: core.getInput("language") as Language,
      scheme: core.getInput("scheme") as Scheme,
      branch: core.getInput("branch"),
      directory: core.getInput("directory"),
      syncAction: core.getInput("sync_action") as SyncAction,
      localizedStrings: core.getInput("localized_strings"),
      title: core.getInput("title"),
      description: core.getInput("description"),
      skipIfPlasmic: !!core.getInput("skip_if_plasmic"),
    };

    initSentry(options);

    const action = new PlasmicAction(options);
    const outputs = await action.run();
    setOutputs(outputs);
  } catch (error) {
    captureException(error);
    core.setFailed(error.message || error);
  }
}

run();
