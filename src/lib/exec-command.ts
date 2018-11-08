import { ClientCommandModel, ExecCommandModel } from '../models';
import { Socket } from 'socket.io';
import { ChildProcess, spawn } from 'child_process';

const fs = require('fs');
const path = require('path');

import * as _ from 'lodash';
import * as os from 'os';
import { Logger } from 'winston';
import chalk from 'chalk'

const pretty = require('js-object-pretty-print').pretty;
const defaultShell = require('spawn-default-shell');

const IS_WINDOWS = os.platform() === 'win32';
const WORK_DIR = path.resolve(`${os.homedir()}/.cacher/run`);

// Allows for more code to execute concurrently
process.setMaxListeners(50);

export class ExecCommand {
  /**
   * Represents the shell command to be executed by `child_process.spawn()`.
   */
  private readonly config: any;
  private readonly clientCommand: ClientCommandModel;

  private socket: Socket;
  private logger: Logger;

  /**
   * Construct a new ExecCommand for provided file contents.
   * @param args
   * @example
   *    const command = new ExecCommand({
   *      clientCommand: {
   *          channel: 'command_12345',
   *          file: {
   *              filename: 'echo.sh',
   *              filetype: 'shell',
   *              content: 'echo "Hello World"'
   *          }
   *      },
   *      socket,
   *      port: 34215,
   *      token: 'some-secret',
   *      logger: winston.createLogger()
   *    });
   */
  constructor(args: ExecCommandModel) {
    this.clientCommand = args.clientCommand;

    this.socket = args.socket;
    this.logger = args.logger;

    const defaultConfig = require('../config/config.default.js');

    // Prepend user config rules to default config
    const config = Object.assign({}, defaultConfig);
    _.each(args.userConfig.rules, (rule: any) => {
      config.rules.unshift(rule);
    });

    this.config = config;
  }

  /**
   * Spawn a separate process for the command call and handle standard output events.
   */
  public call() {
    const process = this.execProcess();
    if (!process) {
      return;
    }

    this.handleEvents(process);
  }

  private execProcess() {
    // Find first rule to match
    const cmd = _.find(
      this.config.rules,
      (rule: any) => {
        if (_.isString(rule.pattern)) {
          return (new RegExp(rule.pattern)).test(this.clientCommand.file.filename);
        } else if (_.isFunction(rule.pattern)) {
          return rule.pattern(this.clientCommand);
        }

        return false;
      }
    );

    if (!cmd) {
      const userConfigFile =
        path.resolve(`${os.homedir()}/.cacher/run-server.user-config.js`);
      const noCmdMessage =
        `Error: Could not find a rule that matches filename '${this.clientCommand.file.filename}'. Please add one to: ${userConfigFile}.`;
      return this.spawn(`echo "${noCmdMessage}" && exit 127`);
    }

    this.verboseLogCommand(cmd);

    let filepath;

    let args: any = {
      runDir: path.resolve(`${os.homedir()}/.cacher/run`)
    };

    // Needs a temp file to execute
    const useTimestamp = cmd === null;
    if (useTimestamp) {
      filepath =
        path.resolve(`${WORK_DIR}/${(new Date()).getTime()}_${this.clientCommand.file.filename}`);
    } else {
      filepath =
        path.resolve(`${WORK_DIR}/${this.clientCommand.file.filename}`);
    }

    fs.writeFileSync(filepath, this.clientCommand.file.content);
    args['baseFilename'] = path.parse(filepath).name;

    const commandStr = cmd.run(this.clientCommand, filepath, args);
    return this.spawn(commandStr);
  }

  private handleEvents(process: ChildProcess) {
    const channel = this.clientCommand.channel;

    process.stdout.on('data', (data: Buffer) => {
      this.socket.emit(channel, {
        event: 'newline',
        data: data.toString()
      });

      this.verboseLog(`${data.toString().trim()}`);
    });

    process.stderr.on('data', (data: Buffer) => {
      this.socket.emit(channel, {
        event: 'newline',
        data: data.toString()
      });

      this.verboseLog(`${chalk.red(data.toString().trim())}`);
    });

    process.on('exit', (code: number) => {
      this.socket.emit(channel, {
        event: 'exit',
        data: code
      });

      this.verboseLog(`Process exited with code ${code}`);
    });

    this.socket.on('command:stop', () => {
      if (channel === this.clientCommand.channel) {
        process.kill();
      }
    });
  }

  private spawn(commandStr: string) {
    // Use login shell for macOS + Linux
    if (IS_WINDOWS) {
      return spawn(commandStr, [], { shell: true });
    } else {
      return defaultShell.spawn(commandStr);
    }
  }

  private verboseLogCommand(cmd: any) {
    this.verboseLog('Starting process');
    this.verboseLog(`Matched with rule:\n${pretty(cmd, 4, 'PRINT', true)}`);
  }

  private verboseLog(message: string) {
    this.logger.verbose(`${chalk.bold(this.clientCommand.file.filename)}: ${message}`);
  }
}
