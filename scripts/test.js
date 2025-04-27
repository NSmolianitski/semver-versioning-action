import {updateVersion, validateInputs} from "./index.js";

try {
    let inputs = {
        latestMainVersion: '3.2.1',
        latestBranchVersion: '3.2.1-feature/core.18',
        branchName: 'feature/core',
        strategy: undefined,
        versionPrefix: undefined
    };
    inputs = validateInputs(inputs);
    console.log(inputs);

    const outputs = updateVersion(inputs);

    console.log(`
New Version: "${outputs.newVersion}"
New Version Raw: "${outputs.newVersionRaw}"
Prefix: "${outputs.prefix}"`);

} catch (error) {
    console.log(`[Error]: ${error.message}`);
}