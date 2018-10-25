export interface ServerModel {
  /**
   * The origin from which we accept connections.
   * @default "https://app.cacher.io"
   */
  origin: string;

  /**
   * Port number that the server is listening on. If not set, is given a random open port.
   */
  port?: number;

  /**
   * Security token used to authenticate connections to the server. If not set, is randomly generated.
   */
  token?: string;

  /**
   * Whether to log all request inputs and outputs.
   */
  verbose?: boolean;

  /**
   * Whether to save the output to the Run Server log file. (~/.cacher/logs/run-server.log)
   */
  logToFile?: boolean;
}
