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
const core = __importStar(require("@actions/core"));
const actions_1 = require("./actions");
const sentry_1 = require("./sentry");
const util_1 = require("./util");
async function run() {
    try {
        const options = {
            run: core.getInput("run"),
            githubToken: core.getInput("github_token"),
            projectId: core.getInput("project_id"),
            projectApiToken: core.getInput("project_api_token"),
            platform: core.getInput("platform"),
            language: core.getInput("language"),
            scheme: core.getInput("scheme"),
            branch: core.getInput("branch"),
            directory: core.getInput("directory"),
            syncAction: core.getInput("sync_action"),
            title: core.getInput("title"),
            description: core.getInput("description"),
            skipIfPlasmic: !!core.getInput("skip_if_plasmic"),
        };
        (0, sentry_1.initSentry)(options);
        const action = new actions_1.PlasmicAction(options);
        const outputs = await action.run();
        (0, util_1.setOutputs)(outputs);
    }
    catch (error) {
        (0, sentry_1.captureException)(error);
        core.setFailed(error.message || error);
    }
}
run();
