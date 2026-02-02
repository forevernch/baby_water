import { stripBomIfNeeded, normalizeFoodName, toNumberMaybe } from "./utils.js";

export const FOOD_DB_FILE = "../food_db.json";

/**
 * 공용 Food DB 로더
 * - 음식수동 / 음식AI 탭에서 동일 인덱스를 공유
 */
export class FoodDb {
  constructor() {
    this.index = new Map(); // Map(normalizedName -> moisturePer100)
    this.loaded = false;
    this.count = 0;
    this.error = null;
  }

  async load() {
    try {
      this.loaded = false;
      this.error = null;

      const res = await fetch(FOOD_DB_FILE, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);

      const text = stripBomIfNeeded(await res.text());
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error("JSON is not an array");

      const idx = new Map();
      let count = 0;

      for (const obj of arr) {
        const name = obj && obj["식품명"] ? String(obj["식품명"]).trim() : "";
        const moisture = toNumberMaybe(obj ? obj["수분(g)"] : null);
        if (!name || moisture == null) continue;

        const key = normalizeFoodName(name);
        if (!key) continue;

        // 중복은 최초 항목 우선 (현재 로직 유지)
        if (!idx.has(key)) {
          idx.set(key, moisture);
          count += 1;
        }
      }

      this.index = idx;
      this.loaded = true;
      this.count = count;
      return { ok: true, count };
    } catch (e) {
      this.index = new Map();
      this.loaded = false;
      this.count = 0;
      this.error = e;
      return { ok: false, error: e };
    }
  }

  /**
   * @param {string} name
   * @returns {{moisture:number, matched:"exact"|"partial"}|null}
   */
  lookup(name) {
    if (!this.index) return null;

    const q = normalizeFoodName(name);
    if (!q) return null;

    // 1) 완전 일치
    if (this.index.has(q)) {
      return { moisture: this.index.get(q), matched: "exact" };
    }

    // 2) 부분 일치 (가장 길이 차이가 적은 항목 1개 선택)
    let best = null;
    for (const [k, v] of this.index.entries()) {
      if (k.includes(q) || q.includes(k)) {
        const score = Math.abs(k.length - q.length);
        if (!best || score < best.score) {
          best = { moisture: v, score, matched: "partial" };
        }
      }
    }

    return best;
  }
}
