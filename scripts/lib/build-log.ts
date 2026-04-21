const BUILD_WARNING_PATTERNS = [
  /^⚠\s.*$/u,
  /^Detected multiple Jotai instances\..*$/u,
] as const;

export const collectBuildWarnings = (output: string): string[] => {
  const warnings = new Set<string>();

  output.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();

    if (
      trimmedLine.length > 0 &&
      BUILD_WARNING_PATTERNS.some((pattern) => pattern.test(trimmedLine))
    ) {
      warnings.add(trimmedLine);
    }
  });

  return [...warnings];
};

export const hasBuildWarnings = (output: string): boolean => {
  return collectBuildWarnings(output).length > 0;
};
