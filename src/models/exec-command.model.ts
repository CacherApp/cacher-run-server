import { Socket } from 'socket.io';
import { Logger } from 'winston';
import { ClientCommandModel } from './client-command.model';

export interface ExecCommandModel {
  /**
   * Port number that the server is listening on.
   */
  port: number,

  /**
   * Security token used to authenticate connections to the server.
   */
  token: string,

  /**
   * The command to be executed.
   */
  clientCommand: ClientCommandModel,

  /**
   * Socket.io Socket object. (https://socket.io/docs/server-api/#Socket)
   */
  socket: Socket,

  /**
   * The Winston Logger. (https://github.com/winstonjs/winston)
   */
  logger: Logger,

  /**
   * User configuration based on `~/.cacher/run-server.user-config.js`.
   */
  userConfig: any
}
