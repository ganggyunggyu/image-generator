import { fetchGoogleSheetRows } from '@/shared/lib/google-sheets/client';

const HANRYE_SPREADSHEET_ID = '1QhF2EqaWfYGNWOeUYuPyBfiQ0aigfWop4Q13_jtm6qY';
const HANRYE_BLOG_UTM_RANGE = "'블로그 UTM 변환기'!A1:I1200";
const HEADER_ROW_INDEX = 6;
const FIRST_DATA_ROW_INDEX = HEADER_ROW_INDEX + 1;
const EXAMPLE_LABEL = '예시';
const MEDIUM_COLUMN_INDEX = 4;
const DETAIL_COLUMN_INDEX = 5;
const CAMPAIGN_TAGGED_URL_COLUMN_INDEX = 7;

interface HanryeodamwonTaggedUrlParams {
  dateCode: string;
  blogName: string;
  keyword: string;
}

const normalizeValue = (value: string): string => {
  return value.normalize('NFC').replace(/\s+/g, '').toLowerCase().trim();
};

const isValidTaggedUrl = (value: string): boolean => {
  return /^https?:\/\//i.test(value);
};

const buildMediumKey = ({ dateCode, blogName }: Pick<HanryeodamwonTaggedUrlParams, 'dateCode' | 'blogName'>): string => {
  return normalizeValue(`${dateCode}${blogName}`);
};

export const findMatchingHanryeodamwonTaggedUrl = (
  { dateCode, blogName, keyword }: HanryeodamwonTaggedUrlParams,
  rows: string[][],
): string | null => {
  const normalizedMedium = buildMediumKey({ dateCode, blogName });
  const normalizedKeyword = normalizeValue(keyword);

  if (!normalizedMedium || !normalizedKeyword) {
    return null;
  }

  let matchedUrl: string | null = null;

  for (let index = FIRST_DATA_ROW_INDEX; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    const label = String(row[0] ?? '').trim();
    const medium = String(row[MEDIUM_COLUMN_INDEX] ?? '').trim();
    const detail = String(row[DETAIL_COLUMN_INDEX] ?? '').trim();
    const taggedUrl = String(row[CAMPAIGN_TAGGED_URL_COLUMN_INDEX] ?? '').trim();

    if (label === EXAMPLE_LABEL) {
      continue;
    }

    if (!medium || normalizeValue(medium) !== normalizedMedium) {
      continue;
    }

    if (!detail || normalizeValue(detail) !== normalizedKeyword) {
      continue;
    }

    if (!isValidTaggedUrl(taggedUrl)) {
      continue;
    }

    matchedUrl = taggedUrl;
  }

  return matchedUrl;
};

export const getHanryeodamwonTaggedUrl = async (
  params: HanryeodamwonTaggedUrlParams,
): Promise<string | null> => {
  const rows = await fetchGoogleSheetRows(HANRYE_SPREADSHEET_ID, HANRYE_BLOG_UTM_RANGE);
  return findMatchingHanryeodamwonTaggedUrl(params, rows);
};
