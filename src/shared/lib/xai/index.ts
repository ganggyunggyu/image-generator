/**
 * xAI Grok API를 사용한 키워드 번역
 */

const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';
const MODEL = 'grok-4-1-fast-reasoning-latest';

interface XAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * xAI Grok을 사용해 한국어를 영어 검색 키워드로 번역
 */
export const translateWithGrok = async (text: string): Promise<string> => {
  const apiKey = process.env.GROK_API_KEY;

  if (!apiKey) {
    console.log('⚠️ GROK_API_KEY 없음, 원본 키워드 사용');
    return text;
  }

  try {
    const response = await fetch(XAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are a translator. Translate Korean to English search keywords. Output ONLY the English keyword, nothing else. Keep medical/technical terms accurate.',
          },
          {
            role: 'user',
            content: text,
          },
        ],
        max_tokens: 50,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ xAI API 오류:', error);
      return text;
    }

    const data: XAIResponse = await response.json();
    const translated = data.choices[0]?.message?.content?.trim() || text;

    console.log(`🤖 Grok 번역: "${text}" → "${translated}"`);
    return translated;
  } catch (error) {
    console.error('❌ xAI 번역 실패:', error);
    return text;
  }
};

/**
 * xAI API 키가 설정되어 있는지 확인
 */
export const isGrokConfigured = (): boolean => {
  return !!process.env.GROK_API_KEY;
};
