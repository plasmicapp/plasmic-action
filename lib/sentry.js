"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureException = exports.initSentry = void 0;
const Sentry = __importStar(require("@sentry/node"));
const github = __importStar(require("@actions/github"));
function initSentry(options) {
    Sentry.init({
        dsn: "https://47f3dbc086994a91af9c07df8efad1f2@o328029.ingest.sentry.io/5723395",
        defaultIntegrations: false,
    });
    const extras = Object.assign({}, options);
    const { owner, repo } = github.context.repo;
    extras["githubRepository"] = `${owner}/${repo}`;
    extras["workflowRunId"] = github.context.runId;
    delete extras["githubToken"];
    delete extras["projectApiToken"];
    Sentry.configureScope((scope) => {
        scope.setExtras(extras);
    });
}
exports.initSentry = initSentry;
exports.captureException = Sentry.captureException;
