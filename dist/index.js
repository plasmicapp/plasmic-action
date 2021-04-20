require('./sourcemap-register.js');module.exports =
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 3623:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlasmicAction = void 0;
const fs_1 = __nccwpck_require__(5747);
const path_1 = __importDefault(__nccwpck_require__(5622));
const exec_1 = __nccwpck_require__(7757);
const util_1 = __nccwpck_require__(4024);
const gitUserName = "Plasmic Bot";
const gitUserEmail = "ops+git@plasmic.app";
class PlasmicAction {
    constructor(args) {
        this.args = args;
        this.opts = {
            cwd: path_1.default.join(".", args.directory || "."),
            onOutput: (chunk) => console.log(chunk.trim()),
            echo: true,
            shell: "bash",
        };
        this.remote = args.githubToken
            ? `https://x-access-token:${args.githubToken}@github.com/${process.env["GITHUB_REPOSITORY"]}.git`
            : undefined;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            switch (this.args.run) {
                case "init":
                    const synced = yield this.init();
                    return { synced };
                case "sync":
                    const new_branch = yield this.sync();
                    return { new_branch };
                case "build":
                    const publish_dir = yield this.build();
                    return { publish_dir };
                default:
                    throw new Error(`Unknown run action: ${this.args.run}`);
            }
        });
    }
    /**
     * Detects if there is a project in the working directory (by testing
     * package.json existence). If there isn't, use create-plasmic-app to
     * create a new one.
     *
     * @returns {synced} boolean indicating whether projectId was synced or not.
     */
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const isNewApp = !fs_1.existsSync(path_1.default.join(this.opts.cwd, "package.json"));
            if (!isNewApp) {
                console.log("Detected existing app. Moving forward...");
                return false;
            }
            util_1.assertNoSingleQuotes(this.args.branch);
            util_1.assertNoSingleQuotes(this.args.platform);
            util_1.assertNoSingleQuotes(this.args.scheme);
            util_1.assertNoSingleQuotes(this.args.projectId);
            util_1.assertNoSingleQuotes(this.args.projectApiToken);
            yield exec_1.exec(`git checkout '${this.args.branch}'`, this.opts);
            const relTmpDir = "tmp-cpa";
            yield exec_1.exec(`npx create-plasmic-app --platform '${this.args.platform}' --scheme '${this.args.scheme}' ${this.args.language === "ts" ? "--typescript=true" : "--typescript=false"} --projectId '${this.args.projectId}' --projectApiToken '${this.args.projectApiToken}' '${relTmpDir}'`, this.opts);
            yield exec_1.exec(`rm -rf '${relTmpDir}/.git'`, this.opts);
            yield exec_1.exec(`shopt -s dotglob && mv * ../`, Object.assign(Object.assign({}, this.opts), { cwd: path_1.default.join(this.opts.cwd, relTmpDir) }));
            yield exec_1.exec(`rm -rf '${relTmpDir}'`, this.opts);
            yield this.commit(this.args.branch);
            return true;
        });
    }
    /**
     * Syncs a project in the working directory if scheme == "codegen".
     *
     * @returns {newBranch} name of created branch (if PR was requested) or
     * undefined if no new branch was created.
     */
    sync() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.args.scheme === "loader") {
                console.log("Nothing to sync; scheme is set to 'loader'.");
                return undefined;
            }
            const pm = util_1.mkPackageManagerCmds(this.opts.cwd);
            const newBranch = this.args.syncAction === "pr"
                ? util_1.mkPrBranchName(this.args.branch)
                : undefined;
            util_1.assertNoSingleQuotes(this.args.branch);
            if (newBranch) {
                util_1.assertNoSingleQuotes(newBranch);
            }
            util_1.assertNoSingleQuotes(this.args.projectId);
            util_1.assertNoSingleQuotes(this.args.projectApiToken);
            yield exec_1.exec(`git checkout '${this.args.branch}'`, this.opts);
            if (newBranch) {
                yield exec_1.exec(`git checkout -B '${newBranch}'`, this.opts);
            }
            yield exec_1.exec(`${pm.add} @plasmicapp/cli`, this.opts);
            yield exec_1.exec(`${pm.cmd} plasmic sync --projects '${this.args.projectId}:${this.args.projectApiToken}' --yes`, this.opts);
            yield this.commit(newBranch || this.args.branch);
            return newBranch;
        });
    }
    /**
     * Checkouts given branch and builds project using Next.js, Gatsby or CRA
     * command depending on platform argument.
     *
     * @returns {publishDir} generated directory to publish.
     */
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            util_1.assertNoSingleQuotes(this.args.branch);
            yield exec_1.exec(`git checkout '${this.args.branch}'`, this.opts);
            const pm = util_1.mkPackageManagerCmds(this.opts.cwd);
            yield exec_1.exec(`${pm.install}`, this.opts);
            let dir;
            switch (this.args.platform) {
                case "nextjs":
                    yield exec_1.exec(`${pm.cmd} next build`, this.opts);
                    yield exec_1.exec(`${pm.cmd} next export`, this.opts);
                    dir = "out";
                    break;
                case "gatsby":
                    yield exec_1.exec(`${pm.cmd} gatsby build`, this.opts);
                    dir = "public";
                    break;
                case "react":
                    yield exec_1.exec(`${pm.run} build`, this.opts);
                    dir = "build/static";
                    break;
                default:
                    throw new Error(`Unknown platform '${this.args.platform}'`);
            }
            // A .nojekyll file is required to bypass Jekyll processing and publish
            // files and directories that start with underscores, e.g. _next.
            // https://github.blog/2009-12-29-bypassing-jekyll-on-github-pages/
            const nojekyllPath = path_1.default.join(dir, ".nojekyll");
            yield exec_1.exec(`touch ${nojekyllPath}`, this.opts);
            return dir;
        });
    }
    /**
     * Commits existing working directory and push to remote (setting branch
     * upstream).
     */
    commit(branch) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.remote) {
                throw new Error("No git remote to push");
            }
            if (!this.args.title) {
                throw new Error("No commit title to use");
            }
            util_1.assertNoSingleQuotes(this.remote);
            const commitMessage = `${this.args.title}\n\n${this.args.description}`;
            yield exec_1.exec(`git add -A .`, this.opts);
            yield exec_1.exec(`git config user.name '${gitUserName}'`, this.opts);
            yield exec_1.exec(`git config user.email '${gitUserEmail}'`, this.opts);
            yield exec_1.exec(`git commit -F -`, Object.assign(Object.assign({}, this.opts), { input: commitMessage }));
            yield exec_1.exec(`git push -u '${this.remote}' '${branch}'`, this.opts);
        });
    }
}
exports.PlasmicAction = PlasmicAction;


/***/ }),

/***/ 7757:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.exec = void 0;
const child_process_1 = __nccwpck_require__(3129);
const util_1 = __nccwpck_require__(1669);
const promiseExec = util_1.promisify(child_process_1.exec);
const defaultTimeout = 10 * 60 * 1000;
function exec(cmd, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const { input, onOutput, echo = false } = opts, nodeOpts = __rest(opts, ["input", "onOutput", "echo"]);
        if (!nodeOpts.timeout) {
            nodeOpts.timeout = defaultTimeout;
        }
        // If timeout expires we want to kill the process immediately instead of
        // just sending SIGTERM. If we send SIGTERM, the process can keep writing
        // to the directory for a few moments which causes "rm -rf {cwd}" to fail.
        nodeOpts.killSignal = "SIGKILL";
        const promise = promiseExec(cmd, nodeOpts);
        if (onOutput && echo) {
            onOutput(`$ ${cmd}\n`);
        }
        if (onOutput) {
            if (promise.child.stdout) {
                promise.child.stdout.on("data", onOutput);
            }
            if (promise.child.stderr) {
                promise.child.stderr.on("data", onOutput);
            }
        }
        if (input && promise.child.stdin) {
            promise.child.stdin.write(input);
            promise.child.stdin.end();
        }
        return yield promise;
    });
}
exports.exec = exec;


/***/ }),

/***/ 3109:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
const core = __importStar(__nccwpck_require__(2186));
const actions_1 = __nccwpck_require__(3623);
const sentry_1 = __nccwpck_require__(5418);
const util_1 = __nccwpck_require__(4024);
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
                title: core.getInput("title"),
                description: core.getInput("description"),
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


/***/ }),

/***/ 5418:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.captureException = exports.initSentry = void 0;
const Sentry = __importStar(__nccwpck_require__(2783));
function initSentry(options) {
    Sentry.init({
        dsn: "https://47f3dbc086994a91af9c07df8efad1f2@o328029.ingest.sentry.io/5723395",
        defaultIntegrations: false,
    });
    const extras = Object.assign({}, options);
    delete extras["githubToken"];
    delete extras["projectApiToken"];
    Sentry.configureScope((scope) => {
        scope.setExtras(extras);
    });
}
exports.initSentry = initSentry;
exports.captureException = Sentry.captureException;


/***/ }),

/***/ 4024:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.setOutputs = exports.mkPrBranchName = exports.mkPackageManagerCmds = exports.assertNoSingleQuotes = void 0;
const core = __importStar(__nccwpck_require__(2186));
const nanoid_1 = __nccwpck_require__(9140);
const fs_1 = __nccwpck_require__(5747);
const path_1 = __importDefault(__nccwpck_require__(5622));
function assertNoSingleQuotes(str) {
    if (str.includes("'")) {
        throw new Error(`Invalid string (contains single quotes): ${str}`);
    }
}
exports.assertNoSingleQuotes = assertNoSingleQuotes;
function mkPackageManagerCmds(cwd) {
    const useYarn = fs_1.existsSync(path_1.default.join(cwd, "yarn.lock"));
    if (useYarn) {
        return {
            install: "yarn",
            run: "yarn",
            add: "yarn add -W",
            cmd: "yarn",
        };
    }
    return {
        install: "npm install",
        run: "npm run",
        add: "npm install",
        cmd: "npx",
    };
}
exports.mkPackageManagerCmds = mkPackageManagerCmds;
function mkPrBranchName(targetBranch) {
    return `plasmic/${nanoid_1.nanoid(8)}/${targetBranch}`;
}
exports.mkPrBranchName = mkPrBranchName;
function setOutputs(outputs) {
    for (const [k, v] of Object.entries(outputs)) {
        core.setOutput(k, v);
    }
}
exports.setOutputs = setOutputs;


/***/ }),

/***/ 7351:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const os = __importStar(__nccwpck_require__(2087));
const utils_1 = __nccwpck_require__(5278);
/**
 * Commands
 *
 * Command Format:
 *   ::name key=value,key=value::message
 *
 * Examples:
 *   ::warning::This is the message
 *   ::set-env name=MY_VAR::some value
 */
function issueCommand(command, properties, message) {
    const cmd = new Command(command, properties, message);
    process.stdout.write(cmd.toString() + os.EOL);
}
exports.issueCommand = issueCommand;
function issue(name, message = '') {
    issueCommand(name, {}, message);
}
exports.issue = issue;
const CMD_STRING = '::';
class Command {
    constructor(command, properties, message) {
        if (!command) {
            command = 'missing.command';
        }
        this.command = command;
        this.properties = properties;
        this.message = message;
    }
    toString() {
        let cmdStr = CMD_STRING + this.command;
        if (this.properties && Object.keys(this.properties).length > 0) {
            cmdStr += ' ';
            let first = true;
            for (const key in this.properties) {
                if (this.properties.hasOwnProperty(key)) {
                    const val = this.properties[key];
                    if (val) {
                        if (first) {
                            first = false;
                        }
                        else {
                            cmdStr += ',';
                        }
                        cmdStr += `${key}=${escapeProperty(val)}`;
                    }
                }
            }
        }
        cmdStr += `${CMD_STRING}${escapeData(this.message)}`;
        return cmdStr;
    }
}
function escapeData(s) {
    return utils_1.toCommandValue(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A');
}
function escapeProperty(s) {
    return utils_1.toCommandValue(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A')
        .replace(/:/g, '%3A')
        .replace(/,/g, '%2C');
}
//# sourceMappingURL=command.js.map

/***/ }),

/***/ 2186:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const command_1 = __nccwpck_require__(7351);
const file_command_1 = __nccwpck_require__(717);
const utils_1 = __nccwpck_require__(5278);
const os = __importStar(__nccwpck_require__(2087));
const path = __importStar(__nccwpck_require__(5622));
/**
 * The code to exit an action
 */
var ExitCode;
(function (ExitCode) {
    /**
     * A code indicating that the action was successful
     */
    ExitCode[ExitCode["Success"] = 0] = "Success";
    /**
     * A code indicating that the action was a failure
     */
    ExitCode[ExitCode["Failure"] = 1] = "Failure";
})(ExitCode = exports.ExitCode || (exports.ExitCode = {}));
//-----------------------------------------------------------------------
// Variables
//-----------------------------------------------------------------------
/**
 * Sets env variable for this action and future actions in the job
 * @param name the name of the variable to set
 * @param val the value of the variable. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exportVariable(name, val) {
    const convertedVal = utils_1.toCommandValue(val);
    process.env[name] = convertedVal;
    const filePath = process.env['GITHUB_ENV'] || '';
    if (filePath) {
        const delimiter = '_GitHubActionsFileCommandDelimeter_';
        const commandValue = `${name}<<${delimiter}${os.EOL}${convertedVal}${os.EOL}${delimiter}`;
        file_command_1.issueCommand('ENV', commandValue);
    }
    else {
        command_1.issueCommand('set-env', { name }, convertedVal);
    }
}
exports.exportVariable = exportVariable;
/**
 * Registers a secret which will get masked from logs
 * @param secret value of the secret
 */
function setSecret(secret) {
    command_1.issueCommand('add-mask', {}, secret);
}
exports.setSecret = setSecret;
/**
 * Prepends inputPath to the PATH (for this action and future actions)
 * @param inputPath
 */
function addPath(inputPath) {
    const filePath = process.env['GITHUB_PATH'] || '';
    if (filePath) {
        file_command_1.issueCommand('PATH', inputPath);
    }
    else {
        command_1.issueCommand('add-path', {}, inputPath);
    }
    process.env['PATH'] = `${inputPath}${path.delimiter}${process.env['PATH']}`;
}
exports.addPath = addPath;
/**
 * Gets the value of an input.  The value is also trimmed.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string
 */
function getInput(name, options) {
    const val = process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
    if (options && options.required && !val) {
        throw new Error(`Input required and not supplied: ${name}`);
    }
    return val.trim();
}
exports.getInput = getInput;
/**
 * Sets the value of an output.
 *
 * @param     name     name of the output to set
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setOutput(name, value) {
    process.stdout.write(os.EOL);
    command_1.issueCommand('set-output', { name }, value);
}
exports.setOutput = setOutput;
/**
 * Enables or disables the echoing of commands into stdout for the rest of the step.
 * Echoing is disabled by default if ACTIONS_STEP_DEBUG is not set.
 *
 */
function setCommandEcho(enabled) {
    command_1.issue('echo', enabled ? 'on' : 'off');
}
exports.setCommandEcho = setCommandEcho;
//-----------------------------------------------------------------------
// Results
//-----------------------------------------------------------------------
/**
 * Sets the action status to failed.
 * When the action exits it will be with an exit code of 1
 * @param message add error issue message
 */
function setFailed(message) {
    process.exitCode = ExitCode.Failure;
    error(message);
}
exports.setFailed = setFailed;
//-----------------------------------------------------------------------
// Logging Commands
//-----------------------------------------------------------------------
/**
 * Gets whether Actions Step Debug is on or not
 */
function isDebug() {
    return process.env['RUNNER_DEBUG'] === '1';
}
exports.isDebug = isDebug;
/**
 * Writes debug message to user log
 * @param message debug message
 */
function debug(message) {
    command_1.issueCommand('debug', {}, message);
}
exports.debug = debug;
/**
 * Adds an error issue
 * @param message error issue message. Errors will be converted to string via toString()
 */
function error(message) {
    command_1.issue('error', message instanceof Error ? message.toString() : message);
}
exports.error = error;
/**
 * Adds an warning issue
 * @param message warning issue message. Errors will be converted to string via toString()
 */
function warning(message) {
    command_1.issue('warning', message instanceof Error ? message.toString() : message);
}
exports.warning = warning;
/**
 * Writes info to log with console.log.
 * @param message info message
 */
function info(message) {
    process.stdout.write(message + os.EOL);
}
exports.info = info;
/**
 * Begin an output group.
 *
 * Output until the next `groupEnd` will be foldable in this group
 *
 * @param name The name of the output group
 */
function startGroup(name) {
    command_1.issue('group', name);
}
exports.startGroup = startGroup;
/**
 * End an output group.
 */
function endGroup() {
    command_1.issue('endgroup');
}
exports.endGroup = endGroup;
/**
 * Wrap an asynchronous function call in a group.
 *
 * Returns the same type as the function itself.
 *
 * @param name The name of the group
 * @param fn The function to wrap in the group
 */
function group(name, fn) {
    return __awaiter(this, void 0, void 0, function* () {
        startGroup(name);
        let result;
        try {
            result = yield fn();
        }
        finally {
            endGroup();
        }
        return result;
    });
}
exports.group = group;
//-----------------------------------------------------------------------
// Wrapper action state
//-----------------------------------------------------------------------
/**
 * Saves state for current action, the state can only be retrieved by this action's post job execution.
 *
 * @param     name     name of the state to store
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function saveState(name, value) {
    command_1.issueCommand('save-state', { name }, value);
}
exports.saveState = saveState;
/**
 * Gets the value of an state set by this action's main execution.
 *
 * @param     name     name of the state to get
 * @returns   string
 */
function getState(name) {
    return process.env[`STATE_${name}`] || '';
}
exports.getState = getState;
//# sourceMappingURL=core.js.map

/***/ }),

/***/ 717:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

// For internal use, subject to change.
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */
const fs = __importStar(__nccwpck_require__(5747));
const os = __importStar(__nccwpck_require__(2087));
const utils_1 = __nccwpck_require__(5278);
function issueCommand(command, message) {
    const filePath = process.env[`GITHUB_${command}`];
    if (!filePath) {
        throw new Error(`Unable to find environment variable for file command ${command}`);
    }
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing file at path: ${filePath}`);
    }
    fs.appendFileSync(filePath, `${utils_1.toCommandValue(message)}${os.EOL}`, {
        encoding: 'utf8'
    });
}
exports.issueCommand = issueCommand;
//# sourceMappingURL=file-command.js.map

/***/ }),

/***/ 5278:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */
Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * Sanitizes an input into a string so it can be passed into issueCommand safely
 * @param input input to sanitize into a string
 */
function toCommandValue(input) {
    if (input === null || input === undefined) {
        return '';
    }
    else if (typeof input === 'string' || input instanceof String) {
        return input;
    }
    return JSON.stringify(input);
}
exports.toCommandValue = toCommandValue;
//# sourceMappingURL=utils.js.map

/***/ }),

/***/ 785:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __nccwpck_require__(1620);
var SENTRY_API_VERSION = '7';
/**
 * Helper class to provide urls, headers and metadata that can be used to form
 * different types of requests to Sentry endpoints.
 * Supports both envelopes and regular event requests.
 **/
var API = /** @class */ (function () {
    /** Create a new instance of API */
    function API(dsn, metadata) {
        if (metadata === void 0) { metadata = {}; }
        this.dsn = dsn;
        this._dsnObject = new utils_1.Dsn(dsn);
        this.metadata = metadata;
    }
    /** Returns the Dsn object. */
    API.prototype.getDsn = function () {
        return this._dsnObject;
    };
    /** Returns the prefix to construct Sentry ingestion API endpoints. */
    API.prototype.getBaseApiEndpoint = function () {
        var dsn = this._dsnObject;
        var protocol = dsn.protocol ? dsn.protocol + ":" : '';
        var port = dsn.port ? ":" + dsn.port : '';
        return protocol + "//" + dsn.host + port + (dsn.path ? "/" + dsn.path : '') + "/api/";
    };
    /** Returns the store endpoint URL. */
    API.prototype.getStoreEndpoint = function () {
        return this._getIngestEndpoint('store');
    };
    /**
     * Returns the store endpoint URL with auth in the query string.
     *
     * Sending auth as part of the query string and not as custom HTTP headers avoids CORS preflight requests.
     */
    API.prototype.getStoreEndpointWithUrlEncodedAuth = function () {
        return this.getStoreEndpoint() + "?" + this._encodedAuth();
    };
    /**
     * Returns the envelope endpoint URL with auth in the query string.
     *
     * Sending auth as part of the query string and not as custom HTTP headers avoids CORS preflight requests.
     */
    API.prototype.getEnvelopeEndpointWithUrlEncodedAuth = function () {
        return this._getEnvelopeEndpoint() + "?" + this._encodedAuth();
    };
    /** Returns only the path component for the store endpoint. */
    API.prototype.getStoreEndpointPath = function () {
        var dsn = this._dsnObject;
        return (dsn.path ? "/" + dsn.path : '') + "/api/" + dsn.projectId + "/store/";
    };
    /**
     * Returns an object that can be used in request headers.
     * This is needed for node and the old /store endpoint in sentry
     */
    API.prototype.getRequestHeaders = function (clientName, clientVersion) {
        // CHANGE THIS to use metadata but keep clientName and clientVersion compatible
        var dsn = this._dsnObject;
        var header = ["Sentry sentry_version=" + SENTRY_API_VERSION];
        header.push("sentry_client=" + clientName + "/" + clientVersion);
        header.push("sentry_key=" + dsn.publicKey);
        if (dsn.pass) {
            header.push("sentry_secret=" + dsn.pass);
        }
        return {
            'Content-Type': 'application/json',
            'X-Sentry-Auth': header.join(', '),
        };
    };
    /** Returns the url to the report dialog endpoint. */
    API.prototype.getReportDialogEndpoint = function (dialogOptions) {
        if (dialogOptions === void 0) { dialogOptions = {}; }
        var dsn = this._dsnObject;
        var endpoint = this.getBaseApiEndpoint() + "embed/error-page/";
        var encodedOptions = [];
        encodedOptions.push("dsn=" + dsn.toString());
        for (var key in dialogOptions) {
            if (key === 'dsn') {
                continue;
            }
            if (key === 'user') {
                if (!dialogOptions.user) {
                    continue;
                }
                if (dialogOptions.user.name) {
                    encodedOptions.push("name=" + encodeURIComponent(dialogOptions.user.name));
                }
                if (dialogOptions.user.email) {
                    encodedOptions.push("email=" + encodeURIComponent(dialogOptions.user.email));
                }
            }
            else {
                encodedOptions.push(encodeURIComponent(key) + "=" + encodeURIComponent(dialogOptions[key]));
            }
        }
        if (encodedOptions.length) {
            return endpoint + "?" + encodedOptions.join('&');
        }
        return endpoint;
    };
    /** Returns the envelope endpoint URL. */
    API.prototype._getEnvelopeEndpoint = function () {
        return this._getIngestEndpoint('envelope');
    };
    /** Returns the ingest API endpoint for target. */
    API.prototype._getIngestEndpoint = function (target) {
        var base = this.getBaseApiEndpoint();
        var dsn = this._dsnObject;
        return "" + base + dsn.projectId + "/" + target + "/";
    };
    /** Returns a URL-encoded string with auth config suitable for a query string. */
    API.prototype._encodedAuth = function () {
        var dsn = this._dsnObject;
        var auth = {
            // We send only the minimum set of required information. See
            // https://github.com/getsentry/sentry-javascript/issues/2572.
            sentry_key: dsn.publicKey,
            sentry_version: SENTRY_API_VERSION,
        };
        return utils_1.urlEncode(auth);
    };
    return API;
}());
exports.API = API;
//# sourceMappingURL=api.js.map

/***/ }),

/***/ 5886:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __nccwpck_require__(1620);
var noop_1 = __nccwpck_require__(8641);
/**
 * This is the base implemention of a Backend.
 * @hidden
 */
var BaseBackend = /** @class */ (function () {
    /** Creates a new backend instance. */
    function BaseBackend(options) {
        this._options = options;
        if (!this._options.dsn) {
            utils_1.logger.warn('No DSN provided, backend will not do anything.');
        }
        this._transport = this._setupTransport();
    }
    /**
     * @inheritDoc
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    BaseBackend.prototype.eventFromException = function (_exception, _hint) {
        throw new utils_1.SentryError('Backend has to implement `eventFromException` method');
    };
    /**
     * @inheritDoc
     */
    BaseBackend.prototype.eventFromMessage = function (_message, _level, _hint) {
        throw new utils_1.SentryError('Backend has to implement `eventFromMessage` method');
    };
    /**
     * @inheritDoc
     */
    BaseBackend.prototype.sendEvent = function (event) {
        this._transport.sendEvent(event).then(null, function (reason) {
            utils_1.logger.error("Error while sending event: " + reason);
        });
    };
    /**
     * @inheritDoc
     */
    BaseBackend.prototype.sendSession = function (session) {
        if (!this._transport.sendSession) {
            utils_1.logger.warn("Dropping session because custom transport doesn't implement sendSession");
            return;
        }
        this._transport.sendSession(session).then(null, function (reason) {
            utils_1.logger.error("Error while sending session: " + reason);
        });
    };
    /**
     * @inheritDoc
     */
    BaseBackend.prototype.getTransport = function () {
        return this._transport;
    };
    /**
     * Sets up the transport so it can be used later to send requests.
     */
    BaseBackend.prototype._setupTransport = function () {
        return new noop_1.NoopTransport();
    };
    return BaseBackend;
}());
exports.BaseBackend = BaseBackend;
//# sourceMappingURL=basebackend.js.map

/***/ }),

/***/ 5684:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
/* eslint-disable max-lines */
var hub_1 = __nccwpck_require__(6393);
var types_1 = __nccwpck_require__(3789);
var utils_1 = __nccwpck_require__(1620);
var integration_1 = __nccwpck_require__(8500);
/**
 * Base implementation for all JavaScript SDK clients.
 *
 * Call the constructor with the corresponding backend constructor and options
 * specific to the client subclass. To access these options later, use
 * {@link Client.getOptions}. Also, the Backend instance is available via
 * {@link Client.getBackend}.
 *
 * If a Dsn is specified in the options, it will be parsed and stored. Use
 * {@link Client.getDsn} to retrieve the Dsn at any moment. In case the Dsn is
 * invalid, the constructor will throw a {@link SentryException}. Note that
 * without a valid Dsn, the SDK will not send any events to Sentry.
 *
 * Before sending an event via the backend, it is passed through
 * {@link BaseClient._prepareEvent} to add SDK information and scope data
 * (breadcrumbs and context). To add more custom information, override this
 * method and extend the resulting prepared event.
 *
 * To issue automatically created events (e.g. via instrumentation), use
 * {@link Client.captureEvent}. It will prepare the event and pass it through
 * the callback lifecycle. To issue auto-breadcrumbs, use
 * {@link Client.addBreadcrumb}.
 *
 * @example
 * class NodeClient extends BaseClient<NodeBackend, NodeOptions> {
 *   public constructor(options: NodeOptions) {
 *     super(NodeBackend, options);
 *   }
 *
 *   // ...
 * }
 */
var BaseClient = /** @class */ (function () {
    /**
     * Initializes this client instance.
     *
     * @param backendClass A constructor function to create the backend.
     * @param options Options for the client.
     */
    function BaseClient(backendClass, options) {
        /** Array of used integrations. */
        this._integrations = {};
        /** Number of call being processed */
        this._processing = 0;
        this._backend = new backendClass(options);
        this._options = options;
        if (options.dsn) {
            this._dsn = new utils_1.Dsn(options.dsn);
        }
    }
    /**
     * @inheritDoc
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    BaseClient.prototype.captureException = function (exception, hint, scope) {
        var _this = this;
        var eventId = hint && hint.event_id;
        this._process(this._getBackend()
            .eventFromException(exception, hint)
            .then(function (event) { return _this._captureEvent(event, hint, scope); })
            .then(function (result) {
            eventId = result;
        }));
        return eventId;
    };
    /**
     * @inheritDoc
     */
    BaseClient.prototype.captureMessage = function (message, level, hint, scope) {
        var _this = this;
        var eventId = hint && hint.event_id;
        var promisedEvent = utils_1.isPrimitive(message)
            ? this._getBackend().eventFromMessage(String(message), level, hint)
            : this._getBackend().eventFromException(message, hint);
        this._process(promisedEvent
            .then(function (event) { return _this._captureEvent(event, hint, scope); })
            .then(function (result) {
            eventId = result;
        }));
        return eventId;
    };
    /**
     * @inheritDoc
     */
    BaseClient.prototype.captureEvent = function (event, hint, scope) {
        var eventId = hint && hint.event_id;
        this._process(this._captureEvent(event, hint, scope).then(function (result) {
            eventId = result;
        }));
        return eventId;
    };
    /**
     * @inheritDoc
     */
    BaseClient.prototype.captureSession = function (session) {
        if (!session.release) {
            utils_1.logger.warn('Discarded session because of missing release');
        }
        else {
            this._sendSession(session);
            // After sending, we set init false to inidcate it's not the first occurence
            session.update({ init: false });
        }
    };
    /**
     * @inheritDoc
     */
    BaseClient.prototype.getDsn = function () {
        return this._dsn;
    };
    /**
     * @inheritDoc
     */
    BaseClient.prototype.getOptions = function () {
        return this._options;
    };
    /**
     * @inheritDoc
     */
    BaseClient.prototype.flush = function (timeout) {
        var _this = this;
        return this._isClientProcessing(timeout).then(function (ready) {
            return _this._getBackend()
                .getTransport()
                .close(timeout)
                .then(function (transportFlushed) { return ready && transportFlushed; });
        });
    };
    /**
     * @inheritDoc
     */
    BaseClient.prototype.close = function (timeout) {
        var _this = this;
        return this.flush(timeout).then(function (result) {
            _this.getOptions().enabled = false;
            return result;
        });
    };
    /**
     * Sets up the integrations
     */
    BaseClient.prototype.setupIntegrations = function () {
        if (this._isEnabled()) {
            this._integrations = integration_1.setupIntegrations(this._options);
        }
    };
    /**
     * @inheritDoc
     */
    BaseClient.prototype.getIntegration = function (integration) {
        try {
            return this._integrations[integration.id] || null;
        }
        catch (_oO) {
            utils_1.logger.warn("Cannot retrieve integration " + integration.id + " from the current Client");
            return null;
        }
    };
    /** Updates existing session based on the provided event */
    BaseClient.prototype._updateSessionFromEvent = function (session, event) {
        var e_1, _a;
        var crashed = false;
        var errored = false;
        var userAgent;
        var exceptions = event.exception && event.exception.values;
        if (exceptions) {
            errored = true;
            try {
                for (var exceptions_1 = tslib_1.__values(exceptions), exceptions_1_1 = exceptions_1.next(); !exceptions_1_1.done; exceptions_1_1 = exceptions_1.next()) {
                    var ex = exceptions_1_1.value;
                    var mechanism = ex.mechanism;
                    if (mechanism && mechanism.handled === false) {
                        crashed = true;
                        break;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (exceptions_1_1 && !exceptions_1_1.done && (_a = exceptions_1.return)) _a.call(exceptions_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        var user = event.user;
        if (!session.userAgent) {
            var headers = event.request ? event.request.headers : {};
            for (var key in headers) {
                if (key.toLowerCase() === 'user-agent') {
                    userAgent = headers[key];
                    break;
                }
            }
        }
        session.update(tslib_1.__assign(tslib_1.__assign({}, (crashed && { status: types_1.SessionStatus.Crashed })), { user: user,
            userAgent: userAgent, errors: session.errors + Number(errored || crashed) }));
        this.captureSession(session);
    };
    /** Deliver captured session to Sentry */
    BaseClient.prototype._sendSession = function (session) {
        this._getBackend().sendSession(session);
    };
    /** Waits for the client to be done with processing. */
    BaseClient.prototype._isClientProcessing = function (timeout) {
        var _this = this;
        return new utils_1.SyncPromise(function (resolve) {
            var ticked = 0;
            var tick = 1;
            var interval = setInterval(function () {
                if (_this._processing == 0) {
                    clearInterval(interval);
                    resolve(true);
                }
                else {
                    ticked += tick;
                    if (timeout && ticked >= timeout) {
                        clearInterval(interval);
                        resolve(false);
                    }
                }
            }, tick);
        });
    };
    /** Returns the current backend. */
    BaseClient.prototype._getBackend = function () {
        return this._backend;
    };
    /** Determines whether this SDK is enabled and a valid Dsn is present. */
    BaseClient.prototype._isEnabled = function () {
        return this.getOptions().enabled !== false && this._dsn !== undefined;
    };
    /**
     * Adds common information to events.
     *
     * The information includes release and environment from `options`,
     * breadcrumbs and context (extra, tags and user) from the scope.
     *
     * Information that is already present in the event is never overwritten. For
     * nested objects, such as the context, keys are merged.
     *
     * @param event The original event.
     * @param hint May contain additional information about the original exception.
     * @param scope A scope containing event metadata.
     * @returns A new event with more information.
     */
    BaseClient.prototype._prepareEvent = function (event, scope, hint) {
        var _this = this;
        var _a = this.getOptions().normalizeDepth, normalizeDepth = _a === void 0 ? 3 : _a;
        var prepared = tslib_1.__assign(tslib_1.__assign({}, event), { event_id: event.event_id || (hint && hint.event_id ? hint.event_id : utils_1.uuid4()), timestamp: event.timestamp || utils_1.dateTimestampInSeconds() });
        this._applyClientOptions(prepared);
        this._applyIntegrationsMetadata(prepared);
        // If we have scope given to us, use it as the base for further modifications.
        // This allows us to prevent unnecessary copying of data if `captureContext` is not provided.
        var finalScope = scope;
        if (hint && hint.captureContext) {
            finalScope = hub_1.Scope.clone(finalScope).update(hint.captureContext);
        }
        // We prepare the result here with a resolved Event.
        var result = utils_1.SyncPromise.resolve(prepared);
        // This should be the last thing called, since we want that
        // {@link Hub.addEventProcessor} gets the finished prepared event.
        if (finalScope) {
            // In case we have a hub we reassign it.
            result = finalScope.applyToEvent(prepared, hint);
        }
        return result.then(function (evt) {
            if (typeof normalizeDepth === 'number' && normalizeDepth > 0) {
                return _this._normalizeEvent(evt, normalizeDepth);
            }
            return evt;
        });
    };
    /**
     * Applies `normalize` function on necessary `Event` attributes to make them safe for serialization.
     * Normalized keys:
     * - `breadcrumbs.data`
     * - `user`
     * - `contexts`
     * - `extra`
     * @param event Event
     * @returns Normalized event
     */
    BaseClient.prototype._normalizeEvent = function (event, depth) {
        if (!event) {
            return null;
        }
        var normalized = tslib_1.__assign(tslib_1.__assign(tslib_1.__assign(tslib_1.__assign(tslib_1.__assign({}, event), (event.breadcrumbs && {
            breadcrumbs: event.breadcrumbs.map(function (b) { return (tslib_1.__assign(tslib_1.__assign({}, b), (b.data && {
                data: utils_1.normalize(b.data, depth),
            }))); }),
        })), (event.user && {
            user: utils_1.normalize(event.user, depth),
        })), (event.contexts && {
            contexts: utils_1.normalize(event.contexts, depth),
        })), (event.extra && {
            extra: utils_1.normalize(event.extra, depth),
        }));
        // event.contexts.trace stores information about a Transaction. Similarly,
        // event.spans[] stores information about child Spans. Given that a
        // Transaction is conceptually a Span, normalization should apply to both
        // Transactions and Spans consistently.
        // For now the decision is to skip normalization of Transactions and Spans,
        // so this block overwrites the normalized event to add back the original
        // Transaction information prior to normalization.
        if (event.contexts && event.contexts.trace) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            normalized.contexts.trace = event.contexts.trace;
        }
        return normalized;
    };
    /**
     *  Enhances event using the client configuration.
     *  It takes care of all "static" values like environment, release and `dist`,
     *  as well as truncating overly long values.
     * @param event event instance to be enhanced
     */
    BaseClient.prototype._applyClientOptions = function (event) {
        var options = this.getOptions();
        var environment = options.environment, release = options.release, dist = options.dist, _a = options.maxValueLength, maxValueLength = _a === void 0 ? 250 : _a;
        if (!('environment' in event)) {
            event.environment = 'environment' in options ? environment : 'production';
        }
        if (event.release === undefined && release !== undefined) {
            event.release = release;
        }
        if (event.dist === undefined && dist !== undefined) {
            event.dist = dist;
        }
        if (event.message) {
            event.message = utils_1.truncate(event.message, maxValueLength);
        }
        var exception = event.exception && event.exception.values && event.exception.values[0];
        if (exception && exception.value) {
            exception.value = utils_1.truncate(exception.value, maxValueLength);
        }
        var request = event.request;
        if (request && request.url) {
            request.url = utils_1.truncate(request.url, maxValueLength);
        }
    };
    /**
     * This function adds all used integrations to the SDK info in the event.
     * @param event The event that will be filled with all integrations.
     */
    BaseClient.prototype._applyIntegrationsMetadata = function (event) {
        var sdkInfo = event.sdk;
        var integrationsArray = Object.keys(this._integrations);
        if (sdkInfo && integrationsArray.length > 0) {
            sdkInfo.integrations = integrationsArray;
        }
    };
    /**
     * Tells the backend to send this event
     * @param event The Sentry event to send
     */
    BaseClient.prototype._sendEvent = function (event) {
        this._getBackend().sendEvent(event);
    };
    /**
     * Processes the event and logs an error in case of rejection
     * @param event
     * @param hint
     * @param scope
     */
    BaseClient.prototype._captureEvent = function (event, hint, scope) {
        return this._processEvent(event, hint, scope).then(function (finalEvent) {
            return finalEvent.event_id;
        }, function (reason) {
            utils_1.logger.error(reason);
            return undefined;
        });
    };
    /**
     * Processes an event (either error or message) and sends it to Sentry.
     *
     * This also adds breadcrumbs and context information to the event. However,
     * platform specific meta data (such as the User's IP address) must be added
     * by the SDK implementor.
     *
     *
     * @param event The event to send to Sentry.
     * @param hint May contain additional information about the original exception.
     * @param scope A scope containing event metadata.
     * @returns A SyncPromise that resolves with the event or rejects in case event was/will not be send.
     */
    BaseClient.prototype._processEvent = function (event, hint, scope) {
        var _this = this;
        // eslint-disable-next-line @typescript-eslint/unbound-method
        var _a = this.getOptions(), beforeSend = _a.beforeSend, sampleRate = _a.sampleRate;
        if (!this._isEnabled()) {
            return utils_1.SyncPromise.reject(new utils_1.SentryError('SDK not enabled, will not send event.'));
        }
        var isTransaction = event.type === 'transaction';
        // 1.0 === 100% events are sent
        // 0.0 === 0% events are sent
        // Sampling for transaction happens somewhere else
        if (!isTransaction && typeof sampleRate === 'number' && Math.random() > sampleRate) {
            return utils_1.SyncPromise.reject(new utils_1.SentryError("Discarding event because it's not included in the random sample (sampling rate = " + sampleRate + ")"));
        }
        return this._prepareEvent(event, scope, hint)
            .then(function (prepared) {
            if (prepared === null) {
                throw new utils_1.SentryError('An event processor returned null, will not send event.');
            }
            var isInternalException = hint && hint.data && hint.data.__sentry__ === true;
            if (isInternalException || isTransaction || !beforeSend) {
                return prepared;
            }
            var beforeSendResult = beforeSend(prepared, hint);
            if (typeof beforeSendResult === 'undefined') {
                throw new utils_1.SentryError('`beforeSend` method has to return `null` or a valid event.');
            }
            else if (utils_1.isThenable(beforeSendResult)) {
                return beforeSendResult.then(function (event) { return event; }, function (e) {
                    throw new utils_1.SentryError("beforeSend rejected with " + e);
                });
            }
            return beforeSendResult;
        })
            .then(function (processedEvent) {
            if (processedEvent === null) {
                throw new utils_1.SentryError('`beforeSend` returned `null`, will not send event.');
            }
            var session = scope && scope.getSession && scope.getSession();
            if (!isTransaction && session) {
                _this._updateSessionFromEvent(session, processedEvent);
            }
            _this._sendEvent(processedEvent);
            return processedEvent;
        })
            .then(null, function (reason) {
            if (reason instanceof utils_1.SentryError) {
                throw reason;
            }
            _this.captureException(reason, {
                data: {
                    __sentry__: true,
                },
                originalException: reason,
            });
            throw new utils_1.SentryError("Event processing pipeline threw an error, original event will not be sent. Details have been sent as a new event.\nReason: " + reason);
        });
    };
    /**
     * Occupies the client with processing and event
     */
    BaseClient.prototype._process = function (promise) {
        var _this = this;
        this._processing += 1;
        promise.then(function (value) {
            _this._processing -= 1;
            return value;
        }, function (reason) {
            _this._processing -= 1;
            return reason;
        });
    };
    return BaseClient;
}());
exports.BaseClient = BaseClient;
//# sourceMappingURL=baseclient.js.map

/***/ }),

/***/ 9212:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var minimal_1 = __nccwpck_require__(8455);
exports.addBreadcrumb = minimal_1.addBreadcrumb;
exports.captureException = minimal_1.captureException;
exports.captureEvent = minimal_1.captureEvent;
exports.captureMessage = minimal_1.captureMessage;
exports.configureScope = minimal_1.configureScope;
exports.startTransaction = minimal_1.startTransaction;
exports.setContext = minimal_1.setContext;
exports.setExtra = minimal_1.setExtra;
exports.setExtras = minimal_1.setExtras;
exports.setTag = minimal_1.setTag;
exports.setTags = minimal_1.setTags;
exports.setUser = minimal_1.setUser;
exports.withScope = minimal_1.withScope;
var hub_1 = __nccwpck_require__(6393);
exports.addGlobalEventProcessor = hub_1.addGlobalEventProcessor;
exports.getCurrentHub = hub_1.getCurrentHub;
exports.getHubFromCarrier = hub_1.getHubFromCarrier;
exports.Hub = hub_1.Hub;
exports.makeMain = hub_1.makeMain;
exports.Scope = hub_1.Scope;
var api_1 = __nccwpck_require__(785);
exports.API = api_1.API;
var baseclient_1 = __nccwpck_require__(5684);
exports.BaseClient = baseclient_1.BaseClient;
var basebackend_1 = __nccwpck_require__(5886);
exports.BaseBackend = basebackend_1.BaseBackend;
var request_1 = __nccwpck_require__(1553);
exports.eventToSentryRequest = request_1.eventToSentryRequest;
exports.sessionToSentryRequest = request_1.sessionToSentryRequest;
var sdk_1 = __nccwpck_require__(6406);
exports.initAndBind = sdk_1.initAndBind;
var noop_1 = __nccwpck_require__(8641);
exports.NoopTransport = noop_1.NoopTransport;
var version_1 = __nccwpck_require__(3493);
exports.SDK_VERSION = version_1.SDK_VERSION;
var Integrations = __nccwpck_require__(6727);
exports.Integrations = Integrations;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 8500:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var hub_1 = __nccwpck_require__(6393);
var utils_1 = __nccwpck_require__(1620);
exports.installedIntegrations = [];
/** Gets integration to install */
function getIntegrationsToSetup(options) {
    var defaultIntegrations = (options.defaultIntegrations && tslib_1.__spread(options.defaultIntegrations)) || [];
    var userIntegrations = options.integrations;
    var integrations = [];
    if (Array.isArray(userIntegrations)) {
        var userIntegrationsNames_1 = userIntegrations.map(function (i) { return i.name; });
        var pickedIntegrationsNames_1 = [];
        // Leave only unique default integrations, that were not overridden with provided user integrations
        defaultIntegrations.forEach(function (defaultIntegration) {
            if (userIntegrationsNames_1.indexOf(defaultIntegration.name) === -1 &&
                pickedIntegrationsNames_1.indexOf(defaultIntegration.name) === -1) {
                integrations.push(defaultIntegration);
                pickedIntegrationsNames_1.push(defaultIntegration.name);
            }
        });
        // Don't add same user integration twice
        userIntegrations.forEach(function (userIntegration) {
            if (pickedIntegrationsNames_1.indexOf(userIntegration.name) === -1) {
                integrations.push(userIntegration);
                pickedIntegrationsNames_1.push(userIntegration.name);
            }
        });
    }
    else if (typeof userIntegrations === 'function') {
        integrations = userIntegrations(defaultIntegrations);
        integrations = Array.isArray(integrations) ? integrations : [integrations];
    }
    else {
        integrations = tslib_1.__spread(defaultIntegrations);
    }
    // Make sure that if present, `Debug` integration will always run last
    var integrationsNames = integrations.map(function (i) { return i.name; });
    var alwaysLastToRun = 'Debug';
    if (integrationsNames.indexOf(alwaysLastToRun) !== -1) {
        integrations.push.apply(integrations, tslib_1.__spread(integrations.splice(integrationsNames.indexOf(alwaysLastToRun), 1)));
    }
    return integrations;
}
exports.getIntegrationsToSetup = getIntegrationsToSetup;
/** Setup given integration */
function setupIntegration(integration) {
    if (exports.installedIntegrations.indexOf(integration.name) !== -1) {
        return;
    }
    integration.setupOnce(hub_1.addGlobalEventProcessor, hub_1.getCurrentHub);
    exports.installedIntegrations.push(integration.name);
    utils_1.logger.log("Integration installed: " + integration.name);
}
exports.setupIntegration = setupIntegration;
/**
 * Given a list of integration instances this installs them all. When `withDefaults` is set to `true` then all default
 * integrations are added unless they were already provided before.
 * @param integrations array of integration instances
 * @param withDefault should enable default integrations
 */
function setupIntegrations(options) {
    var integrations = {};
    getIntegrationsToSetup(options).forEach(function (integration) {
        integrations[integration.name] = integration;
        setupIntegration(integration);
    });
    return integrations;
}
exports.setupIntegrations = setupIntegrations;
//# sourceMappingURL=integration.js.map

/***/ }),

/***/ 7349:
/***/ ((__unused_webpack_module, exports) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var originalFunctionToString;
/** Patch toString calls to return proper name for wrapped functions */
var FunctionToString = /** @class */ (function () {
    function FunctionToString() {
        /**
         * @inheritDoc
         */
        this.name = FunctionToString.id;
    }
    /**
     * @inheritDoc
     */
    FunctionToString.prototype.setupOnce = function () {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        originalFunctionToString = Function.prototype.toString;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Function.prototype.toString = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var context = this.__sentry_original__ || this;
            return originalFunctionToString.apply(context, args);
        };
    };
    /**
     * @inheritDoc
     */
    FunctionToString.id = 'FunctionToString';
    return FunctionToString;
}());
exports.FunctionToString = FunctionToString;
//# sourceMappingURL=functiontostring.js.map

/***/ }),

/***/ 4838:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var hub_1 = __nccwpck_require__(6393);
var utils_1 = __nccwpck_require__(1620);
// "Script error." is hard coded into browsers for errors that it can't read.
// this is the result of a script being pulled in from an external domain and CORS.
var DEFAULT_IGNORE_ERRORS = [/^Script error\.?$/, /^Javascript error: Script error\.? on line 0$/];
/** Inbound filters configurable by the user */
var InboundFilters = /** @class */ (function () {
    function InboundFilters(_options) {
        if (_options === void 0) { _options = {}; }
        this._options = _options;
        /**
         * @inheritDoc
         */
        this.name = InboundFilters.id;
    }
    /**
     * @inheritDoc
     */
    InboundFilters.prototype.setupOnce = function () {
        hub_1.addGlobalEventProcessor(function (event) {
            var hub = hub_1.getCurrentHub();
            if (!hub) {
                return event;
            }
            var self = hub.getIntegration(InboundFilters);
            if (self) {
                var client = hub.getClient();
                var clientOptions = client ? client.getOptions() : {};
                var options = self._mergeOptions(clientOptions);
                if (self._shouldDropEvent(event, options)) {
                    return null;
                }
            }
            return event;
        });
    };
    /** JSDoc */
    InboundFilters.prototype._shouldDropEvent = function (event, options) {
        if (this._isSentryError(event, options)) {
            utils_1.logger.warn("Event dropped due to being internal Sentry Error.\nEvent: " + utils_1.getEventDescription(event));
            return true;
        }
        if (this._isIgnoredError(event, options)) {
            utils_1.logger.warn("Event dropped due to being matched by `ignoreErrors` option.\nEvent: " + utils_1.getEventDescription(event));
            return true;
        }
        if (this._isDeniedUrl(event, options)) {
            utils_1.logger.warn("Event dropped due to being matched by `denyUrls` option.\nEvent: " + utils_1.getEventDescription(event) + ".\nUrl: " + this._getEventFilterUrl(event));
            return true;
        }
        if (!this._isAllowedUrl(event, options)) {
            utils_1.logger.warn("Event dropped due to not being matched by `allowUrls` option.\nEvent: " + utils_1.getEventDescription(event) + ".\nUrl: " + this._getEventFilterUrl(event));
            return true;
        }
        return false;
    };
    /** JSDoc */
    InboundFilters.prototype._isSentryError = function (event, options) {
        if (!options.ignoreInternal) {
            return false;
        }
        try {
            return ((event &&
                event.exception &&
                event.exception.values &&
                event.exception.values[0] &&
                event.exception.values[0].type === 'SentryError') ||
                false);
        }
        catch (_oO) {
            return false;
        }
    };
    /** JSDoc */
    InboundFilters.prototype._isIgnoredError = function (event, options) {
        if (!options.ignoreErrors || !options.ignoreErrors.length) {
            return false;
        }
        return this._getPossibleEventMessages(event).some(function (message) {
            // Not sure why TypeScript complains here...
            return options.ignoreErrors.some(function (pattern) { return utils_1.isMatchingPattern(message, pattern); });
        });
    };
    /** JSDoc */
    InboundFilters.prototype._isDeniedUrl = function (event, options) {
        // TODO: Use Glob instead?
        if (!options.denyUrls || !options.denyUrls.length) {
            return false;
        }
        var url = this._getEventFilterUrl(event);
        return !url ? false : options.denyUrls.some(function (pattern) { return utils_1.isMatchingPattern(url, pattern); });
    };
    /** JSDoc */
    InboundFilters.prototype._isAllowedUrl = function (event, options) {
        // TODO: Use Glob instead?
        if (!options.allowUrls || !options.allowUrls.length) {
            return true;
        }
        var url = this._getEventFilterUrl(event);
        return !url ? true : options.allowUrls.some(function (pattern) { return utils_1.isMatchingPattern(url, pattern); });
    };
    /** JSDoc */
    InboundFilters.prototype._mergeOptions = function (clientOptions) {
        if (clientOptions === void 0) { clientOptions = {}; }
        return {
            allowUrls: tslib_1.__spread((this._options.whitelistUrls || []), (this._options.allowUrls || []), (clientOptions.whitelistUrls || []), (clientOptions.allowUrls || [])),
            denyUrls: tslib_1.__spread((this._options.blacklistUrls || []), (this._options.denyUrls || []), (clientOptions.blacklistUrls || []), (clientOptions.denyUrls || [])),
            ignoreErrors: tslib_1.__spread((this._options.ignoreErrors || []), (clientOptions.ignoreErrors || []), DEFAULT_IGNORE_ERRORS),
            ignoreInternal: typeof this._options.ignoreInternal !== 'undefined' ? this._options.ignoreInternal : true,
        };
    };
    /** JSDoc */
    InboundFilters.prototype._getPossibleEventMessages = function (event) {
        if (event.message) {
            return [event.message];
        }
        if (event.exception) {
            try {
                var _a = (event.exception.values && event.exception.values[0]) || {}, _b = _a.type, type = _b === void 0 ? '' : _b, _c = _a.value, value = _c === void 0 ? '' : _c;
                return ["" + value, type + ": " + value];
            }
            catch (oO) {
                utils_1.logger.error("Cannot extract message for event " + utils_1.getEventDescription(event));
                return [];
            }
        }
        return [];
    };
    /** JSDoc */
    InboundFilters.prototype._getEventFilterUrl = function (event) {
        try {
            if (event.stacktrace) {
                var frames_1 = event.stacktrace.frames;
                return (frames_1 && frames_1[frames_1.length - 1].filename) || null;
            }
            if (event.exception) {
                var frames_2 = event.exception.values && event.exception.values[0].stacktrace && event.exception.values[0].stacktrace.frames;
                return (frames_2 && frames_2[frames_2.length - 1].filename) || null;
            }
            return null;
        }
        catch (oO) {
            utils_1.logger.error("Cannot extract url for event " + utils_1.getEventDescription(event));
            return null;
        }
    };
    /**
     * @inheritDoc
     */
    InboundFilters.id = 'InboundFilters';
    return InboundFilters;
}());
exports.InboundFilters = InboundFilters;
//# sourceMappingURL=inboundfilters.js.map

/***/ }),

/***/ 6727:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var functiontostring_1 = __nccwpck_require__(7349);
exports.FunctionToString = functiontostring_1.FunctionToString;
var inboundfilters_1 = __nccwpck_require__(4838);
exports.InboundFilters = inboundfilters_1.InboundFilters;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 1553:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
/** Extract sdk info from from the API metadata */
function getSdkMetadataForEnvelopeHeader(api) {
    if (!api.metadata || !api.metadata.sdk) {
        return;
    }
    var _a = api.metadata.sdk, name = _a.name, version = _a.version;
    return { name: name, version: version };
}
/**
 * Apply SdkInfo (name, version, packages, integrations) to the corresponding event key.
 * Merge with existing data if any.
 **/
function enhanceEventWithSdkInfo(event, sdkInfo) {
    if (!sdkInfo) {
        return event;
    }
    event.sdk = event.sdk || {
        name: sdkInfo.name,
        version: sdkInfo.version,
    };
    event.sdk.name = event.sdk.name || sdkInfo.name;
    event.sdk.version = event.sdk.version || sdkInfo.version;
    event.sdk.integrations = tslib_1.__spread((event.sdk.integrations || []), (sdkInfo.integrations || []));
    event.sdk.packages = tslib_1.__spread((event.sdk.packages || []), (sdkInfo.packages || []));
    return event;
}
/** Creates a SentryRequest from an event. */
function sessionToSentryRequest(session, api) {
    var sdkInfo = getSdkMetadataForEnvelopeHeader(api);
    var envelopeHeaders = JSON.stringify(tslib_1.__assign({ sent_at: new Date().toISOString() }, (sdkInfo && { sdk: sdkInfo })));
    var itemHeaders = JSON.stringify({
        type: 'session',
    });
    return {
        body: envelopeHeaders + "\n" + itemHeaders + "\n" + JSON.stringify(session),
        type: 'session',
        url: api.getEnvelopeEndpointWithUrlEncodedAuth(),
    };
}
exports.sessionToSentryRequest = sessionToSentryRequest;
/** Creates a SentryRequest from an event. */
function eventToSentryRequest(event, api) {
    var sdkInfo = getSdkMetadataForEnvelopeHeader(api);
    var eventType = event.type || 'event';
    var useEnvelope = eventType === 'transaction';
    var _a = event.debug_meta || {}, transactionSampling = _a.transactionSampling, metadata = tslib_1.__rest(_a, ["transactionSampling"]);
    var _b = transactionSampling || {}, samplingMethod = _b.method, sampleRate = _b.rate;
    if (Object.keys(metadata).length === 0) {
        delete event.debug_meta;
    }
    else {
        event.debug_meta = metadata;
    }
    var req = {
        body: JSON.stringify(sdkInfo ? enhanceEventWithSdkInfo(event, api.metadata.sdk) : event),
        type: eventType,
        url: useEnvelope ? api.getEnvelopeEndpointWithUrlEncodedAuth() : api.getStoreEndpointWithUrlEncodedAuth(),
    };
    // https://develop.sentry.dev/sdk/envelopes/
    // Since we don't need to manipulate envelopes nor store them, there is no
    // exported concept of an Envelope with operations including serialization and
    // deserialization. Instead, we only implement a minimal subset of the spec to
    // serialize events inline here.
    if (useEnvelope) {
        var envelopeHeaders = JSON.stringify(tslib_1.__assign({ event_id: event.event_id, sent_at: new Date().toISOString() }, (sdkInfo && { sdk: sdkInfo })));
        var itemHeaders = JSON.stringify({
            type: event.type,
            // TODO: Right now, sampleRate may or may not be defined (it won't be in the cases of inheritance and
            // explicitly-set sampling decisions). Are we good with that?
            sample_rates: [{ id: samplingMethod, rate: sampleRate }],
        });
        // The trailing newline is optional. We intentionally don't send it to avoid
        // sending unnecessary bytes.
        //
        // const envelope = `${envelopeHeaders}\n${itemHeaders}\n${req.body}\n`;
        var envelope = envelopeHeaders + "\n" + itemHeaders + "\n" + req.body;
        req.body = envelope;
    }
    return req;
}
exports.eventToSentryRequest = eventToSentryRequest;
//# sourceMappingURL=request.js.map

/***/ }),

/***/ 6406:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var hub_1 = __nccwpck_require__(6393);
var utils_1 = __nccwpck_require__(1620);
/**
 * Internal function to create a new SDK client instance. The client is
 * installed and then bound to the current scope.
 *
 * @param clientClass The client class to instantiate.
 * @param options Options to pass to the client.
 */
function initAndBind(clientClass, options) {
    if (options.debug === true) {
        utils_1.logger.enable();
    }
    var hub = hub_1.getCurrentHub();
    var client = new clientClass(options);
    hub.bindClient(client);
}
exports.initAndBind = initAndBind;
//# sourceMappingURL=sdk.js.map

/***/ }),

/***/ 8641:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var types_1 = __nccwpck_require__(3789);
var utils_1 = __nccwpck_require__(1620);
/** Noop transport */
var NoopTransport = /** @class */ (function () {
    function NoopTransport() {
    }
    /**
     * @inheritDoc
     */
    NoopTransport.prototype.sendEvent = function (_) {
        return utils_1.SyncPromise.resolve({
            reason: "NoopTransport: Event has been skipped because no Dsn is configured.",
            status: types_1.Status.Skipped,
        });
    };
    /**
     * @inheritDoc
     */
    NoopTransport.prototype.close = function (_) {
        return utils_1.SyncPromise.resolve(true);
    };
    return NoopTransport;
}());
exports.NoopTransport = NoopTransport;
//# sourceMappingURL=noop.js.map

/***/ }),

/***/ 3493:
/***/ ((__unused_webpack_module, exports) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SDK_VERSION = '6.2.5';
//# sourceMappingURL=version.js.map

/***/ }),

/***/ 3536:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
/* eslint-disable max-lines */
var types_1 = __nccwpck_require__(3789);
var utils_1 = __nccwpck_require__(1620);
var scope_1 = __nccwpck_require__(4213);
var session_1 = __nccwpck_require__(2474);
/**
 * API compatibility version of this hub.
 *
 * WARNING: This number should only be increased when the global interface
 * changes and new methods are introduced.
 *
 * @hidden
 */
exports.API_VERSION = 3;
/**
 * Default maximum number of breadcrumbs added to an event. Can be overwritten
 * with {@link Options.maxBreadcrumbs}.
 */
var DEFAULT_BREADCRUMBS = 100;
/**
 * Absolute maximum number of breadcrumbs added to an event. The
 * `maxBreadcrumbs` option cannot be higher than this value.
 */
var MAX_BREADCRUMBS = 100;
/**
 * @inheritDoc
 */
var Hub = /** @class */ (function () {
    /**
     * Creates a new instance of the hub, will push one {@link Layer} into the
     * internal stack on creation.
     *
     * @param client bound to the hub.
     * @param scope bound to the hub.
     * @param version number, higher number means higher priority.
     */
    function Hub(client, scope, _version) {
        if (scope === void 0) { scope = new scope_1.Scope(); }
        if (_version === void 0) { _version = exports.API_VERSION; }
        this._version = _version;
        /** Is a {@link Layer}[] containing the client and scope */
        this._stack = [{}];
        this.getStackTop().scope = scope;
        this.bindClient(client);
    }
    /**
     * @inheritDoc
     */
    Hub.prototype.isOlderThan = function (version) {
        return this._version < version;
    };
    /**
     * @inheritDoc
     */
    Hub.prototype.bindClient = function (client) {
        var top = this.getStackTop();
        top.client = client;
        if (client && client.setupIntegrations) {
            client.setupIntegrations();
        }
    };
    /**
     * @inheritDoc
     */
    Hub.prototype.pushScope = function () {
        // We want to clone the content of prev scope
        var scope = scope_1.Scope.clone(this.getScope());
        this.getStack().push({
            client: this.getClient(),
            scope: scope,
        });
        return scope;
    };
    /**
     * @inheritDoc
     */
    Hub.prototype.popScope = function () {
        if (this.getStack().length <= 1)
            return false;
        return !!this.getStack().pop();
    };
    /**
     * @inheritDoc
     */
    Hub.prototype.withScope = function (callback) {
        var scope = this.pushScope();
        try {
            callback(scope);
        }
        finally {
            this.popScope();
        }
    };
    /**
     * @inheritDoc
     */
    Hub.prototype.getClient = function () {
        return this.getStackTop().client;
    };
    /** Returns the scope of the top stack. */
    Hub.prototype.getScope = function () {
        return this.getStackTop().scope;
    };
    /** Returns the scope stack for domains or the process. */
    Hub.prototype.getStack = function () {
        return this._stack;
    };
    /** Returns the topmost scope layer in the order domain > local > process. */
    Hub.prototype.getStackTop = function () {
        return this._stack[this._stack.length - 1];
    };
    /**
     * @inheritDoc
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    Hub.prototype.captureException = function (exception, hint) {
        var eventId = (this._lastEventId = utils_1.uuid4());
        var finalHint = hint;
        // If there's no explicit hint provided, mimick the same thing that would happen
        // in the minimal itself to create a consistent behavior.
        // We don't do this in the client, as it's the lowest level API, and doing this,
        // would prevent user from having full control over direct calls.
        if (!hint) {
            var syntheticException = void 0;
            try {
                throw new Error('Sentry syntheticException');
            }
            catch (exception) {
                syntheticException = exception;
            }
            finalHint = {
                originalException: exception,
                syntheticException: syntheticException,
            };
        }
        this._invokeClient('captureException', exception, tslib_1.__assign(tslib_1.__assign({}, finalHint), { event_id: eventId }));
        return eventId;
    };
    /**
     * @inheritDoc
     */
    Hub.prototype.captureMessage = function (message, level, hint) {
        var eventId = (this._lastEventId = utils_1.uuid4());
        var finalHint = hint;
        // If there's no explicit hint provided, mimick the same thing that would happen
        // in the minimal itself to create a consistent behavior.
        // We don't do this in the client, as it's the lowest level API, and doing this,
        // would prevent user from having full control over direct calls.
        if (!hint) {
            var syntheticException = void 0;
            try {
                throw new Error(message);
            }
            catch (exception) {
                syntheticException = exception;
            }
            finalHint = {
                originalException: message,
                syntheticException: syntheticException,
            };
        }
        this._invokeClient('captureMessage', message, level, tslib_1.__assign(tslib_1.__assign({}, finalHint), { event_id: eventId }));
        return eventId;
    };
    /**
     * @inheritDoc
     */
    Hub.prototype.captureEvent = function (event, hint) {
        var eventId = (this._lastEventId = utils_1.uuid4());
        this._invokeClient('captureEvent', event, tslib_1.__assign(tslib_1.__assign({}, hint), { event_id: eventId }));
        return eventId;
    };
    /**
     * @inheritDoc
     */
    Hub.prototype.lastEventId = function () {
        return this._lastEventId;
    };
    /**
     * @inheritDoc
     */
    Hub.prototype.addBreadcrumb = function (breadcrumb, hint) {
        var _a = this.getStackTop(), scope = _a.scope, client = _a.client;
        if (!scope || !client)
            return;
        // eslint-disable-next-line @typescript-eslint/unbound-method
        var _b = (client.getOptions && client.getOptions()) || {}, _c = _b.beforeBreadcrumb, beforeBreadcrumb = _c === void 0 ? null : _c, _d = _b.maxBreadcrumbs, maxBreadcrumbs = _d === void 0 ? DEFAULT_BREADCRUMBS : _d;
        if (maxBreadcrumbs <= 0)
            return;
        var timestamp = utils_1.dateTimestampInSeconds();
        var mergedBreadcrumb = tslib_1.__assign({ timestamp: timestamp }, breadcrumb);
        var finalBreadcrumb = beforeBreadcrumb
            ? utils_1.consoleSandbox(function () { return beforeBreadcrumb(mergedBreadcrumb, hint); })
            : mergedBreadcrumb;
        if (finalBreadcrumb === null)
            return;
        scope.addBreadcrumb(finalBreadcrumb, Math.min(maxBreadcrumbs, MAX_BREADCRUMBS));
    };
    /**
     * @inheritDoc
     */
    Hub.prototype.setUser = function (user) {
        var scope = this.getScope();
        if (scope)
            scope.setUser(user);
    };
    /**
     * @inheritDoc
     */
    Hub.prototype.setTags = function (tags) {
        var scope = this.getScope();
        if (scope)
            scope.setTags(tags);
    };
    /**
     * @inheritDoc
     */
    Hub.prototype.setExtras = function (extras) {
        var scope = this.getScope();
        if (scope)
            scope.setExtras(extras);
    };
    /**
     * @inheritDoc
     */
    Hub.prototype.setTag = function (key, value) {
        var scope = this.getScope();
        if (scope)
            scope.setTag(key, value);
    };
    /**
     * @inheritDoc
     */
    Hub.prototype.setExtra = function (key, extra) {
        var scope = this.getScope();
        if (scope)
            scope.setExtra(key, extra);
    };
    /**
     * @inheritDoc
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Hub.prototype.setContext = function (name, context) {
        var scope = this.getScope();
        if (scope)
            scope.setContext(name, context);
    };
    /**
     * @inheritDoc
     */
    Hub.prototype.configureScope = function (callback) {
        var _a = this.getStackTop(), scope = _a.scope, client = _a.client;
        if (scope && client) {
            callback(scope);
        }
    };
    /**
     * @inheritDoc
     */
    Hub.prototype.run = function (callback) {
        var oldHub = makeMain(this);
        try {
            callback(this);
        }
        finally {
            makeMain(oldHub);
        }
    };
    /**
     * @inheritDoc
     */
    Hub.prototype.getIntegration = function (integration) {
        var client = this.getClient();
        if (!client)
            return null;
        try {
            return client.getIntegration(integration);
        }
        catch (_oO) {
            utils_1.logger.warn("Cannot retrieve integration " + integration.id + " from the current Hub");
            return null;
        }
    };
    /**
     * @inheritDoc
     */
    Hub.prototype.startSpan = function (context) {
        return this._callExtensionMethod('startSpan', context);
    };
    /**
     * @inheritDoc
     */
    Hub.prototype.startTransaction = function (context, customSamplingContext) {
        return this._callExtensionMethod('startTransaction', context, customSamplingContext);
    };
    /**
     * @inheritDoc
     */
    Hub.prototype.traceHeaders = function () {
        return this._callExtensionMethod('traceHeaders');
    };
    /**
     * @inheritDoc
     */
    Hub.prototype.captureSession = function (endSession) {
        if (endSession === void 0) { endSession = false; }
        // both send the update and pull the session from the scope
        if (endSession) {
            return this.endSession();
        }
        // only send the update
        this._sendSessionUpdate();
    };
    /**
     * @inheritDoc
     */
    Hub.prototype.endSession = function () {
        var _a, _b, _c, _d, _e;
        (_c = (_b = (_a = this.getStackTop()) === null || _a === void 0 ? void 0 : _a.scope) === null || _b === void 0 ? void 0 : _b.getSession()) === null || _c === void 0 ? void 0 : _c.close();
        this._sendSessionUpdate();
        // the session is over; take it off of the scope
        (_e = (_d = this.getStackTop()) === null || _d === void 0 ? void 0 : _d.scope) === null || _e === void 0 ? void 0 : _e.setSession();
    };
    /**
     * @inheritDoc
     */
    Hub.prototype.startSession = function (context) {
        var _a = this.getStackTop(), scope = _a.scope, client = _a.client;
        var _b = (client && client.getOptions()) || {}, release = _b.release, environment = _b.environment;
        var session = new session_1.Session(tslib_1.__assign(tslib_1.__assign({ release: release,
            environment: environment }, (scope && { user: scope.getUser() })), context));
        if (scope) {
            // End existing session if there's one
            var currentSession = scope.getSession && scope.getSession();
            if (currentSession && currentSession.status === types_1.SessionStatus.Ok) {
                currentSession.update({ status: types_1.SessionStatus.Exited });
            }
            this.endSession();
            // Afterwards we set the new session on the scope
            scope.setSession(session);
        }
        return session;
    };
    /**
     * Sends the current Session on the scope
     */
    Hub.prototype._sendSessionUpdate = function () {
        var _a = this.getStackTop(), scope = _a.scope, client = _a.client;
        if (!scope)
            return;
        var session = scope.getSession && scope.getSession();
        if (session) {
            if (client && client.captureSession) {
                client.captureSession(session);
            }
        }
    };
    /**
     * Internal helper function to call a method on the top client if it exists.
     *
     * @param method The method to call on the client.
     * @param args Arguments to pass to the client function.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Hub.prototype._invokeClient = function (method) {
        var _a;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var _b = this.getStackTop(), scope = _b.scope, client = _b.client;
        if (client && client[method]) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
            (_a = client)[method].apply(_a, tslib_1.__spread(args, [scope]));
        }
    };
    /**
     * Calls global extension method and binding current instance to the function call
     */
    // @ts-ignore Function lacks ending return statement and return type does not include 'undefined'. ts(2366)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Hub.prototype._callExtensionMethod = function (method) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var carrier = getMainCarrier();
        var sentry = carrier.__SENTRY__;
        if (sentry && sentry.extensions && typeof sentry.extensions[method] === 'function') {
            return sentry.extensions[method].apply(this, args);
        }
        utils_1.logger.warn("Extension method " + method + " couldn't be found, doing nothing.");
    };
    return Hub;
}());
exports.Hub = Hub;
/** Returns the global shim registry. */
function getMainCarrier() {
    var carrier = utils_1.getGlobalObject();
    carrier.__SENTRY__ = carrier.__SENTRY__ || {
        extensions: {},
        hub: undefined,
    };
    return carrier;
}
exports.getMainCarrier = getMainCarrier;
/**
 * Replaces the current main hub with the passed one on the global object
 *
 * @returns The old replaced hub
 */
function makeMain(hub) {
    var registry = getMainCarrier();
    var oldHub = getHubFromCarrier(registry);
    setHubOnCarrier(registry, hub);
    return oldHub;
}
exports.makeMain = makeMain;
/**
 * Returns the default hub instance.
 *
 * If a hub is already registered in the global carrier but this module
 * contains a more recent version, it replaces the registered version.
 * Otherwise, the currently registered hub will be returned.
 */
function getCurrentHub() {
    // Get main carrier (global for every environment)
    var registry = getMainCarrier();
    // If there's no hub, or its an old API, assign a new one
    if (!hasHubOnCarrier(registry) || getHubFromCarrier(registry).isOlderThan(exports.API_VERSION)) {
        setHubOnCarrier(registry, new Hub());
    }
    // Prefer domains over global if they are there (applicable only to Node environment)
    if (utils_1.isNodeEnv()) {
        return getHubFromActiveDomain(registry);
    }
    // Return hub that lives on a global object
    return getHubFromCarrier(registry);
}
exports.getCurrentHub = getCurrentHub;
/**
 * Returns the active domain, if one exists
 * @deprecated No longer used; remove in v7
 * @returns The domain, or undefined if there is no active domain
 */
// eslint-disable-next-line deprecation/deprecation
function getActiveDomain() {
    utils_1.logger.warn('Function `getActiveDomain` is deprecated and will be removed in a future version.');
    var sentry = getMainCarrier().__SENTRY__;
    return sentry && sentry.extensions && sentry.extensions.domain && sentry.extensions.domain.active;
}
exports.getActiveDomain = getActiveDomain;
/**
 * Try to read the hub from an active domain, and fallback to the registry if one doesn't exist
 * @returns discovered hub
 */
function getHubFromActiveDomain(registry) {
    var _a, _b, _c;
    try {
        var activeDomain = (_c = (_b = (_a = getMainCarrier().__SENTRY__) === null || _a === void 0 ? void 0 : _a.extensions) === null || _b === void 0 ? void 0 : _b.domain) === null || _c === void 0 ? void 0 : _c.active;
        // If there's no active domain, just return global hub
        if (!activeDomain) {
            return getHubFromCarrier(registry);
        }
        // If there's no hub on current domain, or it's an old API, assign a new one
        if (!hasHubOnCarrier(activeDomain) || getHubFromCarrier(activeDomain).isOlderThan(exports.API_VERSION)) {
            var registryHubTopStack = getHubFromCarrier(registry).getStackTop();
            setHubOnCarrier(activeDomain, new Hub(registryHubTopStack.client, scope_1.Scope.clone(registryHubTopStack.scope)));
        }
        // Return hub that lives on a domain
        return getHubFromCarrier(activeDomain);
    }
    catch (_Oo) {
        // Return hub that lives on a global object
        return getHubFromCarrier(registry);
    }
}
/**
 * This will tell whether a carrier has a hub on it or not
 * @param carrier object
 */
function hasHubOnCarrier(carrier) {
    return !!(carrier && carrier.__SENTRY__ && carrier.__SENTRY__.hub);
}
/**
 * This will create a new {@link Hub} and add to the passed object on
 * __SENTRY__.hub.
 * @param carrier object
 * @hidden
 */
function getHubFromCarrier(carrier) {
    if (carrier && carrier.__SENTRY__ && carrier.__SENTRY__.hub)
        return carrier.__SENTRY__.hub;
    carrier.__SENTRY__ = carrier.__SENTRY__ || {};
    carrier.__SENTRY__.hub = new Hub();
    return carrier.__SENTRY__.hub;
}
exports.getHubFromCarrier = getHubFromCarrier;
/**
 * This will set passed {@link Hub} on the passed object's __SENTRY__.hub attribute
 * @param carrier object
 * @param hub Hub
 * @returns A boolean indicating success or failure
 */
function setHubOnCarrier(carrier, hub) {
    if (!carrier)
        return false;
    carrier.__SENTRY__ = carrier.__SENTRY__ || {};
    carrier.__SENTRY__.hub = hub;
    return true;
}
exports.setHubOnCarrier = setHubOnCarrier;
//# sourceMappingURL=hub.js.map

/***/ }),

/***/ 6393:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var scope_1 = __nccwpck_require__(4213);
exports.addGlobalEventProcessor = scope_1.addGlobalEventProcessor;
exports.Scope = scope_1.Scope;
var session_1 = __nccwpck_require__(2474);
exports.Session = session_1.Session;
var hub_1 = __nccwpck_require__(3536);
// eslint-disable-next-line deprecation/deprecation
exports.getActiveDomain = hub_1.getActiveDomain;
exports.getCurrentHub = hub_1.getCurrentHub;
exports.getHubFromCarrier = hub_1.getHubFromCarrier;
exports.getMainCarrier = hub_1.getMainCarrier;
exports.Hub = hub_1.Hub;
exports.makeMain = hub_1.makeMain;
exports.setHubOnCarrier = hub_1.setHubOnCarrier;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 4213:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var utils_1 = __nccwpck_require__(1620);
/**
 * Holds additional event information. {@link Scope.applyToEvent} will be
 * called by the client before an event will be sent.
 */
var Scope = /** @class */ (function () {
    function Scope() {
        /** Flag if notifiying is happening. */
        this._notifyingListeners = false;
        /** Callback for client to receive scope changes. */
        this._scopeListeners = [];
        /** Callback list that will be called after {@link applyToEvent}. */
        this._eventProcessors = [];
        /** Array of breadcrumbs. */
        this._breadcrumbs = [];
        /** User */
        this._user = {};
        /** Tags */
        this._tags = {};
        /** Extra */
        this._extra = {};
        /** Contexts */
        this._contexts = {};
    }
    /**
     * Inherit values from the parent scope.
     * @param scope to clone.
     */
    Scope.clone = function (scope) {
        var newScope = new Scope();
        if (scope) {
            newScope._breadcrumbs = tslib_1.__spread(scope._breadcrumbs);
            newScope._tags = tslib_1.__assign({}, scope._tags);
            newScope._extra = tslib_1.__assign({}, scope._extra);
            newScope._contexts = tslib_1.__assign({}, scope._contexts);
            newScope._user = scope._user;
            newScope._level = scope._level;
            newScope._span = scope._span;
            newScope._session = scope._session;
            newScope._transactionName = scope._transactionName;
            newScope._fingerprint = scope._fingerprint;
            newScope._eventProcessors = tslib_1.__spread(scope._eventProcessors);
        }
        return newScope;
    };
    /**
     * Add internal on change listener. Used for sub SDKs that need to store the scope.
     * @hidden
     */
    Scope.prototype.addScopeListener = function (callback) {
        this._scopeListeners.push(callback);
    };
    /**
     * @inheritDoc
     */
    Scope.prototype.addEventProcessor = function (callback) {
        this._eventProcessors.push(callback);
        return this;
    };
    /**
     * @inheritDoc
     */
    Scope.prototype.setUser = function (user) {
        this._user = user || {};
        if (this._session) {
            this._session.update({ user: user });
        }
        this._notifyScopeListeners();
        return this;
    };
    /**
     * @inheritDoc
     */
    Scope.prototype.getUser = function () {
        return this._user;
    };
    /**
     * @inheritDoc
     */
    Scope.prototype.setTags = function (tags) {
        this._tags = tslib_1.__assign(tslib_1.__assign({}, this._tags), tags);
        this._notifyScopeListeners();
        return this;
    };
    /**
     * @inheritDoc
     */
    Scope.prototype.setTag = function (key, value) {
        var _a;
        this._tags = tslib_1.__assign(tslib_1.__assign({}, this._tags), (_a = {}, _a[key] = value, _a));
        this._notifyScopeListeners();
        return this;
    };
    /**
     * @inheritDoc
     */
    Scope.prototype.setExtras = function (extras) {
        this._extra = tslib_1.__assign(tslib_1.__assign({}, this._extra), extras);
        this._notifyScopeListeners();
        return this;
    };
    /**
     * @inheritDoc
     */
    Scope.prototype.setExtra = function (key, extra) {
        var _a;
        this._extra = tslib_1.__assign(tslib_1.__assign({}, this._extra), (_a = {}, _a[key] = extra, _a));
        this._notifyScopeListeners();
        return this;
    };
    /**
     * @inheritDoc
     */
    Scope.prototype.setFingerprint = function (fingerprint) {
        this._fingerprint = fingerprint;
        this._notifyScopeListeners();
        return this;
    };
    /**
     * @inheritDoc
     */
    Scope.prototype.setLevel = function (level) {
        this._level = level;
        this._notifyScopeListeners();
        return this;
    };
    /**
     * @inheritDoc
     */
    Scope.prototype.setTransactionName = function (name) {
        this._transactionName = name;
        this._notifyScopeListeners();
        return this;
    };
    /**
     * Can be removed in major version.
     * @deprecated in favor of {@link this.setTransactionName}
     */
    Scope.prototype.setTransaction = function (name) {
        return this.setTransactionName(name);
    };
    /**
     * @inheritDoc
     */
    Scope.prototype.setContext = function (key, context) {
        var _a;
        if (context === null) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete this._contexts[key];
        }
        else {
            this._contexts = tslib_1.__assign(tslib_1.__assign({}, this._contexts), (_a = {}, _a[key] = context, _a));
        }
        this._notifyScopeListeners();
        return this;
    };
    /**
     * @inheritDoc
     */
    Scope.prototype.setSpan = function (span) {
        this._span = span;
        this._notifyScopeListeners();
        return this;
    };
    /**
     * @inheritDoc
     */
    Scope.prototype.getSpan = function () {
        return this._span;
    };
    /**
     * @inheritDoc
     */
    Scope.prototype.getTransaction = function () {
        var _a, _b, _c, _d;
        // often, this span will be a transaction, but it's not guaranteed to be
        var span = this.getSpan();
        // try it the new way first
        if ((_a = span) === null || _a === void 0 ? void 0 : _a.transaction) {
            return (_b = span) === null || _b === void 0 ? void 0 : _b.transaction;
        }
        // fallback to the old way (known bug: this only finds transactions with sampled = true)
        if ((_d = (_c = span) === null || _c === void 0 ? void 0 : _c.spanRecorder) === null || _d === void 0 ? void 0 : _d.spans[0]) {
            return span.spanRecorder.spans[0];
        }
        // neither way found a transaction
        return undefined;
    };
    /**
     * @inheritDoc
     */
    Scope.prototype.setSession = function (session) {
        if (!session) {
            delete this._session;
        }
        else {
            this._session = session;
        }
        this._notifyScopeListeners();
        return this;
    };
    /**
     * @inheritDoc
     */
    Scope.prototype.getSession = function () {
        return this._session;
    };
    /**
     * @inheritDoc
     */
    Scope.prototype.update = function (captureContext) {
        if (!captureContext) {
            return this;
        }
        if (typeof captureContext === 'function') {
            var updatedScope = captureContext(this);
            return updatedScope instanceof Scope ? updatedScope : this;
        }
        if (captureContext instanceof Scope) {
            this._tags = tslib_1.__assign(tslib_1.__assign({}, this._tags), captureContext._tags);
            this._extra = tslib_1.__assign(tslib_1.__assign({}, this._extra), captureContext._extra);
            this._contexts = tslib_1.__assign(tslib_1.__assign({}, this._contexts), captureContext._contexts);
            if (captureContext._user && Object.keys(captureContext._user).length) {
                this._user = captureContext._user;
            }
            if (captureContext._level) {
                this._level = captureContext._level;
            }
            if (captureContext._fingerprint) {
                this._fingerprint = captureContext._fingerprint;
            }
        }
        else if (utils_1.isPlainObject(captureContext)) {
            // eslint-disable-next-line no-param-reassign
            captureContext = captureContext;
            this._tags = tslib_1.__assign(tslib_1.__assign({}, this._tags), captureContext.tags);
            this._extra = tslib_1.__assign(tslib_1.__assign({}, this._extra), captureContext.extra);
            this._contexts = tslib_1.__assign(tslib_1.__assign({}, this._contexts), captureContext.contexts);
            if (captureContext.user) {
                this._user = captureContext.user;
            }
            if (captureContext.level) {
                this._level = captureContext.level;
            }
            if (captureContext.fingerprint) {
                this._fingerprint = captureContext.fingerprint;
            }
        }
        return this;
    };
    /**
     * @inheritDoc
     */
    Scope.prototype.clear = function () {
        this._breadcrumbs = [];
        this._tags = {};
        this._extra = {};
        this._user = {};
        this._contexts = {};
        this._level = undefined;
        this._transactionName = undefined;
        this._fingerprint = undefined;
        this._span = undefined;
        this._session = undefined;
        this._notifyScopeListeners();
        return this;
    };
    /**
     * @inheritDoc
     */
    Scope.prototype.addBreadcrumb = function (breadcrumb, maxBreadcrumbs) {
        var mergedBreadcrumb = tslib_1.__assign({ timestamp: utils_1.dateTimestampInSeconds() }, breadcrumb);
        this._breadcrumbs =
            maxBreadcrumbs !== undefined && maxBreadcrumbs >= 0
                ? tslib_1.__spread(this._breadcrumbs, [mergedBreadcrumb]).slice(-maxBreadcrumbs)
                : tslib_1.__spread(this._breadcrumbs, [mergedBreadcrumb]);
        this._notifyScopeListeners();
        return this;
    };
    /**
     * @inheritDoc
     */
    Scope.prototype.clearBreadcrumbs = function () {
        this._breadcrumbs = [];
        this._notifyScopeListeners();
        return this;
    };
    /**
     * Applies the current context and fingerprint to the event.
     * Note that breadcrumbs will be added by the client.
     * Also if the event has already breadcrumbs on it, we do not merge them.
     * @param event Event
     * @param hint May contain additional informartion about the original exception.
     * @hidden
     */
    Scope.prototype.applyToEvent = function (event, hint) {
        var _a;
        if (this._extra && Object.keys(this._extra).length) {
            event.extra = tslib_1.__assign(tslib_1.__assign({}, this._extra), event.extra);
        }
        if (this._tags && Object.keys(this._tags).length) {
            event.tags = tslib_1.__assign(tslib_1.__assign({}, this._tags), event.tags);
        }
        if (this._user && Object.keys(this._user).length) {
            event.user = tslib_1.__assign(tslib_1.__assign({}, this._user), event.user);
        }
        if (this._contexts && Object.keys(this._contexts).length) {
            event.contexts = tslib_1.__assign(tslib_1.__assign({}, this._contexts), event.contexts);
        }
        if (this._level) {
            event.level = this._level;
        }
        if (this._transactionName) {
            event.transaction = this._transactionName;
        }
        // We want to set the trace context for normal events only if there isn't already
        // a trace context on the event. There is a product feature in place where we link
        // errors with transaction and it relys on that.
        if (this._span) {
            event.contexts = tslib_1.__assign({ trace: this._span.getTraceContext() }, event.contexts);
            var transactionName = (_a = this._span.transaction) === null || _a === void 0 ? void 0 : _a.name;
            if (transactionName) {
                event.tags = tslib_1.__assign({ transaction: transactionName }, event.tags);
            }
        }
        this._applyFingerprint(event);
        event.breadcrumbs = tslib_1.__spread((event.breadcrumbs || []), this._breadcrumbs);
        event.breadcrumbs = event.breadcrumbs.length > 0 ? event.breadcrumbs : undefined;
        return this._notifyEventProcessors(tslib_1.__spread(getGlobalEventProcessors(), this._eventProcessors), event, hint);
    };
    /**
     * This will be called after {@link applyToEvent} is finished.
     */
    Scope.prototype._notifyEventProcessors = function (processors, event, hint, index) {
        var _this = this;
        if (index === void 0) { index = 0; }
        return new utils_1.SyncPromise(function (resolve, reject) {
            var processor = processors[index];
            if (event === null || typeof processor !== 'function') {
                resolve(event);
            }
            else {
                var result = processor(tslib_1.__assign({}, event), hint);
                if (utils_1.isThenable(result)) {
                    result
                        .then(function (final) { return _this._notifyEventProcessors(processors, final, hint, index + 1).then(resolve); })
                        .then(null, reject);
                }
                else {
                    _this._notifyEventProcessors(processors, result, hint, index + 1)
                        .then(resolve)
                        .then(null, reject);
                }
            }
        });
    };
    /**
     * This will be called on every set call.
     */
    Scope.prototype._notifyScopeListeners = function () {
        var _this = this;
        // We need this check for this._notifyingListeners to be able to work on scope during updates
        // If this check is not here we'll produce endless recursion when something is done with the scope
        // during the callback.
        if (!this._notifyingListeners) {
            this._notifyingListeners = true;
            this._scopeListeners.forEach(function (callback) {
                callback(_this);
            });
            this._notifyingListeners = false;
        }
    };
    /**
     * Applies fingerprint from the scope to the event if there's one,
     * uses message if there's one instead or get rid of empty fingerprint
     */
    Scope.prototype._applyFingerprint = function (event) {
        // Make sure it's an array first and we actually have something in place
        event.fingerprint = event.fingerprint
            ? Array.isArray(event.fingerprint)
                ? event.fingerprint
                : [event.fingerprint]
            : [];
        // If we have something on the scope, then merge it with event
        if (this._fingerprint) {
            event.fingerprint = event.fingerprint.concat(this._fingerprint);
        }
        // If we have no data at all, remove empty array default
        if (event.fingerprint && !event.fingerprint.length) {
            delete event.fingerprint;
        }
    };
    return Scope;
}());
exports.Scope = Scope;
/**
 * Retruns the global event processors.
 */
function getGlobalEventProcessors() {
    /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access  */
    var global = utils_1.getGlobalObject();
    global.__SENTRY__ = global.__SENTRY__ || {};
    global.__SENTRY__.globalEventProcessors = global.__SENTRY__.globalEventProcessors || [];
    return global.__SENTRY__.globalEventProcessors;
    /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
}
/**
 * Add a EventProcessor to be kept globally.
 * @param callback EventProcessor to add
 */
function addGlobalEventProcessor(callback) {
    getGlobalEventProcessors().push(callback);
}
exports.addGlobalEventProcessor = addGlobalEventProcessor;
//# sourceMappingURL=scope.js.map

/***/ }),

/***/ 2474:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var types_1 = __nccwpck_require__(3789);
var utils_1 = __nccwpck_require__(1620);
/**
 * @inheritdoc
 */
var Session = /** @class */ (function () {
    function Session(context) {
        this.errors = 0;
        this.sid = utils_1.uuid4();
        this.timestamp = Date.now();
        this.started = Date.now();
        this.duration = 0;
        this.status = types_1.SessionStatus.Ok;
        this.init = true;
        if (context) {
            this.update(context);
        }
    }
    /** JSDoc */
    // eslint-disable-next-line complexity
    Session.prototype.update = function (context) {
        if (context === void 0) { context = {}; }
        if (context.user) {
            if (context.user.ip_address) {
                this.ipAddress = context.user.ip_address;
            }
            if (!context.did) {
                this.did = context.user.id || context.user.email || context.user.username;
            }
        }
        this.timestamp = context.timestamp || Date.now();
        if (context.sid) {
            // Good enough uuid validation. — Kamil
            this.sid = context.sid.length === 32 ? context.sid : utils_1.uuid4();
        }
        if (context.init !== undefined) {
            this.init = context.init;
        }
        if (context.did) {
            this.did = "" + context.did;
        }
        if (typeof context.started === 'number') {
            this.started = context.started;
        }
        if (typeof context.duration === 'number') {
            this.duration = context.duration;
        }
        else {
            this.duration = this.timestamp - this.started;
        }
        if (context.release) {
            this.release = context.release;
        }
        if (context.environment) {
            this.environment = context.environment;
        }
        if (context.ipAddress) {
            this.ipAddress = context.ipAddress;
        }
        if (context.userAgent) {
            this.userAgent = context.userAgent;
        }
        if (typeof context.errors === 'number') {
            this.errors = context.errors;
        }
        if (context.status) {
            this.status = context.status;
        }
    };
    /** JSDoc */
    Session.prototype.close = function (status) {
        if (status) {
            this.update({ status: status });
        }
        else if (this.status === types_1.SessionStatus.Ok) {
            this.update({ status: types_1.SessionStatus.Exited });
        }
        else {
            this.update();
        }
    };
    /** JSDoc */
    Session.prototype.toJSON = function () {
        return utils_1.dropUndefinedKeys({
            sid: "" + this.sid,
            init: this.init,
            started: new Date(this.started).toISOString(),
            timestamp: new Date(this.timestamp).toISOString(),
            status: this.status,
            errors: this.errors,
            did: typeof this.did === 'number' || typeof this.did === 'string' ? "" + this.did : undefined,
            duration: this.duration,
            attrs: utils_1.dropUndefinedKeys({
                release: this.release,
                environment: this.environment,
                ip_address: this.ipAddress,
                user_agent: this.userAgent,
            }),
        });
    };
    return Session;
}());
exports.Session = Session;
//# sourceMappingURL=session.js.map

/***/ }),

/***/ 8455:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var hub_1 = __nccwpck_require__(6393);
/**
 * This calls a function on the current hub.
 * @param method function to call on hub.
 * @param args to pass to function.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function callOnHub(method) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    var hub = hub_1.getCurrentHub();
    if (hub && hub[method]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return hub[method].apply(hub, tslib_1.__spread(args));
    }
    throw new Error("No hub defined or " + method + " was not found on the hub, please open a bug report.");
}
/**
 * Captures an exception event and sends it to Sentry.
 *
 * @param exception An exception-like object.
 * @returns The generated eventId.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
function captureException(exception, captureContext) {
    var syntheticException;
    try {
        throw new Error('Sentry syntheticException');
    }
    catch (exception) {
        syntheticException = exception;
    }
    return callOnHub('captureException', exception, {
        captureContext: captureContext,
        originalException: exception,
        syntheticException: syntheticException,
    });
}
exports.captureException = captureException;
/**
 * Captures a message event and sends it to Sentry.
 *
 * @param message The message to send to Sentry.
 * @param level Define the level of the message.
 * @returns The generated eventId.
 */
function captureMessage(message, captureContext) {
    var syntheticException;
    try {
        throw new Error(message);
    }
    catch (exception) {
        syntheticException = exception;
    }
    // This is necessary to provide explicit scopes upgrade, without changing the original
    // arity of the `captureMessage(message, level)` method.
    var level = typeof captureContext === 'string' ? captureContext : undefined;
    var context = typeof captureContext !== 'string' ? { captureContext: captureContext } : undefined;
    return callOnHub('captureMessage', message, level, tslib_1.__assign({ originalException: message, syntheticException: syntheticException }, context));
}
exports.captureMessage = captureMessage;
/**
 * Captures a manually created event and sends it to Sentry.
 *
 * @param event The event to send to Sentry.
 * @returns The generated eventId.
 */
function captureEvent(event) {
    return callOnHub('captureEvent', event);
}
exports.captureEvent = captureEvent;
/**
 * Callback to set context information onto the scope.
 * @param callback Callback function that receives Scope.
 */
function configureScope(callback) {
    callOnHub('configureScope', callback);
}
exports.configureScope = configureScope;
/**
 * Records a new breadcrumb which will be attached to future events.
 *
 * Breadcrumbs will be added to subsequent events to provide more context on
 * user's actions prior to an error or crash.
 *
 * @param breadcrumb The breadcrumb to record.
 */
function addBreadcrumb(breadcrumb) {
    callOnHub('addBreadcrumb', breadcrumb);
}
exports.addBreadcrumb = addBreadcrumb;
/**
 * Sets context data with the given name.
 * @param name of the context
 * @param context Any kind of data. This data will be normalized.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setContext(name, context) {
    callOnHub('setContext', name, context);
}
exports.setContext = setContext;
/**
 * Set an object that will be merged sent as extra data with the event.
 * @param extras Extras object to merge into current context.
 */
function setExtras(extras) {
    callOnHub('setExtras', extras);
}
exports.setExtras = setExtras;
/**
 * Set an object that will be merged sent as tags data with the event.
 * @param tags Tags context object to merge into current context.
 */
function setTags(tags) {
    callOnHub('setTags', tags);
}
exports.setTags = setTags;
/**
 * Set key:value that will be sent as extra data with the event.
 * @param key String of extra
 * @param extra Any kind of data. This data will be normalized.
 */
function setExtra(key, extra) {
    callOnHub('setExtra', key, extra);
}
exports.setExtra = setExtra;
/**
 * Set key:value that will be sent as tags data with the event.
 *
 * Can also be used to unset a tag, by passing `undefined`.
 *
 * @param key String key of tag
 * @param value Value of tag
 */
function setTag(key, value) {
    callOnHub('setTag', key, value);
}
exports.setTag = setTag;
/**
 * Updates user context information for future events.
 *
 * @param user User context object to be set in the current context. Pass `null` to unset the user.
 */
function setUser(user) {
    callOnHub('setUser', user);
}
exports.setUser = setUser;
/**
 * Creates a new scope with and executes the given operation within.
 * The scope is automatically removed once the operation
 * finishes or throws.
 *
 * This is essentially a convenience function for:
 *
 *     pushScope();
 *     callback();
 *     popScope();
 *
 * @param callback that will be enclosed into push/popScope.
 */
function withScope(callback) {
    callOnHub('withScope', callback);
}
exports.withScope = withScope;
/**
 * Calls a function on the latest client. Use this with caution, it's meant as
 * in "internal" helper so we don't need to expose every possible function in
 * the shim. It is not guaranteed that the client actually implements the
 * function.
 *
 * @param method The method to call on the client/client.
 * @param args Arguments to pass to the client/fontend.
 * @hidden
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _callOnClient(method) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    callOnHub.apply(void 0, tslib_1.__spread(['_invokeClient', method], args));
}
exports._callOnClient = _callOnClient;
/**
 * Starts a new `Transaction` and returns it. This is the entry point to manual tracing instrumentation.
 *
 * A tree structure can be built by adding child spans to the transaction, and child spans to other spans. To start a
 * new child span within the transaction or any span, call the respective `.startChild()` method.
 *
 * Every child span must be finished before the transaction is finished, otherwise the unfinished spans are discarded.
 *
 * The transaction must be finished with a call to its `.finish()` method, at which point the transaction with all its
 * finished child spans will be sent to Sentry.
 *
 * @param context Properties of the new `Transaction`.
 * @param customSamplingContext Information given to the transaction sampling function (along with context-dependent
 * default values). See {@link Options.tracesSampler}.
 *
 * @returns The transaction which was just started
 */
function startTransaction(context, customSamplingContext) {
    return callOnHub('startTransaction', tslib_1.__assign({}, context), customSamplingContext);
}
exports.startTransaction = startTransaction;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 508:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var core_1 = __nccwpck_require__(9212);
var types_1 = __nccwpck_require__(3789);
var utils_1 = __nccwpck_require__(1620);
var parsers_1 = __nccwpck_require__(9090);
var transports_1 = __nccwpck_require__(1437);
/**
 * The Sentry Node SDK Backend.
 * @hidden
 */
var NodeBackend = /** @class */ (function (_super) {
    tslib_1.__extends(NodeBackend, _super);
    function NodeBackend() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @inheritDoc
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    NodeBackend.prototype.eventFromException = function (exception, hint) {
        var _this = this;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        var ex = exception;
        var mechanism = {
            handled: true,
            type: 'generic',
        };
        if (!utils_1.isError(exception)) {
            if (utils_1.isPlainObject(exception)) {
                // This will allow us to group events based on top-level keys
                // which is much better than creating new group when any key/value change
                var message = "Non-Error exception captured with keys: " + utils_1.extractExceptionKeysForMessage(exception);
                core_1.getCurrentHub().configureScope(function (scope) {
                    scope.setExtra('__serialized__', utils_1.normalizeToSize(exception));
                });
                ex = (hint && hint.syntheticException) || new Error(message);
                ex.message = message;
            }
            else {
                // This handles when someone does: `throw "something awesome";`
                // We use synthesized Error here so we can extract a (rough) stack trace.
                ex = (hint && hint.syntheticException) || new Error(exception);
                ex.message = exception;
            }
            mechanism.synthetic = true;
        }
        return new utils_1.SyncPromise(function (resolve, reject) {
            return parsers_1.parseError(ex, _this._options)
                .then(function (event) {
                utils_1.addExceptionTypeValue(event, undefined, undefined);
                utils_1.addExceptionMechanism(event, mechanism);
                resolve(tslib_1.__assign(tslib_1.__assign({}, event), { event_id: hint && hint.event_id }));
            })
                .then(null, reject);
        });
    };
    /**
     * @inheritDoc
     */
    NodeBackend.prototype.eventFromMessage = function (message, level, hint) {
        var _this = this;
        if (level === void 0) { level = types_1.Severity.Info; }
        var event = {
            event_id: hint && hint.event_id,
            level: level,
            message: message,
        };
        return new utils_1.SyncPromise(function (resolve) {
            if (_this._options.attachStacktrace && hint && hint.syntheticException) {
                var stack = hint.syntheticException ? parsers_1.extractStackFromError(hint.syntheticException) : [];
                parsers_1.parseStack(stack, _this._options)
                    .then(function (frames) {
                    event.stacktrace = {
                        frames: parsers_1.prepareFramesForEvent(frames),
                    };
                    resolve(event);
                })
                    .then(null, function () {
                    resolve(event);
                });
            }
            else {
                resolve(event);
            }
        });
    };
    /**
     * @inheritDoc
     */
    NodeBackend.prototype._setupTransport = function () {
        if (!this._options.dsn) {
            // We return the noop transport here in case there is no Dsn.
            return _super.prototype._setupTransport.call(this);
        }
        var dsn = new utils_1.Dsn(this._options.dsn);
        var transportOptions = tslib_1.__assign(tslib_1.__assign(tslib_1.__assign(tslib_1.__assign(tslib_1.__assign({}, this._options.transportOptions), (this._options.httpProxy && { httpProxy: this._options.httpProxy })), (this._options.httpsProxy && { httpsProxy: this._options.httpsProxy })), (this._options.caCerts && { caCerts: this._options.caCerts })), { dsn: this._options.dsn, _metadata: this._options._metadata });
        if (this._options.transport) {
            return new this._options.transport(transportOptions);
        }
        if (dsn.protocol === 'http') {
            return new transports_1.HTTPTransport(transportOptions);
        }
        return new transports_1.HTTPSTransport(transportOptions);
    };
    return NodeBackend;
}(core_1.BaseBackend));
exports.NodeBackend = NodeBackend;
//# sourceMappingURL=backend.js.map

/***/ }),

/***/ 6147:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var core_1 = __nccwpck_require__(9212);
var backend_1 = __nccwpck_require__(508);
/**
 * The Sentry Node SDK Client.
 *
 * @see NodeOptions for documentation on configuration options.
 * @see SentryClient for usage documentation.
 */
var NodeClient = /** @class */ (function (_super) {
    tslib_1.__extends(NodeClient, _super);
    /**
     * Creates a new Node SDK instance.
     * @param options Configuration options for this SDK.
     */
    function NodeClient(options) {
        var _this = this;
        options._metadata = options._metadata || {};
        options._metadata.sdk = options._metadata.sdk || {
            name: 'sentry.javascript.node',
            packages: [
                {
                    name: 'npm:@sentry/node',
                    version: core_1.SDK_VERSION,
                },
            ],
            version: core_1.SDK_VERSION,
        };
        _this = _super.call(this, backend_1.NodeBackend, options) || this;
        return _this;
    }
    /**
     * @inheritDoc
     */
    NodeClient.prototype._prepareEvent = function (event, scope, hint) {
        event.platform = event.platform || 'node';
        if (this.getOptions().serverName) {
            event.server_name = this.getOptions().serverName;
        }
        return _super.prototype._prepareEvent.call(this, event, scope, hint);
    };
    return NodeClient;
}(core_1.BaseClient));
exports.NodeClient = NodeClient;
//# sourceMappingURL=client.js.map

/***/ }),

/***/ 5400:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
var core_1 = __nccwpck_require__(9212);
var tracing_1 = __nccwpck_require__(4358);
var utils_1 = __nccwpck_require__(1620);
var cookie = __nccwpck_require__(3658);
var domain = __nccwpck_require__(5229);
var os = __nccwpck_require__(2087);
var url = __nccwpck_require__(8835);
var sdk_1 = __nccwpck_require__(8836);
/**
 * Express-compatible tracing handler.
 * @see Exposed as `Handlers.tracingHandler`
 */
function tracingHandler() {
    return function sentryTracingMiddleware(req, res, next) {
        // If there is a trace header set, we extract the data from it (parentSpanId, traceId, and sampling decision)
        var traceparentData;
        if (req.headers && utils_1.isString(req.headers['sentry-trace'])) {
            traceparentData = tracing_1.extractTraceparentData(req.headers['sentry-trace']);
        }
        var transaction = core_1.startTransaction(tslib_1.__assign({ name: extractExpressTransactionName(req, { path: true, method: true }), op: 'http.server' }, traceparentData), { request: extractRequestData(req) });
        // We put the transaction on the scope so users can attach children to it
        core_1.getCurrentHub().configureScope(function (scope) {
            scope.setSpan(transaction);
        });
        // We also set __sentry_transaction on the response so people can grab the transaction there to add
        // spans to it later.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        res.__sentry_transaction = transaction;
        res.once('finish', function () {
            // Push `transaction.finish` to the next event loop so open spans have a chance to finish before the transaction
            // closes
            setImmediate(function () {
                addExpressReqToTransaction(transaction, req);
                transaction.setHttpStatus(res.statusCode);
                transaction.finish();
            });
        });
        next();
    };
}
exports.tracingHandler = tracingHandler;
/**
 * Set parameterized as transaction name e.g.: `GET /users/:id`
 * Also adds more context data on the transaction from the request
 */
function addExpressReqToTransaction(transaction, req) {
    if (!transaction)
        return;
    transaction.name = extractExpressTransactionName(req, { path: true, method: true });
    transaction.setData('url', req.originalUrl);
    transaction.setData('baseUrl', req.baseUrl);
    transaction.setData('query', req.query);
}
/**
 * Extracts complete generalized path from the request object and uses it to construct transaction name.
 *
 * eg. GET /mountpoint/user/:id
 *
 * @param req The ExpressRequest object
 * @param options What to include in the transaction name (method, path, or both)
 *
 * @returns The fully constructed transaction name
 */
function extractExpressTransactionName(req, options) {
    if (options === void 0) { options = {}; }
    var _a;
    var method = (_a = req.method) === null || _a === void 0 ? void 0 : _a.toUpperCase();
    var path = '';
    if (req.route) {
        path = "" + (req.baseUrl || '') + req.route.path;
    }
    else if (req.originalUrl || req.url) {
        path = utils_1.stripUrlQueryAndFragment(req.originalUrl || req.url || '');
    }
    var info = '';
    if (options.method && method) {
        info += method;
    }
    if (options.method && options.path) {
        info += " ";
    }
    if (options.path && path) {
        info += path;
    }
    return info;
}
/** JSDoc */
function extractTransaction(req, type) {
    var _a;
    switch (type) {
        case 'path': {
            return extractExpressTransactionName(req, { path: true });
        }
        case 'handler': {
            return ((_a = req.route) === null || _a === void 0 ? void 0 : _a.stack[0].name) || '<anonymous>';
        }
        case 'methodPath':
        default: {
            return extractExpressTransactionName(req, { path: true, method: true });
        }
    }
}
/** Default user keys that'll be used to extract data from the request */
var DEFAULT_USER_KEYS = ['id', 'username', 'email'];
/** JSDoc */
function extractUserData(user, keys) {
    var extractedUser = {};
    var attributes = Array.isArray(keys) ? keys : DEFAULT_USER_KEYS;
    attributes.forEach(function (key) {
        if (user && key in user) {
            extractedUser[key] = user[key];
        }
    });
    return extractedUser;
}
/** Default request keys that'll be used to extract data from the request */
var DEFAULT_REQUEST_KEYS = ['cookies', 'data', 'headers', 'method', 'query_string', 'url'];
/**
 * Normalizes data from the request object, accounting for framework differences.
 *
 * @param req The request object from which to extract data
 * @param keys An optional array of keys to include in the normalized data. Defaults to DEFAULT_REQUEST_KEYS if not
 * provided.
 * @returns An object containing normalized request data
 */
function extractRequestData(req, keys) {
    if (keys === void 0) { keys = DEFAULT_REQUEST_KEYS; }
    var requestData = {};
    // headers:
    //   node, express: req.headers
    //   koa: req.header
    var headers = (req.headers || req.header || {});
    // method:
    //   node, express, koa: req.method
    var method = req.method;
    // host:
    //   express: req.hostname in > 4 and req.host in < 4
    //   koa: req.host
    //   node: req.headers.host
    var host = req.hostname || req.host || headers.host || '<no host>';
    // protocol:
    //   node: <n/a>
    //   express, koa: req.protocol
    var protocol = req.protocol === 'https' || req.secure || (req.socket || {}).encrypted
        ? 'https'
        : 'http';
    // url (including path and query string):
    //   node, express: req.originalUrl
    //   koa: req.url
    var originalUrl = (req.originalUrl || req.url || '');
    // absolute url
    var absoluteUrl = protocol + "://" + host + originalUrl;
    keys.forEach(function (key) {
        switch (key) {
            case 'headers':
                requestData.headers = headers;
                break;
            case 'method':
                requestData.method = method;
                break;
            case 'url':
                requestData.url = absoluteUrl;
                break;
            case 'cookies':
                // cookies:
                //   node, express, koa: req.headers.cookie
                //   vercel, sails.js, express (w/ cookie middleware): req.cookies
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                requestData.cookies = req.cookies || cookie.parse(headers.cookie || '');
                break;
            case 'query_string':
                // query string:
                //   node: req.url (raw)
                //   express, koa: req.query
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                requestData.query_string = url.parse(originalUrl || '', false).query;
                break;
            case 'data':
                if (method === 'GET' || method === 'HEAD') {
                    break;
                }
                // body data:
                //   node, express, koa: req.body
                if (req.body !== undefined) {
                    requestData.data = utils_1.isString(req.body) ? req.body : JSON.stringify(utils_1.normalize(req.body));
                }
                break;
            default:
                if ({}.hasOwnProperty.call(req, key)) {
                    requestData[key] = req[key];
                }
        }
    });
    return requestData;
}
exports.extractRequestData = extractRequestData;
/**
 * Enriches passed event with request data.
 *
 * @param event Will be mutated and enriched with req data
 * @param req Request object
 * @param options object containing flags to enable functionality
 * @hidden
 */
function parseRequest(event, req, options) {
    // eslint-disable-next-line no-param-reassign
    options = tslib_1.__assign({ ip: false, request: true, serverName: true, transaction: true, user: true, version: true }, options);
    if (options.version) {
        event.contexts = tslib_1.__assign(tslib_1.__assign({}, event.contexts), { runtime: {
                name: 'node',
                version: global.process.version,
            } });
    }
    if (options.request) {
        // if the option value is `true`, use the default set of keys by not passing anything to `extractRequestData()`
        var extractedRequestData = Array.isArray(options.request)
            ? extractRequestData(req, options.request)
            : extractRequestData(req);
        event.request = tslib_1.__assign(tslib_1.__assign({}, event.request), extractedRequestData);
    }
    if (options.serverName && !event.server_name) {
        event.server_name = global.process.env.SENTRY_NAME || os.hostname();
    }
    if (options.user) {
        var extractedUser = req.user && utils_1.isPlainObject(req.user) ? extractUserData(req.user, options.user) : {};
        if (Object.keys(extractedUser)) {
            event.user = tslib_1.__assign(tslib_1.__assign({}, event.user), extractedUser);
        }
    }
    // client ip:
    //   node: req.connection.remoteAddress
    //   express, koa: req.ip
    if (options.ip) {
        var ip = req.ip || (req.connection && req.connection.remoteAddress);
        if (ip) {
            event.user = tslib_1.__assign(tslib_1.__assign({}, event.user), { ip_address: ip });
        }
    }
    if (options.transaction && !event.transaction) {
        event.transaction = extractTransaction(req, options.transaction);
    }
    return event;
}
exports.parseRequest = parseRequest;
/**
 * Express compatible request handler.
 * @see Exposed as `Handlers.requestHandler`
 */
function requestHandler(options) {
    return function sentryRequestMiddleware(req, res, next) {
        if (options && options.flushTimeout && options.flushTimeout > 0) {
            // eslint-disable-next-line @typescript-eslint/unbound-method
            var _end_1 = res.end;
            res.end = function (chunk, encoding, cb) {
                var _this = this;
                sdk_1.flush(options.flushTimeout)
                    .then(function () {
                    _end_1.call(_this, chunk, encoding, cb);
                })
                    .then(null, function (e) {
                    utils_1.logger.error(e);
                });
            };
        }
        var local = domain.create();
        local.add(req);
        local.add(res);
        local.on('error', next);
        local.run(function () {
            core_1.getCurrentHub().configureScope(function (scope) {
                return scope.addEventProcessor(function (event) { return parseRequest(event, req, options); });
            });
            next();
        });
    };
}
exports.requestHandler = requestHandler;
/** JSDoc */
function getStatusCodeFromResponse(error) {
    var statusCode = error.status || error.statusCode || error.status_code || (error.output && error.output.statusCode);
    return statusCode ? parseInt(statusCode, 10) : 500;
}
/** Returns true if response code is internal server error */
function defaultShouldHandleError(error) {
    var status = getStatusCodeFromResponse(error);
    return status >= 500;
}
/**
 * Express compatible error handler.
 * @see Exposed as `Handlers.errorHandler`
 */
function errorHandler(options) {
    return function sentryErrorMiddleware(error, _req, res, next) {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        var shouldHandleError = (options && options.shouldHandleError) || defaultShouldHandleError;
        if (shouldHandleError(error)) {
            core_1.withScope(function (_scope) {
                // For some reason we need to set the transaction on the scope again
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                var transaction = res.__sentry_transaction;
                if (transaction && _scope.getSpan() === undefined) {
                    _scope.setSpan(transaction);
                }
                var eventId = core_1.captureException(error);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                res.sentry = eventId;
                next(error);
            });
            return;
        }
        next(error);
    };
}
exports.errorHandler = errorHandler;
//# sourceMappingURL=handlers.js.map

/***/ }),

/***/ 2783:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var types_1 = __nccwpck_require__(3789);
exports.Severity = types_1.Severity;
exports.Status = types_1.Status;
var core_1 = __nccwpck_require__(9212);
exports.addGlobalEventProcessor = core_1.addGlobalEventProcessor;
exports.addBreadcrumb = core_1.addBreadcrumb;
exports.captureException = core_1.captureException;
exports.captureEvent = core_1.captureEvent;
exports.captureMessage = core_1.captureMessage;
exports.configureScope = core_1.configureScope;
exports.getHubFromCarrier = core_1.getHubFromCarrier;
exports.getCurrentHub = core_1.getCurrentHub;
exports.Hub = core_1.Hub;
exports.makeMain = core_1.makeMain;
exports.Scope = core_1.Scope;
exports.startTransaction = core_1.startTransaction;
exports.SDK_VERSION = core_1.SDK_VERSION;
exports.setContext = core_1.setContext;
exports.setExtra = core_1.setExtra;
exports.setExtras = core_1.setExtras;
exports.setTag = core_1.setTag;
exports.setTags = core_1.setTags;
exports.setUser = core_1.setUser;
exports.withScope = core_1.withScope;
var backend_1 = __nccwpck_require__(508);
exports.NodeBackend = backend_1.NodeBackend;
var client_1 = __nccwpck_require__(6147);
exports.NodeClient = client_1.NodeClient;
var sdk_1 = __nccwpck_require__(8836);
exports.defaultIntegrations = sdk_1.defaultIntegrations;
exports.init = sdk_1.init;
exports.lastEventId = sdk_1.lastEventId;
exports.flush = sdk_1.flush;
exports.close = sdk_1.close;
var version_1 = __nccwpck_require__(1271);
exports.SDK_NAME = version_1.SDK_NAME;
var core_2 = __nccwpck_require__(9212);
var hub_1 = __nccwpck_require__(6393);
var domain = __nccwpck_require__(5229);
var Handlers = __nccwpck_require__(5400);
exports.Handlers = Handlers;
var NodeIntegrations = __nccwpck_require__(2310);
var Transports = __nccwpck_require__(1437);
exports.Transports = Transports;
var INTEGRATIONS = tslib_1.__assign(tslib_1.__assign({}, core_2.Integrations), NodeIntegrations);
exports.Integrations = INTEGRATIONS;
// We need to patch domain on the global __SENTRY__ object to make it work for node in cross-platform packages like
// @sentry/hub. If we don't do this, browser bundlers will have troubles resolving `require('domain')`.
var carrier = hub_1.getMainCarrier();
if (carrier.__SENTRY__) {
    carrier.__SENTRY__.extensions = carrier.__SENTRY__.extensions || {};
    carrier.__SENTRY__.extensions.domain = carrier.__SENTRY__.extensions.domain || domain;
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 9552:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var core_1 = __nccwpck_require__(9212);
var types_1 = __nccwpck_require__(3789);
var utils_1 = __nccwpck_require__(1620);
var util = __nccwpck_require__(1669);
/** Console module integration */
var Console = /** @class */ (function () {
    function Console() {
        /**
         * @inheritDoc
         */
        this.name = Console.id;
    }
    /**
     * @inheritDoc
     */
    Console.prototype.setupOnce = function () {
        var e_1, _a;
        var consoleModule = __nccwpck_require__(7082);
        try {
            for (var _b = tslib_1.__values(['debug', 'info', 'warn', 'error', 'log']), _c = _b.next(); !_c.done; _c = _b.next()) {
                var level = _c.value;
                utils_1.fill(consoleModule, level, createConsoleWrapper(level));
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    /**
     * @inheritDoc
     */
    Console.id = 'Console';
    return Console;
}());
exports.Console = Console;
/**
 * Wrapper function that'll be used for every console level
 */
function createConsoleWrapper(level) {
    return function consoleWrapper(originalConsoleMethod) {
        var sentryLevel;
        switch (level) {
            case 'debug':
                sentryLevel = types_1.Severity.Debug;
                break;
            case 'error':
                sentryLevel = types_1.Severity.Error;
                break;
            case 'info':
                sentryLevel = types_1.Severity.Info;
                break;
            case 'warn':
                sentryLevel = types_1.Severity.Warning;
                break;
            default:
                sentryLevel = types_1.Severity.Log;
        }
        return function () {
            if (core_1.getCurrentHub().getIntegration(Console)) {
                core_1.getCurrentHub().addBreadcrumb({
                    category: 'console',
                    level: sentryLevel,
                    message: util.format.apply(undefined, arguments),
                }, {
                    input: tslib_1.__spread(arguments),
                    level: level,
                });
            }
            originalConsoleMethod.apply(this, arguments);
        };
    };
}
//# sourceMappingURL=console.js.map

/***/ }),

/***/ 6280:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var core_1 = __nccwpck_require__(9212);
var utils_1 = __nccwpck_require__(1620);
var http_1 = __nccwpck_require__(4103);
var NODE_VERSION = utils_1.parseSemver(process.versions.node);
/** http module integration */
var Http = /** @class */ (function () {
    /**
     * @inheritDoc
     */
    function Http(options) {
        if (options === void 0) { options = {}; }
        /**
         * @inheritDoc
         */
        this.name = Http.id;
        this._breadcrumbs = typeof options.breadcrumbs === 'undefined' ? true : options.breadcrumbs;
        this._tracing = typeof options.tracing === 'undefined' ? false : options.tracing;
    }
    /**
     * @inheritDoc
     */
    Http.prototype.setupOnce = function () {
        // No need to instrument if we don't want to track anything
        if (!this._breadcrumbs && !this._tracing) {
            return;
        }
        var wrappedHandlerMaker = _createWrappedRequestMethodFactory(this._breadcrumbs, this._tracing);
        var httpModule = __nccwpck_require__(8605);
        utils_1.fill(httpModule, 'get', wrappedHandlerMaker);
        utils_1.fill(httpModule, 'request', wrappedHandlerMaker);
        // NOTE: Prior to Node 9, `https` used internals of `http` module, thus we don't patch it.
        // If we do, we'd get double breadcrumbs and double spans for `https` calls.
        // It has been changed in Node 9, so for all versions equal and above, we patch `https` separately.
        if (NODE_VERSION.major && NODE_VERSION.major > 8) {
            var httpsModule = __nccwpck_require__(7211);
            utils_1.fill(httpsModule, 'get', wrappedHandlerMaker);
            utils_1.fill(httpsModule, 'request', wrappedHandlerMaker);
        }
    };
    /**
     * @inheritDoc
     */
    Http.id = 'Http';
    return Http;
}());
exports.Http = Http;
/**
 * Function which creates a function which creates wrapped versions of internal `request` and `get` calls within `http`
 * and `https` modules. (NB: Not a typo - this is a creator^2!)
 *
 * @param breadcrumbsEnabled Whether or not to record outgoing requests as breadcrumbs
 * @param tracingEnabled Whether or not to record outgoing requests as tracing spans
 *
 * @returns A function which accepts the exiting handler and returns a wrapped handler
 */
function _createWrappedRequestMethodFactory(breadcrumbsEnabled, tracingEnabled) {
    return function wrappedRequestMethodFactory(originalRequestMethod) {
        return function wrappedMethod() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            var httpModule = this;
            var requestArgs = http_1.normalizeRequestArgs(args);
            var requestOptions = requestArgs[0];
            var requestUrl = http_1.extractUrl(requestOptions);
            // we don't want to record requests to Sentry as either breadcrumbs or spans, so just use the original method
            if (http_1.isSentryRequest(requestUrl)) {
                return originalRequestMethod.apply(httpModule, requestArgs);
            }
            var span;
            var parentSpan;
            var scope = core_1.getCurrentHub().getScope();
            if (scope && tracingEnabled) {
                parentSpan = scope.getSpan();
                if (parentSpan) {
                    span = parentSpan.startChild({
                        description: (requestOptions.method || 'GET') + " " + requestUrl,
                        op: 'request',
                    });
                    var sentryTraceHeader = span.toTraceparent();
                    utils_1.logger.log("[Tracing] Adding sentry-trace header to outgoing request: " + sentryTraceHeader);
                    requestOptions.headers = tslib_1.__assign(tslib_1.__assign({}, requestOptions.headers), { 'sentry-trace': sentryTraceHeader });
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            return originalRequestMethod
                .apply(httpModule, requestArgs)
                .once('response', function (res) {
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                var req = this;
                if (breadcrumbsEnabled) {
                    addRequestBreadcrumb('response', requestUrl, req, res);
                }
                if (tracingEnabled && span) {
                    if (res.statusCode) {
                        span.setHttpStatus(res.statusCode);
                    }
                    span.description = http_1.cleanSpanDescription(span.description, requestOptions, req);
                    span.finish();
                }
            })
                .once('error', function () {
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                var req = this;
                if (breadcrumbsEnabled) {
                    addRequestBreadcrumb('error', requestUrl, req);
                }
                if (tracingEnabled && span) {
                    span.setHttpStatus(500);
                    span.description = http_1.cleanSpanDescription(span.description, requestOptions, req);
                    span.finish();
                }
            });
        };
    };
}
/**
 * Captures Breadcrumb based on provided request/response pair
 */
function addRequestBreadcrumb(event, url, req, res) {
    if (!core_1.getCurrentHub().getIntegration(Http)) {
        return;
    }
    core_1.getCurrentHub().addBreadcrumb({
        category: 'http',
        data: {
            method: req.method,
            status_code: res && res.statusCode,
            url: url,
        },
        type: 'http',
    }, {
        event: event,
        request: req,
        response: res,
    });
}
//# sourceMappingURL=http.js.map

/***/ }),

/***/ 2310:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var console_1 = __nccwpck_require__(9552);
exports.Console = console_1.Console;
var http_1 = __nccwpck_require__(6280);
exports.Http = http_1.Http;
var onuncaughtexception_1 = __nccwpck_require__(443);
exports.OnUncaughtException = onuncaughtexception_1.OnUncaughtException;
var onunhandledrejection_1 = __nccwpck_require__(7344);
exports.OnUnhandledRejection = onunhandledrejection_1.OnUnhandledRejection;
var linkederrors_1 = __nccwpck_require__(208);
exports.LinkedErrors = linkederrors_1.LinkedErrors;
var modules_1 = __nccwpck_require__(46);
exports.Modules = modules_1.Modules;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 208:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var core_1 = __nccwpck_require__(9212);
var utils_1 = __nccwpck_require__(1620);
var parsers_1 = __nccwpck_require__(9090);
var DEFAULT_KEY = 'cause';
var DEFAULT_LIMIT = 5;
/** Adds SDK info to an event. */
var LinkedErrors = /** @class */ (function () {
    /**
     * @inheritDoc
     */
    function LinkedErrors(options) {
        if (options === void 0) { options = {}; }
        /**
         * @inheritDoc
         */
        this.name = LinkedErrors.id;
        this._key = options.key || DEFAULT_KEY;
        this._limit = options.limit || DEFAULT_LIMIT;
    }
    /**
     * @inheritDoc
     */
    LinkedErrors.prototype.setupOnce = function () {
        core_1.addGlobalEventProcessor(function (event, hint) {
            var self = core_1.getCurrentHub().getIntegration(LinkedErrors);
            if (self) {
                var handler = self._handler && self._handler.bind(self);
                return typeof handler === 'function' ? handler(event, hint) : event;
            }
            return event;
        });
    };
    /**
     * @inheritDoc
     */
    LinkedErrors.prototype._handler = function (event, hint) {
        var _this = this;
        if (!event.exception || !event.exception.values || !hint || !utils_1.isInstanceOf(hint.originalException, Error)) {
            return utils_1.SyncPromise.resolve(event);
        }
        return new utils_1.SyncPromise(function (resolve) {
            _this._walkErrorTree(hint.originalException, _this._key)
                .then(function (linkedErrors) {
                if (event && event.exception && event.exception.values) {
                    event.exception.values = tslib_1.__spread(linkedErrors, event.exception.values);
                }
                resolve(event);
            })
                .then(null, function () {
                resolve(event);
            });
        });
    };
    /**
     * @inheritDoc
     */
    LinkedErrors.prototype._walkErrorTree = function (error, key, stack) {
        var _this = this;
        if (stack === void 0) { stack = []; }
        if (!utils_1.isInstanceOf(error[key], Error) || stack.length + 1 >= this._limit) {
            return utils_1.SyncPromise.resolve(stack);
        }
        return new utils_1.SyncPromise(function (resolve, reject) {
            parsers_1.getExceptionFromError(error[key])
                .then(function (exception) {
                _this._walkErrorTree(error[key], key, tslib_1.__spread([exception], stack))
                    .then(resolve)
                    .then(null, function () {
                    reject();
                });
            })
                .then(null, function () {
                reject();
            });
        });
    };
    /**
     * @inheritDoc
     */
    LinkedErrors.id = 'LinkedErrors';
    return LinkedErrors;
}());
exports.LinkedErrors = LinkedErrors;
//# sourceMappingURL=linkederrors.js.map

/***/ }),

/***/ 46:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var fs_1 = __nccwpck_require__(5747);
var path_1 = __nccwpck_require__(5622);
var moduleCache;
/** Extract information about paths */
function getPaths() {
    try {
        return require.cache ? Object.keys(require.cache) : [];
    }
    catch (e) {
        return [];
    }
}
/** Extract information about package.json modules */
function collectModules() {
    var mainPaths = (require.main && require.main.paths) || [];
    var paths = getPaths();
    var infos = {};
    var seen = {};
    paths.forEach(function (path) {
        var dir = path;
        /** Traverse directories upward in the search of package.json file */
        var updir = function () {
            var orig = dir;
            dir = path_1.dirname(orig);
            if (!dir || orig === dir || seen[orig]) {
                return undefined;
            }
            if (mainPaths.indexOf(dir) < 0) {
                return updir();
            }
            var pkgfile = path_1.join(orig, 'package.json');
            seen[orig] = true;
            if (!fs_1.existsSync(pkgfile)) {
                return updir();
            }
            try {
                var info = JSON.parse(fs_1.readFileSync(pkgfile, 'utf8'));
                infos[info.name] = info.version;
            }
            catch (_oO) {
                // no-empty
            }
        };
        updir();
    });
    return infos;
}
/** Add node modules / packages to the event */
var Modules = /** @class */ (function () {
    function Modules() {
        /**
         * @inheritDoc
         */
        this.name = Modules.id;
    }
    /**
     * @inheritDoc
     */
    Modules.prototype.setupOnce = function (addGlobalEventProcessor, getCurrentHub) {
        var _this = this;
        addGlobalEventProcessor(function (event) {
            if (!getCurrentHub().getIntegration(Modules)) {
                return event;
            }
            return tslib_1.__assign(tslib_1.__assign({}, event), { modules: _this._getModules() });
        });
    };
    /** Fetches the list of modules and the versions loaded by the entry file for your node.js app. */
    Modules.prototype._getModules = function () {
        if (!moduleCache) {
            moduleCache = collectModules();
        }
        return moduleCache;
    };
    /**
     * @inheritDoc
     */
    Modules.id = 'Modules';
    return Modules;
}());
exports.Modules = Modules;
//# sourceMappingURL=modules.js.map

/***/ }),

/***/ 443:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var core_1 = __nccwpck_require__(9212);
var types_1 = __nccwpck_require__(3789);
var utils_1 = __nccwpck_require__(1620);
var errorhandling_1 = __nccwpck_require__(5635);
/** Global Promise Rejection handler */
var OnUncaughtException = /** @class */ (function () {
    /**
     * @inheritDoc
     */
    function OnUncaughtException(_options) {
        if (_options === void 0) { _options = {}; }
        this._options = _options;
        /**
         * @inheritDoc
         */
        this.name = OnUncaughtException.id;
        /**
         * @inheritDoc
         */
        this.handler = this._makeErrorHandler();
    }
    /**
     * @inheritDoc
     */
    OnUncaughtException.prototype.setupOnce = function () {
        global.process.on('uncaughtException', this.handler.bind(this));
    };
    /**
     * @hidden
     */
    OnUncaughtException.prototype._makeErrorHandler = function () {
        var _this = this;
        var timeout = 2000;
        var caughtFirstError = false;
        var caughtSecondError = false;
        var calledFatalError = false;
        var firstError;
        return function (error) {
            var onFatalError = errorhandling_1.logAndExitProcess;
            var client = core_1.getCurrentHub().getClient();
            if (_this._options.onFatalError) {
                // eslint-disable-next-line @typescript-eslint/unbound-method
                onFatalError = _this._options.onFatalError;
            }
            else if (client && client.getOptions().onFatalError) {
                // eslint-disable-next-line @typescript-eslint/unbound-method
                onFatalError = client.getOptions().onFatalError;
            }
            if (!caughtFirstError) {
                var hub_1 = core_1.getCurrentHub();
                // this is the first uncaught error and the ultimate reason for shutting down
                // we want to do absolutely everything possible to ensure it gets captured
                // also we want to make sure we don't go recursion crazy if more errors happen after this one
                firstError = error;
                caughtFirstError = true;
                if (hub_1.getIntegration(OnUncaughtException)) {
                    hub_1.withScope(function (scope) {
                        scope.setLevel(types_1.Severity.Fatal);
                        hub_1.captureException(error, { originalException: error });
                        if (!calledFatalError) {
                            calledFatalError = true;
                            onFatalError(error);
                        }
                    });
                }
                else {
                    if (!calledFatalError) {
                        calledFatalError = true;
                        onFatalError(error);
                    }
                }
            }
            else if (calledFatalError) {
                // we hit an error *after* calling onFatalError - pretty boned at this point, just shut it down
                utils_1.logger.warn('uncaught exception after calling fatal error shutdown callback - this is bad! forcing shutdown');
                errorhandling_1.logAndExitProcess(error);
            }
            else if (!caughtSecondError) {
                // two cases for how we can hit this branch:
                //   - capturing of first error blew up and we just caught the exception from that
                //     - quit trying to capture, proceed with shutdown
                //   - a second independent error happened while waiting for first error to capture
                //     - want to avoid causing premature shutdown before first error capture finishes
                // it's hard to immediately tell case 1 from case 2 without doing some fancy/questionable domain stuff
                // so let's instead just delay a bit before we proceed with our action here
                // in case 1, we just wait a bit unnecessarily but ultimately do the same thing
                // in case 2, the delay hopefully made us wait long enough for the capture to finish
                // two potential nonideal outcomes:
                //   nonideal case 1: capturing fails fast, we sit around for a few seconds unnecessarily before proceeding correctly by calling onFatalError
                //   nonideal case 2: case 2 happens, 1st error is captured but slowly, timeout completes before capture and we treat second error as the sendErr of (nonexistent) failure from trying to capture first error
                // note that after hitting this branch, we might catch more errors where (caughtSecondError && !calledFatalError)
                //   we ignore them - they don't matter to us, we're just waiting for the second error timeout to finish
                caughtSecondError = true;
                setTimeout(function () {
                    if (!calledFatalError) {
                        // it was probably case 1, let's treat err as the sendErr and call onFatalError
                        calledFatalError = true;
                        onFatalError(firstError, error);
                    }
                    else {
                        // it was probably case 2, our first error finished capturing while we waited, cool, do nothing
                    }
                }, timeout); // capturing could take at least sendTimeout to fail, plus an arbitrary second for how long it takes to collect surrounding source etc
            }
        };
    };
    /**
     * @inheritDoc
     */
    OnUncaughtException.id = 'OnUncaughtException';
    return OnUncaughtException;
}());
exports.OnUncaughtException = OnUncaughtException;
//# sourceMappingURL=onuncaughtexception.js.map

/***/ }),

/***/ 7344:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var core_1 = __nccwpck_require__(9212);
var utils_1 = __nccwpck_require__(1620);
var errorhandling_1 = __nccwpck_require__(5635);
/** Global Promise Rejection handler */
var OnUnhandledRejection = /** @class */ (function () {
    /**
     * @inheritDoc
     */
    function OnUnhandledRejection(_options) {
        if (_options === void 0) { _options = { mode: 'warn' }; }
        this._options = _options;
        /**
         * @inheritDoc
         */
        this.name = OnUnhandledRejection.id;
    }
    /**
     * @inheritDoc
     */
    OnUnhandledRejection.prototype.setupOnce = function () {
        global.process.on('unhandledRejection', this.sendUnhandledPromise.bind(this));
    };
    /**
     * Send an exception with reason
     * @param reason string
     * @param promise promise
     */
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    OnUnhandledRejection.prototype.sendUnhandledPromise = function (reason, promise) {
        var hub = core_1.getCurrentHub();
        if (!hub.getIntegration(OnUnhandledRejection)) {
            this._handleRejection(reason);
            return;
        }
        /* eslint-disable @typescript-eslint/no-unsafe-member-access */
        var context = (promise.domain && promise.domain.sentryContext) || {};
        hub.withScope(function (scope) {
            scope.setExtra('unhandledPromiseRejection', true);
            // Preserve backwards compatibility with raven-node for now
            if (context.user) {
                scope.setUser(context.user);
            }
            if (context.tags) {
                scope.setTags(context.tags);
            }
            if (context.extra) {
                scope.setExtras(context.extra);
            }
            hub.captureException(reason, { originalException: promise });
        });
        /* eslint-disable @typescript-eslint/no-unsafe-member-access */
        this._handleRejection(reason);
    };
    /**
     * Handler for `mode` option
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    OnUnhandledRejection.prototype._handleRejection = function (reason) {
        // https://github.com/nodejs/node/blob/7cf6f9e964aa00772965391c23acda6d71972a9a/lib/internal/process/promises.js#L234-L240
        var rejectionWarning = 'This error originated either by ' +
            'throwing inside of an async function without a catch block, ' +
            'or by rejecting a promise which was not handled with .catch().' +
            ' The promise rejected with the reason:';
        /* eslint-disable no-console */
        if (this._options.mode === 'warn') {
            utils_1.consoleSandbox(function () {
                console.warn(rejectionWarning);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                console.error(reason && reason.stack ? reason.stack : reason);
            });
        }
        else if (this._options.mode === 'strict') {
            utils_1.consoleSandbox(function () {
                console.warn(rejectionWarning);
            });
            errorhandling_1.logAndExitProcess(reason);
        }
        /* eslint-enable no-console */
    };
    /**
     * @inheritDoc
     */
    OnUnhandledRejection.id = 'OnUnhandledRejection';
    return OnUnhandledRejection;
}());
exports.OnUnhandledRejection = OnUnhandledRejection;
//# sourceMappingURL=onunhandledrejection.js.map

/***/ }),

/***/ 5635:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var core_1 = __nccwpck_require__(9212);
var utils_1 = __nccwpck_require__(1620);
var DEFAULT_SHUTDOWN_TIMEOUT = 2000;
/**
 * @hidden
 */
function logAndExitProcess(error) {
    // eslint-disable-next-line no-console
    console.error(error && error.stack ? error.stack : error);
    var client = core_1.getCurrentHub().getClient();
    if (client === undefined) {
        utils_1.logger.warn('No NodeClient was defined, we are exiting the process now.');
        global.process.exit(1);
        return;
    }
    var options = client.getOptions();
    var timeout = (options && options.shutdownTimeout && options.shutdownTimeout > 0 && options.shutdownTimeout) ||
        DEFAULT_SHUTDOWN_TIMEOUT;
    utils_1.forget(client.close(timeout).then(function (result) {
        if (!result) {
            utils_1.logger.warn('We reached the timeout for emptying the request buffer, still exiting now!');
        }
        global.process.exit(1);
    }));
}
exports.logAndExitProcess = logAndExitProcess;
//# sourceMappingURL=errorhandling.js.map

/***/ }),

/***/ 4103:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var core_1 = __nccwpck_require__(9212);
var url_1 = __nccwpck_require__(8835);
/**
 * Checks whether given url points to Sentry server
 * @param url url to verify
 */
function isSentryRequest(url) {
    var _a;
    var dsn = (_a = core_1.getCurrentHub()
        .getClient()) === null || _a === void 0 ? void 0 : _a.getDsn();
    return dsn ? url.includes(dsn.host) : false;
}
exports.isSentryRequest = isSentryRequest;
/**
 * Assemble a URL to be used for breadcrumbs and spans.
 *
 * @param requestOptions RequestOptions object containing the component parts for a URL
 * @returns Fully-formed URL
 */
function extractUrl(requestOptions) {
    var protocol = requestOptions.protocol || '';
    var hostname = requestOptions.hostname || requestOptions.host || '';
    // Don't log standard :80 (http) and :443 (https) ports to reduce the noise
    var port = !requestOptions.port || requestOptions.port === 80 || requestOptions.port === 443 ? '' : ":" + requestOptions.port;
    var path = requestOptions.path ? requestOptions.path : '/';
    return protocol + "//" + hostname + port + path;
}
exports.extractUrl = extractUrl;
/**
 * Handle various edge cases in the span description (for spans representing http(s) requests).
 *
 * @param description current `description` property of the span representing the request
 * @param requestOptions Configuration data for the request
 * @param Request Request object
 *
 * @returns The cleaned description
 */
function cleanSpanDescription(description, requestOptions, request) {
    var _a, _b, _c;
    // nothing to clean
    if (!description) {
        return description;
    }
    // eslint-disable-next-line prefer-const
    var _d = tslib_1.__read(description.split(' '), 2), method = _d[0], requestUrl = _d[1];
    // superagent sticks the protocol in a weird place (we check for host because if both host *and* protocol are missing,
    // we're likely dealing with an internal route and this doesn't apply)
    if (requestOptions.host && !requestOptions.protocol) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        requestOptions.protocol = (_b = (_a = request) === null || _a === void 0 ? void 0 : _a.agent) === null || _b === void 0 ? void 0 : _b.protocol; // worst comes to worst, this is undefined and nothing changes
        requestUrl = extractUrl(requestOptions);
    }
    // internal routes can end up starting with a triple slash rather than a single one
    if ((_c = requestUrl) === null || _c === void 0 ? void 0 : _c.startsWith('///')) {
        requestUrl = requestUrl.slice(2);
    }
    return method + " " + requestUrl;
}
exports.cleanSpanDescription = cleanSpanDescription;
/**
 * Convert a URL object into a RequestOptions object.
 *
 * Copied from Node's internals (where it's used in http(s).request() and http(s).get()), modified only to use the
 * RequestOptions type above.
 *
 * See https://github.com/nodejs/node/blob/master/lib/internal/url.js.
 */
function urlToOptions(url) {
    var options = {
        protocol: url.protocol,
        hostname: typeof url.hostname === 'string' && url.hostname.startsWith('[') ? url.hostname.slice(1, -1) : url.hostname,
        hash: url.hash,
        search: url.search,
        pathname: url.pathname,
        path: "" + (url.pathname || '') + (url.search || ''),
        href: url.href,
    };
    if (url.port !== '') {
        options.port = Number(url.port);
    }
    if (url.username || url.password) {
        options.auth = url.username + ":" + url.password;
    }
    return options;
}
exports.urlToOptions = urlToOptions;
/**
 * Normalize inputs to `http(s).request()` and `http(s).get()`.
 *
 * Legal inputs to `http(s).request()` and `http(s).get()` can take one of ten forms:
 *     [ RequestOptions | string | URL ],
 *     [ RequestOptions | string | URL, RequestCallback ],
 *     [ string | URL, RequestOptions ], and
 *     [ string | URL, RequestOptions, RequestCallback ].
 *
 * This standardizes to one of two forms: [ RequestOptions ] and [ RequestOptions, RequestCallback ]. A similar thing is
 * done as the first step of `http(s).request()` and `http(s).get()`; this just does it early so that we can interact
 * with the args in a standard way.
 *
 * @param requestArgs The inputs to `http(s).request()` or `http(s).get()`, as an array.
 *
 * @returns Equivalent args of the form [ RequestOptions ] or [ RequestOptions, RequestCallback ].
 */
function normalizeRequestArgs(requestArgs) {
    var callback, requestOptions;
    // pop off the callback, if there is one
    if (typeof requestArgs[requestArgs.length - 1] === 'function') {
        callback = requestArgs.pop();
    }
    // create a RequestOptions object of whatever's at index 0
    if (typeof requestArgs[0] === 'string') {
        requestOptions = urlToOptions(new url_1.URL(requestArgs[0]));
    }
    else if (requestArgs[0] instanceof url_1.URL) {
        requestOptions = urlToOptions(requestArgs[0]);
    }
    else {
        requestOptions = requestArgs[0];
    }
    // if the options were given separately from the URL, fold them in
    if (requestArgs.length === 2) {
        requestOptions = tslib_1.__assign(tslib_1.__assign({}, requestOptions), requestArgs[1]);
    }
    // return args in standardized form
    if (callback) {
        return [requestOptions, callback];
    }
    else {
        return [requestOptions];
    }
}
exports.normalizeRequestArgs = normalizeRequestArgs;
//# sourceMappingURL=http.js.map

/***/ }),

/***/ 9090:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __nccwpck_require__(1620);
var fs_1 = __nccwpck_require__(5747);
var lru_map_1 = __nccwpck_require__(8424);
var stacktrace = __nccwpck_require__(6276);
var DEFAULT_LINES_OF_CONTEXT = 7;
var FILE_CONTENT_CACHE = new lru_map_1.LRUMap(100);
/**
 * Resets the file cache. Exists for testing purposes.
 * @hidden
 */
function resetFileContentCache() {
    FILE_CONTENT_CACHE.clear();
}
exports.resetFileContentCache = resetFileContentCache;
/** JSDoc */
function getFunction(frame) {
    try {
        return frame.functionName || frame.typeName + "." + (frame.methodName || '<anonymous>');
    }
    catch (e) {
        // This seems to happen sometimes when using 'use strict',
        // stemming from `getTypeName`.
        // [TypeError: Cannot read property 'constructor' of undefined]
        return '<anonymous>';
    }
}
var mainModule = ((require.main && require.main.filename && utils_1.dirname(require.main.filename)) ||
    global.process.cwd()) + "/";
/** JSDoc */
function getModule(filename, base) {
    if (!base) {
        // eslint-disable-next-line no-param-reassign
        base = mainModule;
    }
    // It's specifically a module
    var file = utils_1.basename(filename, '.js');
    // eslint-disable-next-line no-param-reassign
    filename = utils_1.dirname(filename);
    var n = filename.lastIndexOf('/node_modules/');
    if (n > -1) {
        // /node_modules/ is 14 chars
        return filename.substr(n + 14).replace(/\//g, '.') + ":" + file;
    }
    // Let's see if it's a part of the main module
    // To be a part of main module, it has to share the same base
    n = (filename + "/").lastIndexOf(base, 0);
    if (n === 0) {
        var moduleName = filename.substr(base.length).replace(/\//g, '.');
        if (moduleName) {
            moduleName += ':';
        }
        moduleName += file;
        return moduleName;
    }
    return file;
}
/**
 * This function reads file contents and caches them in a global LRU cache.
 * Returns a Promise filepath => content array for all files that we were able to read.
 *
 * @param filenames Array of filepaths to read content from.
 */
function readSourceFiles(filenames) {
    // we're relying on filenames being de-duped already
    if (filenames.length === 0) {
        return utils_1.SyncPromise.resolve({});
    }
    return new utils_1.SyncPromise(function (resolve) {
        var sourceFiles = {};
        var count = 0;
        var _loop_1 = function (i) {
            var filename = filenames[i];
            var cache = FILE_CONTENT_CACHE.get(filename);
            // We have a cache hit
            if (cache !== undefined) {
                // If it's not null (which means we found a file and have a content)
                // we set the content and return it later.
                if (cache !== null) {
                    sourceFiles[filename] = cache;
                }
                // eslint-disable-next-line no-plusplus
                count++;
                // In any case we want to skip here then since we have a content already or we couldn't
                // read the file and don't want to try again.
                if (count === filenames.length) {
                    resolve(sourceFiles);
                }
                return "continue";
            }
            fs_1.readFile(filename, function (err, data) {
                var content = err ? null : data.toString();
                sourceFiles[filename] = content;
                // We always want to set the cache, even to null which means there was an error reading the file.
                // We do not want to try to read the file again.
                FILE_CONTENT_CACHE.set(filename, content);
                // eslint-disable-next-line no-plusplus
                count++;
                if (count === filenames.length) {
                    resolve(sourceFiles);
                }
            });
        };
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (var i = 0; i < filenames.length; i++) {
            _loop_1(i);
        }
    });
}
/**
 * @hidden
 */
function extractStackFromError(error) {
    var stack = stacktrace.parse(error);
    if (!stack) {
        return [];
    }
    return stack;
}
exports.extractStackFromError = extractStackFromError;
/**
 * @hidden
 */
function parseStack(stack, options) {
    var filesToRead = [];
    var linesOfContext = options && options.frameContextLines !== undefined ? options.frameContextLines : DEFAULT_LINES_OF_CONTEXT;
    var frames = stack.map(function (frame) {
        var _a;
        var parsedFrame = {
            colno: frame.columnNumber,
            filename: ((_a = frame.fileName) === null || _a === void 0 ? void 0 : _a.startsWith('file://')) ? frame.fileName.substr(7) : frame.fileName || '',
            function: getFunction(frame),
            lineno: frame.lineNumber,
        };
        var isInternal = frame.native ||
            (parsedFrame.filename &&
                !parsedFrame.filename.startsWith('/') &&
                !parsedFrame.filename.startsWith('.') &&
                parsedFrame.filename.indexOf(':\\') !== 1);
        // in_app is all that's not an internal Node function or a module within node_modules
        // note that isNative appears to return true even for node core libraries
        // see https://github.com/getsentry/raven-node/issues/176
        parsedFrame.in_app =
            !isInternal && parsedFrame.filename !== undefined && parsedFrame.filename.indexOf('node_modules/') === -1;
        // Extract a module name based on the filename
        if (parsedFrame.filename) {
            parsedFrame.module = getModule(parsedFrame.filename);
            if (!isInternal && linesOfContext > 0 && filesToRead.indexOf(parsedFrame.filename) === -1) {
                filesToRead.push(parsedFrame.filename);
            }
        }
        return parsedFrame;
    });
    // We do an early return if we do not want to fetch context liens
    if (linesOfContext <= 0) {
        return utils_1.SyncPromise.resolve(frames);
    }
    try {
        return addPrePostContext(filesToRead, frames, linesOfContext);
    }
    catch (_) {
        // This happens in electron for example where we are not able to read files from asar.
        // So it's fine, we recover be just returning all frames without pre/post context.
        return utils_1.SyncPromise.resolve(frames);
    }
}
exports.parseStack = parseStack;
/**
 * This function tries to read the source files + adding pre and post context (source code)
 * to a frame.
 * @param filesToRead string[] of filepaths
 * @param frames StackFrame[] containg all frames
 */
function addPrePostContext(filesToRead, frames, linesOfContext) {
    return new utils_1.SyncPromise(function (resolve) {
        return readSourceFiles(filesToRead).then(function (sourceFiles) {
            var result = frames.map(function (frame) {
                if (frame.filename && sourceFiles[frame.filename]) {
                    try {
                        var lines = sourceFiles[frame.filename].split('\n');
                        utils_1.addContextToFrame(lines, frame, linesOfContext);
                    }
                    catch (e) {
                        // anomaly, being defensive in case
                        // unlikely to ever happen in practice but can definitely happen in theory
                    }
                }
                return frame;
            });
            resolve(result);
        });
    });
}
/**
 * @hidden
 */
function getExceptionFromError(error, options) {
    var name = error.name || error.constructor.name;
    var stack = extractStackFromError(error);
    return new utils_1.SyncPromise(function (resolve) {
        return parseStack(stack, options).then(function (frames) {
            var result = {
                stacktrace: {
                    frames: prepareFramesForEvent(frames),
                },
                type: name,
                value: error.message,
            };
            resolve(result);
        });
    });
}
exports.getExceptionFromError = getExceptionFromError;
/**
 * @hidden
 */
function parseError(error, options) {
    return new utils_1.SyncPromise(function (resolve) {
        return getExceptionFromError(error, options).then(function (exception) {
            resolve({
                exception: {
                    values: [exception],
                },
            });
        });
    });
}
exports.parseError = parseError;
/**
 * @hidden
 */
function prepareFramesForEvent(stack) {
    if (!stack || !stack.length) {
        return [];
    }
    var localStack = stack;
    var firstFrameFunction = localStack[0].function || '';
    if (firstFrameFunction.indexOf('captureMessage') !== -1 || firstFrameFunction.indexOf('captureException') !== -1) {
        localStack = localStack.slice(1);
    }
    // The frame where the crash happened, should be the last entry in the array
    return localStack.reverse();
}
exports.prepareFramesForEvent = prepareFramesForEvent;
//# sourceMappingURL=parsers.js.map

/***/ }),

/***/ 8836:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var core_1 = __nccwpck_require__(9212);
var hub_1 = __nccwpck_require__(6393);
var utils_1 = __nccwpck_require__(1620);
var domain = __nccwpck_require__(5229);
var client_1 = __nccwpck_require__(6147);
var integrations_1 = __nccwpck_require__(2310);
exports.defaultIntegrations = [
    // Common
    new core_1.Integrations.InboundFilters(),
    new core_1.Integrations.FunctionToString(),
    // Native Wrappers
    new integrations_1.Console(),
    new integrations_1.Http(),
    // Global Handlers
    new integrations_1.OnUncaughtException(),
    new integrations_1.OnUnhandledRejection(),
    // Misc
    new integrations_1.LinkedErrors(),
];
/**
 * The Sentry Node SDK Client.
 *
 * To use this SDK, call the {@link init} function as early as possible in the
 * main entry module. To set context information or send manual events, use the
 * provided methods.
 *
 * @example
 * ```
 *
 * const { init } = require('@sentry/node');
 *
 * init({
 *   dsn: '__DSN__',
 *   // ...
 * });
 * ```
 *
 * @example
 * ```
 *
 * const { configureScope } = require('@sentry/node');
 * configureScope((scope: Scope) => {
 *   scope.setExtra({ battery: 0.7 });
 *   scope.setTag({ user_mode: 'admin' });
 *   scope.setUser({ id: '4711' });
 * });
 * ```
 *
 * @example
 * ```
 *
 * const { addBreadcrumb } = require('@sentry/node');
 * addBreadcrumb({
 *   message: 'My Breadcrumb',
 *   // ...
 * });
 * ```
 *
 * @example
 * ```
 *
 * const Sentry = require('@sentry/node');
 * Sentry.captureMessage('Hello, world!');
 * Sentry.captureException(new Error('Good bye'));
 * Sentry.captureEvent({
 *   message: 'Manual',
 *   stacktrace: [
 *     // ...
 *   ],
 * });
 * ```
 *
 * @see {@link NodeOptions} for documentation on configuration options.
 */
function init(options) {
    if (options === void 0) { options = {}; }
    if (options.defaultIntegrations === undefined) {
        options.defaultIntegrations = exports.defaultIntegrations;
    }
    if (options.dsn === undefined && process.env.SENTRY_DSN) {
        options.dsn = process.env.SENTRY_DSN;
    }
    if (options.tracesSampleRate === undefined && process.env.SENTRY_TRACES_SAMPLE_RATE) {
        var tracesSampleRate = parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE);
        if (isFinite(tracesSampleRate)) {
            options.tracesSampleRate = tracesSampleRate;
        }
    }
    if (options.release === undefined) {
        var global_1 = utils_1.getGlobalObject();
        // Prefer env var over global
        if (process.env.SENTRY_RELEASE) {
            options.release = process.env.SENTRY_RELEASE;
        }
        // This supports the variable that sentry-webpack-plugin injects
        else if (global_1.SENTRY_RELEASE && global_1.SENTRY_RELEASE.id) {
            options.release = global_1.SENTRY_RELEASE.id;
        }
    }
    if (options.environment === undefined && process.env.SENTRY_ENVIRONMENT) {
        options.environment = process.env.SENTRY_ENVIRONMENT;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    if (domain.active) {
        hub_1.setHubOnCarrier(hub_1.getMainCarrier(), core_1.getCurrentHub());
    }
    core_1.initAndBind(client_1.NodeClient, options);
}
exports.init = init;
/**
 * This is the getter for lastEventId.
 *
 * @returns The last event id of a captured event.
 */
function lastEventId() {
    return core_1.getCurrentHub().lastEventId();
}
exports.lastEventId = lastEventId;
/**
 * A promise that resolves when all current events have been sent.
 * If you provide a timeout and the queue takes longer to drain the promise returns false.
 *
 * @param timeout Maximum time in ms the client should wait.
 */
function flush(timeout) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var client;
        return tslib_1.__generator(this, function (_a) {
            client = core_1.getCurrentHub().getClient();
            if (client) {
                return [2 /*return*/, client.flush(timeout)];
            }
            return [2 /*return*/, Promise.reject(false)];
        });
    });
}
exports.flush = flush;
/**
 * A promise that resolves when all current events have been sent.
 * If you provide a timeout and the queue takes longer to drain the promise returns false.
 *
 * @param timeout Maximum time in ms the client should wait.
 */
function close(timeout) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var client;
        return tslib_1.__generator(this, function (_a) {
            client = core_1.getCurrentHub().getClient();
            if (client) {
                return [2 /*return*/, client.close(timeout)];
            }
            return [2 /*return*/, Promise.reject(false)];
        });
    });
}
exports.close = close;
//# sourceMappingURL=sdk.js.map

/***/ }),

/***/ 6276:
/***/ ((__unused_webpack_module, exports) => {

/**
 * stack-trace - Parses node.js stack traces
 *
 * This was originally forked to fix this issue:
 * https://github.com/felixge/node-stack-trace/issues/31
 *
 * Mar 19,2019 - #4fd379e
 *
 * https://github.com/felixge/node-stack-trace/
 * @license MIT
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
/** Extracts StackFrames from the Error */
function parse(err) {
    if (!err.stack) {
        return [];
    }
    var lines = err.stack.split('\n').slice(1);
    return lines
        .map(function (line) {
        if (line.match(/^\s*[-]{4,}$/)) {
            return {
                columnNumber: null,
                fileName: line,
                functionName: null,
                lineNumber: null,
                methodName: null,
                native: null,
                typeName: null,
            };
        }
        var lineMatch = line.match(/at (?:(.+?)\s+\()?(?:(.+?):(\d+)(?::(\d+))?|([^)]+))\)?/);
        if (!lineMatch) {
            return undefined;
        }
        var object = null;
        var method = null;
        var functionName = null;
        var typeName = null;
        var methodName = null;
        var isNative = lineMatch[5] === 'native';
        if (lineMatch[1]) {
            functionName = lineMatch[1];
            var methodStart = functionName.lastIndexOf('.');
            if (functionName[methodStart - 1] === '.') {
                // eslint-disable-next-line no-plusplus
                methodStart--;
            }
            if (methodStart > 0) {
                object = functionName.substr(0, methodStart);
                method = functionName.substr(methodStart + 1);
                var objectEnd = object.indexOf('.Module');
                if (objectEnd > 0) {
                    functionName = functionName.substr(objectEnd + 1);
                    object = object.substr(0, objectEnd);
                }
            }
            typeName = null;
        }
        if (method) {
            typeName = object;
            methodName = method;
        }
        if (method === '<anonymous>') {
            methodName = null;
            functionName = null;
        }
        var properties = {
            columnNumber: parseInt(lineMatch[4], 10) || null,
            fileName: lineMatch[2] || null,
            functionName: functionName,
            lineNumber: parseInt(lineMatch[3], 10) || null,
            methodName: methodName,
            native: isNative,
            typeName: typeName,
        };
        return properties;
    })
        .filter(function (callSite) { return !!callSite; });
}
exports.parse = parse;
//# sourceMappingURL=stacktrace.js.map

/***/ }),

/***/ 3240:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var core_1 = __nccwpck_require__(9212);
var types_1 = __nccwpck_require__(3789);
var utils_1 = __nccwpck_require__(1620);
var fs = __nccwpck_require__(5747);
var url = __nccwpck_require__(8835);
var version_1 = __nccwpck_require__(1271);
/** Base Transport class implementation */
var BaseTransport = /** @class */ (function () {
    /** Create instance and set this.dsn */
    function BaseTransport(options) {
        this.options = options;
        /** A simple buffer holding all requests. */
        this._buffer = new utils_1.PromiseBuffer(30);
        /** Locks transport after receiving 429 response */
        this._disabledUntil = new Date(Date.now());
        this._api = new core_1.API(options.dsn, options._metadata);
    }
    /**
     * @inheritDoc
     */
    BaseTransport.prototype.sendEvent = function (_) {
        throw new utils_1.SentryError('Transport Class has to implement `sendEvent` method.');
    };
    /**
     * @inheritDoc
     */
    BaseTransport.prototype.close = function (timeout) {
        return this._buffer.drain(timeout);
    };
    /** Returns a build request option object used by request */
    BaseTransport.prototype._getRequestOptions = function (uri) {
        var headers = tslib_1.__assign(tslib_1.__assign({}, this._api.getRequestHeaders(version_1.SDK_NAME, core_1.SDK_VERSION)), this.options.headers);
        var hostname = uri.hostname, pathname = uri.pathname, port = uri.port, protocol = uri.protocol;
        // See https://github.com/nodejs/node/blob/38146e717fed2fabe3aacb6540d839475e0ce1c6/lib/internal/url.js#L1268-L1290
        // We ignore the query string on purpose
        var path = "" + pathname;
        return tslib_1.__assign({ agent: this.client, headers: headers,
            hostname: hostname, method: 'POST', path: path,
            port: port,
            protocol: protocol }, (this.options.caCerts && {
            ca: fs.readFileSync(this.options.caCerts),
        }));
    };
    /** JSDoc */
    BaseTransport.prototype._sendWithModule = function (httpModule, event) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                if (new Date(Date.now()) < this._disabledUntil) {
                    return [2 /*return*/, Promise.reject(new utils_1.SentryError("Transport locked till " + this._disabledUntil + " due to too many requests."))];
                }
                if (!this._buffer.isReady()) {
                    return [2 /*return*/, Promise.reject(new utils_1.SentryError('Not adding Promise due to buffer limit reached.'))];
                }
                return [2 /*return*/, this._buffer.add(new Promise(function (resolve, reject) {
                        var sentryReq = core_1.eventToSentryRequest(event, _this._api);
                        var options = _this._getRequestOptions(new url.URL(sentryReq.url));
                        var req = httpModule.request(options, function (res) {
                            var statusCode = res.statusCode || 500;
                            var status = types_1.Status.fromHttpCode(statusCode);
                            res.setEncoding('utf8');
                            if (status === types_1.Status.Success) {
                                resolve({ status: status });
                            }
                            else {
                                if (status === types_1.Status.RateLimit) {
                                    var now = Date.now();
                                    /**
                                     * "Key-value pairs of header names and values. Header names are lower-cased."
                                     * https://nodejs.org/api/http.html#http_message_headers
                                     */
                                    var retryAfterHeader = res.headers ? res.headers['retry-after'] : '';
                                    retryAfterHeader = (Array.isArray(retryAfterHeader) ? retryAfterHeader[0] : retryAfterHeader);
                                    _this._disabledUntil = new Date(now + utils_1.parseRetryAfterHeader(now, retryAfterHeader));
                                    utils_1.logger.warn("Too many requests, backing off till: " + _this._disabledUntil);
                                }
                                var rejectionMessage = "HTTP Error (" + statusCode + ")";
                                if (res.headers && res.headers['x-sentry-error']) {
                                    rejectionMessage += ": " + res.headers['x-sentry-error'];
                                }
                                reject(new utils_1.SentryError(rejectionMessage));
                            }
                            // Force the socket to drain
                            res.on('data', function () {
                                // Drain
                            });
                            res.on('end', function () {
                                // Drain
                            });
                        });
                        req.on('error', reject);
                        req.end(sentryReq.body);
                    }))];
            });
        });
    };
    return BaseTransport;
}());
exports.BaseTransport = BaseTransport;
//# sourceMappingURL=base.js.map

/***/ }),

/***/ 4490:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var utils_1 = __nccwpck_require__(1620);
var http = __nccwpck_require__(8605);
var base_1 = __nccwpck_require__(3240);
/** Node http module transport */
var HTTPTransport = /** @class */ (function (_super) {
    tslib_1.__extends(HTTPTransport, _super);
    /** Create a new instance and set this.agent */
    function HTTPTransport(options) {
        var _this = _super.call(this, options) || this;
        _this.options = options;
        var proxy = options.httpProxy || process.env.http_proxy;
        _this.module = http;
        _this.client = proxy
            ? new (__nccwpck_require__(7219))(proxy)
            : new http.Agent({ keepAlive: false, maxSockets: 30, timeout: 2000 });
        return _this;
    }
    /**
     * @inheritDoc
     */
    HTTPTransport.prototype.sendEvent = function (event) {
        if (!this.module) {
            throw new utils_1.SentryError('No module available in HTTPTransport');
        }
        return this._sendWithModule(this.module, event);
    };
    return HTTPTransport;
}(base_1.BaseTransport));
exports.HTTPTransport = HTTPTransport;
//# sourceMappingURL=http.js.map

/***/ }),

/***/ 8621:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var utils_1 = __nccwpck_require__(1620);
var https = __nccwpck_require__(7211);
var base_1 = __nccwpck_require__(3240);
/** Node https module transport */
var HTTPSTransport = /** @class */ (function (_super) {
    tslib_1.__extends(HTTPSTransport, _super);
    /** Create a new instance and set this.agent */
    function HTTPSTransport(options) {
        var _this = _super.call(this, options) || this;
        _this.options = options;
        var proxy = options.httpsProxy || options.httpProxy || process.env.https_proxy || process.env.http_proxy;
        _this.module = https;
        _this.client = proxy
            ? new (__nccwpck_require__(7219))(proxy)
            : new https.Agent({ keepAlive: false, maxSockets: 30, timeout: 2000 });
        return _this;
    }
    /**
     * @inheritDoc
     */
    HTTPSTransport.prototype.sendEvent = function (event) {
        if (!this.module) {
            throw new utils_1.SentryError('No module available in HTTPSTransport');
        }
        return this._sendWithModule(this.module, event);
    };
    return HTTPSTransport;
}(base_1.BaseTransport));
exports.HTTPSTransport = HTTPSTransport;
//# sourceMappingURL=https.js.map

/***/ }),

/***/ 1437:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var base_1 = __nccwpck_require__(3240);
exports.BaseTransport = base_1.BaseTransport;
var http_1 = __nccwpck_require__(4490);
exports.HTTPTransport = http_1.HTTPTransport;
var https_1 = __nccwpck_require__(8621);
exports.HTTPSTransport = https_1.HTTPSTransport;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 1271:
/***/ ((__unused_webpack_module, exports) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
// TODO: Remove in the next major release and rely only on @sentry/core SDK_VERSION and SdkMetadata
exports.SDK_NAME = 'sentry.javascript.node';
//# sourceMappingURL=version.js.map

/***/ }),

/***/ 1867:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __nccwpck_require__(1620);
var spanstatus_1 = __nccwpck_require__(8522);
var utils_2 = __nccwpck_require__(1386);
var global = utils_1.getGlobalObject();
/**
 * Add a listener that cancels and finishes a transaction when the global
 * document is hidden.
 */
function registerBackgroundTabDetection() {
    if (global && global.document) {
        global.document.addEventListener('visibilitychange', function () {
            var activeTransaction = utils_2.getActiveTransaction();
            if (global.document.hidden && activeTransaction) {
                utils_1.logger.log("[Tracing] Transaction: " + spanstatus_1.SpanStatus.Cancelled + " -> since tab moved to the background, op: " + activeTransaction.op);
                // We should not set status if it is already set, this prevent important statuses like
                // error or data loss from being overwritten on transaction.
                if (!activeTransaction.status) {
                    activeTransaction.setStatus(spanstatus_1.SpanStatus.Cancelled);
                }
                activeTransaction.setTag('visibilitychange', 'document.hidden');
                activeTransaction.finish();
            }
        });
    }
    else {
        utils_1.logger.warn('[Tracing] Could not set up background tab detection due to lack of global document');
    }
}
exports.registerBackgroundTabDetection = registerBackgroundTabDetection;
//# sourceMappingURL=backgroundtab.js.map

/***/ }),

/***/ 3577:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var utils_1 = __nccwpck_require__(1620);
var hubextensions_1 = __nccwpck_require__(1409);
var idletransaction_1 = __nccwpck_require__(2171);
var spanstatus_1 = __nccwpck_require__(8522);
var utils_2 = __nccwpck_require__(1386);
var backgroundtab_1 = __nccwpck_require__(1867);
var metrics_1 = __nccwpck_require__(8451);
var request_1 = __nccwpck_require__(7854);
var router_1 = __nccwpck_require__(348);
exports.DEFAULT_MAX_TRANSACTION_DURATION_SECONDS = 600;
var DEFAULT_BROWSER_TRACING_OPTIONS = tslib_1.__assign({ idleTimeout: idletransaction_1.DEFAULT_IDLE_TIMEOUT, markBackgroundTransactions: true, maxTransactionDuration: exports.DEFAULT_MAX_TRANSACTION_DURATION_SECONDS, routingInstrumentation: router_1.instrumentRoutingWithDefaults, startTransactionOnLocationChange: true, startTransactionOnPageLoad: true }, request_1.defaultRequestInstrumentationOptions);
/**
 * The Browser Tracing integration automatically instruments browser pageload/navigation
 * actions as transactions, and captures requests, metrics and errors as spans.
 *
 * The integration can be configured with a variety of options, and can be extended to use
 * any routing library. This integration uses {@see IdleTransaction} to create transactions.
 */
var BrowserTracing = /** @class */ (function () {
    function BrowserTracing(_options) {
        /**
         * @inheritDoc
         */
        this.name = BrowserTracing.id;
        this._metrics = new metrics_1.MetricsInstrumentation();
        this._emitOptionsWarning = false;
        var tracingOrigins = request_1.defaultRequestInstrumentationOptions.tracingOrigins;
        // NOTE: Logger doesn't work in constructors, as it's initialized after integrations instances
        if (_options &&
            _options.tracingOrigins &&
            Array.isArray(_options.tracingOrigins) &&
            _options.tracingOrigins.length !== 0) {
            tracingOrigins = _options.tracingOrigins;
        }
        else {
            this._emitOptionsWarning = true;
        }
        this.options = tslib_1.__assign(tslib_1.__assign(tslib_1.__assign({}, DEFAULT_BROWSER_TRACING_OPTIONS), _options), { tracingOrigins: tracingOrigins });
    }
    /**
     * @inheritDoc
     */
    BrowserTracing.prototype.setupOnce = function (_, getCurrentHub) {
        var _this = this;
        this._getCurrentHub = getCurrentHub;
        if (this._emitOptionsWarning) {
            utils_1.logger.warn('[Tracing] You need to define `tracingOrigins` in the options. Set an array of urls or patterns to trace.');
            utils_1.logger.warn("[Tracing] We added a reasonable default for you: " + request_1.defaultRequestInstrumentationOptions.tracingOrigins);
        }
        // eslint-disable-next-line @typescript-eslint/unbound-method
        var _a = this.options, instrumentRouting = _a.routingInstrumentation, startTransactionOnLocationChange = _a.startTransactionOnLocationChange, startTransactionOnPageLoad = _a.startTransactionOnPageLoad, markBackgroundTransactions = _a.markBackgroundTransactions, traceFetch = _a.traceFetch, traceXHR = _a.traceXHR, tracingOrigins = _a.tracingOrigins, shouldCreateSpanForRequest = _a.shouldCreateSpanForRequest;
        instrumentRouting(function (context) { return _this._createRouteTransaction(context); }, startTransactionOnPageLoad, startTransactionOnLocationChange);
        if (markBackgroundTransactions) {
            backgroundtab_1.registerBackgroundTabDetection();
        }
        request_1.instrumentOutgoingRequests({ traceFetch: traceFetch, traceXHR: traceXHR, tracingOrigins: tracingOrigins, shouldCreateSpanForRequest: shouldCreateSpanForRequest });
    };
    /** Create routing idle transaction. */
    BrowserTracing.prototype._createRouteTransaction = function (context) {
        var _this = this;
        if (!this._getCurrentHub) {
            utils_1.logger.warn("[Tracing] Did not create " + context.op + " transaction because _getCurrentHub is invalid.");
            return undefined;
        }
        // eslint-disable-next-line @typescript-eslint/unbound-method
        var _a = this.options, beforeNavigate = _a.beforeNavigate, idleTimeout = _a.idleTimeout, maxTransactionDuration = _a.maxTransactionDuration;
        var parentContextFromHeader = context.op === 'pageload' ? getHeaderContext() : undefined;
        var expandedContext = tslib_1.__assign(tslib_1.__assign(tslib_1.__assign({}, context), parentContextFromHeader), { trimEnd: true });
        var modifiedContext = typeof beforeNavigate === 'function' ? beforeNavigate(expandedContext) : expandedContext;
        // For backwards compatibility reasons, beforeNavigate can return undefined to "drop" the transaction (prevent it
        // from being sent to Sentry).
        var finalContext = modifiedContext === undefined ? tslib_1.__assign(tslib_1.__assign({}, expandedContext), { sampled: false }) : modifiedContext;
        if (finalContext.sampled === false) {
            utils_1.logger.log("[Tracing] Will not send " + finalContext.op + " transaction because of beforeNavigate.");
        }
        utils_1.logger.log("[Tracing] Starting " + finalContext.op + " transaction on scope");
        var hub = this._getCurrentHub();
        var location = utils_1.getGlobalObject().location;
        var idleTransaction = hubextensions_1.startIdleTransaction(hub, finalContext, idleTimeout, true, { location: location });
        idleTransaction.registerBeforeFinishCallback(function (transaction, endTimestamp) {
            _this._metrics.addPerformanceEntries(transaction);
            adjustTransactionDuration(utils_2.secToMs(maxTransactionDuration), transaction, endTimestamp);
        });
        return idleTransaction;
    };
    /**
     * @inheritDoc
     */
    BrowserTracing.id = 'BrowserTracing';
    return BrowserTracing;
}());
exports.BrowserTracing = BrowserTracing;
/**
 * Gets transaction context from a sentry-trace meta.
 *
 * @returns Transaction context data from the header or undefined if there's no header or the header is malformed
 */
function getHeaderContext() {
    var header = getMetaContent('sentry-trace');
    if (header) {
        return utils_2.extractTraceparentData(header);
    }
    return undefined;
}
exports.getHeaderContext = getHeaderContext;
/** Returns the value of a meta tag */
function getMetaContent(metaName) {
    var el = document.querySelector("meta[name=" + metaName + "]");
    return el ? el.getAttribute('content') : null;
}
exports.getMetaContent = getMetaContent;
/** Adjusts transaction value based on max transaction duration */
function adjustTransactionDuration(maxDuration, transaction, endTimestamp) {
    var diff = endTimestamp - transaction.startTimestamp;
    var isOutdatedTransaction = endTimestamp && (diff > maxDuration || diff < 0);
    if (isOutdatedTransaction) {
        transaction.setStatus(spanstatus_1.SpanStatus.DeadlineExceeded);
        transaction.setTag('maxTransactionDurationExceeded', 'true');
    }
}
//# sourceMappingURL=browsertracing.js.map

/***/ }),

/***/ 1425:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var browsertracing_1 = __nccwpck_require__(3577);
exports.BrowserTracing = browsertracing_1.BrowserTracing;
var request_1 = __nccwpck_require__(7854);
exports.instrumentOutgoingRequests = request_1.instrumentOutgoingRequests;
exports.defaultRequestInstrumentationOptions = request_1.defaultRequestInstrumentationOptions;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 8451:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var utils_1 = __nccwpck_require__(1620);
var utils_2 = __nccwpck_require__(1386);
var getCLS_1 = __nccwpck_require__(6982);
var getFID_1 = __nccwpck_require__(2496);
var getLCP_1 = __nccwpck_require__(9382);
var getTTFB_1 = __nccwpck_require__(5909);
var getFirstHidden_1 = __nccwpck_require__(8493);
var global = utils_1.getGlobalObject();
/** Class tracking metrics  */
var MetricsInstrumentation = /** @class */ (function () {
    function MetricsInstrumentation() {
        this._measurements = {};
        this._performanceCursor = 0;
        if (global && global.performance) {
            if (global.performance.mark) {
                global.performance.mark('sentry-tracing-init');
            }
            this._trackCLS();
            this._trackLCP();
            this._trackFID();
            this._trackTTFB();
        }
    }
    /** Add performance related spans to a transaction */
    MetricsInstrumentation.prototype.addPerformanceEntries = function (transaction) {
        var _this = this;
        if (!global || !global.performance || !global.performance.getEntries || !utils_1.browserPerformanceTimeOrigin) {
            // Gatekeeper if performance API not available
            return;
        }
        utils_1.logger.log('[Tracing] Adding & adjusting spans using Performance API');
        var timeOrigin = utils_2.msToSec(utils_1.browserPerformanceTimeOrigin);
        var entryScriptSrc;
        if (global.document) {
            // eslint-disable-next-line @typescript-eslint/prefer-for-of
            for (var i = 0; i < document.scripts.length; i++) {
                // We go through all scripts on the page and look for 'data-entry'
                // We remember the name and measure the time between this script finished loading and
                // our mark 'sentry-tracing-init'
                if (document.scripts[i].dataset.entry === 'true') {
                    entryScriptSrc = document.scripts[i].src;
                    break;
                }
            }
        }
        var entryScriptStartTimestamp;
        var tracingInitMarkStartTime;
        global.performance
            .getEntries()
            .slice(this._performanceCursor)
            .forEach(function (entry) {
            var startTime = utils_2.msToSec(entry.startTime);
            var duration = utils_2.msToSec(entry.duration);
            if (transaction.op === 'navigation' && timeOrigin + startTime < transaction.startTimestamp) {
                return;
            }
            switch (entry.entryType) {
                case 'navigation':
                    addNavigationSpans(transaction, entry, timeOrigin);
                    break;
                case 'mark':
                case 'paint':
                case 'measure': {
                    var startTimestamp = addMeasureSpans(transaction, entry, startTime, duration, timeOrigin);
                    if (tracingInitMarkStartTime === undefined && entry.name === 'sentry-tracing-init') {
                        tracingInitMarkStartTime = startTimestamp;
                    }
                    // capture web vitals
                    var firstHidden = getFirstHidden_1.getFirstHidden();
                    // Only report if the page wasn't hidden prior to the web vital.
                    var shouldRecord = entry.startTime < firstHidden.timeStamp;
                    if (entry.name === 'first-paint' && shouldRecord) {
                        utils_1.logger.log('[Measurements] Adding FP');
                        _this._measurements['fp'] = { value: entry.startTime };
                        _this._measurements['mark.fp'] = { value: startTimestamp };
                    }
                    if (entry.name === 'first-contentful-paint' && shouldRecord) {
                        utils_1.logger.log('[Measurements] Adding FCP');
                        _this._measurements['fcp'] = { value: entry.startTime };
                        _this._measurements['mark.fcp'] = { value: startTimestamp };
                    }
                    break;
                }
                case 'resource': {
                    var resourceName = entry.name.replace(window.location.origin, '');
                    var endTimestamp = addResourceSpans(transaction, entry, resourceName, startTime, duration, timeOrigin);
                    // We remember the entry script end time to calculate the difference to the first init mark
                    if (entryScriptStartTimestamp === undefined && (entryScriptSrc || '').indexOf(resourceName) > -1) {
                        entryScriptStartTimestamp = endTimestamp;
                    }
                    break;
                }
                default:
                // Ignore other entry types.
            }
        });
        if (entryScriptStartTimestamp !== undefined && tracingInitMarkStartTime !== undefined) {
            _startChild(transaction, {
                description: 'evaluation',
                endTimestamp: tracingInitMarkStartTime,
                op: 'script',
                startTimestamp: entryScriptStartTimestamp,
            });
        }
        this._performanceCursor = Math.max(performance.getEntries().length - 1, 0);
        this._trackNavigator(transaction);
        // Measurements are only available for pageload transactions
        if (transaction.op === 'pageload') {
            // normalize applicable web vital values to be relative to transaction.startTimestamp
            var timeOrigin_1 = utils_2.msToSec(utils_1.browserPerformanceTimeOrigin);
            ['fcp', 'fp', 'lcp', 'ttfb'].forEach(function (name) {
                if (!_this._measurements[name] || timeOrigin_1 >= transaction.startTimestamp) {
                    return;
                }
                // The web vitals, fcp, fp, lcp, and ttfb, all measure relative to timeOrigin.
                // Unfortunately, timeOrigin is not captured within the transaction span data, so these web vitals will need
                // to be adjusted to be relative to transaction.startTimestamp.
                var oldValue = _this._measurements[name].value;
                var measurementTimestamp = timeOrigin_1 + utils_2.msToSec(oldValue);
                // normalizedValue should be in milliseconds
                var normalizedValue = Math.abs((measurementTimestamp - transaction.startTimestamp) * 1000);
                var delta = normalizedValue - oldValue;
                utils_1.logger.log("[Measurements] Normalized " + name + " from " + oldValue + " to " + normalizedValue + " (" + delta + ")");
                _this._measurements[name].value = normalizedValue;
            });
            if (this._measurements['mark.fid'] && this._measurements['fid']) {
                // create span for FID
                _startChild(transaction, {
                    description: 'first input delay',
                    endTimestamp: this._measurements['mark.fid'].value + utils_2.msToSec(this._measurements['fid'].value),
                    op: 'web.vitals',
                    startTimestamp: this._measurements['mark.fid'].value,
                });
            }
            transaction.setMeasurements(this._measurements);
        }
    };
    /** Starts tracking the Cumulative Layout Shift on the current page. */
    MetricsInstrumentation.prototype._trackCLS = function () {
        var _this = this;
        getCLS_1.getCLS(function (metric) {
            var entry = metric.entries.pop();
            if (!entry) {
                return;
            }
            utils_1.logger.log('[Measurements] Adding CLS');
            _this._measurements['cls'] = { value: metric.value };
        });
    };
    /**
     * Capture the information of the user agent.
     */
    MetricsInstrumentation.prototype._trackNavigator = function (transaction) {
        var navigator = global.navigator;
        if (!navigator) {
            return;
        }
        // track network connectivity
        var connection = navigator.connection;
        if (connection) {
            if (connection.effectiveType) {
                transaction.setTag('effectiveConnectionType', connection.effectiveType);
            }
            if (connection.type) {
                transaction.setTag('connectionType', connection.type);
            }
            if (isMeasurementValue(connection.rtt)) {
                this._measurements['connection.rtt'] = { value: connection.rtt };
            }
            if (isMeasurementValue(connection.downlink)) {
                this._measurements['connection.downlink'] = { value: connection.downlink };
            }
        }
        if (isMeasurementValue(navigator.deviceMemory)) {
            transaction.setTag('deviceMemory', String(navigator.deviceMemory));
        }
        if (isMeasurementValue(navigator.hardwareConcurrency)) {
            transaction.setTag('hardwareConcurrency', String(navigator.hardwareConcurrency));
        }
    };
    /** Starts tracking the Largest Contentful Paint on the current page. */
    MetricsInstrumentation.prototype._trackLCP = function () {
        var _this = this;
        getLCP_1.getLCP(function (metric) {
            var entry = metric.entries.pop();
            if (!entry) {
                return;
            }
            var timeOrigin = utils_2.msToSec(performance.timeOrigin);
            var startTime = utils_2.msToSec(entry.startTime);
            utils_1.logger.log('[Measurements] Adding LCP');
            _this._measurements['lcp'] = { value: metric.value };
            _this._measurements['mark.lcp'] = { value: timeOrigin + startTime };
        });
    };
    /** Starts tracking the First Input Delay on the current page. */
    MetricsInstrumentation.prototype._trackFID = function () {
        var _this = this;
        getFID_1.getFID(function (metric) {
            var entry = metric.entries.pop();
            if (!entry) {
                return;
            }
            var timeOrigin = utils_2.msToSec(performance.timeOrigin);
            var startTime = utils_2.msToSec(entry.startTime);
            utils_1.logger.log('[Measurements] Adding FID');
            _this._measurements['fid'] = { value: metric.value };
            _this._measurements['mark.fid'] = { value: timeOrigin + startTime };
        });
    };
    /** Starts tracking the Time to First Byte on the current page. */
    MetricsInstrumentation.prototype._trackTTFB = function () {
        var _this = this;
        getTTFB_1.getTTFB(function (metric) {
            var _a;
            var entry = metric.entries.pop();
            if (!entry) {
                return;
            }
            utils_1.logger.log('[Measurements] Adding TTFB');
            _this._measurements['ttfb'] = { value: metric.value };
            // Capture the time spent making the request and receiving the first byte of the response
            var requestTime = metric.value - (_a = metric.entries[0], (_a !== null && _a !== void 0 ? _a : entry)).requestStart;
            _this._measurements['ttfb.requestTime'] = { value: requestTime };
        });
    };
    return MetricsInstrumentation;
}());
exports.MetricsInstrumentation = MetricsInstrumentation;
/** Instrument navigation entries */
function addNavigationSpans(transaction, entry, timeOrigin) {
    addPerformanceNavigationTiming(transaction, entry, 'unloadEvent', timeOrigin);
    addPerformanceNavigationTiming(transaction, entry, 'redirect', timeOrigin);
    addPerformanceNavigationTiming(transaction, entry, 'domContentLoadedEvent', timeOrigin);
    addPerformanceNavigationTiming(transaction, entry, 'loadEvent', timeOrigin);
    addPerformanceNavigationTiming(transaction, entry, 'connect', timeOrigin);
    addPerformanceNavigationTiming(transaction, entry, 'secureConnection', timeOrigin, 'connectEnd');
    addPerformanceNavigationTiming(transaction, entry, 'fetch', timeOrigin, 'domainLookupStart');
    addPerformanceNavigationTiming(transaction, entry, 'domainLookup', timeOrigin);
    addRequest(transaction, entry, timeOrigin);
}
/** Create measure related spans */
function addMeasureSpans(transaction, entry, startTime, duration, timeOrigin) {
    var measureStartTimestamp = timeOrigin + startTime;
    var measureEndTimestamp = measureStartTimestamp + duration;
    _startChild(transaction, {
        description: entry.name,
        endTimestamp: measureEndTimestamp,
        op: entry.entryType,
        startTimestamp: measureStartTimestamp,
    });
    return measureStartTimestamp;
}
/** Create resource-related spans */
function addResourceSpans(transaction, entry, resourceName, startTime, duration, timeOrigin) {
    // we already instrument based on fetch and xhr, so we don't need to
    // duplicate spans here.
    if (entry.initiatorType === 'xmlhttprequest' || entry.initiatorType === 'fetch') {
        return undefined;
    }
    var data = {};
    if ('transferSize' in entry) {
        data['Transfer Size'] = entry.transferSize;
    }
    if ('encodedBodySize' in entry) {
        data['Encoded Body Size'] = entry.encodedBodySize;
    }
    if ('decodedBodySize' in entry) {
        data['Decoded Body Size'] = entry.decodedBodySize;
    }
    var startTimestamp = timeOrigin + startTime;
    var endTimestamp = startTimestamp + duration;
    _startChild(transaction, {
        description: resourceName,
        endTimestamp: endTimestamp,
        op: entry.initiatorType ? "resource." + entry.initiatorType : 'resource',
        startTimestamp: startTimestamp,
        data: data,
    });
    return endTimestamp;
}
exports.addResourceSpans = addResourceSpans;
/** Create performance navigation related spans */
function addPerformanceNavigationTiming(transaction, entry, event, timeOrigin, eventEnd) {
    var end = eventEnd ? entry[eventEnd] : entry[event + "End"];
    var start = entry[event + "Start"];
    if (!start || !end) {
        return;
    }
    _startChild(transaction, {
        op: 'browser',
        description: event,
        startTimestamp: timeOrigin + utils_2.msToSec(start),
        endTimestamp: timeOrigin + utils_2.msToSec(end),
    });
}
/** Create request and response related spans */
function addRequest(transaction, entry, timeOrigin) {
    _startChild(transaction, {
        op: 'browser',
        description: 'request',
        startTimestamp: timeOrigin + utils_2.msToSec(entry.requestStart),
        endTimestamp: timeOrigin + utils_2.msToSec(entry.responseEnd),
    });
    _startChild(transaction, {
        op: 'browser',
        description: 'response',
        startTimestamp: timeOrigin + utils_2.msToSec(entry.responseStart),
        endTimestamp: timeOrigin + utils_2.msToSec(entry.responseEnd),
    });
}
/**
 * Helper function to start child on transactions. This function will make sure that the transaction will
 * use the start timestamp of the created child span if it is earlier than the transactions actual
 * start timestamp.
 */
function _startChild(transaction, _a) {
    var startTimestamp = _a.startTimestamp, ctx = tslib_1.__rest(_a, ["startTimestamp"]);
    if (startTimestamp && transaction.startTimestamp > startTimestamp) {
        transaction.startTimestamp = startTimestamp;
    }
    return transaction.startChild(tslib_1.__assign({ startTimestamp: startTimestamp }, ctx));
}
exports._startChild = _startChild;
/**
 * Checks if a given value is a valid measurement value.
 */
function isMeasurementValue(value) {
    return typeof value === 'number' && isFinite(value);
}
//# sourceMappingURL=metrics.js.map

/***/ }),

/***/ 7854:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var hub_1 = __nccwpck_require__(6393);
var utils_1 = __nccwpck_require__(1620);
var utils_2 = __nccwpck_require__(1386);
exports.DEFAULT_TRACING_ORIGINS = ['localhost', /^\//];
exports.defaultRequestInstrumentationOptions = {
    traceFetch: true,
    traceXHR: true,
    tracingOrigins: exports.DEFAULT_TRACING_ORIGINS,
};
/** Registers span creators for xhr and fetch requests  */
function instrumentOutgoingRequests(_options) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    var _a = tslib_1.__assign(tslib_1.__assign({}, exports.defaultRequestInstrumentationOptions), _options), traceFetch = _a.traceFetch, traceXHR = _a.traceXHR, tracingOrigins = _a.tracingOrigins, shouldCreateSpanForRequest = _a.shouldCreateSpanForRequest;
    // We should cache url -> decision so that we don't have to compute
    // regexp everytime we create a request.
    var urlMap = {};
    var defaultShouldCreateSpan = function (url) {
        if (urlMap[url]) {
            return urlMap[url];
        }
        var origins = tracingOrigins;
        urlMap[url] =
            origins.some(function (origin) { return utils_1.isMatchingPattern(url, origin); }) &&
                !utils_1.isMatchingPattern(url, 'sentry_key');
        return urlMap[url];
    };
    // We want that our users don't have to re-implement shouldCreateSpanForRequest themselves
    // That's why we filter out already unwanted Spans from tracingOrigins
    var shouldCreateSpan = defaultShouldCreateSpan;
    if (typeof shouldCreateSpanForRequest === 'function') {
        shouldCreateSpan = function (url) {
            return defaultShouldCreateSpan(url) && shouldCreateSpanForRequest(url);
        };
    }
    var spans = {};
    if (traceFetch) {
        utils_1.addInstrumentationHandler({
            callback: function (handlerData) {
                fetchCallback(handlerData, shouldCreateSpan, spans);
            },
            type: 'fetch',
        });
    }
    if (traceXHR) {
        utils_1.addInstrumentationHandler({
            callback: function (handlerData) {
                xhrCallback(handlerData, shouldCreateSpan, spans);
            },
            type: 'xhr',
        });
    }
}
exports.instrumentOutgoingRequests = instrumentOutgoingRequests;
/**
 * Create and track fetch request spans
 */
function fetchCallback(handlerData, shouldCreateSpan, spans) {
    var _a;
    var currentClientOptions = (_a = hub_1.getCurrentHub()
        .getClient()) === null || _a === void 0 ? void 0 : _a.getOptions();
    if (!(currentClientOptions && utils_2.hasTracingEnabled(currentClientOptions)) ||
        !(handlerData.fetchData && shouldCreateSpan(handlerData.fetchData.url))) {
        return;
    }
    if (handlerData.endTimestamp && handlerData.fetchData.__span) {
        var span = spans[handlerData.fetchData.__span];
        if (span) {
            var response = handlerData.response;
            if (response) {
                // TODO (kmclb) remove this once types PR goes through
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                span.setHttpStatus(response.status);
            }
            span.finish();
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete spans[handlerData.fetchData.__span];
        }
        return;
    }
    var activeTransaction = utils_2.getActiveTransaction();
    if (activeTransaction) {
        var span = activeTransaction.startChild({
            data: tslib_1.__assign(tslib_1.__assign({}, handlerData.fetchData), { type: 'fetch' }),
            description: handlerData.fetchData.method + " " + handlerData.fetchData.url,
            op: 'http',
        });
        handlerData.fetchData.__span = span.spanId;
        spans[span.spanId] = span;
        var request = (handlerData.args[0] = handlerData.args[0]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        var options = (handlerData.args[1] = handlerData.args[1] || {});
        var headers = options.headers;
        if (utils_1.isInstanceOf(request, Request)) {
            headers = request.headers;
        }
        if (headers) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (typeof headers.append === 'function') {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                headers.append('sentry-trace', span.toTraceparent());
            }
            else if (Array.isArray(headers)) {
                headers = tslib_1.__spread(headers, [['sentry-trace', span.toTraceparent()]]);
            }
            else {
                headers = tslib_1.__assign(tslib_1.__assign({}, headers), { 'sentry-trace': span.toTraceparent() });
            }
        }
        else {
            headers = { 'sentry-trace': span.toTraceparent() };
        }
        options.headers = headers;
    }
}
exports.fetchCallback = fetchCallback;
/**
 * Create and track xhr request spans
 */
function xhrCallback(handlerData, shouldCreateSpan, spans) {
    var _a;
    var currentClientOptions = (_a = hub_1.getCurrentHub()
        .getClient()) === null || _a === void 0 ? void 0 : _a.getOptions();
    if (!(currentClientOptions && utils_2.hasTracingEnabled(currentClientOptions)) ||
        !(handlerData.xhr && handlerData.xhr.__sentry_xhr__ && shouldCreateSpan(handlerData.xhr.__sentry_xhr__.url)) ||
        handlerData.xhr.__sentry_own_request__) {
        return;
    }
    var xhr = handlerData.xhr.__sentry_xhr__;
    // check first if the request has finished and is tracked by an existing span which should now end
    if (handlerData.endTimestamp && handlerData.xhr.__sentry_xhr_span_id__) {
        var span = spans[handlerData.xhr.__sentry_xhr_span_id__];
        if (span) {
            span.setHttpStatus(xhr.status_code);
            span.finish();
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete spans[handlerData.xhr.__sentry_xhr_span_id__];
        }
        return;
    }
    // if not, create a new span to track it
    var activeTransaction = utils_2.getActiveTransaction();
    if (activeTransaction) {
        var span = activeTransaction.startChild({
            data: tslib_1.__assign(tslib_1.__assign({}, xhr.data), { type: 'xhr', method: xhr.method, url: xhr.url }),
            description: xhr.method + " " + xhr.url,
            op: 'http',
        });
        handlerData.xhr.__sentry_xhr_span_id__ = span.spanId;
        spans[handlerData.xhr.__sentry_xhr_span_id__] = span;
        if (handlerData.xhr.setRequestHeader) {
            try {
                handlerData.xhr.setRequestHeader('sentry-trace', span.toTraceparent());
            }
            catch (_) {
                // Error: InvalidStateError: Failed to execute 'setRequestHeader' on 'XMLHttpRequest': The object's state must be OPENED.
            }
        }
    }
}
exports.xhrCallback = xhrCallback;
//# sourceMappingURL=request.js.map

/***/ }),

/***/ 348:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __nccwpck_require__(1620);
var global = utils_1.getGlobalObject();
/**
 * Default function implementing pageload and navigation transactions
 */
function instrumentRoutingWithDefaults(customStartTransaction, startTransactionOnPageLoad, startTransactionOnLocationChange) {
    if (startTransactionOnPageLoad === void 0) { startTransactionOnPageLoad = true; }
    if (startTransactionOnLocationChange === void 0) { startTransactionOnLocationChange = true; }
    if (!global || !global.location) {
        utils_1.logger.warn('Could not initialize routing instrumentation due to invalid location');
        return;
    }
    var startingUrl = global.location.href;
    var activeTransaction;
    if (startTransactionOnPageLoad) {
        activeTransaction = customStartTransaction({ name: global.location.pathname, op: 'pageload' });
    }
    if (startTransactionOnLocationChange) {
        utils_1.addInstrumentationHandler({
            callback: function (_a) {
                var to = _a.to, from = _a.from;
                /**
                 * This early return is there to account for some cases where a navigation transaction starts right after
                 * long-running pageload. We make sure that if `from` is undefined and a valid `startingURL` exists, we don't
                 * create an uneccessary navigation transaction.
                 *
                 * This was hard to duplicate, but this behavior stopped as soon as this fix was applied. This issue might also
                 * only be caused in certain development environments where the usage of a hot module reloader is causing
                 * errors.
                 */
                if (from === undefined && startingUrl && startingUrl.indexOf(to) !== -1) {
                    startingUrl = undefined;
                    return;
                }
                if (from !== to) {
                    startingUrl = undefined;
                    if (activeTransaction) {
                        utils_1.logger.log("[Tracing] Finishing current transaction with op: " + activeTransaction.op);
                        // If there's an open transaction on the scope, we need to finish it before creating an new one.
                        activeTransaction.finish();
                    }
                    activeTransaction = customStartTransaction({ name: global.location.pathname, op: 'navigation' });
                }
            },
            type: 'history',
        });
    }
}
exports.instrumentRoutingWithDefaults = instrumentRoutingWithDefaults;
//# sourceMappingURL=router.js.map

/***/ }),

/***/ 6982:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
var bindReporter_1 = __nccwpck_require__(4592);
var initMetric_1 = __nccwpck_require__(5300);
var observe_1 = __nccwpck_require__(7984);
var onHidden_1 = __nccwpck_require__(9658);
exports.getCLS = function (onReport, reportAllChanges) {
    if (reportAllChanges === void 0) { reportAllChanges = false; }
    var metric = initMetric_1.initMetric('CLS', 0);
    var report;
    var entryHandler = function (entry) {
        // Only count layout shifts without recent user input.
        if (!entry.hadRecentInput) {
            metric.value += entry.value;
            metric.entries.push(entry);
            report();
        }
    };
    var po = observe_1.observe('layout-shift', entryHandler);
    if (po) {
        report = bindReporter_1.bindReporter(onReport, metric, po, reportAllChanges);
        onHidden_1.onHidden(function (_a) {
            var isUnloading = _a.isUnloading;
            po.takeRecords().map(entryHandler);
            if (isUnloading) {
                metric.isFinal = true;
            }
            report();
        });
    }
};
//# sourceMappingURL=getCLS.js.map

/***/ }),

/***/ 2496:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
var bindReporter_1 = __nccwpck_require__(4592);
var getFirstHidden_1 = __nccwpck_require__(8493);
var initMetric_1 = __nccwpck_require__(5300);
var observe_1 = __nccwpck_require__(7984);
var onHidden_1 = __nccwpck_require__(9658);
exports.getFID = function (onReport) {
    var metric = initMetric_1.initMetric('FID');
    var firstHidden = getFirstHidden_1.getFirstHidden();
    var entryHandler = function (entry) {
        // Only report if the page wasn't hidden prior to the first input.
        if (entry.startTime < firstHidden.timeStamp) {
            metric.value = entry.processingStart - entry.startTime;
            metric.entries.push(entry);
            metric.isFinal = true;
            report();
        }
    };
    var po = observe_1.observe('first-input', entryHandler);
    var report = bindReporter_1.bindReporter(onReport, metric, po);
    if (po) {
        onHidden_1.onHidden(function () {
            po.takeRecords().map(entryHandler);
            po.disconnect();
        }, true);
    }
    else {
        if (window.perfMetrics && window.perfMetrics.onFirstInputDelay) {
            window.perfMetrics.onFirstInputDelay(function (value, event) {
                // Only report if the page wasn't hidden prior to the first input.
                if (event.timeStamp < firstHidden.timeStamp) {
                    metric.value = value;
                    metric.isFinal = true;
                    metric.entries = [
                        {
                            entryType: 'first-input',
                            name: event.type,
                            target: event.target,
                            cancelable: event.cancelable,
                            startTime: event.timeStamp,
                            processingStart: event.timeStamp + value,
                        },
                    ];
                    report();
                }
            });
        }
    }
};
//# sourceMappingURL=getFID.js.map

/***/ }),

/***/ 9382:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
var bindReporter_1 = __nccwpck_require__(4592);
var getFirstHidden_1 = __nccwpck_require__(8493);
var initMetric_1 = __nccwpck_require__(5300);
var observe_1 = __nccwpck_require__(7984);
var onHidden_1 = __nccwpck_require__(9658);
var whenInput_1 = __nccwpck_require__(5181);
exports.getLCP = function (onReport, reportAllChanges) {
    if (reportAllChanges === void 0) { reportAllChanges = false; }
    var metric = initMetric_1.initMetric('LCP');
    var firstHidden = getFirstHidden_1.getFirstHidden();
    var report;
    var entryHandler = function (entry) {
        // The startTime attribute returns the value of the renderTime if it is not 0,
        // and the value of the loadTime otherwise.
        var value = entry.startTime;
        // If the page was hidden prior to paint time of the entry,
        // ignore it and mark the metric as final, otherwise add the entry.
        if (value < firstHidden.timeStamp) {
            metric.value = value;
            metric.entries.push(entry);
        }
        else {
            metric.isFinal = true;
        }
        report();
    };
    var po = observe_1.observe('largest-contentful-paint', entryHandler);
    if (po) {
        report = bindReporter_1.bindReporter(onReport, metric, po, reportAllChanges);
        var onFinal = function () {
            if (!metric.isFinal) {
                po.takeRecords().map(entryHandler);
                metric.isFinal = true;
                report();
            }
        };
        void whenInput_1.whenInput().then(onFinal);
        onHidden_1.onHidden(onFinal, true);
    }
};
//# sourceMappingURL=getLCP.js.map

/***/ }),

/***/ 5909:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __nccwpck_require__(1620);
var initMetric_1 = __nccwpck_require__(5300);
var global = utils_1.getGlobalObject();
var afterLoad = function (callback) {
    if (document.readyState === 'complete') {
        // Queue a task so the callback runs after `loadEventEnd`.
        setTimeout(callback, 0);
    }
    else {
        // Use `pageshow` so the callback runs after `loadEventEnd`.
        addEventListener('pageshow', callback);
    }
};
var getNavigationEntryFromPerformanceTiming = function () {
    // Really annoying that TypeScript errors when using `PerformanceTiming`.
    // eslint-disable-next-line deprecation/deprecation
    var timing = global.performance.timing;
    var navigationEntry = {
        entryType: 'navigation',
        startTime: 0,
    };
    for (var key in timing) {
        if (key !== 'navigationStart' && key !== 'toJSON') {
            navigationEntry[key] = Math.max(timing[key] - timing.navigationStart, 0);
        }
    }
    return navigationEntry;
};
exports.getTTFB = function (onReport) {
    var metric = initMetric_1.initMetric('TTFB');
    afterLoad(function () {
        try {
            // Use the NavigationTiming L2 entry if available.
            var navigationEntry = global.performance.getEntriesByType('navigation')[0] || getNavigationEntryFromPerformanceTiming();
            metric.value = metric.delta = navigationEntry.responseStart;
            metric.entries = [navigationEntry];
            onReport(metric);
        }
        catch (error) {
            // Do nothing.
        }
    });
};
//# sourceMappingURL=getTTFB.js.map

/***/ }),

/***/ 4592:
/***/ ((__unused_webpack_module, exports) => {

/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.bindReporter = function (callback, metric, po, observeAllUpdates) {
    var prevValue;
    return function () {
        if (po && metric.isFinal) {
            po.disconnect();
        }
        if (metric.value >= 0) {
            if (observeAllUpdates || metric.isFinal || document.visibilityState === 'hidden') {
                metric.delta = metric.value - (prevValue || 0);
                // Report the metric if there's a non-zero delta, if the metric is
                // final, or if no previous value exists (which can happen in the case
                // of the document becoming hidden when the metric value is 0).
                // See: https://github.com/GoogleChrome/web-vitals/issues/14
                if (metric.delta || metric.isFinal || prevValue === undefined) {
                    callback(metric);
                    prevValue = metric.value;
                }
            }
        }
    };
};
//# sourceMappingURL=bindReporter.js.map

/***/ }),

/***/ 93:
/***/ ((__unused_webpack_module, exports) => {

/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * Performantly generate a unique, 27-char string by combining the current
 * timestamp with a 13-digit random number.
 * @return {string}
 */
exports.generateUniqueID = function () {
    return Date.now() + "-" + (Math.floor(Math.random() * (9e12 - 1)) + 1e12);
};
//# sourceMappingURL=generateUniqueID.js.map

/***/ }),

/***/ 8493:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
var onHidden_1 = __nccwpck_require__(9658);
var firstHiddenTime;
exports.getFirstHidden = function () {
    if (firstHiddenTime === undefined) {
        // If the document is hidden when this code runs, assume it was hidden
        // since navigation start. This isn't a perfect heuristic, but it's the
        // best we can do until an API is available to support querying past
        // visibilityState.
        firstHiddenTime = document.visibilityState === 'hidden' ? 0 : Infinity;
        // Update the time if/when the document becomes hidden.
        onHidden_1.onHidden(function (_a) {
            var timeStamp = _a.timeStamp;
            return (firstHiddenTime = timeStamp);
        }, true);
    }
    return {
        get timeStamp() {
            return firstHiddenTime;
        },
    };
};
//# sourceMappingURL=getFirstHidden.js.map

/***/ }),

/***/ 5300:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
var generateUniqueID_1 = __nccwpck_require__(93);
exports.initMetric = function (name, value) {
    if (value === void 0) { value = -1; }
    return {
        name: name,
        value: value,
        delta: 0,
        entries: [],
        id: generateUniqueID_1.generateUniqueID(),
        isFinal: false,
    };
};
//# sourceMappingURL=initMetric.js.map

/***/ }),

/***/ 7984:
/***/ ((__unused_webpack_module, exports) => {

/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * Takes a performance entry type and a callback function, and creates a
 * `PerformanceObserver` instance that will observe the specified entry type
 * with buffering enabled and call the callback _for each entry_.
 *
 * This function also feature-detects entry support and wraps the logic in a
 * try/catch to avoid errors in unsupporting browsers.
 */
exports.observe = function (type, callback) {
    try {
        if (PerformanceObserver.supportedEntryTypes.includes(type)) {
            var po = new PerformanceObserver(function (l) { return l.getEntries().map(callback); });
            po.observe({ type: type, buffered: true });
            return po;
        }
    }
    catch (e) {
        // Do nothing.
    }
    return;
};
//# sourceMappingURL=observe.js.map

/***/ }),

/***/ 9658:
/***/ ((__unused_webpack_module, exports) => {

/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
var isUnloading = false;
var listenersAdded = false;
var onPageHide = function (event) {
    isUnloading = !event.persisted;
};
var addListeners = function () {
    addEventListener('pagehide', onPageHide);
    // `beforeunload` is needed to fix this bug:
    // https://bugs.chromium.org/p/chromium/issues/detail?id=987409
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    addEventListener('beforeunload', function () { });
};
exports.onHidden = function (cb, once) {
    if (once === void 0) { once = false; }
    if (!listenersAdded) {
        addListeners();
        listenersAdded = true;
    }
    addEventListener('visibilitychange', function (_a) {
        var timeStamp = _a.timeStamp;
        if (document.visibilityState === 'hidden') {
            cb({ timeStamp: timeStamp, isUnloading: isUnloading });
        }
    }, { capture: true, once: once });
};
//# sourceMappingURL=onHidden.js.map

/***/ }),

/***/ 5181:
/***/ ((__unused_webpack_module, exports) => {

/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
var inputPromise;
exports.whenInput = function () {
    if (!inputPromise) {
        inputPromise = new Promise(function (r) {
            return ['scroll', 'keydown', 'pointerdown'].map(function (type) {
                addEventListener(type, r, {
                    once: true,
                    passive: true,
                    capture: true,
                });
            });
        });
    }
    return inputPromise;
};
//# sourceMappingURL=whenInput.js.map

/***/ }),

/***/ 7906:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __nccwpck_require__(1620);
var spanstatus_1 = __nccwpck_require__(8522);
var utils_2 = __nccwpck_require__(1386);
/**
 * Configures global error listeners
 */
function registerErrorInstrumentation() {
    utils_1.addInstrumentationHandler({
        callback: errorCallback,
        type: 'error',
    });
    utils_1.addInstrumentationHandler({
        callback: errorCallback,
        type: 'unhandledrejection',
    });
}
exports.registerErrorInstrumentation = registerErrorInstrumentation;
/**
 * If an error or unhandled promise occurs, we mark the active transaction as failed
 */
function errorCallback() {
    var activeTransaction = utils_2.getActiveTransaction();
    if (activeTransaction) {
        utils_1.logger.log("[Tracing] Transaction: " + spanstatus_1.SpanStatus.InternalError + " -> Global error occured");
        activeTransaction.setStatus(spanstatus_1.SpanStatus.InternalError);
    }
}
//# sourceMappingURL=errors.js.map

/***/ }),

/***/ 1409:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var hub_1 = __nccwpck_require__(6393);
var types_1 = __nccwpck_require__(3789);
var utils_1 = __nccwpck_require__(1620);
var errors_1 = __nccwpck_require__(7906);
var idletransaction_1 = __nccwpck_require__(2171);
var transaction_1 = __nccwpck_require__(8186);
var utils_2 = __nccwpck_require__(1386);
/** Returns all trace headers that are currently on the top scope. */
function traceHeaders() {
    var scope = this.getScope();
    if (scope) {
        var span = scope.getSpan();
        if (span) {
            return {
                'sentry-trace': span.toTraceparent(),
            };
        }
    }
    return {};
}
/**
 * Makes a sampling decision for the given transaction and stores it on the transaction.
 *
 * Called every time a transaction is created. Only transactions which emerge with a `sampled` value of `true` will be
 * sent to Sentry.
 *
 * @param hub: The hub off of which to read config options
 * @param transaction: The transaction needing a sampling decision
 * @param samplingContext: Default and user-provided data which may be used to help make the decision
 *
 * @returns The given transaction with its `sampled` value set
 */
function sample(transaction, options, samplingContext) {
    // nothing to do if tracing is not enabled
    if (!utils_2.hasTracingEnabled(options)) {
        transaction.sampled = false;
        return transaction;
    }
    // if the user has forced a sampling decision by passing a `sampled` value in their transaction context, go with that
    if (transaction.sampled !== undefined) {
        transaction.setMetadata({
            transactionSampling: { method: types_1.TransactionSamplingMethod.Explicit },
        });
        return transaction;
    }
    // we would have bailed already if neither `tracesSampler` nor `tracesSampleRate` were defined, so one of these should
    // work; prefer the hook if so
    var sampleRate;
    if (typeof options.tracesSampler === 'function') {
        sampleRate = options.tracesSampler(samplingContext);
        transaction.setMetadata({
            transactionSampling: {
                method: types_1.TransactionSamplingMethod.Sampler,
                // cast to number in case it's a boolean
                rate: Number(sampleRate),
            },
        });
    }
    else if (samplingContext.parentSampled !== undefined) {
        sampleRate = samplingContext.parentSampled;
        transaction.setMetadata({
            transactionSampling: { method: types_1.TransactionSamplingMethod.Inheritance },
        });
    }
    else {
        sampleRate = options.tracesSampleRate;
        transaction.setMetadata({
            transactionSampling: {
                method: types_1.TransactionSamplingMethod.Rate,
                // cast to number in case it's a boolean
                rate: Number(sampleRate),
            },
        });
    }
    // Since this is coming from the user (or from a function provided by the user), who knows what we might get. (The
    // only valid values are booleans or numbers between 0 and 1.)
    if (!isValidSampleRate(sampleRate)) {
        utils_1.logger.warn("[Tracing] Discarding transaction because of invalid sample rate.");
        transaction.sampled = false;
        return transaction;
    }
    // if the function returned 0 (or false), or if `tracesSampleRate` is 0, it's a sign the transaction should be dropped
    if (!sampleRate) {
        utils_1.logger.log("[Tracing] Discarding transaction because " + (typeof options.tracesSampler === 'function'
            ? 'tracesSampler returned 0 or false'
            : 'a negative sampling decision was inherited or tracesSampleRate is set to 0'));
        transaction.sampled = false;
        return transaction;
    }
    // Now we roll the dice. Math.random is inclusive of 0, but not of 1, so strict < is safe here. In case sampleRate is
    // a boolean, the < comparison will cause it to be automatically cast to 1 if it's true and 0 if it's false.
    transaction.sampled = Math.random() < sampleRate;
    // if we're not going to keep it, we're done
    if (!transaction.sampled) {
        utils_1.logger.log("[Tracing] Discarding transaction because it's not included in the random sample (sampling rate = " + Number(sampleRate) + ")");
        return transaction;
    }
    utils_1.logger.log("[Tracing] starting " + transaction.op + " transaction - " + transaction.name);
    return transaction;
}
/**
 * Checks the given sample rate to make sure it is valid type and value (a boolean, or a number between 0 and 1).
 */
function isValidSampleRate(rate) {
    // we need to check NaN explicitly because it's of type 'number' and therefore wouldn't get caught by this typecheck
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (isNaN(rate) || !(typeof rate === 'number' || typeof rate === 'boolean')) {
        utils_1.logger.warn("[Tracing] Given sample rate is invalid. Sample rate must be a boolean or a number between 0 and 1. Got " + JSON.stringify(rate) + " of type " + JSON.stringify(typeof rate) + ".");
        return false;
    }
    // in case sampleRate is a boolean, it will get automatically cast to 1 if it's true and 0 if it's false
    if (rate < 0 || rate > 1) {
        utils_1.logger.warn("[Tracing] Given sample rate is invalid. Sample rate must be between 0 and 1. Got " + rate + ".");
        return false;
    }
    return true;
}
/**
 * Creates a new transaction and adds a sampling decision if it doesn't yet have one.
 *
 * The Hub.startTransaction method delegates to this method to do its work, passing the Hub instance in as `this`, as if
 * it had been called on the hub directly. Exists as a separate function so that it can be injected into the class as an
 * "extension method."
 *
 * @param this: The Hub starting the transaction
 * @param transactionContext: Data used to configure the transaction
 * @param CustomSamplingContext: Optional data to be provided to the `tracesSampler` function (if any)
 *
 * @returns The new transaction
 *
 * @see {@link Hub.startTransaction}
 */
function _startTransaction(transactionContext, customSamplingContext) {
    var _a, _b;
    var options = ((_a = this.getClient()) === null || _a === void 0 ? void 0 : _a.getOptions()) || {};
    var transaction = new transaction_1.Transaction(transactionContext, this);
    transaction = sample(transaction, options, tslib_1.__assign({ parentSampled: transactionContext.parentSampled, transactionContext: transactionContext }, customSamplingContext));
    if (transaction.sampled) {
        transaction.initSpanRecorder((_b = options._experiments) === null || _b === void 0 ? void 0 : _b.maxSpans);
    }
    return transaction;
}
/**
 * Create new idle transaction.
 */
function startIdleTransaction(hub, transactionContext, idleTimeout, onScope, customSamplingContext) {
    var _a, _b;
    var options = ((_a = hub.getClient()) === null || _a === void 0 ? void 0 : _a.getOptions()) || {};
    var transaction = new idletransaction_1.IdleTransaction(transactionContext, hub, idleTimeout, onScope);
    transaction = sample(transaction, options, tslib_1.__assign({ parentSampled: transactionContext.parentSampled, transactionContext: transactionContext }, customSamplingContext));
    if (transaction.sampled) {
        transaction.initSpanRecorder((_b = options._experiments) === null || _b === void 0 ? void 0 : _b.maxSpans);
    }
    return transaction;
}
exports.startIdleTransaction = startIdleTransaction;
/**
 * @private
 */
function _addTracingExtensions() {
    var carrier = hub_1.getMainCarrier();
    if (carrier.__SENTRY__) {
        carrier.__SENTRY__.extensions = carrier.__SENTRY__.extensions || {};
        if (!carrier.__SENTRY__.extensions.startTransaction) {
            carrier.__SENTRY__.extensions.startTransaction = _startTransaction;
        }
        if (!carrier.__SENTRY__.extensions.traceHeaders) {
            carrier.__SENTRY__.extensions.traceHeaders = traceHeaders;
        }
    }
}
exports._addTracingExtensions = _addTracingExtensions;
/**
 * This patches the global object and injects the Tracing extensions methods
 */
function addExtensionMethods() {
    _addTracingExtensions();
    // If an error happens globally, we should make sure transaction status is set to error.
    errors_1.registerErrorInstrumentation();
}
exports.addExtensionMethods = addExtensionMethods;
//# sourceMappingURL=hubextensions.js.map

/***/ }),

/***/ 2171:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var utils_1 = __nccwpck_require__(1620);
var span_1 = __nccwpck_require__(4655);
var spanstatus_1 = __nccwpck_require__(8522);
var transaction_1 = __nccwpck_require__(8186);
exports.DEFAULT_IDLE_TIMEOUT = 1000;
/**
 * @inheritDoc
 */
var IdleTransactionSpanRecorder = /** @class */ (function (_super) {
    tslib_1.__extends(IdleTransactionSpanRecorder, _super);
    function IdleTransactionSpanRecorder(_pushActivity, _popActivity, transactionSpanId, maxlen) {
        if (transactionSpanId === void 0) { transactionSpanId = ''; }
        var _this = _super.call(this, maxlen) || this;
        _this._pushActivity = _pushActivity;
        _this._popActivity = _popActivity;
        _this.transactionSpanId = transactionSpanId;
        return _this;
    }
    /**
     * @inheritDoc
     */
    IdleTransactionSpanRecorder.prototype.add = function (span) {
        var _this = this;
        // We should make sure we do not push and pop activities for
        // the transaction that this span recorder belongs to.
        if (span.spanId !== this.transactionSpanId) {
            // We patch span.finish() to pop an activity after setting an endTimestamp.
            span.finish = function (endTimestamp) {
                span.endTimestamp = typeof endTimestamp === 'number' ? endTimestamp : utils_1.timestampWithMs();
                _this._popActivity(span.spanId);
            };
            // We should only push new activities if the span does not have an end timestamp.
            if (span.endTimestamp === undefined) {
                this._pushActivity(span.spanId);
            }
        }
        _super.prototype.add.call(this, span);
    };
    return IdleTransactionSpanRecorder;
}(span_1.SpanRecorder));
exports.IdleTransactionSpanRecorder = IdleTransactionSpanRecorder;
/**
 * An IdleTransaction is a transaction that automatically finishes. It does this by tracking child spans as activities.
 * You can have multiple IdleTransactions active, but if the `onScope` option is specified, the idle transaction will
 * put itself on the scope on creation.
 */
var IdleTransaction = /** @class */ (function (_super) {
    tslib_1.__extends(IdleTransaction, _super);
    function IdleTransaction(transactionContext, _idleHub, 
    // The time to wait in ms until the idle transaction will be finished. Default: 1000
    _idleTimeout, 
    // If an idle transaction should be put itself on and off the scope automatically.
    _onScope) {
        if (_idleTimeout === void 0) { _idleTimeout = exports.DEFAULT_IDLE_TIMEOUT; }
        if (_onScope === void 0) { _onScope = false; }
        var _this = _super.call(this, transactionContext, _idleHub) || this;
        _this._idleHub = _idleHub;
        _this._idleTimeout = _idleTimeout;
        _this._onScope = _onScope;
        // Activities store a list of active spans
        _this.activities = {};
        // Stores reference to the timeout that calls _beat().
        _this._heartbeatTimer = 0;
        // Amount of times heartbeat has counted. Will cause transaction to finish after 3 beats.
        _this._heartbeatCounter = 0;
        // We should not use heartbeat if we finished a transaction
        _this._finished = false;
        _this._beforeFinishCallbacks = [];
        if (_idleHub && _onScope) {
            // There should only be one active transaction on the scope
            clearActiveTransaction(_idleHub);
            // We set the transaction here on the scope so error events pick up the trace
            // context and attach it to the error.
            utils_1.logger.log("Setting idle transaction on scope. Span ID: " + _this.spanId);
            _idleHub.configureScope(function (scope) { return scope.setSpan(_this); });
        }
        _this._initTimeout = setTimeout(function () {
            if (!_this._finished) {
                _this.finish();
            }
        }, _this._idleTimeout);
        return _this;
    }
    /** {@inheritDoc} */
    IdleTransaction.prototype.finish = function (endTimestamp) {
        var e_1, _a;
        var _this = this;
        if (endTimestamp === void 0) { endTimestamp = utils_1.timestampWithMs(); }
        this._finished = true;
        this.activities = {};
        if (this.spanRecorder) {
            utils_1.logger.log('[Tracing] finishing IdleTransaction', new Date(endTimestamp * 1000).toISOString(), this.op);
            try {
                for (var _b = tslib_1.__values(this._beforeFinishCallbacks), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var callback = _c.value;
                    callback(this, endTimestamp);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            this.spanRecorder.spans = this.spanRecorder.spans.filter(function (span) {
                // If we are dealing with the transaction itself, we just return it
                if (span.spanId === _this.spanId) {
                    return true;
                }
                // We cancel all pending spans with status "cancelled" to indicate the idle transaction was finished early
                if (!span.endTimestamp) {
                    span.endTimestamp = endTimestamp;
                    span.setStatus(spanstatus_1.SpanStatus.Cancelled);
                    utils_1.logger.log('[Tracing] cancelling span since transaction ended early', JSON.stringify(span, undefined, 2));
                }
                var keepSpan = span.startTimestamp < endTimestamp;
                if (!keepSpan) {
                    utils_1.logger.log('[Tracing] discarding Span since it happened after Transaction was finished', JSON.stringify(span, undefined, 2));
                }
                return keepSpan;
            });
            utils_1.logger.log('[Tracing] flushing IdleTransaction');
        }
        else {
            utils_1.logger.log('[Tracing] No active IdleTransaction');
        }
        // this._onScope is true if the transaction was previously on the scope.
        if (this._onScope) {
            clearActiveTransaction(this._idleHub);
        }
        return _super.prototype.finish.call(this, endTimestamp);
    };
    /**
     * Register a callback function that gets excecuted before the transaction finishes.
     * Useful for cleanup or if you want to add any additional spans based on current context.
     *
     * This is exposed because users have no other way of running something before an idle transaction
     * finishes.
     */
    IdleTransaction.prototype.registerBeforeFinishCallback = function (callback) {
        this._beforeFinishCallbacks.push(callback);
    };
    /**
     * @inheritDoc
     */
    IdleTransaction.prototype.initSpanRecorder = function (maxlen) {
        var _this = this;
        if (!this.spanRecorder) {
            var pushActivity = function (id) {
                if (_this._finished) {
                    return;
                }
                _this._pushActivity(id);
            };
            var popActivity = function (id) {
                if (_this._finished) {
                    return;
                }
                _this._popActivity(id);
            };
            this.spanRecorder = new IdleTransactionSpanRecorder(pushActivity, popActivity, this.spanId, maxlen);
            // Start heartbeat so that transactions do not run forever.
            utils_1.logger.log('Starting heartbeat');
            this._pingHeartbeat();
        }
        this.spanRecorder.add(this);
    };
    /**
     * Start tracking a specific activity.
     * @param spanId The span id that represents the activity
     */
    IdleTransaction.prototype._pushActivity = function (spanId) {
        if (this._initTimeout) {
            clearTimeout(this._initTimeout);
            this._initTimeout = undefined;
        }
        utils_1.logger.log("[Tracing] pushActivity: " + spanId);
        this.activities[spanId] = true;
        utils_1.logger.log('[Tracing] new activities count', Object.keys(this.activities).length);
    };
    /**
     * Remove an activity from usage
     * @param spanId The span id that represents the activity
     */
    IdleTransaction.prototype._popActivity = function (spanId) {
        var _this = this;
        if (this.activities[spanId]) {
            utils_1.logger.log("[Tracing] popActivity " + spanId);
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete this.activities[spanId];
            utils_1.logger.log('[Tracing] new activities count', Object.keys(this.activities).length);
        }
        if (Object.keys(this.activities).length === 0) {
            var timeout = this._idleTimeout;
            // We need to add the timeout here to have the real endtimestamp of the transaction
            // Remember timestampWithMs is in seconds, timeout is in ms
            var end_1 = utils_1.timestampWithMs() + timeout / 1000;
            setTimeout(function () {
                if (!_this._finished) {
                    _this.finish(end_1);
                }
            }, timeout);
        }
    };
    /**
     * Checks when entries of this.activities are not changing for 3 beats.
     * If this occurs we finish the transaction.
     */
    IdleTransaction.prototype._beat = function () {
        clearTimeout(this._heartbeatTimer);
        // We should not be running heartbeat if the idle transaction is finished.
        if (this._finished) {
            return;
        }
        var keys = Object.keys(this.activities);
        var heartbeatString = keys.length ? keys.reduce(function (prev, current) { return prev + current; }) : '';
        if (heartbeatString === this._prevHeartbeatString) {
            this._heartbeatCounter += 1;
        }
        else {
            this._heartbeatCounter = 1;
        }
        this._prevHeartbeatString = heartbeatString;
        if (this._heartbeatCounter >= 3) {
            utils_1.logger.log("[Tracing] Transaction finished because of no change for 3 heart beats");
            this.setStatus(spanstatus_1.SpanStatus.DeadlineExceeded);
            this.setTag('heartbeat', 'failed');
            this.finish();
        }
        else {
            this._pingHeartbeat();
        }
    };
    /**
     * Pings the heartbeat
     */
    IdleTransaction.prototype._pingHeartbeat = function () {
        var _this = this;
        utils_1.logger.log("pinging Heartbeat -> current counter: " + this._heartbeatCounter);
        this._heartbeatTimer = setTimeout(function () {
            _this._beat();
        }, 5000);
    };
    return IdleTransaction;
}(transaction_1.Transaction));
exports.IdleTransaction = IdleTransaction;
/**
 * Reset active transaction on scope
 */
function clearActiveTransaction(hub) {
    if (hub) {
        var scope = hub.getScope();
        if (scope) {
            var transaction = scope.getTransaction();
            if (transaction) {
                scope.setSpan(undefined);
            }
        }
    }
}
//# sourceMappingURL=idletransaction.js.map

/***/ }),

/***/ 4358:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var browser_1 = __nccwpck_require__(1425);
var hubextensions_1 = __nccwpck_require__(1409);
exports.addExtensionMethods = hubextensions_1.addExtensionMethods;
var TracingIntegrations = __nccwpck_require__(8502);
var Integrations = tslib_1.__assign(tslib_1.__assign({}, TracingIntegrations), { BrowserTracing: browser_1.BrowserTracing });
exports.Integrations = Integrations;
var span_1 = __nccwpck_require__(4655);
exports.Span = span_1.Span;
var transaction_1 = __nccwpck_require__(8186);
exports.Transaction = transaction_1.Transaction;
var browser_2 = __nccwpck_require__(1425);
// TODO deprecate old name in v7
exports.registerRequestInstrumentation = browser_2.instrumentOutgoingRequests;
exports.defaultRequestInstrumentationOptions = browser_2.defaultRequestInstrumentationOptions;
var spanstatus_1 = __nccwpck_require__(8522);
exports.SpanStatus = spanstatus_1.SpanStatus;
var idletransaction_1 = __nccwpck_require__(2171);
exports.IdleTransaction = idletransaction_1.IdleTransaction;
var hubextensions_2 = __nccwpck_require__(1409);
exports.startIdleTransaction = hubextensions_2.startIdleTransaction;
// We are patching the global object with our hub extension methods
hubextensions_1.addExtensionMethods();
var utils_1 = __nccwpck_require__(1386);
exports.extractTraceparentData = utils_1.extractTraceparentData;
exports.getActiveTransaction = utils_1.getActiveTransaction;
exports.hasTracingEnabled = utils_1.hasTracingEnabled;
exports.stripUrlQueryAndFragment = utils_1.stripUrlQueryAndFragment;
exports.TRACEPARENT_REGEXP = utils_1.TRACEPARENT_REGEXP;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 6221:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var utils_1 = __nccwpck_require__(1620);
/**
 * Express integration
 *
 * Provides an request and error handler for Express framework as well as tracing capabilities
 */
var Express = /** @class */ (function () {
    /**
     * @inheritDoc
     */
    function Express(options) {
        if (options === void 0) { options = {}; }
        /**
         * @inheritDoc
         */
        this.name = Express.id;
        this._router = options.router || options.app;
        this._methods = (Array.isArray(options.methods) ? options.methods : []).concat('use');
    }
    /**
     * @inheritDoc
     */
    Express.prototype.setupOnce = function () {
        if (!this._router) {
            utils_1.logger.error('ExpressIntegration is missing an Express instance');
            return;
        }
        instrumentMiddlewares(this._router, this._methods);
    };
    /**
     * @inheritDoc
     */
    Express.id = 'Express';
    return Express;
}());
exports.Express = Express;
/**
 * Wraps original middleware function in a tracing call, which stores the info about the call as a span,
 * and finishes it once the middleware is done invoking.
 *
 * Express middlewares have 3 various forms, thus we have to take care of all of them:
 * // sync
 * app.use(function (req, res) { ... })
 * // async
 * app.use(function (req, res, next) { ... })
 * // error handler
 * app.use(function (err, req, res, next) { ... })
 *
 * They all internally delegate to the `router[method]` of the given application instance.
 */
// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
function wrap(fn, method) {
    var arity = fn.length;
    switch (arity) {
        case 2: {
            return function (req, res) {
                var transaction = res.__sentry_transaction;
                if (transaction) {
                    var span_1 = transaction.startChild({
                        description: fn.name,
                        op: "middleware." + method,
                    });
                    res.once('finish', function () {
                        span_1.finish();
                    });
                }
                return fn.call(this, req, res);
            };
        }
        case 3: {
            return function (req, res, next) {
                var _a;
                var transaction = res.__sentry_transaction;
                var span = (_a = transaction) === null || _a === void 0 ? void 0 : _a.startChild({
                    description: fn.name,
                    op: "middleware." + method,
                });
                fn.call(this, req, res, function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    var _a;
                    (_a = span) === null || _a === void 0 ? void 0 : _a.finish();
                    next.call.apply(next, tslib_1.__spread([this], args));
                });
            };
        }
        case 4: {
            return function (err, req, res, next) {
                var _a;
                var transaction = res.__sentry_transaction;
                var span = (_a = transaction) === null || _a === void 0 ? void 0 : _a.startChild({
                    description: fn.name,
                    op: "middleware." + method,
                });
                fn.call(this, err, req, res, function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    var _a;
                    (_a = span) === null || _a === void 0 ? void 0 : _a.finish();
                    next.call.apply(next, tslib_1.__spread([this], args));
                });
            };
        }
        default: {
            throw new Error("Express middleware takes 2-4 arguments. Got: " + arity);
        }
    }
}
/**
 * Takes all the function arguments passed to the original `app` or `router` method, eg. `app.use` or `router.use`
 * and wraps every function, as well as array of functions with a call to our `wrap` method.
 * We have to take care of the arrays as well as iterate over all of the arguments,
 * as `app.use` can accept middlewares in few various forms.
 *
 * app.use([<path>], <fn>)
 * app.use([<path>], <fn>, ...<fn>)
 * app.use([<path>], ...<fn>[])
 */
function wrapMiddlewareArgs(args, method) {
    return args.map(function (arg) {
        if (typeof arg === 'function') {
            return wrap(arg, method);
        }
        if (Array.isArray(arg)) {
            return arg.map(function (a) {
                if (typeof a === 'function') {
                    return wrap(a, method);
                }
                return a;
            });
        }
        return arg;
    });
}
/**
 * Patches original router to utilize our tracing functionality
 */
function patchMiddleware(router, method) {
    var originalCallback = router[method];
    router[method] = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return originalCallback.call.apply(originalCallback, tslib_1.__spread([this], wrapMiddlewareArgs(args, method)));
    };
    return router;
}
/**
 * Patches original router methods
 */
function instrumentMiddlewares(router, methods) {
    if (methods === void 0) { methods = []; }
    methods.forEach(function (method) { return patchMiddleware(router, method); });
}
//# sourceMappingURL=express.js.map

/***/ }),

/***/ 8502:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var express_1 = __nccwpck_require__(6221);
exports.Express = express_1.Express;
var postgres_1 = __nccwpck_require__(1931);
exports.Postgres = postgres_1.Postgres;
var mysql_1 = __nccwpck_require__(5394);
exports.Mysql = mysql_1.Mysql;
var mongo_1 = __nccwpck_require__(2606);
exports.Mongo = mongo_1.Mongo;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 2606:
/***/ ((module, exports, __nccwpck_require__) => {

/* module decorator */ module = __nccwpck_require__.nmd(module);
Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var utils_1 = __nccwpck_require__(1620);
var OPERATIONS = [
    'aggregate',
    'bulkWrite',
    'countDocuments',
    'createIndex',
    'createIndexes',
    'deleteMany',
    'deleteOne',
    'distinct',
    'drop',
    'dropIndex',
    'dropIndexes',
    'estimatedDocumentCount',
    'find',
    'findOne',
    'findOneAndDelete',
    'findOneAndReplace',
    'findOneAndUpdate',
    'indexes',
    'indexExists',
    'indexInformation',
    'initializeOrderedBulkOp',
    'insertMany',
    'insertOne',
    'isCapped',
    'mapReduce',
    'options',
    'parallelCollectionScan',
    'rename',
    'replaceOne',
    'stats',
    'updateMany',
    'updateOne',
];
// All of the operations above take `options` and `callback` as their final parameters, but some of them
// take additional parameters as well. For those operations, this is a map of
// { <operation name>:  [<names of additional parameters>] }, as a way to know what to call the operation's
// positional arguments when we add them to the span's `data` object later
var OPERATION_SIGNATURES = {
    // aggregate intentionally not included because `pipeline` arguments are too complex to serialize well
    // see https://github.com/getsentry/sentry-javascript/pull/3102
    bulkWrite: ['operations'],
    countDocuments: ['query'],
    createIndex: ['fieldOrSpec'],
    createIndexes: ['indexSpecs'],
    deleteMany: ['filter'],
    deleteOne: ['filter'],
    distinct: ['key', 'query'],
    dropIndex: ['indexName'],
    find: ['query'],
    findOne: ['query'],
    findOneAndDelete: ['filter'],
    findOneAndReplace: ['filter', 'replacement'],
    findOneAndUpdate: ['filter', 'update'],
    indexExists: ['indexes'],
    insertMany: ['docs'],
    insertOne: ['doc'],
    mapReduce: ['map', 'reduce'],
    rename: ['newName'],
    replaceOne: ['filter', 'doc'],
    updateMany: ['filter', 'update'],
    updateOne: ['filter', 'update'],
};
/** Tracing integration for mongo package */
var Mongo = /** @class */ (function () {
    /**
     * @inheritDoc
     */
    function Mongo(options) {
        if (options === void 0) { options = {}; }
        /**
         * @inheritDoc
         */
        this.name = Mongo.id;
        this._operations = Array.isArray(options.operations)
            ? options.operations
            : OPERATIONS;
        this._describeOperations = 'describeOperations' in options ? options.describeOperations : true;
        this._useMongoose = !!options.useMongoose;
    }
    /**
     * @inheritDoc
     */
    Mongo.prototype.setupOnce = function (_, getCurrentHub) {
        var collection;
        var moduleName = this._useMongoose ? 'mongoose' : 'mongodb';
        try {
            var mongodbModule = utils_1.dynamicRequire(module, moduleName);
            collection = mongodbModule.Collection;
        }
        catch (e) {
            utils_1.logger.error("Mongo Integration was unable to require `" + moduleName + "` package.");
            return;
        }
        this._instrumentOperations(collection, this._operations, getCurrentHub);
    };
    /**
     * Patches original collection methods
     */
    Mongo.prototype._instrumentOperations = function (collection, operations, getCurrentHub) {
        var _this = this;
        operations.forEach(function (operation) { return _this._patchOperation(collection, operation, getCurrentHub); });
    };
    /**
     * Patches original collection to utilize our tracing functionality
     */
    Mongo.prototype._patchOperation = function (collection, operation, getCurrentHub) {
        if (!(operation in collection.prototype))
            return;
        var getSpanContext = this._getSpanContextFromOperationArguments.bind(this);
        utils_1.fill(collection.prototype, operation, function (orig) {
            return function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var _a, _b, _c, _d;
                var lastArg = args[args.length - 1];
                var scope = getCurrentHub().getScope();
                var parentSpan = (_a = scope) === null || _a === void 0 ? void 0 : _a.getSpan();
                // Check if the operation was passed a callback. (mapReduce requires a different check, as
                // its (non-callback) arguments can also be functions.)
                if (typeof lastArg !== 'function' || (operation === 'mapReduce' && args.length === 2)) {
                    var span_1 = (_b = parentSpan) === null || _b === void 0 ? void 0 : _b.startChild(getSpanContext(this, operation, args));
                    var maybePromise = orig.call.apply(orig, tslib_1.__spread([this], args));
                    if (utils_1.isThenable(maybePromise)) {
                        return maybePromise.then(function (res) {
                            var _a;
                            (_a = span_1) === null || _a === void 0 ? void 0 : _a.finish();
                            return res;
                        });
                    }
                    else {
                        (_c = span_1) === null || _c === void 0 ? void 0 : _c.finish();
                        return maybePromise;
                    }
                }
                var span = (_d = parentSpan) === null || _d === void 0 ? void 0 : _d.startChild(getSpanContext(this, operation, args.slice(0, -1)));
                return orig.call.apply(orig, tslib_1.__spread([this], args.slice(0, -1), [function (err, result) {
                        var _a;
                        (_a = span) === null || _a === void 0 ? void 0 : _a.finish();
                        lastArg(err, result);
                    }]));
            };
        });
    };
    /**
     * Form a SpanContext based on the user input to a given operation.
     */
    Mongo.prototype._getSpanContextFromOperationArguments = function (collection, operation, args) {
        var data = {
            collectionName: collection.collectionName,
            dbName: collection.dbName,
            namespace: collection.namespace,
        };
        var spanContext = {
            op: "db",
            description: operation,
            data: data,
        };
        // If the operation takes no arguments besides `options` and `callback`, or if argument
        // collection is disabled for this operation, just return early.
        var signature = OPERATION_SIGNATURES[operation];
        var shouldDescribe = Array.isArray(this._describeOperations)
            ? this._describeOperations.includes(operation)
            : this._describeOperations;
        if (!signature || !shouldDescribe) {
            return spanContext;
        }
        try {
            // Special case for `mapReduce`, as the only one accepting functions as arguments.
            if (operation === 'mapReduce') {
                var _a = tslib_1.__read(args, 2), map = _a[0], reduce = _a[1];
                data[signature[0]] = typeof map === 'string' ? map : map.name || '<anonymous>';
                data[signature[1]] = typeof reduce === 'string' ? reduce : reduce.name || '<anonymous>';
            }
            else {
                for (var i = 0; i < signature.length; i++) {
                    data[signature[i]] = JSON.stringify(args[i]);
                }
            }
        }
        catch (_oO) {
            // no-empty
        }
        return spanContext;
    };
    /**
     * @inheritDoc
     */
    Mongo.id = 'Mongo';
    return Mongo;
}());
exports.Mongo = Mongo;
//# sourceMappingURL=mongo.js.map

/***/ }),

/***/ 5394:
/***/ ((module, exports, __nccwpck_require__) => {

/* module decorator */ module = __nccwpck_require__.nmd(module);
Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __nccwpck_require__(1620);
/** Tracing integration for node-mysql package */
var Mysql = /** @class */ (function () {
    function Mysql() {
        /**
         * @inheritDoc
         */
        this.name = Mysql.id;
    }
    /**
     * @inheritDoc
     */
    Mysql.prototype.setupOnce = function (_, getCurrentHub) {
        var connection;
        try {
            // Unfortunatelly mysql is using some custom loading system and `Connection` is not exported directly.
            connection = utils_1.dynamicRequire(module, 'mysql/lib/Connection.js');
        }
        catch (e) {
            utils_1.logger.error('Mysql Integration was unable to require `mysql` package.');
            return;
        }
        // The original function will have one of these signatures:
        //    function (callback) => void
        //    function (options, callback) => void
        //    function (options, values, callback) => void
        utils_1.fill(connection, 'createQuery', function (orig) {
            return function (options, values, callback) {
                var _a, _b;
                var scope = getCurrentHub().getScope();
                var parentSpan = (_a = scope) === null || _a === void 0 ? void 0 : _a.getSpan();
                var span = (_b = parentSpan) === null || _b === void 0 ? void 0 : _b.startChild({
                    description: typeof options === 'string' ? options : options.sql,
                    op: "db",
                });
                if (typeof callback === 'function') {
                    return orig.call(this, options, values, function (err, result, fields) {
                        var _a;
                        (_a = span) === null || _a === void 0 ? void 0 : _a.finish();
                        callback(err, result, fields);
                    });
                }
                if (typeof values === 'function') {
                    return orig.call(this, options, function (err, result, fields) {
                        var _a;
                        (_a = span) === null || _a === void 0 ? void 0 : _a.finish();
                        values(err, result, fields);
                    });
                }
                return orig.call(this, options, values, callback);
            };
        });
    };
    /**
     * @inheritDoc
     */
    Mysql.id = 'Mysql';
    return Mysql;
}());
exports.Mysql = Mysql;
//# sourceMappingURL=mysql.js.map

/***/ }),

/***/ 1931:
/***/ ((module, exports, __nccwpck_require__) => {

/* module decorator */ module = __nccwpck_require__.nmd(module);
Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __nccwpck_require__(1620);
/** Tracing integration for node-postgres package */
var Postgres = /** @class */ (function () {
    function Postgres() {
        /**
         * @inheritDoc
         */
        this.name = Postgres.id;
    }
    /**
     * @inheritDoc
     */
    Postgres.prototype.setupOnce = function (_, getCurrentHub) {
        var client;
        try {
            var pgModule = utils_1.dynamicRequire(module, 'pg');
            client = pgModule.Client;
        }
        catch (e) {
            utils_1.logger.error('Postgres Integration was unable to require `pg` package.');
            return;
        }
        /**
         * function (query, callback) => void
         * function (query, params, callback) => void
         * function (query) => Promise
         * function (query, params) => Promise
         */
        utils_1.fill(client.prototype, 'query', function (orig) {
            return function (config, values, callback) {
                var _a, _b;
                var scope = getCurrentHub().getScope();
                var parentSpan = (_a = scope) === null || _a === void 0 ? void 0 : _a.getSpan();
                var span = (_b = parentSpan) === null || _b === void 0 ? void 0 : _b.startChild({
                    description: typeof config === 'string' ? config : config.text,
                    op: "db",
                });
                if (typeof callback === 'function') {
                    return orig.call(this, config, values, function (err, result) {
                        var _a;
                        (_a = span) === null || _a === void 0 ? void 0 : _a.finish();
                        callback(err, result);
                    });
                }
                if (typeof values === 'function') {
                    return orig.call(this, config, function (err, result) {
                        var _a;
                        (_a = span) === null || _a === void 0 ? void 0 : _a.finish();
                        values(err, result);
                    });
                }
                return orig.call(this, config, values).then(function (res) {
                    var _a;
                    (_a = span) === null || _a === void 0 ? void 0 : _a.finish();
                    return res;
                });
            };
        });
    };
    /**
     * @inheritDoc
     */
    Postgres.id = 'Postgres';
    return Postgres;
}());
exports.Postgres = Postgres;
//# sourceMappingURL=postgres.js.map

/***/ }),

/***/ 4655:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var utils_1 = __nccwpck_require__(1620);
var spanstatus_1 = __nccwpck_require__(8522);
/**
 * Keeps track of finished spans for a given transaction
 * @internal
 * @hideconstructor
 * @hidden
 */
var SpanRecorder = /** @class */ (function () {
    function SpanRecorder(maxlen) {
        if (maxlen === void 0) { maxlen = 1000; }
        this.spans = [];
        this._maxlen = maxlen;
    }
    /**
     * This is just so that we don't run out of memory while recording a lot
     * of spans. At some point we just stop and flush out the start of the
     * trace tree (i.e.the first n spans with the smallest
     * start_timestamp).
     */
    SpanRecorder.prototype.add = function (span) {
        if (this.spans.length > this._maxlen) {
            span.spanRecorder = undefined;
        }
        else {
            this.spans.push(span);
        }
    };
    return SpanRecorder;
}());
exports.SpanRecorder = SpanRecorder;
/**
 * Span contains all data about a span
 */
var Span = /** @class */ (function () {
    /**
     * You should never call the constructor manually, always use `Sentry.startTransaction()`
     * or call `startChild()` on an existing span.
     * @internal
     * @hideconstructor
     * @hidden
     */
    function Span(spanContext) {
        /**
         * @inheritDoc
         */
        this.traceId = utils_1.uuid4();
        /**
         * @inheritDoc
         */
        this.spanId = utils_1.uuid4().substring(16);
        /**
         * Timestamp in seconds when the span was created.
         */
        this.startTimestamp = utils_1.timestampWithMs();
        /**
         * @inheritDoc
         */
        this.tags = {};
        /**
         * @inheritDoc
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.data = {};
        if (!spanContext) {
            return this;
        }
        if (spanContext.traceId) {
            this.traceId = spanContext.traceId;
        }
        if (spanContext.spanId) {
            this.spanId = spanContext.spanId;
        }
        if (spanContext.parentSpanId) {
            this.parentSpanId = spanContext.parentSpanId;
        }
        // We want to include booleans as well here
        if ('sampled' in spanContext) {
            this.sampled = spanContext.sampled;
        }
        if (spanContext.op) {
            this.op = spanContext.op;
        }
        if (spanContext.description) {
            this.description = spanContext.description;
        }
        if (spanContext.data) {
            this.data = spanContext.data;
        }
        if (spanContext.tags) {
            this.tags = spanContext.tags;
        }
        if (spanContext.status) {
            this.status = spanContext.status;
        }
        if (spanContext.startTimestamp) {
            this.startTimestamp = spanContext.startTimestamp;
        }
        if (spanContext.endTimestamp) {
            this.endTimestamp = spanContext.endTimestamp;
        }
    }
    /**
     * @inheritDoc
     * @deprecated
     */
    Span.prototype.child = function (spanContext) {
        return this.startChild(spanContext);
    };
    /**
     * @inheritDoc
     */
    Span.prototype.startChild = function (spanContext) {
        var childSpan = new Span(tslib_1.__assign(tslib_1.__assign({}, spanContext), { parentSpanId: this.spanId, sampled: this.sampled, traceId: this.traceId }));
        childSpan.spanRecorder = this.spanRecorder;
        if (childSpan.spanRecorder) {
            childSpan.spanRecorder.add(childSpan);
        }
        childSpan.transaction = this.transaction;
        return childSpan;
    };
    /**
     * @inheritDoc
     */
    Span.prototype.setTag = function (key, value) {
        var _a;
        this.tags = tslib_1.__assign(tslib_1.__assign({}, this.tags), (_a = {}, _a[key] = value, _a));
        return this;
    };
    /**
     * @inheritDoc
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    Span.prototype.setData = function (key, value) {
        var _a;
        this.data = tslib_1.__assign(tslib_1.__assign({}, this.data), (_a = {}, _a[key] = value, _a));
        return this;
    };
    /**
     * @inheritDoc
     */
    Span.prototype.setStatus = function (value) {
        this.status = value;
        return this;
    };
    /**
     * @inheritDoc
     */
    Span.prototype.setHttpStatus = function (httpStatus) {
        this.setTag('http.status_code', String(httpStatus));
        var spanStatus = spanstatus_1.SpanStatus.fromHttpCode(httpStatus);
        if (spanStatus !== spanstatus_1.SpanStatus.UnknownError) {
            this.setStatus(spanStatus);
        }
        return this;
    };
    /**
     * @inheritDoc
     */
    Span.prototype.isSuccess = function () {
        return this.status === spanstatus_1.SpanStatus.Ok;
    };
    /**
     * @inheritDoc
     */
    Span.prototype.finish = function (endTimestamp) {
        this.endTimestamp = typeof endTimestamp === 'number' ? endTimestamp : utils_1.timestampWithMs();
    };
    /**
     * @inheritDoc
     */
    Span.prototype.toTraceparent = function () {
        var sampledString = '';
        if (this.sampled !== undefined) {
            sampledString = this.sampled ? '-1' : '-0';
        }
        return this.traceId + "-" + this.spanId + sampledString;
    };
    /**
     * @inheritDoc
     */
    Span.prototype.toContext = function () {
        return utils_1.dropUndefinedKeys({
            data: this.data,
            description: this.description,
            endTimestamp: this.endTimestamp,
            op: this.op,
            parentSpanId: this.parentSpanId,
            sampled: this.sampled,
            spanId: this.spanId,
            startTimestamp: this.startTimestamp,
            status: this.status,
            tags: this.tags,
            traceId: this.traceId,
        });
    };
    /**
     * @inheritDoc
     */
    Span.prototype.updateWithContext = function (spanContext) {
        var _a, _b, _c, _d, _e;
        this.data = (_a = spanContext.data, (_a !== null && _a !== void 0 ? _a : {}));
        this.description = spanContext.description;
        this.endTimestamp = spanContext.endTimestamp;
        this.op = spanContext.op;
        this.parentSpanId = spanContext.parentSpanId;
        this.sampled = spanContext.sampled;
        this.spanId = (_b = spanContext.spanId, (_b !== null && _b !== void 0 ? _b : this.spanId));
        this.startTimestamp = (_c = spanContext.startTimestamp, (_c !== null && _c !== void 0 ? _c : this.startTimestamp));
        this.status = spanContext.status;
        this.tags = (_d = spanContext.tags, (_d !== null && _d !== void 0 ? _d : {}));
        this.traceId = (_e = spanContext.traceId, (_e !== null && _e !== void 0 ? _e : this.traceId));
        return this;
    };
    /**
     * @inheritDoc
     */
    Span.prototype.getTraceContext = function () {
        return utils_1.dropUndefinedKeys({
            data: Object.keys(this.data).length > 0 ? this.data : undefined,
            description: this.description,
            op: this.op,
            parent_span_id: this.parentSpanId,
            span_id: this.spanId,
            status: this.status,
            tags: Object.keys(this.tags).length > 0 ? this.tags : undefined,
            trace_id: this.traceId,
        });
    };
    /**
     * @inheritDoc
     */
    Span.prototype.toJSON = function () {
        return utils_1.dropUndefinedKeys({
            data: Object.keys(this.data).length > 0 ? this.data : undefined,
            description: this.description,
            op: this.op,
            parent_span_id: this.parentSpanId,
            span_id: this.spanId,
            start_timestamp: this.startTimestamp,
            status: this.status,
            tags: Object.keys(this.tags).length > 0 ? this.tags : undefined,
            timestamp: this.endTimestamp,
            trace_id: this.traceId,
        });
    };
    return Span;
}());
exports.Span = Span;
//# sourceMappingURL=span.js.map

/***/ }),

/***/ 8522:
/***/ ((__unused_webpack_module, exports) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
/** The status of an Span. */
// eslint-disable-next-line import/export
var SpanStatus;
(function (SpanStatus) {
    /** The operation completed successfully. */
    SpanStatus["Ok"] = "ok";
    /** Deadline expired before operation could complete. */
    SpanStatus["DeadlineExceeded"] = "deadline_exceeded";
    /** 401 Unauthorized (actually does mean unauthenticated according to RFC 7235) */
    SpanStatus["Unauthenticated"] = "unauthenticated";
    /** 403 Forbidden */
    SpanStatus["PermissionDenied"] = "permission_denied";
    /** 404 Not Found. Some requested entity (file or directory) was not found. */
    SpanStatus["NotFound"] = "not_found";
    /** 429 Too Many Requests */
    SpanStatus["ResourceExhausted"] = "resource_exhausted";
    /** Client specified an invalid argument. 4xx. */
    SpanStatus["InvalidArgument"] = "invalid_argument";
    /** 501 Not Implemented */
    SpanStatus["Unimplemented"] = "unimplemented";
    /** 503 Service Unavailable */
    SpanStatus["Unavailable"] = "unavailable";
    /** Other/generic 5xx. */
    SpanStatus["InternalError"] = "internal_error";
    /** Unknown. Any non-standard HTTP status code. */
    SpanStatus["UnknownError"] = "unknown_error";
    /** The operation was cancelled (typically by the user). */
    SpanStatus["Cancelled"] = "cancelled";
    /** Already exists (409) */
    SpanStatus["AlreadyExists"] = "already_exists";
    /** Operation was rejected because the system is not in a state required for the operation's */
    SpanStatus["FailedPrecondition"] = "failed_precondition";
    /** The operation was aborted, typically due to a concurrency issue. */
    SpanStatus["Aborted"] = "aborted";
    /** Operation was attempted past the valid range. */
    SpanStatus["OutOfRange"] = "out_of_range";
    /** Unrecoverable data loss or corruption */
    SpanStatus["DataLoss"] = "data_loss";
})(SpanStatus = exports.SpanStatus || (exports.SpanStatus = {}));
// eslint-disable-next-line @typescript-eslint/no-namespace, import/export
(function (SpanStatus) {
    /**
     * Converts a HTTP status code into a {@link SpanStatus}.
     *
     * @param httpStatus The HTTP response status code.
     * @returns The span status or {@link SpanStatus.UnknownError}.
     */
    function fromHttpCode(httpStatus) {
        if (httpStatus < 400) {
            return SpanStatus.Ok;
        }
        if (httpStatus >= 400 && httpStatus < 500) {
            switch (httpStatus) {
                case 401:
                    return SpanStatus.Unauthenticated;
                case 403:
                    return SpanStatus.PermissionDenied;
                case 404:
                    return SpanStatus.NotFound;
                case 409:
                    return SpanStatus.AlreadyExists;
                case 413:
                    return SpanStatus.FailedPrecondition;
                case 429:
                    return SpanStatus.ResourceExhausted;
                default:
                    return SpanStatus.InvalidArgument;
            }
        }
        if (httpStatus >= 500 && httpStatus < 600) {
            switch (httpStatus) {
                case 501:
                    return SpanStatus.Unimplemented;
                case 503:
                    return SpanStatus.Unavailable;
                case 504:
                    return SpanStatus.DeadlineExceeded;
                default:
                    return SpanStatus.InternalError;
            }
        }
        return SpanStatus.UnknownError;
    }
    SpanStatus.fromHttpCode = fromHttpCode;
})(SpanStatus = exports.SpanStatus || (exports.SpanStatus = {}));
//# sourceMappingURL=spanstatus.js.map

/***/ }),

/***/ 8186:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var hub_1 = __nccwpck_require__(6393);
var utils_1 = __nccwpck_require__(1620);
var span_1 = __nccwpck_require__(4655);
/** JSDoc */
var Transaction = /** @class */ (function (_super) {
    tslib_1.__extends(Transaction, _super);
    /**
     * This constructor should never be called manually. Those instrumenting tracing should use
     * `Sentry.startTransaction()`, and internal methods should use `hub.startTransaction()`.
     * @internal
     * @hideconstructor
     * @hidden
     */
    function Transaction(transactionContext, hub) {
        var _this = _super.call(this, transactionContext) || this;
        _this._metadata = {};
        _this._measurements = {};
        /**
         * The reference to the current hub.
         */
        _this._hub = hub_1.getCurrentHub();
        if (utils_1.isInstanceOf(hub, hub_1.Hub)) {
            _this._hub = hub;
        }
        _this.name = transactionContext.name || '';
        _this._trimEnd = transactionContext.trimEnd;
        // this is because transactions are also spans, and spans have a transaction pointer
        _this.transaction = _this;
        return _this;
    }
    /**
     * JSDoc
     */
    Transaction.prototype.setName = function (name) {
        this.name = name;
    };
    /**
     * Attaches SpanRecorder to the span itself
     * @param maxlen maximum number of spans that can be recorded
     */
    Transaction.prototype.initSpanRecorder = function (maxlen) {
        if (maxlen === void 0) { maxlen = 1000; }
        if (!this.spanRecorder) {
            this.spanRecorder = new span_1.SpanRecorder(maxlen);
        }
        this.spanRecorder.add(this);
    };
    /**
     * Set observed measurements for this transaction.
     * @hidden
     */
    Transaction.prototype.setMeasurements = function (measurements) {
        this._measurements = tslib_1.__assign({}, measurements);
    };
    /**
     * Set metadata for this transaction.
     * @hidden
     */
    Transaction.prototype.setMetadata = function (newMetadata) {
        this._metadata = tslib_1.__assign(tslib_1.__assign({}, this._metadata), newMetadata);
    };
    /**
     * @inheritDoc
     */
    Transaction.prototype.finish = function (endTimestamp) {
        var _this = this;
        // This transaction is already finished, so we should not flush it again.
        if (this.endTimestamp !== undefined) {
            return undefined;
        }
        if (!this.name) {
            utils_1.logger.warn('Transaction has no name, falling back to `<unlabeled transaction>`.');
            this.name = '<unlabeled transaction>';
        }
        // just sets the end timestamp
        _super.prototype.finish.call(this, endTimestamp);
        if (this.sampled !== true) {
            // At this point if `sampled !== true` we want to discard the transaction.
            utils_1.logger.log('[Tracing] Discarding transaction because its trace was not chosen to be sampled.');
            return undefined;
        }
        var finishedSpans = this.spanRecorder ? this.spanRecorder.spans.filter(function (s) { return s !== _this && s.endTimestamp; }) : [];
        if (this._trimEnd && finishedSpans.length > 0) {
            this.endTimestamp = finishedSpans.reduce(function (prev, current) {
                if (prev.endTimestamp && current.endTimestamp) {
                    return prev.endTimestamp > current.endTimestamp ? prev : current;
                }
                return prev;
            }).endTimestamp;
        }
        var transaction = {
            contexts: {
                trace: this.getTraceContext(),
            },
            spans: finishedSpans,
            start_timestamp: this.startTimestamp,
            tags: this.tags,
            timestamp: this.endTimestamp,
            transaction: this.name,
            type: 'transaction',
            debug_meta: this._metadata,
        };
        var hasMeasurements = Object.keys(this._measurements).length > 0;
        if (hasMeasurements) {
            utils_1.logger.log('[Measurements] Adding measurements to transaction', JSON.stringify(this._measurements, undefined, 2));
            transaction.measurements = this._measurements;
        }
        return this._hub.captureEvent(transaction);
    };
    /**
     * @inheritDoc
     */
    Transaction.prototype.toContext = function () {
        var spanContext = _super.prototype.toContext.call(this);
        return utils_1.dropUndefinedKeys(tslib_1.__assign(tslib_1.__assign({}, spanContext), { name: this.name, trimEnd: this._trimEnd }));
    };
    /**
     * @inheritDoc
     */
    Transaction.prototype.updateWithContext = function (transactionContext) {
        var _a;
        _super.prototype.updateWithContext.call(this, transactionContext);
        this.name = (_a = transactionContext.name, (_a !== null && _a !== void 0 ? _a : ''));
        this._trimEnd = transactionContext.trimEnd;
        return this;
    };
    return Transaction;
}(span_1.Span));
exports.Transaction = Transaction;
//# sourceMappingURL=transaction.js.map

/***/ }),

/***/ 1386:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var hub_1 = __nccwpck_require__(6393);
exports.TRACEPARENT_REGEXP = new RegExp('^[ \\t]*' + // whitespace
    '([0-9a-f]{32})?' + // trace_id
    '-?([0-9a-f]{16})?' + // span_id
    '-?([01])?' + // sampled
    '[ \\t]*$');
/**
 * Determines if tracing is currently enabled.
 *
 * Tracing is enabled when at least one of `tracesSampleRate` and `tracesSampler` is defined in the SDK config.
 */
function hasTracingEnabled(options) {
    return 'tracesSampleRate' in options || 'tracesSampler' in options;
}
exports.hasTracingEnabled = hasTracingEnabled;
/**
 * Extract transaction context data from a `sentry-trace` header.
 *
 * @param traceparent Traceparent string
 *
 * @returns Object containing data from the header, or undefined if traceparent string is malformed
 */
function extractTraceparentData(traceparent) {
    var matches = traceparent.match(exports.TRACEPARENT_REGEXP);
    if (matches) {
        var parentSampled = void 0;
        if (matches[3] === '1') {
            parentSampled = true;
        }
        else if (matches[3] === '0') {
            parentSampled = false;
        }
        return {
            traceId: matches[1],
            parentSampled: parentSampled,
            parentSpanId: matches[2],
        };
    }
    return undefined;
}
exports.extractTraceparentData = extractTraceparentData;
/** Grabs active transaction off scope, if any */
function getActiveTransaction(hub) {
    if (hub === void 0) { hub = hub_1.getCurrentHub(); }
    var _a, _b;
    return (_b = (_a = hub) === null || _a === void 0 ? void 0 : _a.getScope()) === null || _b === void 0 ? void 0 : _b.getTransaction();
}
exports.getActiveTransaction = getActiveTransaction;
/**
 * Converts from milliseconds to seconds
 * @param time time in ms
 */
function msToSec(time) {
    return time / 1000;
}
exports.msToSec = msToSec;
/**
 * Converts from seconds to milliseconds
 * @param time time in seconds
 */
function secToMs(time) {
    return time * 1000;
}
exports.secToMs = secToMs;
// so it can be used in manual instrumentation without necessitating a hard dependency on @sentry/utils
var utils_1 = __nccwpck_require__(1620);
exports.stripUrlQueryAndFragment = utils_1.stripUrlQueryAndFragment;
//# sourceMappingURL=utils.js.map

/***/ }),

/***/ 3789:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var loglevel_1 = __nccwpck_require__(6853);
exports.LogLevel = loglevel_1.LogLevel;
var session_1 = __nccwpck_require__(4954);
exports.SessionStatus = session_1.SessionStatus;
var severity_1 = __nccwpck_require__(4124);
exports.Severity = severity_1.Severity;
var status_1 = __nccwpck_require__(1277);
exports.Status = status_1.Status;
var transaction_1 = __nccwpck_require__(7540);
exports.TransactionSamplingMethod = transaction_1.TransactionSamplingMethod;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 6853:
/***/ ((__unused_webpack_module, exports) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
/** Console logging verbosity for the SDK. */
var LogLevel;
(function (LogLevel) {
    /** No logs will be generated. */
    LogLevel[LogLevel["None"] = 0] = "None";
    /** Only SDK internal errors will be logged. */
    LogLevel[LogLevel["Error"] = 1] = "Error";
    /** Information useful for debugging the SDK will be logged. */
    LogLevel[LogLevel["Debug"] = 2] = "Debug";
    /** All SDK actions will be logged. */
    LogLevel[LogLevel["Verbose"] = 3] = "Verbose";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
//# sourceMappingURL=loglevel.js.map

/***/ }),

/***/ 4954:
/***/ ((__unused_webpack_module, exports) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * Session Status
 */
var SessionStatus;
(function (SessionStatus) {
    /** JSDoc */
    SessionStatus["Ok"] = "ok";
    /** JSDoc */
    SessionStatus["Exited"] = "exited";
    /** JSDoc */
    SessionStatus["Crashed"] = "crashed";
    /** JSDoc */
    SessionStatus["Abnormal"] = "abnormal";
})(SessionStatus = exports.SessionStatus || (exports.SessionStatus = {}));
//# sourceMappingURL=session.js.map

/***/ }),

/***/ 4124:
/***/ ((__unused_webpack_module, exports) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
/** JSDoc */
// eslint-disable-next-line import/export
var Severity;
(function (Severity) {
    /** JSDoc */
    Severity["Fatal"] = "fatal";
    /** JSDoc */
    Severity["Error"] = "error";
    /** JSDoc */
    Severity["Warning"] = "warning";
    /** JSDoc */
    Severity["Log"] = "log";
    /** JSDoc */
    Severity["Info"] = "info";
    /** JSDoc */
    Severity["Debug"] = "debug";
    /** JSDoc */
    Severity["Critical"] = "critical";
})(Severity = exports.Severity || (exports.Severity = {}));
// eslint-disable-next-line @typescript-eslint/no-namespace, import/export
(function (Severity) {
    /**
     * Converts a string-based level into a {@link Severity}.
     *
     * @param level string representation of Severity
     * @returns Severity
     */
    function fromString(level) {
        switch (level) {
            case 'debug':
                return Severity.Debug;
            case 'info':
                return Severity.Info;
            case 'warn':
            case 'warning':
                return Severity.Warning;
            case 'error':
                return Severity.Error;
            case 'fatal':
                return Severity.Fatal;
            case 'critical':
                return Severity.Critical;
            case 'log':
            default:
                return Severity.Log;
        }
    }
    Severity.fromString = fromString;
})(Severity = exports.Severity || (exports.Severity = {}));
//# sourceMappingURL=severity.js.map

/***/ }),

/***/ 1277:
/***/ ((__unused_webpack_module, exports) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
/** The status of an event. */
// eslint-disable-next-line import/export
var Status;
(function (Status) {
    /** The status could not be determined. */
    Status["Unknown"] = "unknown";
    /** The event was skipped due to configuration or callbacks. */
    Status["Skipped"] = "skipped";
    /** The event was sent to Sentry successfully. */
    Status["Success"] = "success";
    /** The client is currently rate limited and will try again later. */
    Status["RateLimit"] = "rate_limit";
    /** The event could not be processed. */
    Status["Invalid"] = "invalid";
    /** A server-side error ocurred during submission. */
    Status["Failed"] = "failed";
})(Status = exports.Status || (exports.Status = {}));
// eslint-disable-next-line @typescript-eslint/no-namespace, import/export
(function (Status) {
    /**
     * Converts a HTTP status code into a {@link Status}.
     *
     * @param code The HTTP response status code.
     * @returns The send status or {@link Status.Unknown}.
     */
    function fromHttpCode(code) {
        if (code >= 200 && code < 300) {
            return Status.Success;
        }
        if (code === 429) {
            return Status.RateLimit;
        }
        if (code >= 400 && code < 500) {
            return Status.Invalid;
        }
        if (code >= 500) {
            return Status.Failed;
        }
        return Status.Unknown;
    }
    Status.fromHttpCode = fromHttpCode;
})(Status = exports.Status || (exports.Status = {}));
//# sourceMappingURL=status.js.map

/***/ }),

/***/ 7540:
/***/ ((__unused_webpack_module, exports) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var TransactionSamplingMethod;
(function (TransactionSamplingMethod) {
    TransactionSamplingMethod["Explicit"] = "explicitly_set";
    TransactionSamplingMethod["Sampler"] = "client_sampler";
    TransactionSamplingMethod["Rate"] = "client_rate";
    TransactionSamplingMethod["Inheritance"] = "inheritance";
})(TransactionSamplingMethod = exports.TransactionSamplingMethod || (exports.TransactionSamplingMethod = {}));
//# sourceMappingURL=transaction.js.map

/***/ }),

/***/ 8343:
/***/ ((__unused_webpack_module, exports) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * Consumes the promise and logs the error when it rejects.
 * @param promise A promise to forget.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function forget(promise) {
    promise.then(null, function (e) {
        // TODO: Use a better logging mechanism
        // eslint-disable-next-line no-console
        console.error(e);
    });
}
exports.forget = forget;
//# sourceMappingURL=async.js.map

/***/ }),

/***/ 597:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var is_1 = __nccwpck_require__(2757);
/**
 * Given a child DOM element, returns a query-selector statement describing that
 * and its ancestors
 * e.g. [HTMLElement] => body > div > input#foo.btn[name=baz]
 * @returns generated DOM path
 */
function htmlTreeAsString(elem) {
    // try/catch both:
    // - accessing event.target (see getsentry/raven-js#838, #768)
    // - `htmlTreeAsString` because it's complex, and just accessing the DOM incorrectly
    // - can throw an exception in some circumstances.
    try {
        var currentElem = elem;
        var MAX_TRAVERSE_HEIGHT = 5;
        var MAX_OUTPUT_LEN = 80;
        var out = [];
        var height = 0;
        var len = 0;
        var separator = ' > ';
        var sepLength = separator.length;
        var nextStr = void 0;
        // eslint-disable-next-line no-plusplus
        while (currentElem && height++ < MAX_TRAVERSE_HEIGHT) {
            nextStr = _htmlElementAsString(currentElem);
            // bail out if
            // - nextStr is the 'html' element
            // - the length of the string that would be created exceeds MAX_OUTPUT_LEN
            //   (ignore this limit if we are on the first iteration)
            if (nextStr === 'html' || (height > 1 && len + out.length * sepLength + nextStr.length >= MAX_OUTPUT_LEN)) {
                break;
            }
            out.push(nextStr);
            len += nextStr.length;
            currentElem = currentElem.parentNode;
        }
        return out.reverse().join(separator);
    }
    catch (_oO) {
        return '<unknown>';
    }
}
exports.htmlTreeAsString = htmlTreeAsString;
/**
 * Returns a simple, query-selector representation of a DOM element
 * e.g. [HTMLElement] => input#foo.btn[name=baz]
 * @returns generated DOM path
 */
function _htmlElementAsString(el) {
    var elem = el;
    var out = [];
    var className;
    var classes;
    var key;
    var attr;
    var i;
    if (!elem || !elem.tagName) {
        return '';
    }
    out.push(elem.tagName.toLowerCase());
    if (elem.id) {
        out.push("#" + elem.id);
    }
    // eslint-disable-next-line prefer-const
    className = elem.className;
    if (className && is_1.isString(className)) {
        classes = className.split(/\s+/);
        for (i = 0; i < classes.length; i++) {
            out.push("." + classes[i]);
        }
    }
    var allowedAttrs = ['type', 'name', 'title', 'alt'];
    for (i = 0; i < allowedAttrs.length; i++) {
        key = allowedAttrs[i];
        attr = elem.getAttribute(key);
        if (attr) {
            out.push("[" + key + "=\"" + attr + "\"]");
        }
    }
    return out.join('');
}
//# sourceMappingURL=browser.js.map

/***/ }),

/***/ 3275:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var error_1 = __nccwpck_require__(6238);
/** Regular expression used to parse a Dsn. */
var DSN_REGEX = /^(?:(\w+):)\/\/(?:(\w+)(?::(\w+))?@)([\w.-]+)(?::(\d+))?\/(.+)/;
/** Error message */
var ERROR_MESSAGE = 'Invalid Dsn';
/** The Sentry Dsn, identifying a Sentry instance and project. */
var Dsn = /** @class */ (function () {
    /** Creates a new Dsn component */
    function Dsn(from) {
        if (typeof from === 'string') {
            this._fromString(from);
        }
        else {
            this._fromComponents(from);
        }
        this._validate();
    }
    /**
     * Renders the string representation of this Dsn.
     *
     * By default, this will render the public representation without the password
     * component. To get the deprecated private representation, set `withPassword`
     * to true.
     *
     * @param withPassword When set to true, the password will be included.
     */
    Dsn.prototype.toString = function (withPassword) {
        if (withPassword === void 0) { withPassword = false; }
        var _a = this, host = _a.host, path = _a.path, pass = _a.pass, port = _a.port, projectId = _a.projectId, protocol = _a.protocol, publicKey = _a.publicKey;
        return (protocol + "://" + publicKey + (withPassword && pass ? ":" + pass : '') +
            ("@" + host + (port ? ":" + port : '') + "/" + (path ? path + "/" : path) + projectId));
    };
    /** Parses a string into this Dsn. */
    Dsn.prototype._fromString = function (str) {
        var match = DSN_REGEX.exec(str);
        if (!match) {
            throw new error_1.SentryError(ERROR_MESSAGE);
        }
        var _a = tslib_1.__read(match.slice(1), 6), protocol = _a[0], publicKey = _a[1], _b = _a[2], pass = _b === void 0 ? '' : _b, host = _a[3], _c = _a[4], port = _c === void 0 ? '' : _c, lastPath = _a[5];
        var path = '';
        var projectId = lastPath;
        var split = projectId.split('/');
        if (split.length > 1) {
            path = split.slice(0, -1).join('/');
            projectId = split.pop();
        }
        if (projectId) {
            var projectMatch = projectId.match(/^\d+/);
            if (projectMatch) {
                projectId = projectMatch[0];
            }
        }
        this._fromComponents({ host: host, pass: pass, path: path, projectId: projectId, port: port, protocol: protocol, publicKey: publicKey });
    };
    /** Maps Dsn components into this instance. */
    Dsn.prototype._fromComponents = function (components) {
        // TODO this is for backwards compatibility, and can be removed in a future version
        if ('user' in components && !('publicKey' in components)) {
            components.publicKey = components.user;
        }
        this.user = components.publicKey || '';
        this.protocol = components.protocol;
        this.publicKey = components.publicKey || '';
        this.pass = components.pass || '';
        this.host = components.host;
        this.port = components.port || '';
        this.path = components.path || '';
        this.projectId = components.projectId;
    };
    /** Validates this Dsn and throws on error. */
    Dsn.prototype._validate = function () {
        var _this = this;
        ['protocol', 'publicKey', 'host', 'projectId'].forEach(function (component) {
            if (!_this[component]) {
                throw new error_1.SentryError(ERROR_MESSAGE + ": " + component + " missing");
            }
        });
        if (!this.projectId.match(/^\d+$/)) {
            throw new error_1.SentryError(ERROR_MESSAGE + ": Invalid projectId " + this.projectId);
        }
        if (this.protocol !== 'http' && this.protocol !== 'https') {
            throw new error_1.SentryError(ERROR_MESSAGE + ": Invalid protocol " + this.protocol);
        }
        if (this.port && isNaN(parseInt(this.port, 10))) {
            throw new error_1.SentryError(ERROR_MESSAGE + ": Invalid port " + this.port);
        }
    };
    return Dsn;
}());
exports.Dsn = Dsn;
//# sourceMappingURL=dsn.js.map

/***/ }),

/***/ 6238:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var polyfill_1 = __nccwpck_require__(1243);
/** An error emitted by Sentry SDKs and related utilities. */
var SentryError = /** @class */ (function (_super) {
    tslib_1.__extends(SentryError, _super);
    function SentryError(message) {
        var _newTarget = this.constructor;
        var _this = _super.call(this, message) || this;
        _this.message = message;
        _this.name = _newTarget.prototype.constructor.name;
        polyfill_1.setPrototypeOf(_this, _newTarget.prototype);
        return _this;
    }
    return SentryError;
}(Error));
exports.SentryError = SentryError;
//# sourceMappingURL=error.js.map

/***/ }),

/***/ 1620:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
tslib_1.__exportStar(__nccwpck_require__(8343), exports);
tslib_1.__exportStar(__nccwpck_require__(597), exports);
tslib_1.__exportStar(__nccwpck_require__(3275), exports);
tslib_1.__exportStar(__nccwpck_require__(6238), exports);
tslib_1.__exportStar(__nccwpck_require__(5474), exports);
tslib_1.__exportStar(__nccwpck_require__(2757), exports);
tslib_1.__exportStar(__nccwpck_require__(5577), exports);
tslib_1.__exportStar(__nccwpck_require__(9515), exports);
tslib_1.__exportStar(__nccwpck_require__(2154), exports);
tslib_1.__exportStar(__nccwpck_require__(6411), exports);
tslib_1.__exportStar(__nccwpck_require__(9249), exports);
tslib_1.__exportStar(__nccwpck_require__(9188), exports);
tslib_1.__exportStar(__nccwpck_require__(1811), exports);
tslib_1.__exportStar(__nccwpck_require__(5986), exports);
tslib_1.__exportStar(__nccwpck_require__(6538), exports);
tslib_1.__exportStar(__nccwpck_require__(8714), exports);
tslib_1.__exportStar(__nccwpck_require__(7833), exports);
tslib_1.__exportStar(__nccwpck_require__(1735), exports);
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 5474:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var is_1 = __nccwpck_require__(2757);
var logger_1 = __nccwpck_require__(5577);
var misc_1 = __nccwpck_require__(2154);
var object_1 = __nccwpck_require__(9249);
var stacktrace_1 = __nccwpck_require__(5986);
var supports_1 = __nccwpck_require__(8714);
var global = misc_1.getGlobalObject();
/**
 * Instrument native APIs to call handlers that can be used to create breadcrumbs, APM spans etc.
 *  - Console API
 *  - Fetch API
 *  - XHR API
 *  - History API
 *  - DOM API (click/typing)
 *  - Error API
 *  - UnhandledRejection API
 */
var handlers = {};
var instrumented = {};
/** Instruments given API */
function instrument(type) {
    if (instrumented[type]) {
        return;
    }
    instrumented[type] = true;
    switch (type) {
        case 'console':
            instrumentConsole();
            break;
        case 'dom':
            instrumentDOM();
            break;
        case 'xhr':
            instrumentXHR();
            break;
        case 'fetch':
            instrumentFetch();
            break;
        case 'history':
            instrumentHistory();
            break;
        case 'error':
            instrumentError();
            break;
        case 'unhandledrejection':
            instrumentUnhandledRejection();
            break;
        default:
            logger_1.logger.warn('unknown instrumentation type:', type);
    }
}
/**
 * Add handler that will be called when given type of instrumentation triggers.
 * Use at your own risk, this might break without changelog notice, only used internally.
 * @hidden
 */
function addInstrumentationHandler(handler) {
    if (!handler || typeof handler.type !== 'string' || typeof handler.callback !== 'function') {
        return;
    }
    handlers[handler.type] = handlers[handler.type] || [];
    handlers[handler.type].push(handler.callback);
    instrument(handler.type);
}
exports.addInstrumentationHandler = addInstrumentationHandler;
/** JSDoc */
function triggerHandlers(type, data) {
    var e_1, _a;
    if (!type || !handlers[type]) {
        return;
    }
    try {
        for (var _b = tslib_1.__values(handlers[type] || []), _c = _b.next(); !_c.done; _c = _b.next()) {
            var handler = _c.value;
            try {
                handler(data);
            }
            catch (e) {
                logger_1.logger.error("Error while triggering instrumentation handler.\nType: " + type + "\nName: " + stacktrace_1.getFunctionName(handler) + "\nError: " + e);
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
}
/** JSDoc */
function instrumentConsole() {
    if (!('console' in global)) {
        return;
    }
    ['debug', 'info', 'warn', 'error', 'log', 'assert'].forEach(function (level) {
        if (!(level in global.console)) {
            return;
        }
        object_1.fill(global.console, level, function (originalConsoleLevel) {
            return function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                triggerHandlers('console', { args: args, level: level });
                // this fails for some browsers. :(
                if (originalConsoleLevel) {
                    Function.prototype.apply.call(originalConsoleLevel, global.console, args);
                }
            };
        });
    });
}
/** JSDoc */
function instrumentFetch() {
    if (!supports_1.supportsNativeFetch()) {
        return;
    }
    object_1.fill(global, 'fetch', function (originalFetch) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var handlerData = {
                args: args,
                fetchData: {
                    method: getFetchMethod(args),
                    url: getFetchUrl(args),
                },
                startTimestamp: Date.now(),
            };
            triggerHandlers('fetch', tslib_1.__assign({}, handlerData));
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            return originalFetch.apply(global, args).then(function (response) {
                triggerHandlers('fetch', tslib_1.__assign(tslib_1.__assign({}, handlerData), { endTimestamp: Date.now(), response: response }));
                return response;
            }, function (error) {
                triggerHandlers('fetch', tslib_1.__assign(tslib_1.__assign({}, handlerData), { endTimestamp: Date.now(), error: error }));
                // NOTE: If you are a Sentry user, and you are seeing this stack frame,
                //       it means the sentry.javascript SDK caught an error invoking your application code.
                //       This is expected behavior and NOT indicative of a bug with sentry.javascript.
                throw error;
            });
        };
    });
}
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/** Extract `method` from fetch call arguments */
function getFetchMethod(fetchArgs) {
    if (fetchArgs === void 0) { fetchArgs = []; }
    if ('Request' in global && is_1.isInstanceOf(fetchArgs[0], Request) && fetchArgs[0].method) {
        return String(fetchArgs[0].method).toUpperCase();
    }
    if (fetchArgs[1] && fetchArgs[1].method) {
        return String(fetchArgs[1].method).toUpperCase();
    }
    return 'GET';
}
/** Extract `url` from fetch call arguments */
function getFetchUrl(fetchArgs) {
    if (fetchArgs === void 0) { fetchArgs = []; }
    if (typeof fetchArgs[0] === 'string') {
        return fetchArgs[0];
    }
    if ('Request' in global && is_1.isInstanceOf(fetchArgs[0], Request)) {
        return fetchArgs[0].url;
    }
    return String(fetchArgs[0]);
}
/* eslint-enable @typescript-eslint/no-unsafe-member-access */
/** JSDoc */
function instrumentXHR() {
    if (!('XMLHttpRequest' in global)) {
        return;
    }
    // Poor man's implementation of ES6 `Map`, tracking and keeping in sync key and value separately.
    var requestKeys = [];
    var requestValues = [];
    var xhrproto = XMLHttpRequest.prototype;
    object_1.fill(xhrproto, 'open', function (originalOpen) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            var xhr = this;
            var url = args[1];
            xhr.__sentry_xhr__ = {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                method: is_1.isString(args[0]) ? args[0].toUpperCase() : args[0],
                url: args[1],
            };
            // if Sentry key appears in URL, don't capture it as a request
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (is_1.isString(url) && xhr.__sentry_xhr__.method === 'POST' && url.match(/sentry_key/)) {
                xhr.__sentry_own_request__ = true;
            }
            var onreadystatechangeHandler = function () {
                if (xhr.readyState === 4) {
                    try {
                        // touching statusCode in some platforms throws
                        // an exception
                        if (xhr.__sentry_xhr__) {
                            xhr.__sentry_xhr__.status_code = xhr.status;
                        }
                    }
                    catch (e) {
                        /* do nothing */
                    }
                    try {
                        var requestPos = requestKeys.indexOf(xhr);
                        if (requestPos !== -1) {
                            // Make sure to pop both key and value to keep it in sync.
                            requestKeys.splice(requestPos);
                            var args_1 = requestValues.splice(requestPos)[0];
                            if (xhr.__sentry_xhr__ && args_1[0] !== undefined) {
                                xhr.__sentry_xhr__.body = args_1[0];
                            }
                        }
                    }
                    catch (e) {
                        /* do nothing */
                    }
                    triggerHandlers('xhr', {
                        args: args,
                        endTimestamp: Date.now(),
                        startTimestamp: Date.now(),
                        xhr: xhr,
                    });
                }
            };
            if ('onreadystatechange' in xhr && typeof xhr.onreadystatechange === 'function') {
                object_1.fill(xhr, 'onreadystatechange', function (original) {
                    return function () {
                        var readyStateArgs = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            readyStateArgs[_i] = arguments[_i];
                        }
                        onreadystatechangeHandler();
                        return original.apply(xhr, readyStateArgs);
                    };
                });
            }
            else {
                xhr.addEventListener('readystatechange', onreadystatechangeHandler);
            }
            return originalOpen.apply(xhr, args);
        };
    });
    object_1.fill(xhrproto, 'send', function (originalSend) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            requestKeys.push(this);
            requestValues.push(args);
            triggerHandlers('xhr', {
                args: args,
                startTimestamp: Date.now(),
                xhr: this,
            });
            return originalSend.apply(this, args);
        };
    });
}
var lastHref;
/** JSDoc */
function instrumentHistory() {
    if (!supports_1.supportsHistory()) {
        return;
    }
    var oldOnPopState = global.onpopstate;
    global.onpopstate = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var to = global.location.href;
        // keep track of the current URL state, as we always receive only the updated state
        var from = lastHref;
        lastHref = to;
        triggerHandlers('history', {
            from: from,
            to: to,
        });
        if (oldOnPopState) {
            return oldOnPopState.apply(this, args);
        }
    };
    /** @hidden */
    function historyReplacementFunction(originalHistoryFunction) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var url = args.length > 2 ? args[2] : undefined;
            if (url) {
                // coerce to string (this is what pushState does)
                var from = lastHref;
                var to = String(url);
                // keep track of the current URL state, as we always receive only the updated state
                lastHref = to;
                triggerHandlers('history', {
                    from: from,
                    to: to,
                });
            }
            return originalHistoryFunction.apply(this, args);
        };
    }
    object_1.fill(global.history, 'pushState', historyReplacementFunction);
    object_1.fill(global.history, 'replaceState', historyReplacementFunction);
}
var debounceDuration = 1000;
var debounceTimerID;
var lastCapturedEvent;
/**
 * Decide whether the current event should finish the debounce of previously captured one.
 * @param previous previously captured event
 * @param current event to be captured
 */
function shouldShortcircuitPreviousDebounce(previous, current) {
    // If there was no previous event, it should always be swapped for the new one.
    if (!previous) {
        return true;
    }
    // If both events have different type, then user definitely performed two separate actions. e.g. click + keypress.
    if (previous.type !== current.type) {
        return true;
    }
    try {
        // If both events have the same type, it's still possible that actions were performed on different targets.
        // e.g. 2 clicks on different buttons.
        if (previous.target !== current.target) {
            return true;
        }
    }
    catch (e) {
        // just accessing `target` property can throw an exception in some rare circumstances
        // see: https://github.com/getsentry/sentry-javascript/issues/838
    }
    // If both events have the same type _and_ same `target` (an element which triggered an event, _not necessarily_
    // to which an event listener was attached), we treat them as the same action, as we want to capture
    // only one breadcrumb. e.g. multiple clicks on the same button, or typing inside a user input box.
    return false;
}
/**
 * Decide whether an event should be captured.
 * @param event event to be captured
 */
function shouldSkipDOMEvent(event) {
    // We are only interested in filtering `keypress` events for now.
    if (event.type !== 'keypress') {
        return false;
    }
    try {
        var target = event.target;
        if (!target || !target.tagName) {
            return true;
        }
        // Only consider keypress events on actual input elements. This will disregard keypresses targeting body
        // e.g.tabbing through elements, hotkeys, etc.
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return false;
        }
    }
    catch (e) {
        // just accessing `target` property can throw an exception in some rare circumstances
        // see: https://github.com/getsentry/sentry-javascript/issues/838
    }
    return true;
}
/**
 * Wraps addEventListener to capture UI breadcrumbs
 * @param handler function that will be triggered
 * @param globalListener indicates whether event was captured by the global event listener
 * @returns wrapped breadcrumb events handler
 * @hidden
 */
function makeDOMEventHandler(handler, globalListener) {
    if (globalListener === void 0) { globalListener = false; }
    return function (event) {
        // It's possible this handler might trigger multiple times for the same
        // event (e.g. event propagation through node ancestors).
        // Ignore if we've already captured that event.
        if (!event || lastCapturedEvent === event) {
            return;
        }
        // We always want to skip _some_ events.
        if (shouldSkipDOMEvent(event)) {
            return;
        }
        var name = event.type === 'keypress' ? 'input' : event.type;
        // If there is no debounce timer, it means that we can safely capture the new event and store it for future comparisons.
        if (debounceTimerID === undefined) {
            handler({
                event: event,
                name: name,
                global: globalListener,
            });
            lastCapturedEvent = event;
        }
        // If there is a debounce awaiting, see if the new event is different enough to treat it as a unique one.
        // If that's the case, emit the previous event and store locally the newly-captured DOM event.
        else if (shouldShortcircuitPreviousDebounce(lastCapturedEvent, event)) {
            handler({
                event: event,
                name: name,
                global: globalListener,
            });
            lastCapturedEvent = event;
        }
        // Start a new debounce timer that will prevent us from capturing multiple events that should be grouped together.
        clearTimeout(debounceTimerID);
        debounceTimerID = global.setTimeout(function () {
            debounceTimerID = undefined;
        }, debounceDuration);
    };
}
/** JSDoc */
function instrumentDOM() {
    if (!('document' in global)) {
        return;
    }
    // Make it so that any click or keypress that is unhandled / bubbled up all the way to the document triggers our dom
    // handlers. (Normally we have only one, which captures a breadcrumb for each click or keypress.) Do this before
    // we instrument `addEventListener` so that we don't end up attaching this handler twice.
    var triggerDOMHandler = triggerHandlers.bind(null, 'dom');
    var globalDOMEventHandler = makeDOMEventHandler(triggerDOMHandler, true);
    global.document.addEventListener('click', globalDOMEventHandler, false);
    global.document.addEventListener('keypress', globalDOMEventHandler, false);
    // After hooking into click and keypress events bubbled up to `document`, we also hook into user-handled
    // clicks & keypresses, by adding an event listener of our own to any element to which they add a listener. That
    // way, whenever one of their handlers is triggered, ours will be, too. (This is needed because their handler
    // could potentially prevent the event from bubbling up to our global listeners. This way, our handler are still
    // guaranteed to fire at least once.)
    ['EventTarget', 'Node'].forEach(function (target) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        var proto = global[target] && global[target].prototype;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, no-prototype-builtins
        if (!proto || !proto.hasOwnProperty || !proto.hasOwnProperty('addEventListener')) {
            return;
        }
        object_1.fill(proto, 'addEventListener', function (originalAddEventListener) {
            return function (type, listener, options) {
                if (type === 'click' || type == 'keypress') {
                    try {
                        var el = this;
                        var handlers_1 = (el.__sentry_instrumentation_handlers__ = el.__sentry_instrumentation_handlers__ || {});
                        var handlerForType = (handlers_1[type] = handlers_1[type] || { refCount: 0 });
                        if (!handlerForType.handler) {
                            var handler = makeDOMEventHandler(triggerDOMHandler);
                            handlerForType.handler = handler;
                            originalAddEventListener.call(this, type, handler, options);
                        }
                        handlerForType.refCount += 1;
                    }
                    catch (e) {
                        // Accessing dom properties is always fragile.
                        // Also allows us to skip `addEventListenrs` calls with no proper `this` context.
                    }
                }
                return originalAddEventListener.call(this, type, listener, options);
            };
        });
        object_1.fill(proto, 'removeEventListener', function (originalRemoveEventListener) {
            return function (type, listener, options) {
                if (type === 'click' || type == 'keypress') {
                    try {
                        var el = this;
                        var handlers_2 = el.__sentry_instrumentation_handlers__ || {};
                        var handlerForType = handlers_2[type];
                        if (handlerForType) {
                            handlerForType.refCount -= 1;
                            // If there are no longer any custom handlers of the current type on this element, we can remove ours, too.
                            if (handlerForType.refCount <= 0) {
                                originalRemoveEventListener.call(this, type, handlerForType.handler, options);
                                handlerForType.handler = undefined;
                                delete handlers_2[type]; // eslint-disable-line @typescript-eslint/no-dynamic-delete
                            }
                            // If there are no longer any custom handlers of any type on this element, cleanup everything.
                            if (Object.keys(handlers_2).length === 0) {
                                delete el.__sentry_instrumentation_handlers__;
                            }
                        }
                    }
                    catch (e) {
                        // Accessing dom properties is always fragile.
                        // Also allows us to skip `addEventListenrs` calls with no proper `this` context.
                    }
                }
                return originalRemoveEventListener.call(this, type, listener, options);
            };
        });
    });
}
var _oldOnErrorHandler = null;
/** JSDoc */
function instrumentError() {
    _oldOnErrorHandler = global.onerror;
    global.onerror = function (msg, url, line, column, error) {
        triggerHandlers('error', {
            column: column,
            error: error,
            line: line,
            msg: msg,
            url: url,
        });
        if (_oldOnErrorHandler) {
            // eslint-disable-next-line prefer-rest-params
            return _oldOnErrorHandler.apply(this, arguments);
        }
        return false;
    };
}
var _oldOnUnhandledRejectionHandler = null;
/** JSDoc */
function instrumentUnhandledRejection() {
    _oldOnUnhandledRejectionHandler = global.onunhandledrejection;
    global.onunhandledrejection = function (e) {
        triggerHandlers('unhandledrejection', e);
        if (_oldOnUnhandledRejectionHandler) {
            // eslint-disable-next-line prefer-rest-params
            return _oldOnUnhandledRejectionHandler.apply(this, arguments);
        }
        return true;
    };
}
//# sourceMappingURL=instrument.js.map

/***/ }),

/***/ 2757:
/***/ ((__unused_webpack_module, exports) => {

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * Checks whether given value's type is one of a few Error or Error-like
 * {@link isError}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */
function isError(wat) {
    switch (Object.prototype.toString.call(wat)) {
        case '[object Error]':
            return true;
        case '[object Exception]':
            return true;
        case '[object DOMException]':
            return true;
        default:
            return isInstanceOf(wat, Error);
    }
}
exports.isError = isError;
/**
 * Checks whether given value's type is ErrorEvent
 * {@link isErrorEvent}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */
function isErrorEvent(wat) {
    return Object.prototype.toString.call(wat) === '[object ErrorEvent]';
}
exports.isErrorEvent = isErrorEvent;
/**
 * Checks whether given value's type is DOMError
 * {@link isDOMError}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */
function isDOMError(wat) {
    return Object.prototype.toString.call(wat) === '[object DOMError]';
}
exports.isDOMError = isDOMError;
/**
 * Checks whether given value's type is DOMException
 * {@link isDOMException}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */
function isDOMException(wat) {
    return Object.prototype.toString.call(wat) === '[object DOMException]';
}
exports.isDOMException = isDOMException;
/**
 * Checks whether given value's type is a string
 * {@link isString}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */
function isString(wat) {
    return Object.prototype.toString.call(wat) === '[object String]';
}
exports.isString = isString;
/**
 * Checks whether given value's is a primitive (undefined, null, number, boolean, string, bigint, symbol)
 * {@link isPrimitive}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */
function isPrimitive(wat) {
    return wat === null || (typeof wat !== 'object' && typeof wat !== 'function');
}
exports.isPrimitive = isPrimitive;
/**
 * Checks whether given value's type is an object literal
 * {@link isPlainObject}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */
function isPlainObject(wat) {
    return Object.prototype.toString.call(wat) === '[object Object]';
}
exports.isPlainObject = isPlainObject;
/**
 * Checks whether given value's type is an Event instance
 * {@link isEvent}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */
function isEvent(wat) {
    return typeof Event !== 'undefined' && isInstanceOf(wat, Event);
}
exports.isEvent = isEvent;
/**
 * Checks whether given value's type is an Element instance
 * {@link isElement}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */
function isElement(wat) {
    return typeof Element !== 'undefined' && isInstanceOf(wat, Element);
}
exports.isElement = isElement;
/**
 * Checks whether given value's type is an regexp
 * {@link isRegExp}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */
function isRegExp(wat) {
    return Object.prototype.toString.call(wat) === '[object RegExp]';
}
exports.isRegExp = isRegExp;
/**
 * Checks whether given value has a then function.
 * @param wat A value to be checked.
 */
function isThenable(wat) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return Boolean(wat && wat.then && typeof wat.then === 'function');
}
exports.isThenable = isThenable;
/**
 * Checks whether given value's type is a SyntheticEvent
 * {@link isSyntheticEvent}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */
function isSyntheticEvent(wat) {
    return isPlainObject(wat) && 'nativeEvent' in wat && 'preventDefault' in wat && 'stopPropagation' in wat;
}
exports.isSyntheticEvent = isSyntheticEvent;
/**
 * Checks whether given value's type is an instance of provided constructor.
 * {@link isInstanceOf}.
 *
 * @param wat A value to be checked.
 * @param base A constructor to be used in a check.
 * @returns A boolean representing the result.
 */
function isInstanceOf(wat, base) {
    try {
        return wat instanceof base;
    }
    catch (_e) {
        return false;
    }
}
exports.isInstanceOf = isInstanceOf;
//# sourceMappingURL=is.js.map

/***/ }),

/***/ 5577:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
/* eslint-disable @typescript-eslint/no-explicit-any */
var misc_1 = __nccwpck_require__(2154);
// TODO: Implement different loggers for different environments
var global = misc_1.getGlobalObject();
/** Prefix for logging strings */
var PREFIX = 'Sentry Logger ';
/** JSDoc */
var Logger = /** @class */ (function () {
    /** JSDoc */
    function Logger() {
        this._enabled = false;
    }
    /** JSDoc */
    Logger.prototype.disable = function () {
        this._enabled = false;
    };
    /** JSDoc */
    Logger.prototype.enable = function () {
        this._enabled = true;
    };
    /** JSDoc */
    Logger.prototype.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (!this._enabled) {
            return;
        }
        misc_1.consoleSandbox(function () {
            global.console.log(PREFIX + "[Log]: " + args.join(' '));
        });
    };
    /** JSDoc */
    Logger.prototype.warn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (!this._enabled) {
            return;
        }
        misc_1.consoleSandbox(function () {
            global.console.warn(PREFIX + "[Warn]: " + args.join(' '));
        });
    };
    /** JSDoc */
    Logger.prototype.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (!this._enabled) {
            return;
        }
        misc_1.consoleSandbox(function () {
            global.console.error(PREFIX + "[Error]: " + args.join(' '));
        });
    };
    return Logger;
}());
// Ensure we only have a single logger instance, even if multiple versions of @sentry/utils are being used
global.__SENTRY__ = global.__SENTRY__ || {};
var logger = global.__SENTRY__.logger || (global.__SENTRY__.logger = new Logger());
exports.logger = logger;
//# sourceMappingURL=logger.js.map

/***/ }),

/***/ 9515:
/***/ ((__unused_webpack_module, exports) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/**
 * Memo class used for decycle json objects. Uses WeakSet if available otherwise array.
 */
var Memo = /** @class */ (function () {
    function Memo() {
        this._hasWeakSet = typeof WeakSet === 'function';
        this._inner = this._hasWeakSet ? new WeakSet() : [];
    }
    /**
     * Sets obj to remember.
     * @param obj Object to remember
     */
    Memo.prototype.memoize = function (obj) {
        if (this._hasWeakSet) {
            if (this._inner.has(obj)) {
                return true;
            }
            this._inner.add(obj);
            return false;
        }
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (var i = 0; i < this._inner.length; i++) {
            var value = this._inner[i];
            if (value === obj) {
                return true;
            }
        }
        this._inner.push(obj);
        return false;
    };
    /**
     * Removes object from internal storage.
     * @param obj Object to forget
     */
    Memo.prototype.unmemoize = function (obj) {
        if (this._hasWeakSet) {
            this._inner.delete(obj);
        }
        else {
            for (var i = 0; i < this._inner.length; i++) {
                if (this._inner[i] === obj) {
                    this._inner.splice(i, 1);
                    break;
                }
            }
        }
    };
    return Memo;
}());
exports.Memo = Memo;
//# sourceMappingURL=memo.js.map

/***/ }),

/***/ 2154:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var node_1 = __nccwpck_require__(6411);
var string_1 = __nccwpck_require__(6538);
var fallbackGlobalObject = {};
/**
 * Safely get global scope object
 *
 * @returns Global scope object
 */
function getGlobalObject() {
    return (node_1.isNodeEnv()
        ? global
        : typeof window !== 'undefined'
            ? window
            : typeof self !== 'undefined'
                ? self
                : fallbackGlobalObject);
}
exports.getGlobalObject = getGlobalObject;
/**
 * UUID4 generator
 *
 * @returns string Generated UUID4.
 */
function uuid4() {
    var global = getGlobalObject();
    var crypto = global.crypto || global.msCrypto;
    if (!(crypto === void 0) && crypto.getRandomValues) {
        // Use window.crypto API if available
        var arr = new Uint16Array(8);
        crypto.getRandomValues(arr);
        // set 4 in byte 7
        // eslint-disable-next-line no-bitwise
        arr[3] = (arr[3] & 0xfff) | 0x4000;
        // set 2 most significant bits of byte 9 to '10'
        // eslint-disable-next-line no-bitwise
        arr[4] = (arr[4] & 0x3fff) | 0x8000;
        var pad = function (num) {
            var v = num.toString(16);
            while (v.length < 4) {
                v = "0" + v;
            }
            return v;
        };
        return (pad(arr[0]) + pad(arr[1]) + pad(arr[2]) + pad(arr[3]) + pad(arr[4]) + pad(arr[5]) + pad(arr[6]) + pad(arr[7]));
    }
    // http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        // eslint-disable-next-line no-bitwise
        var r = (Math.random() * 16) | 0;
        // eslint-disable-next-line no-bitwise
        var v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
exports.uuid4 = uuid4;
/**
 * Parses string form of URL into an object
 * // borrowed from https://tools.ietf.org/html/rfc3986#appendix-B
 * // intentionally using regex and not <a/> href parsing trick because React Native and other
 * // environments where DOM might not be available
 * @returns parsed URL object
 */
function parseUrl(url) {
    if (!url) {
        return {};
    }
    var match = url.match(/^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/);
    if (!match) {
        return {};
    }
    // coerce to undefined values to empty string so we don't get 'undefined'
    var query = match[6] || '';
    var fragment = match[8] || '';
    return {
        host: match[4],
        path: match[5],
        protocol: match[2],
        relative: match[5] + query + fragment,
    };
}
exports.parseUrl = parseUrl;
/**
 * Extracts either message or type+value from an event that can be used for user-facing logs
 * @returns event's description
 */
function getEventDescription(event) {
    if (event.message) {
        return event.message;
    }
    if (event.exception && event.exception.values && event.exception.values[0]) {
        var exception = event.exception.values[0];
        if (exception.type && exception.value) {
            return exception.type + ": " + exception.value;
        }
        return exception.type || exception.value || event.event_id || '<unknown>';
    }
    return event.event_id || '<unknown>';
}
exports.getEventDescription = getEventDescription;
/** JSDoc */
function consoleSandbox(callback) {
    var global = getGlobalObject();
    var levels = ['debug', 'info', 'warn', 'error', 'log', 'assert'];
    if (!('console' in global)) {
        return callback();
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    var originalConsole = global.console;
    var wrappedLevels = {};
    // Restore all wrapped console methods
    levels.forEach(function (level) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (level in global.console && originalConsole[level].__sentry_original__) {
            wrappedLevels[level] = originalConsole[level];
            originalConsole[level] = originalConsole[level].__sentry_original__;
        }
    });
    // Perform callback manipulations
    var result = callback();
    // Revert restoration to wrapped state
    Object.keys(wrappedLevels).forEach(function (level) {
        originalConsole[level] = wrappedLevels[level];
    });
    return result;
}
exports.consoleSandbox = consoleSandbox;
/**
 * Adds exception values, type and value to an synthetic Exception.
 * @param event The event to modify.
 * @param value Value of the exception.
 * @param type Type of the exception.
 * @hidden
 */
function addExceptionTypeValue(event, value, type) {
    event.exception = event.exception || {};
    event.exception.values = event.exception.values || [];
    event.exception.values[0] = event.exception.values[0] || {};
    event.exception.values[0].value = event.exception.values[0].value || value || '';
    event.exception.values[0].type = event.exception.values[0].type || type || 'Error';
}
exports.addExceptionTypeValue = addExceptionTypeValue;
/**
 * Adds exception mechanism to a given event.
 * @param event The event to modify.
 * @param mechanism Mechanism of the mechanism.
 * @hidden
 */
function addExceptionMechanism(event, mechanism) {
    if (mechanism === void 0) { mechanism = {}; }
    // TODO: Use real type with `keyof Mechanism` thingy and maybe make it better?
    try {
        // @ts-ignore Type 'Mechanism | {}' is not assignable to type 'Mechanism | undefined'
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        event.exception.values[0].mechanism = event.exception.values[0].mechanism || {};
        Object.keys(mechanism).forEach(function (key) {
            // @ts-ignore Mechanism has no index signature
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            event.exception.values[0].mechanism[key] = mechanism[key];
        });
    }
    catch (_oO) {
        // no-empty
    }
}
exports.addExceptionMechanism = addExceptionMechanism;
/**
 * A safe form of location.href
 */
function getLocationHref() {
    try {
        return document.location.href;
    }
    catch (oO) {
        return '';
    }
}
exports.getLocationHref = getLocationHref;
// https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
var SEMVER_REGEXP = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
/**
 * Parses input into a SemVer interface
 * @param input string representation of a semver version
 */
function parseSemver(input) {
    var match = input.match(SEMVER_REGEXP) || [];
    var major = parseInt(match[1], 10);
    var minor = parseInt(match[2], 10);
    var patch = parseInt(match[3], 10);
    return {
        buildmetadata: match[5],
        major: isNaN(major) ? undefined : major,
        minor: isNaN(minor) ? undefined : minor,
        patch: isNaN(patch) ? undefined : patch,
        prerelease: match[4],
    };
}
exports.parseSemver = parseSemver;
var defaultRetryAfter = 60 * 1000; // 60 seconds
/**
 * Extracts Retry-After value from the request header or returns default value
 * @param now current unix timestamp
 * @param header string representation of 'Retry-After' header
 */
function parseRetryAfterHeader(now, header) {
    if (!header) {
        return defaultRetryAfter;
    }
    var headerDelay = parseInt("" + header, 10);
    if (!isNaN(headerDelay)) {
        return headerDelay * 1000;
    }
    var headerDate = Date.parse("" + header);
    if (!isNaN(headerDate)) {
        return headerDate - now;
    }
    return defaultRetryAfter;
}
exports.parseRetryAfterHeader = parseRetryAfterHeader;
/**
 * This function adds context (pre/post/line) lines to the provided frame
 *
 * @param lines string[] containing all lines
 * @param frame StackFrame that will be mutated
 * @param linesOfContext number of context lines we want to add pre/post
 */
function addContextToFrame(lines, frame, linesOfContext) {
    if (linesOfContext === void 0) { linesOfContext = 5; }
    var lineno = frame.lineno || 0;
    var maxLines = lines.length;
    var sourceLine = Math.max(Math.min(maxLines, lineno - 1), 0);
    frame.pre_context = lines
        .slice(Math.max(0, sourceLine - linesOfContext), sourceLine)
        .map(function (line) { return string_1.snipLine(line, 0); });
    frame.context_line = string_1.snipLine(lines[Math.min(maxLines - 1, sourceLine)], frame.colno || 0);
    frame.post_context = lines
        .slice(Math.min(sourceLine + 1, maxLines), sourceLine + 1 + linesOfContext)
        .map(function (line) { return string_1.snipLine(line, 0); });
}
exports.addContextToFrame = addContextToFrame;
/**
 * Strip the query string and fragment off of a given URL or path (if present)
 *
 * @param urlPath Full URL or path, including possible query string and/or fragment
 * @returns URL or path without query string or fragment
 */
function stripUrlQueryAndFragment(urlPath) {
    // eslint-disable-next-line no-useless-escape
    return urlPath.split(/[\?#]/, 1)[0];
}
exports.stripUrlQueryAndFragment = stripUrlQueryAndFragment;
//# sourceMappingURL=misc.js.map

/***/ }),

/***/ 6411:
/***/ ((__unused_webpack_module, exports) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * Checks whether we're in the Node.js or Browser environment
 *
 * @returns Answer to given question
 */
function isNodeEnv() {
    return Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]';
}
exports.isNodeEnv = isNodeEnv;
/**
 * Requires a module which is protected against bundler minification.
 *
 * @param request The module path to resolve
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
function dynamicRequire(mod, request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return mod.require(request);
}
exports.dynamicRequire = dynamicRequire;
//# sourceMappingURL=node.js.map

/***/ }),

/***/ 9249:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __nccwpck_require__(5636);
var browser_1 = __nccwpck_require__(597);
var is_1 = __nccwpck_require__(2757);
var memo_1 = __nccwpck_require__(9515);
var stacktrace_1 = __nccwpck_require__(5986);
var string_1 = __nccwpck_require__(6538);
/**
 * Wrap a given object method with a higher-order function
 *
 * @param source An object that contains a method to be wrapped.
 * @param name A name of method to be wrapped.
 * @param replacementFactory A function that should be used to wrap a given method, returning the wrapped method which
 * will be substituted in for `source[name]`.
 * @returns void
 */
function fill(source, name, replacementFactory) {
    if (!(name in source)) {
        return;
    }
    var original = source[name];
    var wrapped = replacementFactory(original);
    // Make sure it's a function first, as we need to attach an empty prototype for `defineProperties` to work
    // otherwise it'll throw "TypeError: Object.defineProperties called on non-object"
    if (typeof wrapped === 'function') {
        try {
            wrapped.prototype = wrapped.prototype || {};
            Object.defineProperties(wrapped, {
                __sentry_original__: {
                    enumerable: false,
                    value: original,
                },
            });
        }
        catch (_Oo) {
            // This can throw if multiple fill happens on a global object like XMLHttpRequest
            // Fixes https://github.com/getsentry/sentry-javascript/issues/2043
        }
    }
    source[name] = wrapped;
}
exports.fill = fill;
/**
 * Encodes given object into url-friendly format
 *
 * @param object An object that contains serializable values
 * @returns string Encoded
 */
function urlEncode(object) {
    return Object.keys(object)
        .map(function (key) { return encodeURIComponent(key) + "=" + encodeURIComponent(object[key]); })
        .join('&');
}
exports.urlEncode = urlEncode;
/**
 * Transforms any object into an object literal with all its attributes
 * attached to it.
 *
 * @param value Initial source that we have to transform in order for it to be usable by the serializer
 */
function getWalkSource(value) {
    if (is_1.isError(value)) {
        var error = value;
        var err = {
            message: error.message,
            name: error.name,
            stack: error.stack,
        };
        for (var i in error) {
            if (Object.prototype.hasOwnProperty.call(error, i)) {
                err[i] = error[i];
            }
        }
        return err;
    }
    if (is_1.isEvent(value)) {
        var event_1 = value;
        var source = {};
        source.type = event_1.type;
        // Accessing event.target can throw (see getsentry/raven-js#838, #768)
        try {
            source.target = is_1.isElement(event_1.target)
                ? browser_1.htmlTreeAsString(event_1.target)
                : Object.prototype.toString.call(event_1.target);
        }
        catch (_oO) {
            source.target = '<unknown>';
        }
        try {
            source.currentTarget = is_1.isElement(event_1.currentTarget)
                ? browser_1.htmlTreeAsString(event_1.currentTarget)
                : Object.prototype.toString.call(event_1.currentTarget);
        }
        catch (_oO) {
            source.currentTarget = '<unknown>';
        }
        if (typeof CustomEvent !== 'undefined' && is_1.isInstanceOf(value, CustomEvent)) {
            source.detail = event_1.detail;
        }
        for (var i in event_1) {
            if (Object.prototype.hasOwnProperty.call(event_1, i)) {
                source[i] = event_1;
            }
        }
        return source;
    }
    return value;
}
/** Calculates bytes size of input string */
function utf8Length(value) {
    // eslint-disable-next-line no-bitwise
    return ~-encodeURI(value).split(/%..|./).length;
}
/** Calculates bytes size of input object */
function jsonSize(value) {
    return utf8Length(JSON.stringify(value));
}
/** JSDoc */
function normalizeToSize(object, 
// Default Node.js REPL depth
depth, 
// 100kB, as 200kB is max payload size, so half sounds reasonable
maxSize) {
    if (depth === void 0) { depth = 3; }
    if (maxSize === void 0) { maxSize = 100 * 1024; }
    var serialized = normalize(object, depth);
    if (jsonSize(serialized) > maxSize) {
        return normalizeToSize(object, depth - 1, maxSize);
    }
    return serialized;
}
exports.normalizeToSize = normalizeToSize;
/**
 * Transform any non-primitive, BigInt, or Symbol-type value into a string. Acts as a no-op on strings, numbers,
 * booleans, null, and undefined.
 *
 * @param value The value to stringify
 * @returns For non-primitive, BigInt, and Symbol-type values, a string denoting the value's type, type and value, or
 *  type and `description` property, respectively. For non-BigInt, non-Symbol primitives, returns the original value,
 *  unchanged.
 */
function serializeValue(value) {
    var type = Object.prototype.toString.call(value);
    // Node.js REPL notation
    if (typeof value === 'string') {
        return value;
    }
    if (type === '[object Object]') {
        return '[Object]';
    }
    if (type === '[object Array]') {
        return '[Array]';
    }
    var normalized = normalizeValue(value);
    return is_1.isPrimitive(normalized) ? normalized : type;
}
/**
 * normalizeValue()
 *
 * Takes unserializable input and make it serializable friendly
 *
 * - translates undefined/NaN values to "[undefined]"/"[NaN]" respectively,
 * - serializes Error objects
 * - filter global objects
 */
function normalizeValue(value, key) {
    if (key === 'domain' && value && typeof value === 'object' && value._events) {
        return '[Domain]';
    }
    if (key === 'domainEmitter') {
        return '[DomainEmitter]';
    }
    if (typeof global !== 'undefined' && value === global) {
        return '[Global]';
    }
    if (typeof window !== 'undefined' && value === window) {
        return '[Window]';
    }
    if (typeof document !== 'undefined' && value === document) {
        return '[Document]';
    }
    // React's SyntheticEvent thingy
    if (is_1.isSyntheticEvent(value)) {
        return '[SyntheticEvent]';
    }
    if (typeof value === 'number' && value !== value) {
        return '[NaN]';
    }
    if (value === void 0) {
        return '[undefined]';
    }
    if (typeof value === 'function') {
        return "[Function: " + stacktrace_1.getFunctionName(value) + "]";
    }
    // symbols and bigints are considered primitives by TS, but aren't natively JSON-serilaizable
    if (typeof value === 'symbol') {
        return "[" + String(value) + "]";
    }
    if (typeof value === 'bigint') {
        return "[BigInt: " + String(value) + "]";
    }
    return value;
}
/**
 * Walks an object to perform a normalization on it
 *
 * @param key of object that's walked in current iteration
 * @param value object to be walked
 * @param depth Optional number indicating how deep should walking be performed
 * @param memo Optional Memo class handling decycling
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function walk(key, value, depth, memo) {
    if (depth === void 0) { depth = +Infinity; }
    if (memo === void 0) { memo = new memo_1.Memo(); }
    // If we reach the maximum depth, serialize whatever has left
    if (depth === 0) {
        return serializeValue(value);
    }
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    // If value implements `toJSON` method, call it and return early
    if (value !== null && value !== undefined && typeof value.toJSON === 'function') {
        return value.toJSON();
    }
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */
    // If normalized value is a primitive, there are no branches left to walk, so we can just bail out, as theres no point in going down that branch any further
    var normalized = normalizeValue(value, key);
    if (is_1.isPrimitive(normalized)) {
        return normalized;
    }
    // Create source that we will use for next itterations, either objectified error object (Error type with extracted keys:value pairs) or the input itself
    var source = getWalkSource(value);
    // Create an accumulator that will act as a parent for all future itterations of that branch
    var acc = Array.isArray(value) ? [] : {};
    // If we already walked that branch, bail out, as it's circular reference
    if (memo.memoize(value)) {
        return '[Circular ~]';
    }
    // Walk all keys of the source
    for (var innerKey in source) {
        // Avoid iterating over fields in the prototype if they've somehow been exposed to enumeration.
        if (!Object.prototype.hasOwnProperty.call(source, innerKey)) {
            continue;
        }
        // Recursively walk through all the child nodes
        acc[innerKey] = walk(innerKey, source[innerKey], depth - 1, memo);
    }
    // Once walked through all the branches, remove the parent from memo storage
    memo.unmemoize(value);
    // Return accumulated values
    return acc;
}
exports.walk = walk;
/**
 * normalize()
 *
 * - Creates a copy to prevent original input mutation
 * - Skip non-enumerablers
 * - Calls `toJSON` if implemented
 * - Removes circular references
 * - Translates non-serializeable values (undefined/NaN/Functions) to serializable format
 * - Translates known global objects/Classes to a string representations
 * - Takes care of Error objects serialization
 * - Optionally limit depth of final output
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function normalize(input, depth) {
    try {
        return JSON.parse(JSON.stringify(input, function (key, value) { return walk(key, value, depth); }));
    }
    catch (_oO) {
        return '**non-serializable**';
    }
}
exports.normalize = normalize;
/**
 * Given any captured exception, extract its keys and create a sorted
 * and truncated list that will be used inside the event message.
 * eg. `Non-error exception captured with keys: foo, bar, baz`
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function extractExceptionKeysForMessage(exception, maxLength) {
    if (maxLength === void 0) { maxLength = 40; }
    var keys = Object.keys(getWalkSource(exception));
    keys.sort();
    if (!keys.length) {
        return '[object has no keys]';
    }
    if (keys[0].length >= maxLength) {
        return string_1.truncate(keys[0], maxLength);
    }
    for (var includedKeys = keys.length; includedKeys > 0; includedKeys--) {
        var serialized = keys.slice(0, includedKeys).join(', ');
        if (serialized.length > maxLength) {
            continue;
        }
        if (includedKeys === keys.length) {
            return serialized;
        }
        return string_1.truncate(serialized, maxLength);
    }
    return '';
}
exports.extractExceptionKeysForMessage = extractExceptionKeysForMessage;
/**
 * Given any object, return the new object with removed keys that value was `undefined`.
 * Works recursively on objects and arrays.
 */
function dropUndefinedKeys(val) {
    var e_1, _a;
    if (is_1.isPlainObject(val)) {
        var obj = val;
        var rv = {};
        try {
            for (var _b = tslib_1.__values(Object.keys(obj)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var key = _c.value;
                if (typeof obj[key] !== 'undefined') {
                    rv[key] = dropUndefinedKeys(obj[key]);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return rv;
    }
    if (Array.isArray(val)) {
        return val.map(dropUndefinedKeys);
    }
    return val;
}
exports.dropUndefinedKeys = dropUndefinedKeys;
//# sourceMappingURL=object.js.map

/***/ }),

/***/ 9188:
/***/ ((__unused_webpack_module, exports) => {

// Slightly modified (no IE8 support, ES6) and transcribed to TypeScript
// https://raw.githubusercontent.com/calvinmetcalf/rollup-plugin-node-builtins/master/src/es6/path.js
Object.defineProperty(exports, "__esModule", ({ value: true }));
/** JSDoc */
function normalizeArray(parts, allowAboveRoot) {
    // if the path tries to go above the root, `up` ends up > 0
    var up = 0;
    for (var i = parts.length - 1; i >= 0; i--) {
        var last = parts[i];
        if (last === '.') {
            parts.splice(i, 1);
        }
        else if (last === '..') {
            parts.splice(i, 1);
            // eslint-disable-next-line no-plusplus
            up++;
        }
        else if (up) {
            parts.splice(i, 1);
            // eslint-disable-next-line no-plusplus
            up--;
        }
    }
    // if the path is allowed to go above the root, restore leading ..s
    if (allowAboveRoot) {
        // eslint-disable-next-line no-plusplus
        for (; up--; up) {
            parts.unshift('..');
        }
    }
    return parts;
}
// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^/]+?|)(\.[^./]*|))(?:[/]*)$/;
/** JSDoc */
function splitPath(filename) {
    var parts = splitPathRe.exec(filename);
    return parts ? parts.slice(1) : [];
}
// path.resolve([from ...], to)
// posix version
/** JSDoc */
function resolve() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var resolvedPath = '';
    var resolvedAbsolute = false;
    for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
        var path = i >= 0 ? args[i] : '/';
        // Skip empty entries
        if (!path) {
            continue;
        }
        resolvedPath = path + "/" + resolvedPath;
        resolvedAbsolute = path.charAt(0) === '/';
    }
    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)
    // Normalize the path
    resolvedPath = normalizeArray(resolvedPath.split('/').filter(function (p) { return !!p; }), !resolvedAbsolute).join('/');
    return (resolvedAbsolute ? '/' : '') + resolvedPath || '.';
}
exports.resolve = resolve;
/** JSDoc */
function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
        if (arr[start] !== '') {
            break;
        }
    }
    var end = arr.length - 1;
    for (; end >= 0; end--) {
        if (arr[end] !== '') {
            break;
        }
    }
    if (start > end) {
        return [];
    }
    return arr.slice(start, end - start + 1);
}
// path.relative(from, to)
// posix version
/** JSDoc */
function relative(from, to) {
    /* eslint-disable no-param-reassign */
    from = resolve(from).substr(1);
    to = resolve(to).substr(1);
    /* eslint-enable no-param-reassign */
    var fromParts = trim(from.split('/'));
    var toParts = trim(to.split('/'));
    var length = Math.min(fromParts.length, toParts.length);
    var samePartsLength = length;
    for (var i = 0; i < length; i++) {
        if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
        }
    }
    var outputParts = [];
    for (var i = samePartsLength; i < fromParts.length; i++) {
        outputParts.push('..');
    }
    outputParts = outputParts.concat(toParts.slice(samePartsLength));
    return outputParts.join('/');
}
exports.relative = relative;
// path.normalize(path)
// posix version
/** JSDoc */
function normalizePath(path) {
    var isPathAbsolute = isAbsolute(path);
    var trailingSlash = path.substr(-1) === '/';
    // Normalize the path
    var normalizedPath = normalizeArray(path.split('/').filter(function (p) { return !!p; }), !isPathAbsolute).join('/');
    if (!normalizedPath && !isPathAbsolute) {
        normalizedPath = '.';
    }
    if (normalizedPath && trailingSlash) {
        normalizedPath += '/';
    }
    return (isPathAbsolute ? '/' : '') + normalizedPath;
}
exports.normalizePath = normalizePath;
// posix version
/** JSDoc */
function isAbsolute(path) {
    return path.charAt(0) === '/';
}
exports.isAbsolute = isAbsolute;
// posix version
/** JSDoc */
function join() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return normalizePath(args.join('/'));
}
exports.join = join;
/** JSDoc */
function dirname(path) {
    var result = splitPath(path);
    var root = result[0];
    var dir = result[1];
    if (!root && !dir) {
        // No dirname whatsoever
        return '.';
    }
    if (dir) {
        // It has a dirname, strip trailing slash
        dir = dir.substr(0, dir.length - 1);
    }
    return root + dir;
}
exports.dirname = dirname;
/** JSDoc */
function basename(path, ext) {
    var f = splitPath(path)[2];
    if (ext && f.substr(ext.length * -1) === ext) {
        f = f.substr(0, f.length - ext.length);
    }
    return f;
}
exports.basename = basename;
//# sourceMappingURL=path.js.map

/***/ }),

/***/ 1243:
/***/ ((__unused_webpack_module, exports) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.setPrototypeOf = Object.setPrototypeOf || ({ __proto__: [] } instanceof Array ? setProtoOf : mixinProperties);
/**
 * setPrototypeOf polyfill using __proto__
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function setProtoOf(obj, proto) {
    // @ts-ignore __proto__ does not exist on obj
    obj.__proto__ = proto;
    return obj;
}
/**
 * setPrototypeOf polyfill using mixin
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function mixinProperties(obj, proto) {
    for (var prop in proto) {
        // eslint-disable-next-line no-prototype-builtins
        if (!obj.hasOwnProperty(prop)) {
            // @ts-ignore typescript complains about indexing so we remove
            obj[prop] = proto[prop];
        }
    }
    return obj;
}
//# sourceMappingURL=polyfill.js.map

/***/ }),

/***/ 1811:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var error_1 = __nccwpck_require__(6238);
var syncpromise_1 = __nccwpck_require__(7833);
/** A simple queue that holds promises. */
var PromiseBuffer = /** @class */ (function () {
    function PromiseBuffer(_limit) {
        this._limit = _limit;
        /** Internal set of queued Promises */
        this._buffer = [];
    }
    /**
     * Says if the buffer is ready to take more requests
     */
    PromiseBuffer.prototype.isReady = function () {
        return this._limit === undefined || this.length() < this._limit;
    };
    /**
     * Add a promise to the queue.
     *
     * @param task Can be any PromiseLike<T>
     * @returns The original promise.
     */
    PromiseBuffer.prototype.add = function (task) {
        var _this = this;
        if (!this.isReady()) {
            return syncpromise_1.SyncPromise.reject(new error_1.SentryError('Not adding Promise due to buffer limit reached.'));
        }
        if (this._buffer.indexOf(task) === -1) {
            this._buffer.push(task);
        }
        task
            .then(function () { return _this.remove(task); })
            .then(null, function () {
            return _this.remove(task).then(null, function () {
                // We have to add this catch here otherwise we have an unhandledPromiseRejection
                // because it's a new Promise chain.
            });
        });
        return task;
    };
    /**
     * Remove a promise to the queue.
     *
     * @param task Can be any PromiseLike<T>
     * @returns Removed promise.
     */
    PromiseBuffer.prototype.remove = function (task) {
        var removedTask = this._buffer.splice(this._buffer.indexOf(task), 1)[0];
        return removedTask;
    };
    /**
     * This function returns the number of unresolved promises in the queue.
     */
    PromiseBuffer.prototype.length = function () {
        return this._buffer.length;
    };
    /**
     * This will drain the whole queue, returns true if queue is empty or drained.
     * If timeout is provided and the queue takes longer to drain, the promise still resolves but with false.
     *
     * @param timeout Number in ms to wait until it resolves with false.
     */
    PromiseBuffer.prototype.drain = function (timeout) {
        var _this = this;
        return new syncpromise_1.SyncPromise(function (resolve) {
            var capturedSetTimeout = setTimeout(function () {
                if (timeout && timeout > 0) {
                    resolve(false);
                }
            }, timeout);
            syncpromise_1.SyncPromise.all(_this._buffer)
                .then(function () {
                clearTimeout(capturedSetTimeout);
                resolve(true);
            })
                .then(null, function () {
                resolve(true);
            });
        });
    };
    return PromiseBuffer;
}());
exports.PromiseBuffer = PromiseBuffer;
//# sourceMappingURL=promisebuffer.js.map

/***/ }),

/***/ 5986:
/***/ ((__unused_webpack_module, exports) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var defaultFunctionName = '<anonymous>';
/**
 * Safely extract function name from itself
 */
function getFunctionName(fn) {
    try {
        if (!fn || typeof fn !== 'function') {
            return defaultFunctionName;
        }
        return fn.name || defaultFunctionName;
    }
    catch (e) {
        // Just accessing custom props in some Selenium environments
        // can cause a "Permission denied" exception (see raven-js#495).
        return defaultFunctionName;
    }
}
exports.getFunctionName = getFunctionName;
//# sourceMappingURL=stacktrace.js.map

/***/ }),

/***/ 6538:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var is_1 = __nccwpck_require__(2757);
/**
 * Truncates given string to the maximum characters count
 *
 * @param str An object that contains serializable values
 * @param max Maximum number of characters in truncated string (0 = unlimited)
 * @returns string Encoded
 */
function truncate(str, max) {
    if (max === void 0) { max = 0; }
    if (typeof str !== 'string' || max === 0) {
        return str;
    }
    return str.length <= max ? str : str.substr(0, max) + "...";
}
exports.truncate = truncate;
/**
 * This is basically just `trim_line` from
 * https://github.com/getsentry/sentry/blob/master/src/sentry/lang/javascript/processor.py#L67
 *
 * @param str An object that contains serializable values
 * @param max Maximum number of characters in truncated string
 * @returns string Encoded
 */
function snipLine(line, colno) {
    var newLine = line;
    var ll = newLine.length;
    if (ll <= 150) {
        return newLine;
    }
    if (colno > ll) {
        // eslint-disable-next-line no-param-reassign
        colno = ll;
    }
    var start = Math.max(colno - 60, 0);
    if (start < 5) {
        start = 0;
    }
    var end = Math.min(start + 140, ll);
    if (end > ll - 5) {
        end = ll;
    }
    if (end === ll) {
        start = Math.max(end - 140, 0);
    }
    newLine = newLine.slice(start, end);
    if (start > 0) {
        newLine = "'{snip} " + newLine;
    }
    if (end < ll) {
        newLine += ' {snip}';
    }
    return newLine;
}
exports.snipLine = snipLine;
/**
 * Join values in array
 * @param input array of values to be joined together
 * @param delimiter string to be placed in-between values
 * @returns Joined values
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeJoin(input, delimiter) {
    if (!Array.isArray(input)) {
        return '';
    }
    var output = [];
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (var i = 0; i < input.length; i++) {
        var value = input[i];
        try {
            output.push(String(value));
        }
        catch (e) {
            output.push('[value cannot be serialized]');
        }
    }
    return output.join(delimiter);
}
exports.safeJoin = safeJoin;
/**
 * Checks if the value matches a regex or includes the string
 * @param value The string value to be checked against
 * @param pattern Either a regex or a string that must be contained in value
 */
function isMatchingPattern(value, pattern) {
    if (!is_1.isString(value)) {
        return false;
    }
    if (is_1.isRegExp(pattern)) {
        return pattern.test(value);
    }
    if (typeof pattern === 'string') {
        return value.indexOf(pattern) !== -1;
    }
    return false;
}
exports.isMatchingPattern = isMatchingPattern;
//# sourceMappingURL=string.js.map

/***/ }),

/***/ 8714:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
var logger_1 = __nccwpck_require__(5577);
var misc_1 = __nccwpck_require__(2154);
/**
 * Tells whether current environment supports ErrorEvent objects
 * {@link supportsErrorEvent}.
 *
 * @returns Answer to the given question.
 */
function supportsErrorEvent() {
    try {
        new ErrorEvent('');
        return true;
    }
    catch (e) {
        return false;
    }
}
exports.supportsErrorEvent = supportsErrorEvent;
/**
 * Tells whether current environment supports DOMError objects
 * {@link supportsDOMError}.
 *
 * @returns Answer to the given question.
 */
function supportsDOMError() {
    try {
        // Chrome: VM89:1 Uncaught TypeError: Failed to construct 'DOMError':
        // 1 argument required, but only 0 present.
        // @ts-ignore It really needs 1 argument, not 0.
        new DOMError('');
        return true;
    }
    catch (e) {
        return false;
    }
}
exports.supportsDOMError = supportsDOMError;
/**
 * Tells whether current environment supports DOMException objects
 * {@link supportsDOMException}.
 *
 * @returns Answer to the given question.
 */
function supportsDOMException() {
    try {
        new DOMException('');
        return true;
    }
    catch (e) {
        return false;
    }
}
exports.supportsDOMException = supportsDOMException;
/**
 * Tells whether current environment supports Fetch API
 * {@link supportsFetch}.
 *
 * @returns Answer to the given question.
 */
function supportsFetch() {
    if (!('fetch' in misc_1.getGlobalObject())) {
        return false;
    }
    try {
        new Headers();
        new Request('');
        new Response();
        return true;
    }
    catch (e) {
        return false;
    }
}
exports.supportsFetch = supportsFetch;
/**
 * isNativeFetch checks if the given function is a native implementation of fetch()
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function isNativeFetch(func) {
    return func && /^function fetch\(\)\s+\{\s+\[native code\]\s+\}$/.test(func.toString());
}
exports.isNativeFetch = isNativeFetch;
/**
 * Tells whether current environment supports Fetch API natively
 * {@link supportsNativeFetch}.
 *
 * @returns true if `window.fetch` is natively implemented, false otherwise
 */
function supportsNativeFetch() {
    if (!supportsFetch()) {
        return false;
    }
    var global = misc_1.getGlobalObject();
    // Fast path to avoid DOM I/O
    // eslint-disable-next-line @typescript-eslint/unbound-method
    if (isNativeFetch(global.fetch)) {
        return true;
    }
    // window.fetch is implemented, but is polyfilled or already wrapped (e.g: by a chrome extension)
    // so create a "pure" iframe to see if that has native fetch
    var result = false;
    var doc = global.document;
    // eslint-disable-next-line deprecation/deprecation
    if (doc && typeof doc.createElement === "function") {
        try {
            var sandbox = doc.createElement('iframe');
            sandbox.hidden = true;
            doc.head.appendChild(sandbox);
            if (sandbox.contentWindow && sandbox.contentWindow.fetch) {
                // eslint-disable-next-line @typescript-eslint/unbound-method
                result = isNativeFetch(sandbox.contentWindow.fetch);
            }
            doc.head.removeChild(sandbox);
        }
        catch (err) {
            logger_1.logger.warn('Could not create sandbox iframe for pure fetch check, bailing to window.fetch: ', err);
        }
    }
    return result;
}
exports.supportsNativeFetch = supportsNativeFetch;
/**
 * Tells whether current environment supports ReportingObserver API
 * {@link supportsReportingObserver}.
 *
 * @returns Answer to the given question.
 */
function supportsReportingObserver() {
    return 'ReportingObserver' in misc_1.getGlobalObject();
}
exports.supportsReportingObserver = supportsReportingObserver;
/**
 * Tells whether current environment supports Referrer Policy API
 * {@link supportsReferrerPolicy}.
 *
 * @returns Answer to the given question.
 */
function supportsReferrerPolicy() {
    // Despite all stars in the sky saying that Edge supports old draft syntax, aka 'never', 'always', 'origin' and 'default
    // https://caniuse.com/#feat=referrer-policy
    // It doesn't. And it throw exception instead of ignoring this parameter...
    // REF: https://github.com/getsentry/raven-js/issues/1233
    if (!supportsFetch()) {
        return false;
    }
    try {
        new Request('_', {
            referrerPolicy: 'origin',
        });
        return true;
    }
    catch (e) {
        return false;
    }
}
exports.supportsReferrerPolicy = supportsReferrerPolicy;
/**
 * Tells whether current environment supports History API
 * {@link supportsHistory}.
 *
 * @returns Answer to the given question.
 */
function supportsHistory() {
    // NOTE: in Chrome App environment, touching history.pushState, *even inside
    //       a try/catch block*, will cause Chrome to output an error to console.error
    // borrowed from: https://github.com/angular/angular.js/pull/13945/files
    var global = misc_1.getGlobalObject();
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    var chrome = global.chrome;
    var isChromePackagedApp = chrome && chrome.app && chrome.app.runtime;
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */
    var hasHistoryApi = 'history' in global && !!global.history.pushState && !!global.history.replaceState;
    return !isChromePackagedApp && hasHistoryApi;
}
exports.supportsHistory = supportsHistory;
//# sourceMappingURL=supports.js.map

/***/ }),

/***/ 7833:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

Object.defineProperty(exports, "__esModule", ({ value: true }));
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/typedef */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
var is_1 = __nccwpck_require__(2757);
/** SyncPromise internal states */
var States;
(function (States) {
    /** Pending */
    States["PENDING"] = "PENDING";
    /** Resolved / OK */
    States["RESOLVED"] = "RESOLVED";
    /** Rejected / Error */
    States["REJECTED"] = "REJECTED";
})(States || (States = {}));
/**
 * Thenable class that behaves like a Promise and follows it's interface
 * but is not async internally
 */
var SyncPromise = /** @class */ (function () {
    function SyncPromise(executor) {
        var _this = this;
        this._state = States.PENDING;
        this._handlers = [];
        /** JSDoc */
        this._resolve = function (value) {
            _this._setResult(States.RESOLVED, value);
        };
        /** JSDoc */
        this._reject = function (reason) {
            _this._setResult(States.REJECTED, reason);
        };
        /** JSDoc */
        this._setResult = function (state, value) {
            if (_this._state !== States.PENDING) {
                return;
            }
            if (is_1.isThenable(value)) {
                value.then(_this._resolve, _this._reject);
                return;
            }
            _this._state = state;
            _this._value = value;
            _this._executeHandlers();
        };
        // TODO: FIXME
        /** JSDoc */
        this._attachHandler = function (handler) {
            _this._handlers = _this._handlers.concat(handler);
            _this._executeHandlers();
        };
        /** JSDoc */
        this._executeHandlers = function () {
            if (_this._state === States.PENDING) {
                return;
            }
            var cachedHandlers = _this._handlers.slice();
            _this._handlers = [];
            cachedHandlers.forEach(function (handler) {
                if (handler.done) {
                    return;
                }
                if (_this._state === States.RESOLVED) {
                    if (handler.onfulfilled) {
                        // eslint-disable-next-line @typescript-eslint/no-floating-promises
                        handler.onfulfilled(_this._value);
                    }
                }
                if (_this._state === States.REJECTED) {
                    if (handler.onrejected) {
                        handler.onrejected(_this._value);
                    }
                }
                handler.done = true;
            });
        };
        try {
            executor(this._resolve, this._reject);
        }
        catch (e) {
            this._reject(e);
        }
    }
    /** JSDoc */
    SyncPromise.resolve = function (value) {
        return new SyncPromise(function (resolve) {
            resolve(value);
        });
    };
    /** JSDoc */
    SyncPromise.reject = function (reason) {
        return new SyncPromise(function (_, reject) {
            reject(reason);
        });
    };
    /** JSDoc */
    SyncPromise.all = function (collection) {
        return new SyncPromise(function (resolve, reject) {
            if (!Array.isArray(collection)) {
                reject(new TypeError("Promise.all requires an array as input."));
                return;
            }
            if (collection.length === 0) {
                resolve([]);
                return;
            }
            var counter = collection.length;
            var resolvedCollection = [];
            collection.forEach(function (item, index) {
                SyncPromise.resolve(item)
                    .then(function (value) {
                    resolvedCollection[index] = value;
                    counter -= 1;
                    if (counter !== 0) {
                        return;
                    }
                    resolve(resolvedCollection);
                })
                    .then(null, reject);
            });
        });
    };
    /** JSDoc */
    SyncPromise.prototype.then = function (onfulfilled, onrejected) {
        var _this = this;
        return new SyncPromise(function (resolve, reject) {
            _this._attachHandler({
                done: false,
                onfulfilled: function (result) {
                    if (!onfulfilled) {
                        // TODO: ¯\_(ツ)_/¯
                        // TODO: FIXME
                        resolve(result);
                        return;
                    }
                    try {
                        resolve(onfulfilled(result));
                        return;
                    }
                    catch (e) {
                        reject(e);
                        return;
                    }
                },
                onrejected: function (reason) {
                    if (!onrejected) {
                        reject(reason);
                        return;
                    }
                    try {
                        resolve(onrejected(reason));
                        return;
                    }
                    catch (e) {
                        reject(e);
                        return;
                    }
                },
            });
        });
    };
    /** JSDoc */
    SyncPromise.prototype.catch = function (onrejected) {
        return this.then(function (val) { return val; }, onrejected);
    };
    /** JSDoc */
    SyncPromise.prototype.finally = function (onfinally) {
        var _this = this;
        return new SyncPromise(function (resolve, reject) {
            var val;
            var isRejected;
            return _this.then(function (value) {
                isRejected = false;
                val = value;
                if (onfinally) {
                    onfinally();
                }
            }, function (reason) {
                isRejected = true;
                val = reason;
                if (onfinally) {
                    onfinally();
                }
            }).then(function () {
                if (isRejected) {
                    reject(val);
                    return;
                }
                resolve(val);
            });
        });
    };
    /** JSDoc */
    SyncPromise.prototype.toString = function () {
        return '[object SyncPromise]';
    };
    return SyncPromise;
}());
exports.SyncPromise = SyncPromise;
//# sourceMappingURL=syncpromise.js.map

/***/ }),

/***/ 1735:
/***/ ((module, exports, __nccwpck_require__) => {

/* module decorator */ module = __nccwpck_require__.nmd(module);
Object.defineProperty(exports, "__esModule", ({ value: true }));
var misc_1 = __nccwpck_require__(2154);
var node_1 = __nccwpck_require__(6411);
/**
 * A TimestampSource implementation for environments that do not support the Performance Web API natively.
 *
 * Note that this TimestampSource does not use a monotonic clock. A call to `nowSeconds` may return a timestamp earlier
 * than a previously returned value. We do not try to emulate a monotonic behavior in order to facilitate debugging. It
 * is more obvious to explain "why does my span have negative duration" than "why my spans have zero duration".
 */
var dateTimestampSource = {
    nowSeconds: function () { return Date.now() / 1000; },
};
/**
 * Returns a wrapper around the native Performance API browser implementation, or undefined for browsers that do not
 * support the API.
 *
 * Wrapping the native API works around differences in behavior from different browsers.
 */
function getBrowserPerformance() {
    var performance = misc_1.getGlobalObject().performance;
    if (!performance || !performance.now) {
        return undefined;
    }
    // Replace performance.timeOrigin with our own timeOrigin based on Date.now().
    //
    // This is a partial workaround for browsers reporting performance.timeOrigin such that performance.timeOrigin +
    // performance.now() gives a date arbitrarily in the past.
    //
    // Additionally, computing timeOrigin in this way fills the gap for browsers where performance.timeOrigin is
    // undefined.
    //
    // The assumption that performance.timeOrigin + performance.now() ~= Date.now() is flawed, but we depend on it to
    // interact with data coming out of performance entries.
    //
    // Note that despite recommendations against it in the spec, browsers implement the Performance API with a clock that
    // might stop when the computer is asleep (and perhaps under other circumstances). Such behavior causes
    // performance.timeOrigin + performance.now() to have an arbitrary skew over Date.now(). In laptop computers, we have
    // observed skews that can be as long as days, weeks or months.
    //
    // See https://github.com/getsentry/sentry-javascript/issues/2590.
    //
    // BUG: despite our best intentions, this workaround has its limitations. It mostly addresses timings of pageload
    // transactions, but ignores the skew built up over time that can aversely affect timestamps of navigation
    // transactions of long-lived web pages.
    var timeOrigin = Date.now() - performance.now();
    return {
        now: function () { return performance.now(); },
        timeOrigin: timeOrigin,
    };
}
/**
 * Returns the native Performance API implementation from Node.js. Returns undefined in old Node.js versions that don't
 * implement the API.
 */
function getNodePerformance() {
    try {
        var perfHooks = node_1.dynamicRequire(module, 'perf_hooks');
        return perfHooks.performance;
    }
    catch (_) {
        return undefined;
    }
}
/**
 * The Performance API implementation for the current platform, if available.
 */
var platformPerformance = node_1.isNodeEnv() ? getNodePerformance() : getBrowserPerformance();
var timestampSource = platformPerformance === undefined
    ? dateTimestampSource
    : {
        nowSeconds: function () { return (platformPerformance.timeOrigin + platformPerformance.now()) / 1000; },
    };
/**
 * Returns a timestamp in seconds since the UNIX epoch using the Date API.
 */
exports.dateTimestampInSeconds = dateTimestampSource.nowSeconds.bind(dateTimestampSource);
/**
 * Returns a timestamp in seconds since the UNIX epoch using either the Performance or Date APIs, depending on the
 * availability of the Performance API.
 *
 * See `usingPerformanceAPI` to test whether the Performance API is used.
 *
 * BUG: Note that because of how browsers implement the Performance API, the clock might stop when the computer is
 * asleep. This creates a skew between `dateTimestampInSeconds` and `timestampInSeconds`. The
 * skew can grow to arbitrary amounts like days, weeks or months.
 * See https://github.com/getsentry/sentry-javascript/issues/2590.
 */
exports.timestampInSeconds = timestampSource.nowSeconds.bind(timestampSource);
// Re-exported with an old name for backwards-compatibility.
exports.timestampWithMs = exports.timestampInSeconds;
/**
 * A boolean that is true when timestampInSeconds uses the Performance API to produce monotonic timestamps.
 */
exports.usingPerformanceAPI = platformPerformance !== undefined;
/**
 * The number of milliseconds since the UNIX epoch. This value is only usable in a browser, and only when the
 * performance API is available.
 */
exports.browserPerformanceTimeOrigin = (function () {
    // Unfortunately browsers may report an inaccurate time origin data, through either performance.timeOrigin or
    // performance.timing.navigationStart, which results in poor results in performance data. We only treat time origin
    // data as reliable if they are within a reasonable threshold of the current time.
    var performance = misc_1.getGlobalObject().performance;
    if (!performance) {
        exports._browserPerformanceTimeOriginMode = 'none';
        return undefined;
    }
    var threshold = 3600 * 1000;
    var timeOriginIsReliable = performance.timeOrigin && Math.abs(performance.timeOrigin + performance.now() - Date.now()) < threshold;
    if (timeOriginIsReliable) {
        exports._browserPerformanceTimeOriginMode = 'timeOrigin';
        return performance.timeOrigin;
    }
    // While performance.timing.navigationStart is deprecated in favor of performance.timeOrigin, performance.timeOrigin
    // is not as widely supported. Namely, performance.timeOrigin is undefined in Safari as of writing.
    // Also as of writing, performance.timing is not available in Web Workers in mainstream browsers, so it is not always
    // a valid fallback. In the absence of an initial time provided by the browser, fallback to the current time from the
    // Date API.
    // eslint-disable-next-line deprecation/deprecation
    var navigationStart = performance.timing && performance.timing.navigationStart;
    var hasNavigationStart = typeof navigationStart === 'number';
    var navigationStartIsReliable = hasNavigationStart && Math.abs(navigationStart + performance.now() - Date.now()) < threshold;
    if (navigationStartIsReliable) {
        exports._browserPerformanceTimeOriginMode = 'navigationStart';
        return navigationStart;
    }
    // Either both timeOrigin and navigationStart are skewed or neither is available, fallback to Date.
    exports._browserPerformanceTimeOriginMode = 'dateNow';
    return Date.now();
})();
//# sourceMappingURL=time.js.map

/***/ }),

/***/ 9690:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const events_1 = __nccwpck_require__(8614);
const debug_1 = __importDefault(__nccwpck_require__(8237));
const promisify_1 = __importDefault(__nccwpck_require__(6570));
const debug = debug_1.default('agent-base');
function isAgent(v) {
    return Boolean(v) && typeof v.addRequest === 'function';
}
function isSecureEndpoint() {
    const { stack } = new Error();
    if (typeof stack !== 'string')
        return false;
    return stack.split('\n').some(l => l.indexOf('(https.js:') !== -1 || l.indexOf('node:https:') !== -1);
}
function createAgent(callback, opts) {
    return new createAgent.Agent(callback, opts);
}
(function (createAgent) {
    /**
     * Base `http.Agent` implementation.
     * No pooling/keep-alive is implemented by default.
     *
     * @param {Function} callback
     * @api public
     */
    class Agent extends events_1.EventEmitter {
        constructor(callback, _opts) {
            super();
            let opts = _opts;
            if (typeof callback === 'function') {
                this.callback = callback;
            }
            else if (callback) {
                opts = callback;
            }
            // Timeout for the socket to be returned from the callback
            this.timeout = null;
            if (opts && typeof opts.timeout === 'number') {
                this.timeout = opts.timeout;
            }
            // These aren't actually used by `agent-base`, but are required
            // for the TypeScript definition files in `@types/node` :/
            this.maxFreeSockets = 1;
            this.maxSockets = 1;
            this.maxTotalSockets = Infinity;
            this.sockets = {};
            this.freeSockets = {};
            this.requests = {};
            this.options = {};
        }
        get defaultPort() {
            if (typeof this.explicitDefaultPort === 'number') {
                return this.explicitDefaultPort;
            }
            return isSecureEndpoint() ? 443 : 80;
        }
        set defaultPort(v) {
            this.explicitDefaultPort = v;
        }
        get protocol() {
            if (typeof this.explicitProtocol === 'string') {
                return this.explicitProtocol;
            }
            return isSecureEndpoint() ? 'https:' : 'http:';
        }
        set protocol(v) {
            this.explicitProtocol = v;
        }
        callback(req, opts, fn) {
            throw new Error('"agent-base" has no default implementation, you must subclass and override `callback()`');
        }
        /**
         * Called by node-core's "_http_client.js" module when creating
         * a new HTTP request with this Agent instance.
         *
         * @api public
         */
        addRequest(req, _opts) {
            const opts = Object.assign({}, _opts);
            if (typeof opts.secureEndpoint !== 'boolean') {
                opts.secureEndpoint = isSecureEndpoint();
            }
            if (opts.host == null) {
                opts.host = 'localhost';
            }
            if (opts.port == null) {
                opts.port = opts.secureEndpoint ? 443 : 80;
            }
            if (opts.protocol == null) {
                opts.protocol = opts.secureEndpoint ? 'https:' : 'http:';
            }
            if (opts.host && opts.path) {
                // If both a `host` and `path` are specified then it's most
                // likely the result of a `url.parse()` call... we need to
                // remove the `path` portion so that `net.connect()` doesn't
                // attempt to open that as a unix socket file.
                delete opts.path;
            }
            delete opts.agent;
            delete opts.hostname;
            delete opts._defaultAgent;
            delete opts.defaultPort;
            delete opts.createConnection;
            // Hint to use "Connection: close"
            // XXX: non-documented `http` module API :(
            req._last = true;
            req.shouldKeepAlive = false;
            let timedOut = false;
            let timeoutId = null;
            const timeoutMs = opts.timeout || this.timeout;
            const onerror = (err) => {
                if (req._hadError)
                    return;
                req.emit('error', err);
                // For Safety. Some additional errors might fire later on
                // and we need to make sure we don't double-fire the error event.
                req._hadError = true;
            };
            const ontimeout = () => {
                timeoutId = null;
                timedOut = true;
                const err = new Error(`A "socket" was not created for HTTP request before ${timeoutMs}ms`);
                err.code = 'ETIMEOUT';
                onerror(err);
            };
            const callbackError = (err) => {
                if (timedOut)
                    return;
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                onerror(err);
            };
            const onsocket = (socket) => {
                if (timedOut)
                    return;
                if (timeoutId != null) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                if (isAgent(socket)) {
                    // `socket` is actually an `http.Agent` instance, so
                    // relinquish responsibility for this `req` to the Agent
                    // from here on
                    debug('Callback returned another Agent instance %o', socket.constructor.name);
                    socket.addRequest(req, opts);
                    return;
                }
                if (socket) {
                    socket.once('free', () => {
                        this.freeSocket(socket, opts);
                    });
                    req.onSocket(socket);
                    return;
                }
                const err = new Error(`no Duplex stream was returned to agent-base for \`${req.method} ${req.path}\``);
                onerror(err);
            };
            if (typeof this.callback !== 'function') {
                onerror(new Error('`callback` is not defined'));
                return;
            }
            if (!this.promisifiedCallback) {
                if (this.callback.length >= 3) {
                    debug('Converting legacy callback function to promise');
                    this.promisifiedCallback = promisify_1.default(this.callback);
                }
                else {
                    this.promisifiedCallback = this.callback;
                }
            }
            if (typeof timeoutMs === 'number' && timeoutMs > 0) {
                timeoutId = setTimeout(ontimeout, timeoutMs);
            }
            if ('port' in opts && typeof opts.port !== 'number') {
                opts.port = Number(opts.port);
            }
            try {
                debug('Resolving socket for %o request: %o', opts.protocol, `${req.method} ${req.path}`);
                Promise.resolve(this.promisifiedCallback(req, opts)).then(onsocket, callbackError);
            }
            catch (err) {
                Promise.reject(err).catch(callbackError);
            }
        }
        freeSocket(socket, opts) {
            debug('Freeing socket %o %o', socket.constructor.name, opts);
            socket.destroy();
        }
        destroy() {
            debug('Destroying agent %o', this.constructor.name);
        }
    }
    createAgent.Agent = Agent;
    // So that `instanceof` works correctly
    createAgent.prototype = createAgent.Agent.prototype;
})(createAgent || (createAgent = {}));
module.exports = createAgent;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 6570:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
function promisify(fn) {
    return function (req, opts) {
        return new Promise((resolve, reject) => {
            fn.call(this, req, opts, (err, rtn) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rtn);
                }
            });
        });
    };
}
exports.default = promisify;
//# sourceMappingURL=promisify.js.map

/***/ }),

/***/ 3658:
/***/ ((__unused_webpack_module, exports) => {

"use strict";
/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */



/**
 * Module exports.
 * @public
 */

exports.parse = parse;
exports.serialize = serialize;

/**
 * Module variables.
 * @private
 */

var decode = decodeURIComponent;
var encode = encodeURIComponent;
var pairSplitRegExp = /; */;

/**
 * RegExp to match field-content in RFC 7230 sec 3.2
 *
 * field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 * field-vchar   = VCHAR / obs-text
 * obs-text      = %x80-FF
 */

var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;

/**
 * Parse a cookie header.
 *
 * Parse the given cookie header string into an object
 * The object has the various cookies as keys(names) => values
 *
 * @param {string} str
 * @param {object} [options]
 * @return {object}
 * @public
 */

function parse(str, options) {
  if (typeof str !== 'string') {
    throw new TypeError('argument str must be a string');
  }

  var obj = {}
  var opt = options || {};
  var pairs = str.split(pairSplitRegExp);
  var dec = opt.decode || decode;

  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i];
    var eq_idx = pair.indexOf('=');

    // skip things that don't look like key=value
    if (eq_idx < 0) {
      continue;
    }

    var key = pair.substr(0, eq_idx).trim()
    var val = pair.substr(++eq_idx, pair.length).trim();

    // quoted values
    if ('"' == val[0]) {
      val = val.slice(1, -1);
    }

    // only assign once
    if (undefined == obj[key]) {
      obj[key] = tryDecode(val, dec);
    }
  }

  return obj;
}

/**
 * Serialize data into a cookie header.
 *
 * Serialize the a name value pair into a cookie string suitable for
 * http headers. An optional options object specified cookie parameters.
 *
 * serialize('foo', 'bar', { httpOnly: true })
 *   => "foo=bar; httpOnly"
 *
 * @param {string} name
 * @param {string} val
 * @param {object} [options]
 * @return {string}
 * @public
 */

function serialize(name, val, options) {
  var opt = options || {};
  var enc = opt.encode || encode;

  if (typeof enc !== 'function') {
    throw new TypeError('option encode is invalid');
  }

  if (!fieldContentRegExp.test(name)) {
    throw new TypeError('argument name is invalid');
  }

  var value = enc(val);

  if (value && !fieldContentRegExp.test(value)) {
    throw new TypeError('argument val is invalid');
  }

  var str = name + '=' + value;

  if (null != opt.maxAge) {
    var maxAge = opt.maxAge - 0;

    if (isNaN(maxAge) || !isFinite(maxAge)) {
      throw new TypeError('option maxAge is invalid')
    }

    str += '; Max-Age=' + Math.floor(maxAge);
  }

  if (opt.domain) {
    if (!fieldContentRegExp.test(opt.domain)) {
      throw new TypeError('option domain is invalid');
    }

    str += '; Domain=' + opt.domain;
  }

  if (opt.path) {
    if (!fieldContentRegExp.test(opt.path)) {
      throw new TypeError('option path is invalid');
    }

    str += '; Path=' + opt.path;
  }

  if (opt.expires) {
    if (typeof opt.expires.toUTCString !== 'function') {
      throw new TypeError('option expires is invalid');
    }

    str += '; Expires=' + opt.expires.toUTCString();
  }

  if (opt.httpOnly) {
    str += '; HttpOnly';
  }

  if (opt.secure) {
    str += '; Secure';
  }

  if (opt.sameSite) {
    var sameSite = typeof opt.sameSite === 'string'
      ? opt.sameSite.toLowerCase() : opt.sameSite;

    switch (sameSite) {
      case true:
        str += '; SameSite=Strict';
        break;
      case 'lax':
        str += '; SameSite=Lax';
        break;
      case 'strict':
        str += '; SameSite=Strict';
        break;
      case 'none':
        str += '; SameSite=None';
        break;
      default:
        throw new TypeError('option sameSite is invalid');
    }
  }

  return str;
}

/**
 * Try decoding a string using a decoding function.
 *
 * @param {string} str
 * @param {function} decode
 * @private
 */

function tryDecode(str, decode) {
  try {
    return decode(str);
  } catch (e) {
    return str;
  }
}


/***/ }),

/***/ 8222:
/***/ ((module, exports, __nccwpck_require__) => {

/* eslint-env browser */

/**
 * This is the web browser implementation of `debug()`.
 */

exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = localstorage();
exports.destroy = (() => {
	let warned = false;

	return () => {
		if (!warned) {
			warned = true;
			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
		}
	};
})();

/**
 * Colors.
 */

exports.colors = [
	'#0000CC',
	'#0000FF',
	'#0033CC',
	'#0033FF',
	'#0066CC',
	'#0066FF',
	'#0099CC',
	'#0099FF',
	'#00CC00',
	'#00CC33',
	'#00CC66',
	'#00CC99',
	'#00CCCC',
	'#00CCFF',
	'#3300CC',
	'#3300FF',
	'#3333CC',
	'#3333FF',
	'#3366CC',
	'#3366FF',
	'#3399CC',
	'#3399FF',
	'#33CC00',
	'#33CC33',
	'#33CC66',
	'#33CC99',
	'#33CCCC',
	'#33CCFF',
	'#6600CC',
	'#6600FF',
	'#6633CC',
	'#6633FF',
	'#66CC00',
	'#66CC33',
	'#9900CC',
	'#9900FF',
	'#9933CC',
	'#9933FF',
	'#99CC00',
	'#99CC33',
	'#CC0000',
	'#CC0033',
	'#CC0066',
	'#CC0099',
	'#CC00CC',
	'#CC00FF',
	'#CC3300',
	'#CC3333',
	'#CC3366',
	'#CC3399',
	'#CC33CC',
	'#CC33FF',
	'#CC6600',
	'#CC6633',
	'#CC9900',
	'#CC9933',
	'#CCCC00',
	'#CCCC33',
	'#FF0000',
	'#FF0033',
	'#FF0066',
	'#FF0099',
	'#FF00CC',
	'#FF00FF',
	'#FF3300',
	'#FF3333',
	'#FF3366',
	'#FF3399',
	'#FF33CC',
	'#FF33FF',
	'#FF6600',
	'#FF6633',
	'#FF9900',
	'#FF9933',
	'#FFCC00',
	'#FFCC33'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

// eslint-disable-next-line complexity
function useColors() {
	// NB: In an Electron preload script, document will be defined but not fully
	// initialized. Since we know we're in Chrome, we'll just detect this case
	// explicitly
	if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
		return true;
	}

	// Internet Explorer and Edge do not support colors.
	if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
		return false;
	}

	// Is webkit? http://stackoverflow.com/a/16459606/376773
	// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
	return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
		// Is firebug? http://stackoverflow.com/a/398120/376773
		(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
		// Is firefox >= v31?
		// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
		// Double check webkit in userAgent just in case we are in a worker
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
	args[0] = (this.useColors ? '%c' : '') +
		this.namespace +
		(this.useColors ? ' %c' : ' ') +
		args[0] +
		(this.useColors ? '%c ' : ' ') +
		'+' + module.exports.humanize(this.diff);

	if (!this.useColors) {
		return;
	}

	const c = 'color: ' + this.color;
	args.splice(1, 0, c, 'color: inherit');

	// The final "%c" is somewhat tricky, because there could be other
	// arguments passed either before or after the %c, so we need to
	// figure out the correct index to insert the CSS into
	let index = 0;
	let lastC = 0;
	args[0].replace(/%[a-zA-Z%]/g, match => {
		if (match === '%%') {
			return;
		}
		index++;
		if (match === '%c') {
			// We only are interested in the *last* %c
			// (the user may have provided their own)
			lastC = index;
		}
	});

	args.splice(lastC, 0, c);
}

/**
 * Invokes `console.debug()` when available.
 * No-op when `console.debug` is not a "function".
 * If `console.debug` is not available, falls back
 * to `console.log`.
 *
 * @api public
 */
exports.log = console.debug || console.log || (() => {});

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
function save(namespaces) {
	try {
		if (namespaces) {
			exports.storage.setItem('debug', namespaces);
		} else {
			exports.storage.removeItem('debug');
		}
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */
function load() {
	let r;
	try {
		r = exports.storage.getItem('debug');
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}

	// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
	if (!r && typeof process !== 'undefined' && 'env' in process) {
		r = process.env.DEBUG;
	}

	return r;
}

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
	try {
		// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
		// The Browser also has localStorage in the global context.
		return localStorage;
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

module.exports = __nccwpck_require__(6243)(exports);

const {formatters} = module.exports;

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

formatters.j = function (v) {
	try {
		return JSON.stringify(v);
	} catch (error) {
		return '[UnexpectedJSONParseError]: ' + error.message;
	}
};


/***/ }),

/***/ 6243:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {


/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 */

function setup(env) {
	createDebug.debug = createDebug;
	createDebug.default = createDebug;
	createDebug.coerce = coerce;
	createDebug.disable = disable;
	createDebug.enable = enable;
	createDebug.enabled = enabled;
	createDebug.humanize = __nccwpck_require__(900);
	createDebug.destroy = destroy;

	Object.keys(env).forEach(key => {
		createDebug[key] = env[key];
	});

	/**
	* The currently active debug mode names, and names to skip.
	*/

	createDebug.names = [];
	createDebug.skips = [];

	/**
	* Map of special "%n" handling functions, for the debug "format" argument.
	*
	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
	*/
	createDebug.formatters = {};

	/**
	* Selects a color for a debug namespace
	* @param {String} namespace The namespace string for the for the debug instance to be colored
	* @return {Number|String} An ANSI color code for the given namespace
	* @api private
	*/
	function selectColor(namespace) {
		let hash = 0;

		for (let i = 0; i < namespace.length; i++) {
			hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
			hash |= 0; // Convert to 32bit integer
		}

		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
	}
	createDebug.selectColor = selectColor;

	/**
	* Create a debugger with the given `namespace`.
	*
	* @param {String} namespace
	* @return {Function}
	* @api public
	*/
	function createDebug(namespace) {
		let prevTime;
		let enableOverride = null;

		function debug(...args) {
			// Disabled?
			if (!debug.enabled) {
				return;
			}

			const self = debug;

			// Set `diff` timestamp
			const curr = Number(new Date());
			const ms = curr - (prevTime || curr);
			self.diff = ms;
			self.prev = prevTime;
			self.curr = curr;
			prevTime = curr;

			args[0] = createDebug.coerce(args[0]);

			if (typeof args[0] !== 'string') {
				// Anything else let's inspect with %O
				args.unshift('%O');
			}

			// Apply any `formatters` transformations
			let index = 0;
			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
				// If we encounter an escaped % then don't increase the array index
				if (match === '%%') {
					return '%';
				}
				index++;
				const formatter = createDebug.formatters[format];
				if (typeof formatter === 'function') {
					const val = args[index];
					match = formatter.call(self, val);

					// Now we need to remove `args[index]` since it's inlined in the `format`
					args.splice(index, 1);
					index--;
				}
				return match;
			});

			// Apply env-specific formatting (colors, etc.)
			createDebug.formatArgs.call(self, args);

			const logFn = self.log || createDebug.log;
			logFn.apply(self, args);
		}

		debug.namespace = namespace;
		debug.useColors = createDebug.useColors();
		debug.color = createDebug.selectColor(namespace);
		debug.extend = extend;
		debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

		Object.defineProperty(debug, 'enabled', {
			enumerable: true,
			configurable: false,
			get: () => enableOverride === null ? createDebug.enabled(namespace) : enableOverride,
			set: v => {
				enableOverride = v;
			}
		});

		// Env-specific initialization logic for debug instances
		if (typeof createDebug.init === 'function') {
			createDebug.init(debug);
		}

		return debug;
	}

	function extend(namespace, delimiter) {
		const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
		newDebug.log = this.log;
		return newDebug;
	}

	/**
	* Enables a debug mode by namespaces. This can include modes
	* separated by a colon and wildcards.
	*
	* @param {String} namespaces
	* @api public
	*/
	function enable(namespaces) {
		createDebug.save(namespaces);

		createDebug.names = [];
		createDebug.skips = [];

		let i;
		const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
		const len = split.length;

		for (i = 0; i < len; i++) {
			if (!split[i]) {
				// ignore empty strings
				continue;
			}

			namespaces = split[i].replace(/\*/g, '.*?');

			if (namespaces[0] === '-') {
				createDebug.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
			} else {
				createDebug.names.push(new RegExp('^' + namespaces + '$'));
			}
		}
	}

	/**
	* Disable debug output.
	*
	* @return {String} namespaces
	* @api public
	*/
	function disable() {
		const namespaces = [
			...createDebug.names.map(toNamespace),
			...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)
		].join(',');
		createDebug.enable('');
		return namespaces;
	}

	/**
	* Returns true if the given mode name is enabled, false otherwise.
	*
	* @param {String} name
	* @return {Boolean}
	* @api public
	*/
	function enabled(name) {
		if (name[name.length - 1] === '*') {
			return true;
		}

		let i;
		let len;

		for (i = 0, len = createDebug.skips.length; i < len; i++) {
			if (createDebug.skips[i].test(name)) {
				return false;
			}
		}

		for (i = 0, len = createDebug.names.length; i < len; i++) {
			if (createDebug.names[i].test(name)) {
				return true;
			}
		}

		return false;
	}

	/**
	* Convert regexp to namespace
	*
	* @param {RegExp} regxep
	* @return {String} namespace
	* @api private
	*/
	function toNamespace(regexp) {
		return regexp.toString()
			.substring(2, regexp.toString().length - 2)
			.replace(/\.\*\?$/, '*');
	}

	/**
	* Coerce `val`.
	*
	* @param {Mixed} val
	* @return {Mixed}
	* @api private
	*/
	function coerce(val) {
		if (val instanceof Error) {
			return val.stack || val.message;
		}
		return val;
	}

	/**
	* XXX DO NOT USE. This is a temporary stub function.
	* XXX It WILL be removed in the next major release.
	*/
	function destroy() {
		console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
	}

	createDebug.enable(createDebug.load());

	return createDebug;
}

module.exports = setup;


/***/ }),

/***/ 8237:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * Detect Electron renderer / nwjs process, which is node, but we should
 * treat as a browser.
 */

if (typeof process === 'undefined' || process.type === 'renderer' || process.browser === true || process.__nwjs) {
	module.exports = __nccwpck_require__(8222);
} else {
	module.exports = __nccwpck_require__(5332);
}


/***/ }),

/***/ 5332:
/***/ ((module, exports, __nccwpck_require__) => {

/**
 * Module dependencies.
 */

const tty = __nccwpck_require__(3867);
const util = __nccwpck_require__(1669);

/**
 * This is the Node.js implementation of `debug()`.
 */

exports.init = init;
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.destroy = util.deprecate(
	() => {},
	'Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.'
);

/**
 * Colors.
 */

exports.colors = [6, 2, 3, 4, 5, 1];

try {
	// Optional dependency (as in, doesn't need to be installed, NOT like optionalDependencies in package.json)
	// eslint-disable-next-line import/no-extraneous-dependencies
	const supportsColor = __nccwpck_require__(132);

	if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
		exports.colors = [
			20,
			21,
			26,
			27,
			32,
			33,
			38,
			39,
			40,
			41,
			42,
			43,
			44,
			45,
			56,
			57,
			62,
			63,
			68,
			69,
			74,
			75,
			76,
			77,
			78,
			79,
			80,
			81,
			92,
			93,
			98,
			99,
			112,
			113,
			128,
			129,
			134,
			135,
			148,
			149,
			160,
			161,
			162,
			163,
			164,
			165,
			166,
			167,
			168,
			169,
			170,
			171,
			172,
			173,
			178,
			179,
			184,
			185,
			196,
			197,
			198,
			199,
			200,
			201,
			202,
			203,
			204,
			205,
			206,
			207,
			208,
			209,
			214,
			215,
			220,
			221
		];
	}
} catch (error) {
	// Swallow - we only care if `supports-color` is available; it doesn't have to be.
}

/**
 * Build up the default `inspectOpts` object from the environment variables.
 *
 *   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
 */

exports.inspectOpts = Object.keys(process.env).filter(key => {
	return /^debug_/i.test(key);
}).reduce((obj, key) => {
	// Camel-case
	const prop = key
		.substring(6)
		.toLowerCase()
		.replace(/_([a-z])/g, (_, k) => {
			return k.toUpperCase();
		});

	// Coerce string value into JS value
	let val = process.env[key];
	if (/^(yes|on|true|enabled)$/i.test(val)) {
		val = true;
	} else if (/^(no|off|false|disabled)$/i.test(val)) {
		val = false;
	} else if (val === 'null') {
		val = null;
	} else {
		val = Number(val);
	}

	obj[prop] = val;
	return obj;
}, {});

/**
 * Is stdout a TTY? Colored output is enabled when `true`.
 */

function useColors() {
	return 'colors' in exports.inspectOpts ?
		Boolean(exports.inspectOpts.colors) :
		tty.isatty(process.stderr.fd);
}

/**
 * Adds ANSI color escape codes if enabled.
 *
 * @api public
 */

function formatArgs(args) {
	const {namespace: name, useColors} = this;

	if (useColors) {
		const c = this.color;
		const colorCode = '\u001B[3' + (c < 8 ? c : '8;5;' + c);
		const prefix = `  ${colorCode};1m${name} \u001B[0m`;

		args[0] = prefix + args[0].split('\n').join('\n' + prefix);
		args.push(colorCode + 'm+' + module.exports.humanize(this.diff) + '\u001B[0m');
	} else {
		args[0] = getDate() + name + ' ' + args[0];
	}
}

function getDate() {
	if (exports.inspectOpts.hideDate) {
		return '';
	}
	return new Date().toISOString() + ' ';
}

/**
 * Invokes `util.format()` with the specified arguments and writes to stderr.
 */

function log(...args) {
	return process.stderr.write(util.format(...args) + '\n');
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
function save(namespaces) {
	if (namespaces) {
		process.env.DEBUG = namespaces;
	} else {
		// If you set a process.env field to null or undefined, it gets cast to the
		// string 'null' or 'undefined'. Just delete instead.
		delete process.env.DEBUG;
	}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
	return process.env.DEBUG;
}

/**
 * Init logic for `debug` instances.
 *
 * Create a new `inspectOpts` object in case `useColors` is set
 * differently for a particular `debug` instance.
 */

function init(debug) {
	debug.inspectOpts = {};

	const keys = Object.keys(exports.inspectOpts);
	for (let i = 0; i < keys.length; i++) {
		debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
	}
}

module.exports = __nccwpck_require__(6243)(exports);

const {formatters} = module.exports;

/**
 * Map %o to `util.inspect()`, all on a single line.
 */

formatters.o = function (v) {
	this.inspectOpts.colors = this.useColors;
	return util.inspect(v, this.inspectOpts)
		.split('\n')
		.map(str => str.trim())
		.join(' ');
};

/**
 * Map %O to `util.inspect()`, allowing multiple lines if needed.
 */

formatters.O = function (v) {
	this.inspectOpts.colors = this.useColors;
	return util.inspect(v, this.inspectOpts);
};


/***/ }),

/***/ 5098:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const net_1 = __importDefault(__nccwpck_require__(1631));
const tls_1 = __importDefault(__nccwpck_require__(4016));
const url_1 = __importDefault(__nccwpck_require__(8835));
const assert_1 = __importDefault(__nccwpck_require__(2357));
const debug_1 = __importDefault(__nccwpck_require__(8237));
const agent_base_1 = __nccwpck_require__(9690);
const parse_proxy_response_1 = __importDefault(__nccwpck_require__(595));
const debug = debug_1.default('https-proxy-agent:agent');
/**
 * The `HttpsProxyAgent` implements an HTTP Agent subclass that connects to
 * the specified "HTTP(s) proxy server" in order to proxy HTTPS requests.
 *
 * Outgoing HTTP requests are first tunneled through the proxy server using the
 * `CONNECT` HTTP request method to establish a connection to the proxy server,
 * and then the proxy server connects to the destination target and issues the
 * HTTP request from the proxy server.
 *
 * `https:` requests have their socket connection upgraded to TLS once
 * the connection to the proxy server has been established.
 *
 * @api public
 */
class HttpsProxyAgent extends agent_base_1.Agent {
    constructor(_opts) {
        let opts;
        if (typeof _opts === 'string') {
            opts = url_1.default.parse(_opts);
        }
        else {
            opts = _opts;
        }
        if (!opts) {
            throw new Error('an HTTP(S) proxy server `host` and `port` must be specified!');
        }
        debug('creating new HttpsProxyAgent instance: %o', opts);
        super(opts);
        const proxy = Object.assign({}, opts);
        // If `true`, then connect to the proxy server over TLS.
        // Defaults to `false`.
        this.secureProxy = opts.secureProxy || isHTTPS(proxy.protocol);
        // Prefer `hostname` over `host`, and set the `port` if needed.
        proxy.host = proxy.hostname || proxy.host;
        if (typeof proxy.port === 'string') {
            proxy.port = parseInt(proxy.port, 10);
        }
        if (!proxy.port && proxy.host) {
            proxy.port = this.secureProxy ? 443 : 80;
        }
        // ALPN is supported by Node.js >= v5.
        // attempt to negotiate http/1.1 for proxy servers that support http/2
        if (this.secureProxy && !('ALPNProtocols' in proxy)) {
            proxy.ALPNProtocols = ['http 1.1'];
        }
        if (proxy.host && proxy.path) {
            // If both a `host` and `path` are specified then it's most likely
            // the result of a `url.parse()` call... we need to remove the
            // `path` portion so that `net.connect()` doesn't attempt to open
            // that as a Unix socket file.
            delete proxy.path;
            delete proxy.pathname;
        }
        this.proxy = proxy;
    }
    /**
     * Called when the node-core HTTP client library is creating a
     * new HTTP request.
     *
     * @api protected
     */
    callback(req, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { proxy, secureProxy } = this;
            // Create a socket connection to the proxy server.
            let socket;
            if (secureProxy) {
                debug('Creating `tls.Socket`: %o', proxy);
                socket = tls_1.default.connect(proxy);
            }
            else {
                debug('Creating `net.Socket`: %o', proxy);
                socket = net_1.default.connect(proxy);
            }
            const headers = Object.assign({}, proxy.headers);
            const hostname = `${opts.host}:${opts.port}`;
            let payload = `CONNECT ${hostname} HTTP/1.1\r\n`;
            // Inject the `Proxy-Authorization` header if necessary.
            if (proxy.auth) {
                headers['Proxy-Authorization'] = `Basic ${Buffer.from(proxy.auth).toString('base64')}`;
            }
            // The `Host` header should only include the port
            // number when it is not the default port.
            let { host, port, secureEndpoint } = opts;
            if (!isDefaultPort(port, secureEndpoint)) {
                host += `:${port}`;
            }
            headers.Host = host;
            headers.Connection = 'close';
            for (const name of Object.keys(headers)) {
                payload += `${name}: ${headers[name]}\r\n`;
            }
            const proxyResponsePromise = parse_proxy_response_1.default(socket);
            socket.write(`${payload}\r\n`);
            const { statusCode, buffered } = yield proxyResponsePromise;
            if (statusCode === 200) {
                req.once('socket', resume);
                if (opts.secureEndpoint) {
                    const servername = opts.servername || opts.host;
                    if (!servername) {
                        throw new Error('Could not determine "servername"');
                    }
                    // The proxy is connecting to a TLS server, so upgrade
                    // this socket connection to a TLS connection.
                    debug('Upgrading socket connection to TLS');
                    return tls_1.default.connect(Object.assign(Object.assign({}, omit(opts, 'host', 'hostname', 'path', 'port')), { socket,
                        servername }));
                }
                return socket;
            }
            // Some other status code that's not 200... need to re-play the HTTP
            // header "data" events onto the socket once the HTTP machinery is
            // attached so that the node core `http` can parse and handle the
            // error status code.
            // Close the original socket, and a new "fake" socket is returned
            // instead, so that the proxy doesn't get the HTTP request
            // written to it (which may contain `Authorization` headers or other
            // sensitive data).
            //
            // See: https://hackerone.com/reports/541502
            socket.destroy();
            const fakeSocket = new net_1.default.Socket();
            fakeSocket.readable = true;
            // Need to wait for the "socket" event to re-play the "data" events.
            req.once('socket', (s) => {
                debug('replaying proxy buffer for failed request');
                assert_1.default(s.listenerCount('data') > 0);
                // Replay the "buffered" Buffer onto the fake `socket`, since at
                // this point the HTTP module machinery has been hooked up for
                // the user.
                s.push(buffered);
                s.push(null);
            });
            return fakeSocket;
        });
    }
}
exports.default = HttpsProxyAgent;
function resume(socket) {
    socket.resume();
}
function isDefaultPort(port, secure) {
    return Boolean((!secure && port === 80) || (secure && port === 443));
}
function isHTTPS(protocol) {
    return typeof protocol === 'string' ? /^https:?$/i.test(protocol) : false;
}
function omit(obj, ...keys) {
    const ret = {};
    let key;
    for (key in obj) {
        if (!keys.includes(key)) {
            ret[key] = obj[key];
        }
    }
    return ret;
}
//# sourceMappingURL=agent.js.map

/***/ }),

/***/ 7219:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const agent_1 = __importDefault(__nccwpck_require__(5098));
function createHttpsProxyAgent(opts) {
    return new agent_1.default(opts);
}
(function (createHttpsProxyAgent) {
    createHttpsProxyAgent.HttpsProxyAgent = agent_1.default;
    createHttpsProxyAgent.prototype = agent_1.default.prototype;
})(createHttpsProxyAgent || (createHttpsProxyAgent = {}));
module.exports = createHttpsProxyAgent;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 595:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const debug_1 = __importDefault(__nccwpck_require__(8237));
const debug = debug_1.default('https-proxy-agent:parse-proxy-response');
function parseProxyResponse(socket) {
    return new Promise((resolve, reject) => {
        // we need to buffer any HTTP traffic that happens with the proxy before we get
        // the CONNECT response, so that if the response is anything other than an "200"
        // response code, then we can re-play the "data" events on the socket once the
        // HTTP parser is hooked up...
        let buffersLength = 0;
        const buffers = [];
        function read() {
            const b = socket.read();
            if (b)
                ondata(b);
            else
                socket.once('readable', read);
        }
        function cleanup() {
            socket.removeListener('end', onend);
            socket.removeListener('error', onerror);
            socket.removeListener('close', onclose);
            socket.removeListener('readable', read);
        }
        function onclose(err) {
            debug('onclose had error %o', err);
        }
        function onend() {
            debug('onend');
        }
        function onerror(err) {
            cleanup();
            debug('onerror %o', err);
            reject(err);
        }
        function ondata(b) {
            buffers.push(b);
            buffersLength += b.length;
            const buffered = Buffer.concat(buffers, buffersLength);
            const endOfHeaders = buffered.indexOf('\r\n\r\n');
            if (endOfHeaders === -1) {
                // keep buffering
                debug('have not received end of HTTP headers yet...');
                read();
                return;
            }
            const firstLine = buffered.toString('ascii', 0, buffered.indexOf('\r\n'));
            const statusCode = +firstLine.split(' ')[1];
            debug('got proxy server response: %o', firstLine);
            resolve({
                statusCode,
                buffered
            });
        }
        socket.on('error', onerror);
        socket.on('close', onclose);
        socket.on('end', onend);
        read();
    });
}
exports.default = parseProxyResponse;
//# sourceMappingURL=parse-proxy-response.js.map

/***/ }),

/***/ 8424:
/***/ (function(__unused_webpack_module, exports) {

/**
 * A doubly linked list-based Least Recently Used (LRU) cache. Will keep most
 * recently used items while discarding least recently used items when its limit
 * is reached.
 *
 * Licensed under MIT. Copyright (c) 2010 Rasmus Andersson <http://hunch.se/>
 * See README.md for details.
 *
 * Illustration of the design:
 *
 *       entry             entry             entry             entry
 *       ______            ______            ______            ______
 *      | head |.newer => |      |.newer => |      |.newer => | tail |
 *      |  A   |          |  B   |          |  C   |          |  D   |
 *      |______| <= older.|______| <= older.|______| <= older.|______|
 *
 *  removed  <--  <--  <--  <--  <--  <--  <--  <--  <--  <--  <--  added
 */
(function(g,f){
  const e =  true ? exports : 0;
  f(e);
  if (typeof define == 'function' && define.amd) { define('lru', e); }
})(this, function(exports) {

const NEWER = Symbol('newer');
const OLDER = Symbol('older');

function LRUMap(limit, entries) {
  if (typeof limit !== 'number') {
    // called as (entries)
    entries = limit;
    limit = 0;
  }

  this.size = 0;
  this.limit = limit;
  this.oldest = this.newest = undefined;
  this._keymap = new Map();

  if (entries) {
    this.assign(entries);
    if (limit < 1) {
      this.limit = this.size;
    }
  }
}

exports.LRUMap = LRUMap;

function Entry(key, value) {
  this.key = key;
  this.value = value;
  this[NEWER] = undefined;
  this[OLDER] = undefined;
}


LRUMap.prototype._markEntryAsUsed = function(entry) {
  if (entry === this.newest) {
    // Already the most recenlty used entry, so no need to update the list
    return;
  }
  // HEAD--------------TAIL
  //   <.older   .newer>
  //  <--- add direction --
  //   A  B  C  <D>  E
  if (entry[NEWER]) {
    if (entry === this.oldest) {
      this.oldest = entry[NEWER];
    }
    entry[NEWER][OLDER] = entry[OLDER]; // C <-- E.
  }
  if (entry[OLDER]) {
    entry[OLDER][NEWER] = entry[NEWER]; // C. --> E
  }
  entry[NEWER] = undefined; // D --x
  entry[OLDER] = this.newest; // D. --> E
  if (this.newest) {
    this.newest[NEWER] = entry; // E. <-- D
  }
  this.newest = entry;
};

LRUMap.prototype.assign = function(entries) {
  let entry, limit = this.limit || Number.MAX_VALUE;
  this._keymap.clear();
  let it = entries[Symbol.iterator]();
  for (let itv = it.next(); !itv.done; itv = it.next()) {
    let e = new Entry(itv.value[0], itv.value[1]);
    this._keymap.set(e.key, e);
    if (!entry) {
      this.oldest = e;
    } else {
      entry[NEWER] = e;
      e[OLDER] = entry;
    }
    entry = e;
    if (limit-- == 0) {
      throw new Error('overflow');
    }
  }
  this.newest = entry;
  this.size = this._keymap.size;
};

LRUMap.prototype.get = function(key) {
  // First, find our cache entry
  var entry = this._keymap.get(key);
  if (!entry) return; // Not cached. Sorry.
  // As <key> was found in the cache, register it as being requested recently
  this._markEntryAsUsed(entry);
  return entry.value;
};

LRUMap.prototype.set = function(key, value) {
  var entry = this._keymap.get(key);

  if (entry) {
    // update existing
    entry.value = value;
    this._markEntryAsUsed(entry);
    return this;
  }

  // new entry
  this._keymap.set(key, (entry = new Entry(key, value)));

  if (this.newest) {
    // link previous tail to the new tail (entry)
    this.newest[NEWER] = entry;
    entry[OLDER] = this.newest;
  } else {
    // we're first in -- yay
    this.oldest = entry;
  }

  // add new entry to the end of the linked list -- it's now the freshest entry.
  this.newest = entry;
  ++this.size;
  if (this.size > this.limit) {
    // we hit the limit -- remove the head
    this.shift();
  }

  return this;
};

LRUMap.prototype.shift = function() {
  // todo: handle special case when limit == 1
  var entry = this.oldest;
  if (entry) {
    if (this.oldest[NEWER]) {
      // advance the list
      this.oldest = this.oldest[NEWER];
      this.oldest[OLDER] = undefined;
    } else {
      // the cache is exhausted
      this.oldest = undefined;
      this.newest = undefined;
    }
    // Remove last strong reference to <entry> and remove links from the purged
    // entry being returned:
    entry[NEWER] = entry[OLDER] = undefined;
    this._keymap.delete(entry.key);
    --this.size;
    return [entry.key, entry.value];
  }
};

// ----------------------------------------------------------------------------
// Following code is optional and can be removed without breaking the core
// functionality.

LRUMap.prototype.find = function(key) {
  let e = this._keymap.get(key);
  return e ? e.value : undefined;
};

LRUMap.prototype.has = function(key) {
  return this._keymap.has(key);
};

LRUMap.prototype['delete'] = function(key) {
  var entry = this._keymap.get(key);
  if (!entry) return;
  this._keymap.delete(entry.key);
  if (entry[NEWER] && entry[OLDER]) {
    // relink the older entry with the newer entry
    entry[OLDER][NEWER] = entry[NEWER];
    entry[NEWER][OLDER] = entry[OLDER];
  } else if (entry[NEWER]) {
    // remove the link to us
    entry[NEWER][OLDER] = undefined;
    // link the newer entry to head
    this.oldest = entry[NEWER];
  } else if (entry[OLDER]) {
    // remove the link to us
    entry[OLDER][NEWER] = undefined;
    // link the newer entry to head
    this.newest = entry[OLDER];
  } else {// if(entry[OLDER] === undefined && entry.newer === undefined) {
    this.oldest = this.newest = undefined;
  }

  this.size--;
  return entry.value;
};

LRUMap.prototype.clear = function() {
  // Not clearing links should be safe, as we don't expose live links to user
  this.oldest = this.newest = undefined;
  this.size = 0;
  this._keymap.clear();
};


function EntryIterator(oldestEntry) { this.entry = oldestEntry; }
EntryIterator.prototype[Symbol.iterator] = function() { return this; }
EntryIterator.prototype.next = function() {
  let ent = this.entry;
  if (ent) {
    this.entry = ent[NEWER];
    return { done: false, value: [ent.key, ent.value] };
  } else {
    return { done: true, value: undefined };
  }
};


function KeyIterator(oldestEntry) { this.entry = oldestEntry; }
KeyIterator.prototype[Symbol.iterator] = function() { return this; }
KeyIterator.prototype.next = function() {
  let ent = this.entry;
  if (ent) {
    this.entry = ent[NEWER];
    return { done: false, value: ent.key };
  } else {
    return { done: true, value: undefined };
  }
};

function ValueIterator(oldestEntry) { this.entry = oldestEntry; }
ValueIterator.prototype[Symbol.iterator] = function() { return this; }
ValueIterator.prototype.next = function() {
  let ent = this.entry;
  if (ent) {
    this.entry = ent[NEWER];
    return { done: false, value: ent.value };
  } else {
    return { done: true, value: undefined };
  }
};


LRUMap.prototype.keys = function() {
  return new KeyIterator(this.oldest);
};

LRUMap.prototype.values = function() {
  return new ValueIterator(this.oldest);
};

LRUMap.prototype.entries = function() {
  return this;
};

LRUMap.prototype[Symbol.iterator] = function() {
  return new EntryIterator(this.oldest);
};

LRUMap.prototype.forEach = function(fun, thisObj) {
  if (typeof thisObj !== 'object') {
    thisObj = this;
  }
  let entry = this.oldest;
  while (entry) {
    fun.call(thisObj, entry.value, entry.key, this);
    entry = entry[NEWER];
  }
};

/** Returns a JSON (array) representation */
LRUMap.prototype.toJSON = function() {
  var s = new Array(this.size), i = 0, entry = this.oldest;
  while (entry) {
    s[i++] = { key: entry.key, value: entry.value };
    entry = entry[NEWER];
  }
  return s;
};

/** Returns a String representation */
LRUMap.prototype.toString = function() {
  var s = '', entry = this.oldest;
  while (entry) {
    s += String(entry.key)+':'+entry.value;
    entry = entry[NEWER];
    if (entry) {
      s += ' < ';
    }
  }
  return s;
};

});


/***/ }),

/***/ 900:
/***/ ((module) => {

/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var w = d * 7;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isFinite(val)) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'weeks':
    case 'week':
    case 'w':
      return n * w;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (msAbs >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (msAbs >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (msAbs >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return plural(ms, msAbs, d, 'day');
  }
  if (msAbs >= h) {
    return plural(ms, msAbs, h, 'hour');
  }
  if (msAbs >= m) {
    return plural(ms, msAbs, m, 'minute');
  }
  if (msAbs >= s) {
    return plural(ms, msAbs, s, 'second');
  }
  return ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, msAbs, n, name) {
  var isPlural = msAbs >= n * 1.5;
  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
}


/***/ }),

/***/ 5636:
/***/ ((__unused_webpack_module, __webpack_exports__, __nccwpck_require__) => {

"use strict";
__nccwpck_require__.r(__webpack_exports__);
/* harmony export */ __nccwpck_require__.d(__webpack_exports__, {
/* harmony export */   "__extends": () => /* binding */ __extends,
/* harmony export */   "__assign": () => /* binding */ __assign,
/* harmony export */   "__rest": () => /* binding */ __rest,
/* harmony export */   "__decorate": () => /* binding */ __decorate,
/* harmony export */   "__param": () => /* binding */ __param,
/* harmony export */   "__metadata": () => /* binding */ __metadata,
/* harmony export */   "__awaiter": () => /* binding */ __awaiter,
/* harmony export */   "__generator": () => /* binding */ __generator,
/* harmony export */   "__createBinding": () => /* binding */ __createBinding,
/* harmony export */   "__exportStar": () => /* binding */ __exportStar,
/* harmony export */   "__values": () => /* binding */ __values,
/* harmony export */   "__read": () => /* binding */ __read,
/* harmony export */   "__spread": () => /* binding */ __spread,
/* harmony export */   "__spreadArrays": () => /* binding */ __spreadArrays,
/* harmony export */   "__await": () => /* binding */ __await,
/* harmony export */   "__asyncGenerator": () => /* binding */ __asyncGenerator,
/* harmony export */   "__asyncDelegator": () => /* binding */ __asyncDelegator,
/* harmony export */   "__asyncValues": () => /* binding */ __asyncValues,
/* harmony export */   "__makeTemplateObject": () => /* binding */ __makeTemplateObject,
/* harmony export */   "__importStar": () => /* binding */ __importStar,
/* harmony export */   "__importDefault": () => /* binding */ __importDefault,
/* harmony export */   "__classPrivateFieldGet": () => /* binding */ __classPrivateFieldGet,
/* harmony export */   "__classPrivateFieldSet": () => /* binding */ __classPrivateFieldSet
/* harmony export */ });
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    }
    return __assign.apply(this, arguments);
}

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __createBinding(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}

function __exportStar(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) exports[p] = m[p];
}

function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};

function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
}

function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};

function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result.default = mod;
    return result;
}

function __importDefault(mod) {
    return (mod && mod.__esModule) ? mod : { default: mod };
}

function __classPrivateFieldGet(receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
}

function __classPrivateFieldSet(receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
}


/***/ }),

/***/ 132:
/***/ ((module) => {

module.exports = eval("require")("supports-color");


/***/ }),

/***/ 9140:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

let crypto = __nccwpck_require__(6417)

let { urlAlphabet } = __nccwpck_require__(3861)

// It is best to make fewer, larger requests to the crypto module to
// avoid system call overhead. So, random numbers are generated in a
// pool. The pool is a Buffer that is larger than the initial random
// request size by this multiplier. The pool is enlarged if subsequent
// requests exceed the maximum buffer size.
const POOL_SIZE_MULTIPLIER = 32
let pool, poolOffset

let random = bytes => {
  if (!pool || pool.length < bytes) {
    pool = Buffer.allocUnsafe(bytes * POOL_SIZE_MULTIPLIER)
    crypto.randomFillSync(pool)
    poolOffset = 0
  } else if (poolOffset + bytes > pool.length) {
    crypto.randomFillSync(pool)
    poolOffset = 0
  }

  let res = pool.subarray(poolOffset, poolOffset + bytes)
  poolOffset += bytes
  return res
}

let customRandom = (alphabet, size, getRandom) => {
  // First, a bitmask is necessary to generate the ID. The bitmask makes bytes
  // values closer to the alphabet size. The bitmask calculates the closest
  // `2^31 - 1` number, which exceeds the alphabet size.
  // For example, the bitmask for the alphabet size 30 is 31 (00011111).
  let mask = (2 << (31 - Math.clz32((alphabet.length - 1) | 1))) - 1
  // Though, the bitmask solution is not perfect since the bytes exceeding
  // the alphabet size are refused. Therefore, to reliably generate the ID,
  // the random bytes redundancy has to be satisfied.

  // Note: every hardware random generator call is performance expensive,
  // because the system call for entropy collection takes a lot of time.
  // So, to avoid additional system calls, extra bytes are requested in advance.

  // Next, a step determines how many random bytes to generate.
  // The number of random bytes gets decided upon the ID size, mask,
  // alphabet size, and magic number 1.6 (using 1.6 peaks at performance
  // according to benchmarks).
  let step = Math.ceil((1.6 * mask * size) / alphabet.length)

  return () => {
    let id = ''
    while (true) {
      let bytes = getRandom(step)
      // A compact alternative for `for (let i = 0; i < step; i++)`.
      let i = step
      while (i--) {
        // Adding `|| ''` refuses a random byte that exceeds the alphabet size.
        id += alphabet[bytes[i] & mask] || ''
        if (id.length === size) return id
      }
    }
  }
}

let customAlphabet = (alphabet, size) => customRandom(alphabet, size, random)

let nanoid = (size = 21) => {
  let bytes = random(size)
  let id = ''
  // A compact alternative for `for (let i = 0; i < size; i++)`.
  while (size--) {
    // It is incorrect to use bytes exceeding the alphabet size.
    // The following mask reduces the random byte in the 0-255 value
    // range to the 0-63 value range. Therefore, adding hacks, such
    // as empty string fallback or magic numbers, is unneccessary because
    // the bitmask trims bytes down to the alphabet size.
    id += urlAlphabet[bytes[size] & 63]
  }
  return id
}

module.exports = { nanoid, customAlphabet, customRandom, urlAlphabet, random }


/***/ }),

/***/ 3861:
/***/ ((module) => {

// This alphabet uses `A-Za-z0-9_-` symbols. The genetic algorithm helped
// optimize the gzip compression for this alphabet.
let urlAlphabet =
  'ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUvz_KqYTJkLxpZXIjQW'

module.exports = { urlAlphabet }


/***/ }),

/***/ 2357:
/***/ ((module) => {

"use strict";
module.exports = require("assert");;

/***/ }),

/***/ 3129:
/***/ ((module) => {

"use strict";
module.exports = require("child_process");;

/***/ }),

/***/ 7082:
/***/ ((module) => {

"use strict";
module.exports = require("console");;

/***/ }),

/***/ 6417:
/***/ ((module) => {

"use strict";
module.exports = require("crypto");;

/***/ }),

/***/ 5229:
/***/ ((module) => {

"use strict";
module.exports = require("domain");;

/***/ }),

/***/ 8614:
/***/ ((module) => {

"use strict";
module.exports = require("events");;

/***/ }),

/***/ 5747:
/***/ ((module) => {

"use strict";
module.exports = require("fs");;

/***/ }),

/***/ 8605:
/***/ ((module) => {

"use strict";
module.exports = require("http");;

/***/ }),

/***/ 7211:
/***/ ((module) => {

"use strict";
module.exports = require("https");;

/***/ }),

/***/ 1631:
/***/ ((module) => {

"use strict";
module.exports = require("net");;

/***/ }),

/***/ 2087:
/***/ ((module) => {

"use strict";
module.exports = require("os");;

/***/ }),

/***/ 5622:
/***/ ((module) => {

"use strict";
module.exports = require("path");;

/***/ }),

/***/ 4016:
/***/ ((module) => {

"use strict";
module.exports = require("tls");;

/***/ }),

/***/ 3867:
/***/ ((module) => {

"use strict";
module.exports = require("tty");;

/***/ }),

/***/ 8835:
/***/ ((module) => {

"use strict";
module.exports = require("url");;

/***/ }),

/***/ 1669:
/***/ ((module) => {

"use strict";
module.exports = require("util");;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__nccwpck_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__nccwpck_require__.o(definition, key) && !__nccwpck_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__nccwpck_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop)
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__nccwpck_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__nccwpck_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	__nccwpck_require__.ab = __dirname + "/";/************************************************************************/
/******/ 	// module exports must be returned from runtime so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	return __nccwpck_require__(3109);
/******/ })()
;
//# sourceMappingURL=index.js.map