import * as fs from 'fs';

export const resolveExistingDirectory = (candidates: string[]): string => {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
  }

  throw new Error(`No matching input directory found: ${candidates.join(', ')}`);
};
