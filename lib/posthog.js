"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackAction = trackAction;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const posthogHost = "https://us.i.posthog.com";
const posthogProjectToken = "phc_eaI1hFsPRIZkmwrXaSGRNDh4H9J3xdh1j9rgNy27NgP";
const posthogTimeoutMs = 2000;
function withTimeout(ms) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms).unref();
    return controller.signal;
}
async function trackAction(options) {
    const { owner, repo } = github.context.repo;
    const repository = `${owner}/${repo}`;
    if (!options.projectId) {
        core.debug("PostHog tracking skipped because project_id is missing");
        return;
    }
    try {
        const response = await fetch(`${posthogHost}/i/v0/e/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token: posthogProjectToken,
                event: "plasmic github action",
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
            core.debug(`PostHog tracking failed with status ${response.status} ${response.statusText}`);
        }
    }
    catch (error) {
        core.debug(`PostHog tracking failed: ${error.message || error}`);
    }
}
