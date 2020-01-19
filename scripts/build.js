const path = require('path');
const { Extractor, ExtractorConfig } = require('@microsoft/api-extractor');

const extractorConfigPath = path.resolve(process.cwd(), `api-extractor.json`);
const extractorConfig = ExtractorConfig.loadFileAndPrepare(extractorConfigPath);
const result = Extractor.invoke(extractorConfig, {
  localBuild: true,
  showVerboseMessages: true
});

console.log(result);
