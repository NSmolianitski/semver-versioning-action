import * as core from '@actions/core';

export class Inputs {
    latestMainVersion;
    latestBranchVersion;
    branchName;
    strategy;
    versionPrefix;
}

export class Outputs {
    newVersion;
    newVersionRaw;
}

export function isStringEmpty(str) {
    return !str || !str.trim().length;
}

export function validateInputs(inputs) {
    if (isStringEmpty(inputs.strategy)) {
        inputs.strategy = 'patch';
    }

    if (isStringEmpty(inputs.latestMainVersion)) {
        inputs.latestMainVersion = '0.0.0';
    }

    if (isStringEmpty(inputs.branchName)) {
        inputs.branchName = 'master';
    }

    return inputs;
}

export function parseSemVersion(versionString) {
    const regex = /^([a-zA-Z]*)(\d+)\.(\d+)\.(\d+)$/;
    const match = versionString.match(regex);

    if (!match) throw new Error(`Invalid version format: ${versionString}`);

    return {
        prefix: match[1] || '',
        major: parseInt(match[2], 10),
        minor: parseInt(match[3], 10),
        patch: parseInt(match[4], 10),
    };
}

export function incrementMainVersion(latestMainVersion, strategy) {
    const {prefix, major, minor, patch} = parseSemVersion(latestMainVersion);

    let newVersion;
    switch (strategy) {
        case 'patch':
            newVersion = `${major}.${minor}.${Number(patch) + 1}`;
            break;
        case 'minor':
            newVersion = `${major}.${Number(minor) + 1}.0`;
            break;
        case 'major':
            newVersion = `${Number(major) + 1}.0.0`;
            break;
        default:
            throw new Error(`Unknown version strategy type: ${strategy}`);
    }

    return {
        newVersion: `${prefix}${newVersion}`,
        newVersionRaw: newVersion,
        prefix: prefix
    };
}

export function incrementBranchVersion(latestMainVersion, branchName, versionPrefix) {
    const formattedBranchName = branchName.replace('/[^a-z0-9]/gi', '-').toLowerCase();

    let branchPatchVersion = latestMainVersion.split('.').pop();
    const match = branchPatchVersion.match(/^-.*-([^.-]+)\.(\d+)$/);

    if (!match || isNaN(Number(branchPatchVersion)))
        branchPatchVersion = '0';

    const newVersion = `${formattedBranchName}.${Number(branchPatchVersion) + 1}`;

    return {
        newVersion: `${versionPrefix}${newVersion}`,
        newVersionRaw: newVersion,
        prefix: versionPrefix
    };
}

export function updateVersion(inputs) {
    const {latestMainVersion, branchName, strategy, versionPrefix} = inputs;

    if (['master', 'main'].includes(branchName)) {
        return incrementMainVersion(latestMainVersion, strategy, versionPrefix);
    }

    return `${incrementBranchVersion(latestMainVersion, branchName, versionPrefix)}`;
}

export function run() {
    try {
        let inputs = {
            baseVersion: core.getInput('base_version'),
            branchName: core.getInput('branch_name'),
            strategy: core.getInput('version_strategy'),
            versionPrefix: core.getInput('version_prefix')
        };
        inputs = validateInputs(inputs);

        const newVersion = updateVersion(inputs);

        core.setOutput('new_version', newVersion);
        core.setOutput('new_version_raw', newVersion);
    } catch (error) {
        core.setFailed(error.message);
    }
}

// run();