const core = require('@actions/core');

function incrementMainVersion(baseVersion, strategy, versionPrefix) {
    if (strategy === undefined || strategy.trim() === '') {
        strategy = 'patch';
    }

    if (baseVersion === undefined || baseVersion.trim() === '') {
        baseVersion = '0.0.0';
    }

    const version = parseMainVersion(baseVersion);
    const {prefix, major, minor, patch} = version;

    switch (strategy) {
        case 'patch':
            return `${versionPrefix}${major}.${minor}.${Number(patch) + 1}`;
        case 'minor':
            return `${versionPrefix}${major}.${Number(minor) + 1}.0`;
        case 'major':
            return `${versionPrefix}${Number(major) + 1}.0.0`;
        default:
            throw new Error(`Unknown version strategy type: ${strategy}`);
    }
}

function parseMainVersion(versionString) {
    const regex = /^([a-zA-Z]*)(\d+)\.(\d+)\.(\d+)$/;
    const match = versionString.match(regex);

    if (!match)
        throw new Error("Invalid version format");

    return {
        prefix: match[1] || '',
        major: parseInt(match[2], 10),
        minor: parseInt(match[3], 10),
        patch: parseInt(match[4], 10),
    };
}

function incrementBranchVersion(baseVersion, branchName, versionPrefix) {
    const branchId = branchName.replace('/[^a-z0-9]/gi', '-').toLowerCase();

    const preVersion = baseVersion.split('.').pop();
    const regex = /^([a-zA-Z]*)(\d+)$/;
    const match = preVersion.match(regex);

    if (!match || isNaN(Number(preVersion)))
        throw new Error('Old version has invalid format: ' + baseVersion);

    return `${branchId}.${versionPrefix}${Number(preVersion) + 1}`;
}

function updateVersion(baseVersion, branchName, strategy, versionPrefix) {
    if (['main', 'master'].includes(branchName)) {
        return incrementMainVersion(baseVersion, strategy, versionPrefix);
    }

    return `${incrementBranchVersion(baseVersion, branchName, versionPrefix)}`;
}

try {
    const baseVersion = core.getInput('base_version');
    const branchName = core.getInput('branch_name');
    const strategy = core.getInput('version_strategy');
    const versionPrefix = core.getInput('version_prefix');

    const newVersion = updateVersion(baseVersion, branchName, strategy, versionPrefix);

    core.setOutput('new_version', newVersion);
} catch (error) {
    core.setFailed(error.message);
}