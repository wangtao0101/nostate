const chalk = require('chalk');
const msgPath = process.env.HUSKY_GIT_PARAMS;
const msg = require('fs')
  .readFileSync(msgPath, 'utf-8')
  .trim();

const commitRE = /^(revert: )?(feat|fix|docs|style|refactor|perf|test|build|chore|types)(\(.+\))?: .{1,50}/;

if (!commitRE.test(msg)) {
  console.error(
    `  ${chalk.bgRed.white(' ERROR ')} ${chalk.red(`invalid commit message format.`)}\n\n` +
      chalk.red(`Proper commit message format is required for automated changelog generation. Examples:\n\n`) +
      `${chalk.green(`fix(pencil): add 'graphiteWidth' option (close #28)`)}\n\n`,
  );

  process.exit(1);
}
