/**
 * Call `npm start [origin]` to run this script.
 */

const RunServer = require('../dist/lib/server').RunServer;

if (!process.argv[2]) {
  console.error(
    'Must provide "origin" as first argument. Use "file://" with Cacher Desktop, "https://app.cacher.io" for Web App.'
  );
  process.exit(1);
}

(new RunServer({
  origin: process.argv[2],
  port: 64182,
  token: 'token'
})).start();
