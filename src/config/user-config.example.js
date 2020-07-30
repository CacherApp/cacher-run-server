/**
 * All rules defined here will match ahead of the ones defined in the default config.
 * Use them to append to or override existing rules.
 * View ~/.cacher/run-server.config.js to see how the default rules are defined.
 *
 * See https://github.com/CacherApp/cacher-run-server/blob/master/README.md
 * for complete documentation.
 */

((require) => {
  // Use any standard Node library, along with opn (https://www.npmjs.com/package/opn) and
  // any globally-installed Node packages.
  const path = require('path');
  const childProcess = require('child_process');
  const opn = require('opn');
  const os = require('os');

  return {
    rules: [
      /*

      // Run script for new file extension
      {
        pattern: '\.awesome$',
        run: (command, filepath) => `awesome-compiler "${filepath}"`
      },

      // ------------------------------------------------------

      // Rule to compile .md (Markdown) file into HTML, then display in default browser.
      // Requires first running `npm -g markdown` (https://github.com/evilstreak/markdown-js)
      {
        pattern: '\.md$',
        run: (command, filepath, args) => {
          const outputHtmlFile = `${args.runDir}/${args.baseFilename}.html`;
          childProcess.execSync(`md2html ${filepath} > ${outputHtmlFile}`);
          opn(outputHtmlFile);

          // Must return a shell command
          return `echo "Generated '${outputHtmlFile}'" and opened in default browser`;
        }
      },

      // ------------------------------------------------------

      // Filter file by both filename and content. Run pre-execution command.
      // Put "//nvm: v6.10.1" at top of snippet file to use a specific Node version for execution
      {
        pattern: (command) => {
          return /\.js$/.test(command.file.filename)
            && command.file.content.indexOf('//nvm:') >= 0;
        },
        run: (command, filepath) => {
          let nvmVersion = command.file.content.match(/(\/\/nvm: v(.+))/)[0]
            .replace('//nvm: ', '');

          return `export NVM_DIR=~/.nvm ` +
            `&& source ~/.nvm/nvm.sh` +
            `&& nvm use ${nvmVersion} ` +
            `&& node "${filepath}"`;
        }
      }

      */
    ]
  };
});
