export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function formatTime12h(date) {
  const h24 = date.getHours();
  const m = date.getMinutes();
  const ampm = h24 >= 12 ? "pm" : "am";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${ampm} ${pad2(h12)}:${pad2(m)}`;
}

export function dateKeyLocal(date) {
  const y = date.getFullYear();
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  return `${y}-${mm}-${dd}`;
}

export function toNumberMaybe(v) {
  if (v == null) return null;
  const s = String(v).split(",").join("").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function stripBomIfNeeded(text) {
  if (!text) return "";
  return text.charCodeAt(0) === 65279 ? text.slice(1) : text;
}

/**
 * 음식명 정규화: 공백/특수문자 제거 + 소문자화
 * - 한글/영문/숫자만 남김
 */
export function normalizeFoodName(s) {
  const raw = (s || "").toString().trim().toLowerCase();
  let out = "";

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    // 공백류 제거
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") continue;

    const code = ch.charCodeAt(0);
    const isNum = code >= 48 && code <= 57; // 0-9
    const isAZ = code >= 97 && code <= 122; // a-z
    const isHangul = code >= 44032 && code <= 55203; // 가-힣

    if (isNum || isAZ || isHangul) out += ch;
  }

  return out;
}

/**
 * 추정 수분(ml)
 * @param {number} weightG  음식 중량(g)
 * @param {number} moisturePer100  수분(g/100g)
 */
export function computeEstimatedMl(weightG, moisturePer100) {
  const w = Math.max(0, Number(weightG) || 0);
  const m = Number(moisturePer100);
  if (!Number.isFinite(m)) return 0;
  return Math.round((w * m) / 100);
}
