import * as fs from 'fs';
import * as path from 'path';
import { isImageFile } from './image-filter';

export type ImageCopyGroup = {
  label: string;
  outputDirName: string;
  outputPrefix: string;
  match: (filename: string) => boolean;
};

export const sortByNumeric = (a: string, b: string): number =>
  a.localeCompare(b, undefined, { numeric: true });

type CopyImageGroupParams = {
  files: string[];
  srcDir: string;
  outDir: string;
  group: ImageCopyGroup;
};

export const copyImageGroup = ({
  files,
  srcDir,
  outDir,
  group,
}: CopyImageGroupParams): number => {
  const groupDir = path.join(outDir, group.outputDirName);
  fs.mkdirSync(groupDir, { recursive: true });

  const matchedFiles = files
    .filter((file) => group.match(file) && isImageFile(file))
    .sort(sortByNumeric);

  matchedFiles.forEach((file, index) => {
    const ext = path.extname(file);
    const outputName = `${group.outputPrefix}_${index + 1}${ext}`;
    fs.copyFileSync(path.join(srcDir, file), path.join(groupDir, outputName));
  });

  return matchedFiles.length;
};
