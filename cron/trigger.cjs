#!/usr/bin/env node
/**
 * Router Trigger Helper — 로컬 라우터에 Claude 프롬프트 전송
 */
const http = require('http');

function triggerClaude(chatId, prompt, notify = '') {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      chat_id: String(chatId),
      prompt,
      ...(notify ? { notify } : {}),
    });
    const req = http.request(
      { hostname: '127.0.0.1', port: 7867, path: '/trigger', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        let d = ''; res.on('data', c => d += c);
        res.on('end', () => { try { resolve(JSON.parse(d).ok === true); } catch { resolve(false); } });
      }
    );
    req.on('error', (e) => { process.stderr.write(`[trigger] 라우터 연결 실패: ${e.message}\n`); resolve(false); });
    req.write(body); req.end();
  });
}

module.exports = { triggerClaude };
