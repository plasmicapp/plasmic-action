"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exec = exec;
const child_process_1 = require("child_process");
const util_1 = require("util");
const promiseExec = (0, util_1.promisify)(child_process_1.exec);
const defaultTimeout = 10 * 60 * 1000;
async function exec(cmd, opts) {
    const { input, ...nodeOpts } = opts;
    if (!nodeOpts.timeout) {
        nodeOpts.timeout = defaultTimeout;
    }
    if (!nodeOpts.encoding) {
        nodeOpts.encoding = "utf8";
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
    const result = await promise;
    return {
        stdout: result.stdout.toString(),
        stderr: result.stderr.toString(),
    };
}
