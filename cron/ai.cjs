/**
 * AI 헬퍼 — Gemini 2.5 Flash
 * OpenRouter/OpenClaw 게이트웨이 대체 (Google AI API 직접 호출)
 * 이머전시용 OpenRouter 키는 보존만, 평상시 사용 안 함
 */
const https = require('https');

const GOOGLE_AI_KEY = 'AIzaSyAhF8MA0mxt6PfmJMwMGABUNyxXoBnBYO0';
const MODEL = 'gemini-2.5-flash';

/**
 * @param {string} prompt
 * @param {object} options
 * @returns {Promise<string>} AI 응답 텍스트
 */
function askAI(prompt, options = {}) {
  const model = options.model || MODEL;
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options.temperature ?? 0.4,
      maxOutputTokens: options.maxTokens || 2000,
      thinkingConfig: { thinkingBudget: options.thinkingBudget ?? 0 },
    },
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:generateContent?key=${GOOGLE_AI_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const d = JSON.parse(data);
          if (d.error) return reject(new Error(d.error.message));
          resolve(d.candidates[0].content.parts[0].text);
        } catch (e) {
          reject(new Error(`Gemini 파싱 오류: ${e.message} / raw: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = { askAI };
