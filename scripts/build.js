const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const execa = require('execa');
const { Extractor, ExtractorConfig } = require('@microsoft/api-extractor');

run();

async function run() {
  await execa('rollup', ['-c'], { stdio: 'inherit' });

  const extractorConfigPath = path.resolve(process.cwd(), `api-extractor.json`);
  const extractorConfig = ExtractorConfig.loadFileAndPrepare(extractorConfigPath);
  const result = Extractor.invoke(extractorConfig, {
    localBuild: true,
    showVerboseMessages: true
  });

  if (result.succeeded) {
    console.log(chalk.bold(chalk.green(`API Extractor completed successfully.`)));
  } else {
    console.error(
      `API Extractor completed with ${extractorResult.errorCount} errors` +
        ` and ${extractorResult.warningCount} warnings`
    );
    process.exitCode = 1;
  }

  await fs.remove(`dist/src`);
}
