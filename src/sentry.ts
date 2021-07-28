import * as Sentry from "@sentry/node";
import * as github from "@actions/github";
import { PlasmicActionOptions } from "./actions";

export function initSentry(options: PlasmicActionOptions) {
  Sentry.init({
    dsn:
      "https://47f3dbc086994a91af9c07df8efad1f2@o328029.ingest.sentry.io/5723395",
    defaultIntegrations: false,
  });

  const extras = { ...options } as Record<string, any>;
  const { owner, repo } = github.context.repo;
  extras["githubRepository"] = `${owner}/${repo}`;
  extras["workflowRunId"] = github.context.runId;
  delete extras["githubToken"];
  delete extras["projectApiToken"];
  Sentry.configureScope((scope) => {
    scope.setExtras(extras);
  });
}

export const captureException = Sentry.captureException;
