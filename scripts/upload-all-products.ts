import * as path from 'path';
import * as fs from 'fs';
import { listSubdirectories } from './lib/local-fs';
import { uploadProductFolder } from './lib/upload-folder';
import { resolveNaverId } from './lib/blog-account-map';
import { SUB_FOLDERS } from './lib/constants';

const rawArgs = process.argv.slice(2);
const args = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs;

const flags = new Set<string>();
const positionals: string[] = [];
for (const arg of args) {
  if (arg.startsWith('--')) flags.add(arg);
  else positionals.push(arg);
}

const outputDir = positionals[0] || '';
const blogIdArg = positionals[1] || '';

const resolveBlogId = (folderNameOrId: string): string => resolveNaverId(folderNameOrId);

const isBlogOutputFolder = (dirPath: string): boolean => {
  try {
    const children = listSubdirectories(dirPath);
    if (children.length === 0) return false;

    const firstChildDir = path.join(dirPath, children[0]!);
    const entries = fs.readdirSync(firstChildDir);
    if (entries.includes('metadata.json')) return true;

    for (const sub of SUB_FOLDERS) {
      const p = path.join(firstChildDir, sub);
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) return true;
    }

    return false;
  } catch {
    return false;
  }
};

const uploadSingleBlogFolder = async ({
  blogDir,
  blogId,
}: {
  blogDir: string;
  blogId: string;
}): Promise<number> => {
  const keywords = listSubdirectories(blogDir).filter((k) => !k.startsWith('_used_'));
  console.log(`S3 경로: product-images/${blogId}/`);
  console.log(`총 ${keywords.length}개 키워드 업로드\n`);

  if (flags.has('--dry-run')) {
    for (const keyword of keywords) console.log(`[Keyword] ${keyword}`);
    return 0;
  }

  let total = 0;
  for (const keyword of keywords) {
    console.log(`[Keyword] ${keyword}`);
    const count = await uploadProductFolder({
      localBase: path.join(blogDir, keyword),
      s3Base: `product-images/${blogId}/${keyword}`,
      verbose: flags.has('--verbose'),
    });
    total += count;
    console.log(`  ${count}장 완료\n`);
  }

  return total;
};

const uploadOutputRoot = async (rootDir: string): Promise<number> => {
  const blogFolders = listSubdirectories(rootDir);

  const targets = blogFolders
    .map((folderName) => ({ folderName, blogId: resolveBlogId(folderName) }))
    .filter((t) => Boolean(t.blogId));

  const unmapped = blogFolders.filter((folderName) => !resolveBlogId(folderName));
  if (unmapped.length > 0) {
    console.log('unmapped blog folders found:');
    for (const name of unmapped) console.log(`- ${name}`);
    console.log('scripts/lib/blog-account-map.ts 에 매핑 추가 후 재시도 필요');
    process.exit(1);
  }

  targets.sort((a, b) => a.blogId.localeCompare(b.blogId, undefined, { numeric: true }));

  console.log(`[Root] ${rootDir}`);
  console.log(`[Blogs] ${targets.length}개`);
  for (const t of targets) console.log(`- ${t.folderName} -> ${t.blogId}`);

  if (flags.has('--dry-run')) return 0;

  let grandTotal = 0;

  for (const { folderName, blogId } of targets) {
    const blogDir = path.join(rootDir, folderName);
    const total = await uploadSingleBlogFolder({ blogDir, blogId });
    grandTotal += total;
    console.log(`[Blog] ${blogId}: ${total}장 완료\n`);
  }

  return grandTotal;
};

const main = async (): Promise<void> => {
  if (!outputDir) {
    console.log(
      'Usage: pnpm -s scripts:build && node dist-scripts/upload-all-products.js <outputDir> [blogId] [--dry-run] [--verbose]',
    );
    process.exit(1);
  }

  const resolvedOutputDir = path.resolve(outputDir);
  const leaf = path.basename(resolvedOutputDir);

  if (blogIdArg) {
    const total = await uploadSingleBlogFolder({ blogDir: resolvedOutputDir, blogId: blogIdArg });
    console.log(`총 ${total}장 업로드 완료`);
    return;
  }

  const inferredBlogId = resolveBlogId(leaf);
  if (inferredBlogId) {
    const total = await uploadSingleBlogFolder({ blogDir: resolvedOutputDir, blogId: inferredBlogId });
    console.log(`총 ${total}장 업로드 완료`);
    return;
  }

  if (isBlogOutputFolder(resolvedOutputDir)) {
    console.log('blogId required (arg missing and cannot infer from folder name)');
    console.log(`outputDir: ${resolvedOutputDir}`);
    console.log(`folderName: ${leaf}`);
    console.log('scripts/lib/blog-account-map.ts 매핑 추가하거나 blogId를 직접 넘겨야 함');
    process.exit(1);
  }

  const total = await uploadOutputRoot(resolvedOutputDir);
  console.log(`총 ${total}장 업로드 완료`);
};

const handleError = (err: unknown): void => {
  console.error(err);
  process.exit(1);
};

main().catch(handleError);
