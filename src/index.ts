import * as core from '@actions/core';

export interface SemVersion {
  prefix: string;
  major: number;
  minor: number;
  patch: number;
}

export class Inputs {
  latestMainVersion!: string;
  latestBranchVersion!: string;
  branchName!: string;
  strategy!: string;
  versionPrefix!: string;
  additionalName!: string;
  mainlineVersioningBranches!: string;
}

export class Outputs {
  newVersion!: string;
  newVersionRaw!: string;
  prefix!: string;
  major!: string;
  minor!: string;
  patch!: string;
}

export function isStringEmpty(str: string | undefined | null): boolean {
  return !str || !str.trim().length;
}

export function validateInputs(inputs: Partial<Inputs>): Inputs {
  const validated: Inputs = inputs as Inputs;

  if (isStringEmpty(validated.strategy)) {
    validated.strategy = 'patch';
  }

  if (isStringEmpty(validated.latestMainVersion)) {
    validated.latestMainVersion = '0.0.0';
  }

  if (isStringEmpty(validated.latestBranchVersion)) {
    validated.latestBranchVersion = '';
  }

  if (isStringEmpty(validated.branchName)) {
    validated.branchName = 'master';
  }

  if (isStringEmpty(validated.versionPrefix)) {
    validated.versionPrefix = '';
  }

  if (isStringEmpty(validated.additionalName)) {
    validated.additionalName = '';
  } else {
    validated.additionalName += '.';
  }

  if (isStringEmpty(validated.mainlineVersioningBranches)) {
    validated.mainlineVersioningBranches = 'main,master';
  }

  return validated;
}

export function parseSemVersion(additionalName: string, versionString: string): SemVersion {
  const rawVersionString = versionString.replace(additionalName, '');
  const regex = /^([a-zA-Z]*)(\d+)\.(\d+)\.(\d+)$/;
  const match = rawVersionString.match(regex);

  if (!match)
    throw new Error(`Invalid version format: ${rawVersionString}`);

  return {
    prefix: match[1] || '',
    major: parseInt(match[2], 10),
    minor: parseInt(match[3], 10),
    patch: parseInt(match[4], 10),
  };
}

export function incrementMainVersion(
  latestMainVersion: string,
  strategy: string,
  versionPrefix: string,
  additionalName: string
): Outputs {
  let {prefix, major, minor, patch} = parseSemVersion(additionalName, latestMainVersion);

  switch (strategy) {
    case 'patch':
      ++patch;
      break;
    case 'minor':
      ++minor;
      patch = 0;
      break;
    case 'major':
      ++major;
      minor = 0;
      patch = 0;
      break;
    default:
      throw new Error(`Unknown version strategy type: ${strategy}`);
  }

  const newVersion = `${major}.${minor}.${patch}`;

  return {
    newVersion: `${additionalName}${versionPrefix}${newVersion}`,
    newVersionRaw: newVersion,
    prefix: versionPrefix,
    major: `${additionalName}${versionPrefix}${major}`,
    minor: `${additionalName}${versionPrefix}${minor}`,
    patch: `${additionalName}${versionPrefix}${patch}`,
  };
}

export function incrementBranchVersion(
  latestMainVersion: string,
  latestBranchVersion: string,
  branchName: string,
  versionPrefix: string,
  additionalName: string
): Outputs {
  const formattedBranchName = branchName
    .replace(additionalName, '')
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase();

  let branchPatchVersion = latestBranchVersion.split('.').pop() || '0';
  const match = latestBranchVersion.match(/^[^.]+\.[^.]+\.[^.]+-.*\.(\d+)$/);

  if (isNaN(Number(branchPatchVersion)) || !match) {
    branchPatchVersion = '0';
  }

  const fullPrefix = `${versionPrefix}${latestMainVersion}-${formattedBranchName}`;
  const newVersionRaw = Number(branchPatchVersion) + 1;
  const newVersion = `${additionalName}${fullPrefix}.${newVersionRaw}`;

  return {
    newVersion: newVersion,
    newVersionRaw: `${newVersionRaw}`,
    prefix: fullPrefix,
    major: 'branch-version-increased',
    minor: 'branch-version-increased',
    patch: 'branch-version-increased',
  };
}

export function updateVersion(inputs: Inputs): Outputs {
  const {
    latestMainVersion,
    latestBranchVersion,
    branchName,
    strategy,
    versionPrefix,
    additionalName,
    mainlineVersioningBranches
  } = inputs;

  if (mainlineVersioningBranches.split(',').includes(branchName)) {
    return incrementMainVersion(latestMainVersion, strategy, versionPrefix, additionalName);
  }

  return incrementBranchVersion(latestMainVersion, latestBranchVersion, branchName, versionPrefix, additionalName);
}

export function run(): void {
  try {
    let inputs: Partial<Inputs> = {
      latestMainVersion: core.getInput('latest_main_version'),
      latestBranchVersion: core.getInput('latest_branch_version'),
      branchName: core.getInput('branch_name'),
      strategy: core.getInput('version_strategy'),
      versionPrefix: core.getInput('version_prefix'),
      additionalName: core.getInput('additional_name'),
      mainlineVersioningBranches: core.getInput('mainline_versioning_branches')
    };

    const validatedInputs = validateInputs(inputs);
    const newVersionOutputs = updateVersion(validatedInputs);

    core.setOutput('new_version', newVersionOutputs.newVersion);
    core.setOutput('new_version_raw', newVersionOutputs.newVersionRaw);
    core.setOutput('prefix', newVersionOutputs.prefix);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('Unknown error occurred');
    }
  }
}

run();