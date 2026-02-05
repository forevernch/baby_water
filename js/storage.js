export const STORAGE_KEY = "hydration_html_records_v1_stable";

/** @returns {any[]} */
export function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** @param {any[]} next */
export function saveRecords(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 저장 실패(용량/권한 등) 시에도 앱은 죽지 않게 무시
  }
}

/** @returns {string} YYYY-MM-DD (로컬 기준) */
export function toLocalDateKey(ts = Date.now()) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 공통 레코드 추가 */
export function addRecord(record) {
  const records = loadRecords();
  records.push(record);
  saveRecords(records);
}

/** 공통 레코드 삭제 */
export function removeRecordById(id) {
  const records = loadRecords().filter(r => r.id !== id);
  saveRecords(records);
}

/** 타입별 조회 */
export function getRecordsByType(type) {
  return loadRecords().filter(r => r.type === type);
}

/** 오늘(type 옵션) */
export function getTodayRecords(type = null) {
  const todayKey = toLocalDateKey(Date.now());
  return loadRecords().filter(r => {
    const dayKey = toLocalDateKey(r.ts ?? r.time ?? Date.now());
    const typeOk = type ? r.type === type : true;
    return typeOk && dayKey === todayKey;
  });
}