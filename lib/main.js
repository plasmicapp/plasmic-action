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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const actions_1 = require("./actions");
const sentry_1 = require("./sentry");
const util_1 = require("./util");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
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
                localizationStringsPath: core.getInput("localization_strings_path"),
                localizationStringsFormat: core.getInput("localization_strings_format"),
                title: core.getInput("title"),
                description: core.getInput("description"),
                skipIfPlasmic: !!core.getInput("skip_if_plasmic"),
            };
            sentry_1.initSentry(options);
            const action = new actions_1.PlasmicAction(options);
            const outputs = yield action.run();
            util_1.setOutputs(outputs);
        }
        catch (error) {
            sentry_1.captureException(error);
            core.setFailed(error.message || error);
        }
    });
}
run();
