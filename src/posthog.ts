import * as core from "@actions/core";
import * as github from "@actions/github";
import { PlasmicActionOptions } from "./actions";

const posthogHost = "https://us.i.posthog.com";
const posthogProjectToken = "phc_eaI1hFsPRIZkmwrXaSGRNDh4H9J3xdh1j9rgNy27NgP";
const posthogTimeoutMs = 5000;

function withTimeout(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms).unref();
  return controller.signal;
}

export async function trackAction(
  options: PlasmicActionOptions,
): Promise<void> {
  const { owner, repo } = github.context.repo;
  const repository = `${owner}/${repo}`;

  try {
    const response = await fetch(`${posthogHost}/i/v0/e/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: posthogProjectToken,
        event: "plasmic_github_action",
        distinct_id: options.projectId,
        properties: {
          source: "plasmic-action",
          run: options.run,
          projectId: options.projectId,
          platform: options.platform,
          scheme: options.scheme,
          language: options.language,
          syncAction: options.syncAction,
          githubRepository: repository,
          githubRepositoryOwner: owner,
          githubRepositoryName: repo,
          githubWorkflow: github.context.workflow,
          githubRunId: github.context.runId,
          githubRunNumber: github.context.runNumber,
          githubActor: github.context.actor,
          githubEventName: github.context.eventName,
          $process_person_profile: false,
        },
      }),
      signal: withTimeout(posthogTimeoutMs),
    });

    if (!response.ok) {
      core.debug(
        `PostHog tracking failed with status ${response.status} ${response.statusText}`,
      );
    }
  } catch (error: any) {
    core.debug(`PostHog tracking failed: ${error.message || error}`);
  }
}
