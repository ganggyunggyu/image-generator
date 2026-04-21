const AUTO_PASS_PREFIXES = ['Merge ', 'Revert "', 'fixup! ', 'squash! '] as const;

const REQUIRED_FIELDS = [
  {
    label: 'Expected',
    pattern: /^(Expected|기대결과):\s*\S.+$/,
  },
  {
    label: 'Verification',
    pattern: /^(Verification|검증):\s*\S.+$/,
  },
  {
    label: 'Tests',
    pattern: /^(Tests|테스트):\s*\S.+$/,
  },
] as const;

export interface CommitMessageValidationResult {
  errors: string[];
  isValid: boolean;
}

const normalizeLines = (message: string): string[] => {
  return message
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
};

const shouldBypassValidation = (subject: string): boolean => {
  return AUTO_PASS_PREFIXES.some((prefix) => subject.startsWith(prefix));
};

export const validateCommitMessage = (
  message: string
): CommitMessageValidationResult => {
  const lines = normalizeLines(message);
  const [subject = ''] = lines;

  if (subject.length === 0) {
    return {
      errors: ['커밋 제목이 비어 있음'],
      isValid: false,
    };
  }

  if (shouldBypassValidation(subject)) {
    return {
      errors: [],
      isValid: true,
    };
  }

  const errors = REQUIRED_FIELDS.flatMap(({ label, pattern }) => {
    return lines.some((line) => pattern.test(line))
      ? []
      : [`${label}: 줄이 필요함`];
  });

  return {
    errors,
    isValid: errors.length === 0,
  };
};
