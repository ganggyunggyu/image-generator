import * as fs from 'fs';
import * as path from 'path';
import { type Metadata, parsePetMetadata } from './metadata-parser';
import { listFiles, listSubdirectories } from './local-fs';
import { isImageFile } from './image-filter';

export interface PetOutputTargetContext {
  blogName: string;
}

export interface PetOutputTarget {
  label: string;
  outputDir: string;
  resolveBlogDirectoryName: (context: PetOutputTargetContext) => string;
  libraryDirName: string;
  libraryFilePrefix: string;
}

interface ProcessPetInputFoldersOptions {
  inputDir?: string;
  inputDirs?: string[];
  targets: PetOutputTarget[];
  skipExistingOutputs?: boolean;
}

interface ProcessedKeywordSummary {
  keyword: string;
  libraryCount: number;
  metadata: Metadata;
  writtenTargets: number;
  skippedTargets: number;
}

interface ProcessedBlogSummary {
  blogName: string;
  keywords: ProcessedKeywordSummary[];
}

export interface ProcessPetInputFoldersResult {
  grandTotal: number;
  blogs: ProcessedBlogSummary[];
}

const createEmptyMetadata = (): Metadata => ({ mapQueries: [], phone: '', url: '', lib_url: [] });

const includesLibraryToken = (file: string): boolean =>
  file.normalize('NFC').includes('라이브러리');

const listLibraryFiles = (srcDir: string): string[] =>
  listFiles(srcDir)
    .filter((file) => includesLibraryToken(file) && isImageFile(file))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const readMetadata = (srcDir: string): Metadata => {
  const txtPath = path.join(srcDir, '지도,번호,링크.txt');
  if (!fs.existsSync(txtPath)) return createEmptyMetadata();

  const content = fs.readFileSync(txtPath, 'utf-8');
  return parsePetMetadata(content);
};

const resolveInputDirs = (inputDir: string | undefined, inputDirs: string[] | undefined): string[] => {
  const resolvedInputDirs = inputDirs && inputDirs.length > 0 ? inputDirs : inputDir ? [inputDir] : [];

  if (resolvedInputDirs.length === 0) {
    throw new Error('No input directories provided');
  }

  return resolvedInputDirs;
};

const writeKeywordOutput = ({
  srcDir,
  target,
  blogName,
  keyword,
  libraryFiles,
  metadata,
}: {
  srcDir: string;
  target: PetOutputTarget;
  blogName: string;
  keyword: string;
  libraryFiles: string[];
  metadata: Metadata;
}): void => {
  const blogDirName = target.resolveBlogDirectoryName({ blogName }).trim();
  if (!blogDirName) {
    throw new Error(`[${target.label}] empty output blog directory for "${blogName}"`);
  }

  const outDir = path.join(target.outputDir, blogDirName, keyword);
  const libraryDir = path.join(outDir, target.libraryDirName);

  fs.mkdirSync(libraryDir, { recursive: true });

  libraryFiles.forEach((file, index) => {
    const ext = path.extname(file);
    const outputName = `${target.libraryFilePrefix}_${index + 1}${ext}`;
    fs.copyFileSync(path.join(srcDir, file), path.join(libraryDir, outputName));
  });

  fs.writeFileSync(path.join(outDir, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n');
};

const hasExistingKeywordOutput = ({
  target,
  blogName,
  keyword,
}: {
  target: PetOutputTarget;
  blogName: string;
  keyword: string;
}): boolean => {
  const blogDirName = target.resolveBlogDirectoryName({ blogName }).trim();
  if (!blogDirName) {
    throw new Error(`[${target.label}] empty output blog directory for "${blogName}"`);
  }

  const outDir = path.join(target.outputDir, blogDirName, keyword);
  const metadataPath = path.join(outDir, 'metadata.json');
  const libraryDir = path.join(outDir, target.libraryDirName);

  if (!fs.existsSync(outDir)) return false;
  if (!fs.existsSync(libraryDir) || !fs.statSync(libraryDir).isDirectory()) return false;

  const hasImageOutput = listFiles(libraryDir).some((file) => isImageFile(file));
  return fs.existsSync(metadataPath) && hasImageOutput;
};

export const processPetInputFolders = ({
  inputDir,
  inputDirs,
  targets,
  skipExistingOutputs = false,
}: ProcessPetInputFoldersOptions): ProcessPetInputFoldersResult => {
  const resolvedInputDirs = resolveInputDirs(inputDir, inputDirs);
  const blogs: ProcessedBlogSummary[] = [];
  const blogsByName = new Map<string, ProcessedBlogSummary>();
  let grandTotal = 0;

  for (const target of targets) {
    if (!skipExistingOutputs) {
      fs.rmSync(target.outputDir, { recursive: true, force: true });
    }
    fs.mkdirSync(target.outputDir, { recursive: true });
  }

  for (const sourceInputDir of resolvedInputDirs) {
    const blogNames = listSubdirectories(sourceInputDir);

    for (const blogName of blogNames) {
      const blogDir = path.join(sourceInputDir, blogName);
      const keywords = listSubdirectories(blogDir);
      let blogSummary = blogsByName.get(blogName);

      if (!blogSummary) {
        blogSummary = { blogName, keywords: [] };
        blogsByName.set(blogName, blogSummary);
        blogs.push(blogSummary);
      }

      for (const keyword of keywords) {
        const srcDir = path.join(blogDir, keyword);
        const libraryFiles = listLibraryFiles(srcDir);
        const metadata = readMetadata(srcDir);
        let writtenTargets = 0;
        let skippedTargets = 0;

        for (const target of targets) {
          if (skipExistingOutputs && hasExistingKeywordOutput({ target, blogName, keyword })) {
            skippedTargets += 1;
            continue;
          }

          writeKeywordOutput({ srcDir, target, blogName, keyword, libraryFiles, metadata });
          writtenTargets += 1;
        }

        const libraryCount = libraryFiles.length;
        grandTotal += libraryCount * writtenTargets;
        blogSummary.keywords.push({ keyword, libraryCount, metadata, writtenTargets, skippedTargets });
      }
    }
  }

  return { grandTotal, blogs };
};
