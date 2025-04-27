import {
  incrementBranchVersion,
  incrementMainVersion,
  Inputs,
  isStringEmpty,
  parseSemVersion,
  updateVersion,
  validateInputs
} from '../src';

describe('isStringEmpty', () => {
  it('should return true for empty strings', () => {
    expect(isStringEmpty('')).toBe(true);
    expect(isStringEmpty(null)).toBe(true);
    expect(isStringEmpty(undefined)).toBe(true);
    expect(isStringEmpty('   ')).toBe(true);
  });

  it('should return false for non-empty strings', () => {
    expect(isStringEmpty('test')).toBe(false);
    expect(isStringEmpty('  test  ')).toBe(false);
  });
});

describe('validateInputs', () => {
  it('should set default values for empty inputs', () => {
    const result = validateInputs({});
    expect(result.strategy).toBe('patch');
    expect(result.latestMainVersion).toBe('0.0.0');
    expect(result.latestBranchVersion).toBe('');
    expect(result.branchName).toBe('master');
    expect(result.versionPrefix).toBe('');
  });

  it('should preserve valid inputs', () => {
    const inputs: Partial<Inputs> = {
      strategy: 'minor',
      latestMainVersion: '1.2.3',
      branchName: 'feature-123',
      versionPrefix: 'v'
    };
    const result = validateInputs(inputs);
    expect(result.strategy).toBe('minor');
    expect(result.latestMainVersion).toBe('1.2.3');
    expect(result.branchName).toBe('feature-123');
    expect(result.versionPrefix).toBe('v');
  });
});

describe('parseSemVersion', () => {
  it('should parse version without prefix', () => {
    const result = parseSemVersion('1.2.3');
    expect(result).toEqual({
      prefix: '',
      major: 1,
      minor: 2,
      patch: 3
    });
  });

  it('should parse version with prefix', () => {
    const result = parseSemVersion('v1.2.3');
    expect(result).toEqual({
      prefix: 'v',
      major: 1,
      minor: 2,
      patch: 3
    });
  });

  it('should throw error for invalid format', () => {
    expect(() => parseSemVersion('invalid')).toThrow();
    expect(() => parseSemVersion('1.2')).toThrow();
  });
});

describe('incrementMainVersion', () => {
  const testCases = [
    {strategy: 'patch', input: '1.2.3', versionPrefix: '', expected: '1.2.4'},
    {strategy: 'minor', input: '1.2.3', versionPrefix: '', expected: '1.3.0'},
    {strategy: 'major', input: '1.2.3', versionPrefix: '', expected: '2.0.0'},
    {strategy: 'patch', input: 'v1.2.3', versionPrefix: '', expected: '1.2.4'},
    {strategy: 'minor', input: 'v1.2.3', versionPrefix: '', expected: '1.3.0'},
    {strategy: 'major', input: 'v1.2.3', versionPrefix: 'v', expected: 'v2.0.0'}
  ];

  testCases.forEach(({strategy, input, versionPrefix, expected}) => {
    it(`should increment ${strategy} version for ${input}`, () => {
      const result = incrementMainVersion(input, strategy, versionPrefix);
      expect(result.newVersion).toBe(expected);
    });
  });

  it('should throw error for unknown strategy', () => {
    expect(() => incrementMainVersion('1.2.3', 'invalid', '')).toThrow();
  });
});

describe('incrementBranchVersion', () => {
  it('should create first branch version when no previous exists', () => {
    const result = incrementBranchVersion('1.2.3', '', 'feature/new', 'v');
    expect(result.newVersion).toBe('v1.2.3-feature-new.1');
  });

  it('should increment existing branch version', () => {
    const result = incrementBranchVersion('1.2.3', 'v1.2.3-feature-new.5', 'feature/new', 'v');
    expect(result.newVersion).toBe('v1.2.3-feature-new.6');
  });

  it('should handle invalid branch version', () => {
    const result = incrementBranchVersion('1.2.3', 'invalid', 'feature/new', 'v');
    expect(result.newVersion).toBe('v1.2.3-feature-new.1');
  });
});

describe('updateVersion', () => {
  it('should update main version for main branch', () => {
    const inputs: Inputs = {
      latestMainVersion: '1.2.3',
      latestBranchVersion: '',
      branchName: 'main',
      strategy: 'minor',
      versionPrefix: 'v'
    };
    const result = updateVersion(inputs);
    expect(result.newVersion).toBe('v1.3.0');
  });

  it('should update branch version for feature branch', () => {
    const inputs: Inputs = {
      latestMainVersion: '1.2.3',
      latestBranchVersion: 'v1.2.3-feature-test.5',
      branchName: 'feature-test',
      strategy: 'patch',
      versionPrefix: 'v'
    };
    const result = updateVersion(inputs);
    expect(result.newVersion).toBe('v1.2.3-feature-test.6');
  });

  it('should handle master branch as main', () => {
    const inputs: Inputs = {
      latestMainVersion: '1.2.3',
      latestBranchVersion: '',
      branchName: 'master',
      strategy: 'major',
      versionPrefix: ''
    };
    const result = updateVersion(inputs);
    expect(result.newVersion).toBe('2.0.0');
  });
});
