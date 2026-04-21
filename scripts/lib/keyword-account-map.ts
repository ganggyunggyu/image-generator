import * as fs from 'fs';
import * as path from 'path';

export interface KeywordAccountMapping {
  accountId: string;
  keywords: string[];
}

export const buildKeywordAccountMappingContent = (
  mappings: KeywordAccountMapping[],
): string => {
  const lines: string[] = [];

  for (const { accountId, keywords } of mappings) {
    lines.push(accountId);

    for (const keyword of keywords) {
      lines.push(keyword);
    }

    lines.push('');
  }

  return `${lines.join('\n')}\n`;
};

export const writeKeywordAccountMappingFile = ({
  outputDir,
  mappings,
  fileName = '키워드_계정매칭.txt',
}: {
  outputDir: string;
  mappings: KeywordAccountMapping[];
  fileName?: string;
}): string => {
  const filePath = path.join(outputDir, fileName);
  const content = buildKeywordAccountMappingContent(mappings);

  fs.writeFileSync(filePath, content);

  return filePath;
};
