require('./sourcemap-register.js');module.exports =
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 623:
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
const fs_1 = __nccwpck_require__(747);
const path_1 = __importDefault(__nccwpck_require__(622));
const exec_1 = __nccwpck_require__(757);
const util_1 = __nccwpck_require__(24);
const gitUserName = "Plasmic Bot";
const gitUserEmail = "ops+git@plasmic.app";
class PlasmicAction {
    constructor(args) {
        this.args = args;
        this.opts = {
            cwd: path_1.default.join(".", args.directory || "."),
            onOutput: (chunk) => console.log(chunk.trim()),
            echo: true,
            shell: 'bash',
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
            yield exec_1.exec(`npx create-plasmic-app --platform '${this.args.platform}' --scheme '${this.args.scheme}' ${this.args.language === "ts" ? "--typescript" : ""} --projectId '${this.args.projectId}' --projectApiToken '${this.args.projectApiToken}' '${relTmpDir}'`, this.opts);
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
            switch (this.args.platform) {
                case "nextjs":
                    yield exec_1.exec(`${pm.cmd} next build`, this.opts);
                    yield exec_1.exec(`${pm.cmd} next export`, this.opts);
                    return "out";
                case "gatsby":
                    yield exec_1.exec(`${pm.cmd} gatsby build`, this.opts);
                    return "public";
                case "react":
                    yield exec_1.exec(`${pm.run} build`, this.opts);
                    return "build/static";
                default:
                    throw new Error(`Unknown platform '${this.args.platform}'`);
            }
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

/***/ 757:
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
const child_process_1 = __nccwpck_require__(129);
const util_1 = __nccwpck_require__(669);
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

/***/ 109:
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
const core = __importStar(__nccwpck_require__(186));
const actions_1 = __nccwpck_require__(623);
const util_1 = __nccwpck_require__(24);
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const action = new actions_1.PlasmicAction({
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
            });
            const outputs = yield action.run();
            util_1.setOutputs(outputs);
        }
        catch (error) {
            core.setFailed(error.message || error);
        }
    });
}
run();


/***/ }),

/***/ 24:
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
const core = __importStar(__nccwpck_require__(186));
const nanoid_1 = __nccwpck_require__(140);
const fs_1 = __nccwpck_require__(747);
const path_1 = __importDefault(__nccwpck_require__(622));
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

/***/ 351:
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
const os = __importStar(__nccwpck_require__(87));
const utils_1 = __nccwpck_require__(278);
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

/***/ 186:
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
const command_1 = __nccwpck_require__(351);
const file_command_1 = __nccwpck_require__(717);
const utils_1 = __nccwpck_require__(278);
const os = __importStar(__nccwpck_require__(87));
const path = __importStar(__nccwpck_require__(622));
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
const fs = __importStar(__nccwpck_require__(747));
const os = __importStar(__nccwpck_require__(87));
const utils_1 = __nccwpck_require__(278);
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

/***/ 278:
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

/***/ 140:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

let crypto = __nccwpck_require__(417)

let { urlAlphabet } = __nccwpck_require__(861)

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

/***/ 861:
/***/ ((module) => {

// This alphabet uses `A-Za-z0-9_-` symbols. The genetic algorithm helped
// optimize the gzip compression for this alphabet.
let urlAlphabet =
  'ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUvz_KqYTJkLxpZXIjQW'

module.exports = { urlAlphabet }


/***/ }),

/***/ 129:
/***/ ((module) => {

"use strict";
module.exports = require("child_process");;

/***/ }),

/***/ 417:
/***/ ((module) => {

"use strict";
module.exports = require("crypto");;

/***/ }),

/***/ 747:
/***/ ((module) => {

"use strict";
module.exports = require("fs");;

/***/ }),

/***/ 87:
/***/ ((module) => {

"use strict";
module.exports = require("os");;

/***/ }),

/***/ 622:
/***/ ((module) => {

"use strict";
module.exports = require("path");;

/***/ }),

/***/ 669:
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
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
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
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	__nccwpck_require__.ab = __dirname + "/";/************************************************************************/
/******/ 	// module exports must be returned from runtime so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	return __nccwpck_require__(109);
/******/ })()
;
//# sourceMappingURL=index.js.map