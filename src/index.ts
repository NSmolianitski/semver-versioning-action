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
}

export class Outputs {
  newVersion!: string;
  newVersionRaw!: string;
  prefix!: string;
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

  return validated;
}

export function parseSemVersion(versionString: string): SemVersion {
  const regex = /^([a-zA-Z]*)(\d+)\.(\d+)\.(\d+)$/;
  const match = versionString.match(regex);

  if (!match)
    throw new Error(`Invalid version format: ${versionString}`);

  return {
    prefix: match[1] || '',
    major: parseInt(match[2], 10),
    minor: parseInt(match[3], 10),
    patch: parseInt(match[4], 10),
  };
}

export function incrementMainVersion(latestMainVersion: string, strategy: string, versionPrefix: string): Outputs {
  const {prefix, major, minor, patch} = parseSemVersion(latestMainVersion);

  let newVersion: string;
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
    newVersion: `${versionPrefix}${newVersion}`,
    newVersionRaw: newVersion,
    prefix: versionPrefix
  };
}

export function incrementBranchVersion(latestMainVersion: string, latestBranchVersion: string, branchName: string, versionPrefix: string): Outputs {
  const formattedBranchName = branchName.replace(/[^a-z0-9]/gi, '-').toLowerCase();

  let branchPatchVersion = latestBranchVersion.split('.').pop() || '0';
  const match = latestBranchVersion.match(/^[^.]+\.[^.]+\.[^.]+-.*\.(\d+)$/);

  if (isNaN(Number(branchPatchVersion)) || !match) {
    branchPatchVersion = '0';
  }

  const fullPrefix = `${versionPrefix}${latestMainVersion}-${formattedBranchName}`;
  const newVersionRaw = Number(branchPatchVersion) + 1;
  const newVersion = `${fullPrefix}.${newVersionRaw}`;

  return {
    newVersion: newVersion,
    newVersionRaw: `${newVersionRaw}`,
    prefix: fullPrefix
  };
}

export function updateVersion(inputs: Inputs): Outputs {
  const {
    latestMainVersion,
    latestBranchVersion,
    branchName,
    strategy,
    versionPrefix
  } = inputs;

  if (['master', 'main'].includes(branchName)) {
    return incrementMainVersion(latestMainVersion, strategy, versionPrefix);
  }

  return incrementBranchVersion(latestMainVersion, latestBranchVersion, branchName, versionPrefix);
}

export function run(): void {
  try {
    let inputs: Partial<Inputs> = {
      latestMainVersion: core.getInput('latest_main_version'),
      latestBranchVersion: core.getInput('latest_branch_version'),
      branchName: core.getInput('branch_name'),
      strategy: core.getInput('version_strategy'),
      versionPrefix: core.getInput('version_prefix')
    };

    const validatedInputs = validateInputs(inputs);
    const newVersion = updateVersion(validatedInputs);

    core.setOutput('new_version', newVersion.newVersion);
    core.setOutput('new_version_raw', newVersion.newVersionRaw);
    core.setOutput('prefix', newVersion.prefix);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('Unknown error occurred');
    }
  }
}