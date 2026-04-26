import * as fs from 'fs';
import * as path from 'path';

export const resolveExistingDirectory = (candidates: string[]): string => {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
  }

  throw new Error(`No matching input directory found: ${candidates.join(', ')}`);
};

const normalizeName = (value: string): string => value.normalize('NFC');

const compareByDirectoryNameAsc = (left: string, right: string): number =>
  normalizeName(path.basename(left)).localeCompare(normalizeName(path.basename(right)), 'ko-KR', {
    numeric: true,
  });

export const findMatchingSubdirectories = (baseDir: string, keyword: string): string[] => {
  if (!fs.existsSync(baseDir) || !fs.statSync(baseDir).isDirectory()) return [];

  return fs.readdirSync(baseDir)
    .filter((name) => normalizeName(name).includes(keyword))
    .map((name) => path.join(baseDir, name))
    .filter((candidate) => fs.statSync(candidate).isDirectory())
    .sort(compareByDirectoryNameAsc);
};
