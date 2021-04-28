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
Object.defineProperty(exports, "__esModule", { value: true });
exports.exec = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const promiseExec = util_1.promisify(child_process_1.exec);
const defaultTimeout = 10 * 60 * 1000;
function exec(cmd, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const { input } = opts, nodeOpts = __rest(opts, ["input"]);
        if (!nodeOpts.timeout) {
            nodeOpts.timeout = defaultTimeout;
        }
        // If timeout expires we want to kill the process immediately instead of
        // just sending SIGTERM. If we send SIGTERM, the process can keep writing
        // to the directory for a few moments which causes "rm -rf {cwd}" to fail.
        nodeOpts.killSignal = "SIGKILL";
        const promise = promiseExec(cmd, nodeOpts);
        console.log(`$ ${cmd}`);
        const onOutput = (chunk) => {
            console.log(chunk.trim());
        };
        if (promise.child.stdout) {
            promise.child.stdout.on("data", onOutput);
        }
        if (promise.child.stderr) {
            promise.child.stderr.on("data", onOutput);
        }
        if (input && promise.child.stdin) {
            promise.child.stdin.write(input);
            promise.child.stdin.end();
        }
        return yield promise;
    });
}
exports.exec = exec;
