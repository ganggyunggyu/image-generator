const PARTIAL_MATCH_PREFIX_LENGTH = 5;

type NormalizedFolder = {
  folder: string;
  normalized: string;
};

export const normalizeFolderName = (value: string): string =>
  value.normalize('NFC').replace(/\s+/g, '').toLowerCase().trim();

const createNormalizedFolders = (folders: string[]): NormalizedFolder[] =>
  folders.map((folder) => ({
    folder,
    normalized: normalizeFolderName(folder),
  }));

const hasPartialPrefixMatch = (keyword: string, folder: string): boolean => {
  const matchLength = Math.min(folder.length, keyword.length, PARTIAL_MATCH_PREFIX_LENGTH);
  return folder.slice(0, matchLength) === keyword.slice(0, matchLength);
};

export const findBestMatchingFolder = (keyword: string, folders: string[]): string | null => {
  const normalizedKeyword = normalizeFolderName(keyword);

  if (!normalizedKeyword) {
    return null;
  }

  const normalizedFolders = createNormalizedFolders(folders);

  const exactMatch = normalizedFolders.find(({ normalized }) => normalized === normalizedKeyword);
  if (exactMatch) {
    return exactMatch.folder;
  }

  const containsMatch = normalizedFolders.find(({ normalized }) => normalized.includes(normalizedKeyword));
  if (containsMatch) {
    return containsMatch.folder;
  }

  const reverseMatch = normalizedFolders.find(({ normalized }) => normalizedKeyword.includes(normalized));
  if (reverseMatch) {
    return reverseMatch.folder;
  }

  const partialMatch = normalizedFolders.find(({ normalized }) =>
    hasPartialPrefixMatch(normalizedKeyword, normalized)
  );
  if (partialMatch) {
    return partialMatch.folder;
  }

  return null;
};
