'use strict';
function runRegex({ pattern, text, flags }) {
  if (typeof pattern !== 'string' || pattern.length > 2000 || typeof text !== 'string' || text.length > 20000) throw new Error('패턴은 2,000자, 검사할 글은 20,000자 이내로 입력하세요.');
  if (typeof flags !== 'string' || !/^[gimsu]*$/.test(flags) || new Set(flags).size !== flags.length) throw new Error('옵션은 g·i·m·s·u를 중복 없이 입력하세요.');
  let regex; try { regex = new RegExp(pattern, flags); } catch { throw new Error('정규식 문법이 올바르지 않습니다. 괄호·대괄호·역슬래시를 확인하세요.'); }
  const matches = []; let truncated = false;
  while (true) {
    const match = regex.exec(text); if (!match) break;
    if (matches.length === 200) { truncated = true; break; }
    matches.push({ value: match[0], index: match.index, groups: match.slice(1).map(value => value === undefined ? null : value), named: match.groups ? Object.fromEntries(Object.entries(match.groups).map(([key, value]) => [key, value === undefined ? null : value])) : null });
    if (!regex.global) break;
    if (match[0] === '') { const index = regex.lastIndex, first = text.charCodeAt(index), next = text.charCodeAt(index + 1); regex.lastIndex += regex.unicode && first >= 0xD800 && first <= 0xDBFF && next >= 0xDC00 && next <= 0xDFFF ? 2 : 1; }
  }
  return { matches, truncated };
}
if (typeof module !== 'undefined') module.exports = { runRegex };
if (typeof self !== 'undefined' && typeof document === 'undefined') self.onmessage = event => { try { self.postMessage({ result: runRegex(event.data) }); } catch (error) { self.postMessage({ error: error.message }); } };
