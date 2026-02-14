import * as path from 'path';
import { BLOG_NAME_TO_NAVER_ID } from './lib/blog-account-map';
import { listSubdirectories } from './lib/local-fs';
import { uploadProductFolder } from './lib/upload-folder';

interface BlogTarget {
  folderName: string;
  blogId: string;
}

const rawArgs = process.argv.slice(2);
const args = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs;

const outputRootDir = args[0] || '';
const flags = new Set(args.slice(1));

const verbose = flags.has('--verbose');
const dryRun = flags.has('--dry-run');

const normalizeKey = (value: string): string => value.normalize('NFC').trim();
const isLikelyBlogId = (value: string): boolean => /^[a-z0-9_]+$/i.test(value);

const resolveBlogId = (folderName: string): string => {
  const key = normalizeKey(folderName);
  const mapped = BLOG_NAME_TO_NAVER_ID[key];
  if (mapped) return mapped;
  if (isLikelyBlogId(key)) return key;
  return '';
};

const loadBlogTargets = (rootDir: string): { targets: BlogTarget[]; unmapped: string[] } => {
  const blogFolders = listSubdirectories(rootDir);
  const targets: BlogTarget[] = [];
  const unmapped: string[] = [];

  for (const folderName of blogFolders) {
    const blogId = resolveBlogId(folderName);
    if (!blogId) {
      unmapped.push(folderName);
      continue;
    }
    targets.push({ folderName, blogId });
  }

  targets.sort((a, b) => a.blogId.localeCompare(b.blogId, undefined, { numeric: true }));
  return { targets, unmapped };
};

const main = async (): Promise<void> => {
  if (!outputRootDir) {
    console.log(
      'Usage: pnpm -s scripts:build && node dist-scripts/upload-output-root.js <outputRootDir> [--dry-run] [--verbose]',
    );
    process.exit(1);
  }

  const rootDir = path.resolve(outputRootDir);
  const { targets, unmapped } = loadBlogTargets(rootDir);

  if (unmapped.length > 0) {
    console.log('unmapped blog folders found:');
    for (const name of unmapped) console.log(`- ${name}`);
    console.log('\nAdd mappings in scripts/lib/blog-account-map.ts');
    process.exit(1);
  }

  console.log(`[Root] ${rootDir}`);
  console.log(`[Blogs] ${targets.length}개`);
  for (const t of targets) console.log(`- ${t.folderName} -> ${t.blogId}`);

  if (dryRun) {
    console.log('\nDRY RUN: upload skipped');
    return;
  }

  let grandTotal = 0;

  for (const { folderName, blogId } of targets) {
    const blogDir = path.join(rootDir, folderName);
    const keywords = listSubdirectories(blogDir).filter((k) => !k.startsWith('_used_'));
    console.log(`\n[Blog] ${folderName} -> ${blogId} (${keywords.length}개 키워드)`);

    let blogTotal = 0;
    for (const keyword of keywords) {
      const count = await uploadProductFolder({
        localBase: path.join(blogDir, keyword),
        s3Base: `product-images/${blogId}/${keyword}`,
        verbose,
      });
      blogTotal += count;
      console.log(`  [Keyword] ${keyword}: ${count}장`);
    }

    grandTotal += blogTotal;
    console.log(`[Blog] ${blogId}: ${blogTotal}장 완료`);
  }

  console.log(`\n[Done] 총 ${grandTotal}장 업로드 완료`);
};

const handleError = (err: unknown): void => {
  console.error(err);
  process.exit(1);
};

main().catch(handleError);

