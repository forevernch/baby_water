import { uid } from "./utils.js";
import { createRecordRow } from "./ui.js";
import { dateKeyLocal } from "./utils.js";

function toNumber(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

/**
 * 음식AI 탭
 * - UI/동작 패턴은 음식수동과 동일하게 유지
 * - 차이: kind="foodAI" 로 저장
 * - DB: FoodDb(음식수동과 동일 인스턴스) 공유
 */
export function initFoodAiTab(opts) {
  const {
    nameEl,
    gramEl,
    btnMinus,
    btnPlus,
    candidatesEl,
    statusEl,
    btnAdd,
    listEl,
    modal,
    foodDb,
  } = opts;

  let handlers = { addRecord: null, deleteRecordById: null };
  let selected = null; // { name, waterG } 형태(검색 결과 항목)

  function setHandlers(h) {
    handlers = h;
  }

  function syncDbStatus() {
    if (!statusEl) return;
    if (foodDb?.isLoaded()) statusEl.textContent = "DB 로딩 상태: 완료";
    else statusEl.textContent = "DB 로딩 상태: 실패/미완료";
  }

  function clearCandidates() {
    if (!candidatesEl) return;
    candidatesEl.innerHTML = "";
  }

  function renderCandidates(items) {
    clearCandidates();
    if (!candidatesEl) return;

    if (!items || items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "row muted";
      empty.textContent = "검색 결과가 없습니다.";
      candidatesEl.appendChild(empty);
      return;
    }

    items.slice(0, 20).forEach((it) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "row clickable";
      row.textContent = `${it.name} (수분 ${it.waterG}g/100g)`;
      row.addEventListener("click", () => {
        selected = it;
        nameEl.value = it.name; // 선택 시 입력칸을 DB명으로 정렬
        // 선택 강조
        [...candidatesEl.querySelectorAll(".row")].forEach((r) => r.classList.remove("selected"));
        row.classList.add("selected");
      });
      candidatesEl.appendChild(row);
    });
  }

  function search() {
    const q = (nameEl.value || "").trim();
    if (!q) {
      clearCandidates();
      selected = null;
      return;
    }
    if (!foodDb?.isLoaded()) {
      clearCandidates();
      selected = null;
      return;
    }

    // FoodDb의 검색 결과 형식에 맞춰 사용
    const items = foodDb.search(q);
    // items: [{ name, waterG }, ...]
    renderCandidates(items);
  }

  function calcMl(gram, waterGPer100) {
    // waterGPer100: 100g당 수분(g)
    // 섭취량 g * (수분/100) = 수분 g ≈ ml
    return Math.round(gram * (toNumber(waterGPer100, 0) / 100));
  }

  function makeRecord() {
    const gram = toNumber(gramEl.value, 0);
    if (!Number.isFinite(gram) || gram <= 0) return null;

    const inputName = (nameEl.value || "").trim();
    if (!inputName) return null;

    // 선택된 DB 항목이 있으면 그 값을 사용
    const use = selected && selected.name ? selected : null;

    const name = use ? use.name : inputName;
    const hasData = !!use;
    const waterG = use ? toNumber(use.waterG, 0) : 0;
    const ml = hasData ? calcMl(gram, waterG) : 0;

    const now = new Date();
    return {
      id: uid(),
      kind: "foodAI",
      name,
      gram,
      ml,
      hasData,
      ts: now.getTime(),
      dateKey: dateKeyLocal(now),
    };
  }

  function onAdd() {
    if (!handlers.addRecord) return;

    const rec = makeRecord();
    if (!rec) return;

    handlers.addRecord(rec);

    // 입력 초기화
    gramEl.value = "0";
    // nameEl은 유지(연속 기록 편의)
    selected = null;
    clearCandidates();
  }

  function onDeleteClick(id) {
    if (!handlers.deleteRecordById) return;

    modal.open({
      onConfirm: () => {
        handlers.deleteRecordById(id);
        modal.close();
      },
      onCancel: () => {
        modal.close();
      },
    });
  }

  function render(records) {
    if (!listEl) return;
    listEl.innerHTML = "";

    if (!records || records.length === 0) {
      const empty = document.createElement("div");
      empty.className = "row muted";
      empty.textContent = "오늘 기록이 없습니다.";
      listEl.appendChild(empty);
      return;
    }

    records.forEach((r) => {
      const row = createRecordRow({
        title: r.name || "-",
        subtitle: r.hasData === false ? "데이터없음 (0ml 처리)" : `${r.gram}g`,
        rightText: `${r.ml || 0} ml`,
        onDelete: () => onDeleteClick(r.id),
      });
      listEl.appendChild(row);
    });
  }

  function sumMl(records) {
    if (!records) return 0;
    return records.reduce((acc, r) => acc + (toNumber(r.ml, 0) || 0), 0);
  }

  // 이벤트 연결
  nameEl?.addEventListener("input", () => {
    selected = null;
    search();
  });

  btnMinus?.addEventListener("click", () => {
    gramEl.value = String(Math.max(0, toNumber(gramEl.value, 0) - 5));
  });

  btnPlus?.addEventListener("click", () => {
    gramEl.value = String(toNumber(gramEl.value, 0) + 5);
  });

  btnAdd?.addEventListener("click", onAdd);

  // 초기 상태
  syncDbStatus();

  return {
    setHandlers,
    render,
    sumMl,
    syncDbStatus,
  };
}
