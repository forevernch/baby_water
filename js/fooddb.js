import { stripBomIfNeeded, normalizeFoodName, toNumberMaybe } from "./utils.js";

export const FOOD_DB_FILE = "/baby_water/food_db.json";

/**
 * 공용 Food DB 로더
 * - 음식수동 / 음식AI 탭에서 동일 인덱스를 공유
 * - 개선: 후보 리스트(search) 지원을 위해 원본 식품명(name)도 함께 저장
 */
export class FoodDb {
  constructor() {
    // Map(normalizedName -> { name: string, moisture: number })
    this.index = new Map();
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

        // ✅ 중복은 "최초 항목 우선" (원본 로직 유지)
        //    단, 이제는 원본 name도 같이 저장
        if (!idx.has(key)) {
          idx.set(key, { name, moisture });
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
   * 검색어(query)를 포함하는 후보 리스트를 반환합니다.
   * - UI에서 "귀리" 입력 시 여러 후보를 보여주고 선택하게 하는 용도
   * @param {string} query
   * @param {number} limit
   * @returns {{name:string, moisture:number, key:string}[]}
   */
  search(query, limit = 20) {
    if (!this.index) return [];
    const q = normalizeFoodName(query);
    if (!q) return [];
    if (!this.loaded) return [];

    const results = [];
    for (const [k, obj] of this.index.entries()) {
      if (k.includes(q) || q.includes(k)) {
        results.push({ name: obj.name, moisture: obj.moisture, key: k });
      }
    }

    // 가까운 항목을 위로: 길이 차이가 적을수록 상단
    results.sort(
      (a, b) => Math.abs(a.key.length - q.length) - Math.abs(b.key.length - q.length)
    );

    return results.slice(0, limit);
  }

  /**
   * 기존 API 호환용 (원래처럼 1개만 고르는 함수)
   * @param {string} name
   * @returns {{name?:string, moisture:number, matched:"exact"|"partial"}|null}
   */
  lookup(name) {
    if (!this.index) return null;

    const q = normalizeFoodName(name);
    if (!q) return null;

    // 1) 완전 일치
    if (this.index.has(q)) {
      const obj = this.index.get(q);
      return { name: obj.name, moisture: obj.moisture, matched: "exact" };
    }

    // 2) 부분 일치 (가장 길이 차이가 적은 항목 1개 선택)
    let best = null;
    for (const [k, obj] of this.index.entries()) {
      if (k.includes(q) || q.includes(k)) {
        const score = Math.abs(k.length - q.length);
        if (!best || score < best.score) {
          best = { name: obj.name, moisture: obj.moisture, score, matched: "partial" };
        }
      }
    }

    return best;
  }
}
