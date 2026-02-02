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
