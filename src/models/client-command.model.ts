export interface ClientCommandModel {
  /**
   * Name of the Socket.io channel.
   */
  channel: string,

  /**
   * The attributes from a Cacher snippet file that are needed for execution.
   */
  file: {
    filename: string,
    filetype: string,
    content: string
  }
}
