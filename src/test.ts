import {updateVersion, validateInputs} from "./index.js";

try {
  let initInputs = {
    latestMainVersion: undefined,
    latestBranchVersion: undefined,
    branchName: 'main',
    strategy: '',
    versionPrefix: '',
    additionalName: '',
    mainlineVersioningBranches: ''
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