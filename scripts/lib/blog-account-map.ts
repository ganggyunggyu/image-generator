const BLOG_ACCOUNT_ENTRIES: Array<[string, string]> = [
  ['패밀리넛', 'ecjroe6558'],
  ['빨간모자앤 - 준3', 'dhtksk1p'],
  ['정의 - 준4', 'eqsdxv2863'],
  ['찐찐찐찐찐이야', 'ags2oigb'],
  ['제아 - 영구정지', 'biggoose488'],
  ['소원', 'regular14631'],
  ['똑똑한 건희씨', 'orangeswan630'],
  ['새로운 시작', 'dyust'],
  ['새로운 시작 - 교체', 'dyust'],
  ['에스앤비안과 1', 'nes1p2kx'],
  ['에스앤비안과 2', 'mh8j62wm'],
  ['에스앤비안과 정보', 'h9ag469z'],
  ['에스앤비안과, 28년 경력', 'mzuul'],
  ['에스앤비안과, 29년 경력', 'dq1h3bjy'],
  ['에스앤비안과의원', 'hagyga'],
  ['에스앤비안과의원 - 교체', 'hagyga'],
  ['모험', 'geenl'],
  ['모험 - 교체', 'geenl'],
  ['탐험기', 'ghhoy'],
  ['탐험기 - 교체', 'ghhoy'],
  ['angrykoala270', 'angrykoala270'],
  ['앵그리맨', 'angrykoala270'],
  ['tinyfish183', 'tinyfish183'],
  ['티니피쉬', 'tinyfish183'],
  ['고래낚시', 'bigfish773'],
  ['똑똑한건희씨', 'orangeswan630'],
  ['겨울의 눈꽃', 'iealpx8p'],
  ['강아지강하지', 'k7d9x2m4'],
  ['라우드', 'loand3324'],
  ['고구마스틱', 'fail5644'],
  ['룰루랄라', 'compare14310'],
  ['실눈캐', 'ghostrush7'],
  ['웅이', 'b6x2k9w3'],
  ['고양이밥', 'n7c3w8z2'],
  ['리스팩식스팩', 'respawnking9'],
  ['햄부기', 'ahfflwl123'],
  ['바삭바삭해', 'ahffkdlek12'],
  ['쉽고간단하게', 'ahsxkfldk12'],
  ['꼬리별', '8i2vlbym'],
  ['하준리뷰', 'heavyzebra240'],
  ['달달한하루', 'njmzdksm'],
  ['봄바람', 'e6yb5u4k'],
  ['오늘도 즐겁게', 'suc4dce7'],
  ['스탠드', 'xzjmfn3f'],
  ['세월', '8ua1womn'],
  ['오차즈케', '0ehz3cb2'],
  ['듣는방법', '4giccokx'],
  ['비밀의 정원', 'umhu0m83'],
  ['힘차게', 'olgdmp9921'],
  ['달리자', 'uqgidh2690'],
  ['뽀또', 'eytkgy5500'],
  ['미식가', 'yenalk'],
  ['미식가 2', 'yenalk'],
  ['기쁨의꽃', 'br5rbg'],
  ['뷰티풀', 'beautifulelephant274'],
  ['얼음땡 - 준4', 'cookie4931'],
  ['투디치과 스킨블', 'wound12567'],
  ['토토리토', 'precede1451'],
  ['글로벌', 'gmezz'],
  ['글로벌발자국', 'gmezz'],
  ['운명의 마법사', 'dyulp'],
  ['운명의마법사', 'dyulp'],
  ['맛집 탐험대', 'lesyt'],
  ['맛집탐험대', 'lesyt'],
  ['알리바바1', 'weed3122'],
  ['알리바바2', 'mad1651'],
  ['알리바바3', 'chemical12568'],
  ['알리바바4', 'copy11525'],
  ['알리바바5', 'individual14144'],
  ['1', 'weed3122'],
  ['2', 'mad1651'],
  ['3', 'chemical12568'],
  ['4', 'copy11525'],
  ['5', 'individual14144'],
  ['먹방 여행기', 'aryunt'],
  ['먹방여행기', 'aryunt'],
  ['새로운 여행지', 'zhuwl'],
  ['은길', 'enugii'],
  ['떠나는날의 이야기', 'nnhha'],
  ['이야기', 'nnhha'],
  ['투데이', 'aqahdp5252'],
  ['해리포터', 'selzze'],
  ['불꽃', 'bjwuo'],
  ['새로운 발견', 'ebbte'],
  ['다이어리', 'ganir'],
  ['꿈꾸는 나날', 'shcint'],
  ['숙면구출', 'momenft5251'],
  ['고뇌물렁', 'column13365'],
];

const normalizeKey = (value: string): string =>
  value
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();

export const BLOG_NAME_TO_NAVER_ID: Record<string, string> = Object.fromEntries(
  BLOG_ACCOUNT_ENTRIES.map(([blogName, blogId]) => [normalizeKey(blogName), blogId])
);

const isLikelyNaverId = (value: string): boolean => /^[a-z0-9_]+$/i.test(value);

export const resolveNaverId = (blogFolderNameOrId: string): string => {
  const key = normalizeKey(blogFolderNameOrId);
  const mapped = BLOG_NAME_TO_NAVER_ID[key];

  if (mapped) return mapped;
  if (isLikelyNaverId(key)) return key;

  return '';
};
