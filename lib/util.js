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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setOutputs = exports.mkPrBranchName = exports.mkPackageManagerCmds = exports.assertNoSingleQuotes = void 0;
const core = __importStar(require("@actions/core"));
const nanoid_1 = require("nanoid");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
const child_process_1 = require("child_process");
function assertNoSingleQuotes(str) {
    if (str.includes("'")) {
        throw new Error(`Invalid string (contains single quotes): ${str}`);
    }
}
exports.assertNoSingleQuotes = assertNoSingleQuotes;
function mkPackageManagerCmds(cwd) {
    // We check both cwd, and the root path (cwd may be a subdir if the user
    // specified a sub directory within a repo). This is a quick heuristics
    // for dealing with mono-repos
    const useYarn = fs_1.existsSync(path_1.default.join(cwd, "yarn.lock")) ||
        fs_1.existsSync(path_1.default.join(".", "yarn.lock"));
    if (useYarn) {
        const yarnVersion = child_process_1.execSync(`yarn --version`).toString().trim();
        const is2 = semver_1.default.gte(yarnVersion, "2.0.0");
        return {
            install: "yarn",
            run: "yarn",
            add: is2 ? "yarn add" : "yarn add -W",
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
    return `plasmicops/${nanoid_1.nanoid(8)}/${targetBranch}`;
}
exports.mkPrBranchName = mkPrBranchName;
function setOutputs(outputs) {
    for (const [k, v] of Object.entries(outputs)) {
        core.setOutput(k, v);
    }
}
exports.setOutputs = setOutputs;
