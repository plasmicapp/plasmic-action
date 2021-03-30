import {
  exec as nodeExec,
  ExecOptions as NodeExecOptions,
} from "child_process";
import { promisify } from "util";

const promiseExec = promisify(nodeExec);

const defaultTimeout = 10 * 60 * 1000;

export type ExecOptions = NodeExecOptions & {
  cwd: string;
  // This string is given to executed command as standard input.
  input?: string;
  // Function to receive command output (both stdout and stderr).
  onOutput?: (chunk: any) => void;
  // Whether to echo "$ {cmd}" to `onOutput`.
  echo?: boolean;
};

export async function exec(cmd: string, opts: ExecOptions) {
  const { input, onOutput, echo = false, ...nodeOpts } = opts;

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

  return await promise;
}
