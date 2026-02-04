import * as fs from 'fs';
import * as path from 'path';
import { isImageFile } from './image-filter';

export const listSubdirectories = (dir: string): string[] =>
  fs.readdirSync(dir)
    .filter((f) => fs.statSync(path.join(dir, f)).isDirectory())
    .sort();

export const listFiles = (dir: string): string[] =>
  fs.readdirSync(dir)
    .filter((f) => !fs.statSync(path.join(dir, f)).isDirectory());

export const listImageFiles = (dir: string): string[] =>
  fs.readdirSync(dir).filter((f) => isImageFile(f));
