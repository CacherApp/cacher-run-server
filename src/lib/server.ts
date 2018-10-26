import * as http from 'http';
import * as express from 'express';

const os = require('os');
const path = require('path');
const vm = require('vm');

const shell = require('shelljs');
const socketio = require('socket.io');
const opn = require('opn');

import * as winston from 'winston';
import { format } from 'logform';
import * as fs from 'fs';
import chalk from 'chalk';

const getPort = require('get-port');
const nanoid = require('nanoid');

import { Socket } from 'socket.io';
import { ClientCommandModel, ServerModel } from '../models';
import { ExecCommand } from './exec-command';

const WORK_DIR = path.resolve(`${os.homedir()}/.cacher/run`);
const LOGS_DIR = path.resolve(`${os.homedir()}/.cacher/logs`);
const USER_CONFIG_FILE = path.resolve(`${os.homedir()}/.cacher/run-server.user-config.js`);
const LOG_FILE = path.resolve(`${LOGS_DIR}/run-server.log`);

let USER_CONFIG = { rules: [] };

export class RunServer {
  /**
   * Uses the Socket.io Server to accept WebSocket command requests and execute
   * them in child processes.
   */

  private readonly origin: string;
  private port: number;
  private readonly token: string;
  private readonly verbose: boolean;
  private readonly logToFile: boolean;

  private logger: any;
  private server: any;
  private io: any;

  /**
   * Opens the user configuration file to map file extensions to run commands.
   * @param {string} editor - Editor to open the config file in.
   * @example
   *    RunServer.openConfig('code');
   */
  public static openConfig(editor?: string) {
    RunServer.setup();

    if (editor) {
      shell.exec(`${editor} ${USER_CONFIG_FILE}`);
    } else {
      opn(USER_CONFIG_FILE);
    }
  }

  /**
   * Tail the Run Server log file.
   * @param {boolean} tail - Whether to follow the log file output.
   * @param {number} lines - Show the last n lines of log output.
   */
  public static openLog(tail?: boolean, lines = 25) {
    RunServer.setup();

    if (tail) {
      shell.exec(`tail -f ${LOG_FILE}`);
    } else {
      shell.exec(`tail -${lines} ${LOG_FILE}`);
    }
  }

  private static setup(logger?: any) {
    RunServer.createDirs();
    RunServer.copyConfig(logger);
    RunServer.cleanWorkDir();
    RunServer.createLogFile();
  }

  private static createDirs() {
    // Make working dir if does not exist
    if (!fs.existsSync(WORK_DIR)) {
      shell.mkdir('-p', WORK_DIR);
    }

    if (!fs.existsSync(LOGS_DIR)) {
      shell.mkdir('-p', LOGS_DIR);
    }
  }

  private static cleanWorkDir() {
    // Clear any existing temporary files
    const removePath = path.resolve(`${WORK_DIR}/*`);
    shell.rm('-rf', removePath);
  }

  private static createLogFile() {
    if (!fs.existsSync(LOG_FILE)) {
      shell.exec(`touch ${LOG_FILE}`);
    }
  }

  private static copyConfig(logger?: any) {
    const serverConfig =
      path.resolve(`${os.homedir()}/.cacher/run-server.config.js`);

    if (!fs.existsSync(serverConfig)) {
      const defaultConfig = path.resolve(`${__dirname}/../config/config.default.js`);
      shell.cp(defaultConfig, serverConfig);

      if (logger) {
        logger.info(`Copied server configuration to:\n${chalk.bold(serverConfig)}\n`);
      }
    }

    if (!fs.existsSync(USER_CONFIG_FILE)) {
      const configExample =
        path.resolve(`${__dirname}/../config/user-config.example.js`);
      shell.cp(configExample, USER_CONFIG_FILE);

      if (logger) {
        logger.info(`Copied user configuration to:\n${chalk.bold(USER_CONFIG_FILE)}\n`);
      }
    }

    USER_CONFIG =
      vm.runInThisContext(
        fs.readFileSync(USER_CONFIG_FILE).toString()
      )(require);
  }

  /**
   * Construct a new server and run setup functions.
   * @param args
   * @example
   *    const server = new RunServer({
   *      origin: 'https://app.test',
   *      port: 34221,
   *      token: nanoid(),
   *      verbose: false,
   *      logToFile: true
   *    });
   */
  constructor(args: ServerModel) {
    this.origin = args.origin;
    this.port = args.port || -1;
    this.token = args.token || nanoid();
    this.verbose = args.verbose || false;
    this.logToFile = args.logToFile || false;

    this.setupLogger();
    RunServer.setup(this.logger);
  }

  /**
   * Start the Run Server on the provided port.
   */
  public start() {
    (async () => {
      const app = express();
      const server = http.createServer(app);

      if (this.port === -1) {
        this.port = await getPort()
      }

      // See issue:
      // https://github.com/socketio/socket.io-client/issues/1140#issuecomment-325958737
      const io =
        socketio(
          server,
          {
            handlePreflightRequest: (req: any, res: any) => {
              let headers = {
                'Access-Control-Allow-Headers': 'x-server-token',
                'Access-Control-Allow-Origin': this.origin,
                'Access-Control-Allow-Credentials': true
              };
              res.writeHead(200, headers);
              res.end();
            }
          });

      io.use((socket: Socket, next: Function) => {
        const token = socket.handshake.headers['x-server-token'];
        if (token === this.token) {
          return next();
        }

        return next(new Error('authentication error'));
      });

      io.on('connection', (socket: Socket) => {
        socket.on('handshake', () => {
          // Just to check authentication
          socket.emit('handshake', { status: 'ok' });
        });

        socket.on('command:run', (clientCommand: ClientCommandModel) => {
          const exec = new ExecCommand({
            clientCommand,
            socket,
            port: this.port,
            token: this.token,
            logger: this.logger,
            userConfig: USER_CONFIG
          });

          exec.call();
        });
      });

      server.listen(this.port, () => {
        this.logger.info(`Listening on: ${chalk.bold('http://localhost:' + this.port.toString())}`);
        this.logger.info(`Server token: ${chalk.bold(this.token)}`);
        this.logger.info(`Allow connections from origin: ${chalk.bold(this.origin)}`);
      });

      this.io = io;
      this.server = server;
    })()
  }

  /**
   * Stop the Run Server and close all WebSocket connections.
   */
  public stop() {
    if (this.io) {
      this.io.close();
    }

    if (this.server) {
      this.server.close(() => {
        this.logger.info(`Stopped server: ${chalk.bold('http://localhost:' + this.port.toString())}`);
      });
    }
  }

  private setupLogger() {
    const level = this.verbose ? 'debug' : 'info';

    const transports = this.logToFile
      ? [new winston.transports.File({ filename: LOG_FILE })]
      : [new winston.transports.Console()];

    this.logger = winston.createLogger({
      level,
      format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
      ),
      transports
    });
  }
}

