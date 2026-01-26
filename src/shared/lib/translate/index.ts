/**
 * Google Translate API를 사용한 키워드 번역
 */

const GOOGLE_TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';

interface TranslateResponse {
  data: {
    translations: Array<{
      translatedText: string;
      detectedSourceLanguage?: string;
    }>;
  };
}

/**
 * 한국어 키워드를 영어로 번역
 */
export const translateToEnglish = async (text: string): Promise<string> => {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

  if (!apiKey) {
    console.log('⚠️ GOOGLE_TRANSLATE_API_KEY 없음, 원본 키워드 사용');
    return text;
  }

  try {
    const response = await fetch(`${GOOGLE_TRANSLATE_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: 'ko',
        target: 'en',
        format: 'text',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ 번역 API 오류:', error);
      return text;
    }

    const data: TranslateResponse = await response.json();
    const translated = data.data.translations[0]?.translatedText || text;

    console.log(`🌐 번역: "${text}" → "${translated}"`);
    return translated;
  } catch (error) {
    console.error('❌ 번역 실패:', error);
    return text;
  }
};

/**
 * 번역 API 키가 설정되어 있는지 확인
 */
export const isTranslateConfigured = (): boolean => {
  return !!process.env.GOOGLE_TRANSLATE_API_KEY;
};
