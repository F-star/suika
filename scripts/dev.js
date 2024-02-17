const { context } = require('esbuild');
const args = require('minimist')(process.argv.slice(2));
const path = require('path');
const { sassPlugin } = require('esbuild-sass-plugin');
const fs = require('fs');
const { typecheckPlugin } = require('@jgoz/esbuild-plugin-typecheck');
const pc = require('picocolors');

const setup = async () => {
  const cwd = process.cwd();

  const target = args._[0];
  if (!target) {
    console.log('Please specify a target package');
    return;
  }

  const pkgJson = require(path.resolve(cwd, `./package.json`));

  const outfile = path.resolve(cwd, `./dist/${target}.es.js`);
  const relativeOutputFile = path.relative(cwd, outfile);

  const SUCCESS = process.platform === 'win32' ? '√' : '✔';
  const WARNING = process.platform === 'win32' ? '‼' : '⚠';
  const ERROR = process.platform === 'win32' ? '×' : '✖';
  const INFO = process.platform === 'win32' ? 'i' : 'ℹ';

  /** @type {import('esbuild').BuildContext} */
  const ctx = await context({
    entryPoints: [path.resolve(cwd, `./src/index.ts`)],
    outfile,
    bundle: true,
    metafile: true,
    external: Object.keys({
      ...pkgJson.dependencies,
      ...pkgJson.peerDependencies,
      ...pkgJson.devDependencies,
    }).filter((dep) => !dep.startsWith('@suika')),
    sourcemap: true,
    format: 'esm',
    platform: 'browser',
    plugins: [
      sassPlugin({
        type: 'css',
      }),
      typecheckPlugin({
        watch: true,
        omitStartLog: true,
        // compilerOptions: {
        //   noUnusedLocals: false,
        // },
        logger: {
          info(message) {
            // don't log info
            // console.info(pc.bold(INFO) + '  ' + message);
          },
          warn(message) {
            console.warn(pc.bold(pc.yellow(WARNING)) + '  ' + message);
          },
          error(message) {
            console.error(pc.bold(pc.red(ERROR)) + '  ' + message);
          },
          success(message) {
            // don't log success
            console.info(
              `${pc.bold(SUCCESS)}  [${target}] ${pc.green(message)}`,
            );
          },
        },
      }),
      {
        name: 'watch-build',
        setup(build) {
          build.onEnd((result) => {
            if (result.errors.length) {
              console.error('build failed...' /*, result.errors */);
              return;
            }
            console.log('watch build succeeded:', relativeOutputFile);

            // rename output CSS file
            if (result.metafile) {
              const outputs = result.metafile.outputs;
              Object.keys(outputs).forEach((output) => {
                const oldPath = path.resolve(output);
                let newPath;
                if (output.endsWith('.css')) {
                  // <target>.es.css ---> style.css
                  newPath = oldPath.replace(`${target}.es.css`, 'style.css');
                }
                if (newPath && oldPath !== newPath) {
                  fs.renameSync(oldPath, newPath);
                }
              });
            }
          });
        },
      },
    ],
  });

  await ctx.watch();
};

setup();
