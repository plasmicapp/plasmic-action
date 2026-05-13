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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertNoSingleQuotes = assertNoSingleQuotes;
exports.mkPackageManagerCmds = mkPackageManagerCmds;
exports.mkPrBranchName = mkPrBranchName;
exports.setOutputs = setOutputs;
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
function mkPackageManagerCmds(cwd) {
    // We check both cwd, and the root path (cwd may be a subdir if the user
    // specified a sub directory within a repo). This is a quick heuristics
    // for dealing with mono-repos
    const useYarn = (0, fs_1.existsSync)(path_1.default.join(cwd, "yarn.lock")) ||
        (0, fs_1.existsSync)(path_1.default.join(".", "yarn.lock"));
    if (useYarn) {
        const yarnVersion = (0, child_process_1.execSync)(`yarn --version`).toString().trim();
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
        add: "npm install --legacy-peer-deps",
        cmd: "npx",
    };
}
function mkPrBranchName(targetBranch) {
    return `plasmicops/${(0, nanoid_1.nanoid)(8)}/${targetBranch}`;
}
function setOutputs(outputs) {
    for (const [k, v] of Object.entries(outputs)) {
        core.setOutput(k, v);
    }
}
