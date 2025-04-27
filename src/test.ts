import {updateVersion, validateInputs} from "./index.js";

try {
  let initInputs = {
    latestMainVersion: '3.2.1',
    latestBranchVersion: '',
    branchName: 'main',
    strategy: 'minor',
    versionPrefix: 'v'
  };
  const inputs = validateInputs(initInputs);
  console.log(inputs);

  const outputs = updateVersion(inputs);

  console.log(`
New Version: "${outputs.newVersion}"
New Version Raw: "${outputs.newVersionRaw}"
Prefix: "${outputs.prefix}"`);

} catch (error: any) {
  console.log(`[Error]: ${error.message}`);
}