﻿import { computeEstimatedMl, dateKeyLocal, formatTime12h } from "./utils.js";
import { renderList } from "./ui.js";

export function initFoodAiTab(ctx) {
  const {
    foodDb,
    elFoodAiStatus,

    // ✅ 음식수동과 동일한 저장/렌더 구조
    elFoodAiListBody,
    elFoodAiTotal,
    getRecords,
    setRecords,
    saveRecords,
    renderAll,
    openDeleteModal,
    dateKeyLocal: dateKeyLocalFromCtx,
    formatTime12h: formatTime12hFromCtx,
  } = ctx;

  // app.js에서 주입한 유틸이 있으면 그걸 우선 사용(테스트/일관성)
  const _dateKeyLocal = dateKeyLocalFromCtx || dateKeyLocal;
  const _formatTime12h = formatTime12hFromCtx || formatTime12h;

  // ===== DOM (기존) =====
  const btnTopCamera = document.getElementById("btnAiTopCamera");
  const btnTopGallery = document.getElementById("btnAiTopGallery");
  const btnSideCamera = document.getElementById("btnAiSideCamera");
  const btnSideGallery = document.getElementById("btnAiSideGallery");

  const fileTopCamera = document.getElementById("aiFileTopCamera");
  const fileTopGallery = document.getElementById("aiFileTopGallery");
  const fileSideCamera = document.getElementById("aiFileSideCamera");
  const fileSideGallery = document.getElementById("aiFileSideGallery");

  const btnAnalyze = document.getElementById("btnAiAnalyze");

  const elFoodSelect = document.getElementById("aiFoodSelect");
  const elMinus = document.getElementById("aiBtnMinus");
  const elPlus = document.getElementById("aiBtnPlus");
  const elWeightBox = document.getElementById("aiWeightBox");

  const elMoistureBox = document.getElementById("aiMoistureBox");
  const elEstimatedBox = document.getElementById("aiEstimatedBox");
  const elTotalBox = document.getElementById("aiTotalBox"); // (없어도 무해)

  const btnAdd = document.getElementById("btnAiAdd");
  const elHint = document.getElementById("aiHint");

  // ===== DOM (오버레이/레이어) =====
  const topImg = document.getElementById("aiTopImg");
  const sideImg = document.getElementById("aiSideImg");

  const topLayer = document.getElementById("aiTopLayer");
  const sideLayer = document.getElementById("aiSideLayer");

  const topOverlay = document.getElementById("aiTopOverlay");
  const sideOverlay = document.getElementById("aiSideOverlay");

  const btnTopReCamera = document.getElementById("btnAiTopReCamera");
  const btnTopReGallery = document.getElementById("btnAiTopReGallery");
  const btnSideReCamera = document.getElementById("btnAiSideReCamera");
  const btnSideReGallery = document.getElementById("btnAiSideReGallery");

  // ===== state =====
  let weightG = 100;
  let selected = null; // { name, moisture }
  let topFile = null;
  let sideFile = null;

  function setStatus(text) {
    if (elFoodAiStatus) elFoodAiStatus.textContent = text;
  }
  function setHint(text) {
    if (elHint) elHint.textContent = text;
  }

  // ------------------------------------------------------------
  // ✅ 핵심: 프레임을 innerHTML로 덮어쓰지 않는다
  //  - file 없으면: 기본(텍스트+버튼) 레이어 보여주고 오버레이 숨김
  //  - file 있으면: img 보여주고 기본 레이어 숨김 + 오버레이(재선택) 노출
  // ------------------------------------------------------------
  function renderPreview(which) {
    const isTop = which === "top";
    const file = isTop ? topFile : sideFile;

    const img = isTop ? topImg : sideImg;
    const baseLayer = isTop ? topLayer : sideLayer;
    const overlay = isTop ? topOverlay : sideOverlay;

    // DOM이 없으면 조용히 종료(페이지 구조 불일치 보호)
    if (!img || !baseLayer || !overlay) return;

    if (!file) {
      // 초기/삭제 상태
      img.style.display = "none";
      img.removeAttribute("src");
      baseLayer.style.display = "flex";
      overlay.style.display = "none";
      return;
    }

    // 파일이 들어온 상태
    img.src = URL.createObjectURL(file);
    img.style.display = "block";
    baseLayer.style.display = "none";
    overlay.style.display = "flex";
  }

   function setWeight(next) {
    const n = Number(next);
    const snapped = Number.isFinite(n) ? Math.round(n / 5) * 5 : 100;
    weightG = Math.max(0, snapped);

    if (elWeightBox) elWeightBox.value = String(weightG);

    if (elMinus) {
      if (weightG <= 0) elMinus.classList.add("disabled");
      else elMinus.classList.remove("disabled");
    }

    refreshEstimate();
  }

  function populateSelect(items) {
    if (!elFoodSelect) return;

    elFoodSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "AI 추정 음식명";
    elFoodSelect.appendChild(placeholder);

    items.forEach((it) => {
      const opt = document.createElement("option");
      opt.value = it.name;
      opt.textContent = it.name;
      opt.dataset.moisture = String(it.moisture);
      elFoodSelect.appendChild(opt);
    });
  }

  function clearPhotos() {
    topFile = null;
    sideFile = null;

    // 같은 파일을 다시 선택할 수 있도록 input value도 비워줌
    if (fileTopCamera) fileTopCamera.value = "";
    if (fileTopGallery) fileTopGallery.value = "";
    if (fileSideCamera) fileSideCamera.value = "";
    if (fileSideGallery) fileSideGallery.value = "";

    renderPreview("top");
    renderPreview("side");
  }

  function refreshEstimate() {
    const hasData = !!selected;
    const hasAnyPhoto = !!topFile || !!sideFile;

    if (elMoistureBox) elMoistureBox.textContent = hasData ? String(selected.moisture) : "데이터 없음";

    const estimated = hasData ? computeEstimatedMl(weightG, selected.moisture) : 0;
    if (elEstimatedBox) elEstimatedBox.textContent = String(estimated || 0);
    if (elTotalBox) elTotalBox.textContent = String(estimated || 0);

    if (btnAnalyze) btnAnalyze.disabled = !hasAnyPhoto;
    if (btnAdd) btnAdd.disabled = !(hasAnyPhoto && hasData);

    if (!hasAnyPhoto) setHint("윗면/옆면 사진 중 최소 1장을 넣어주세요. (2장이면 정확도↑)");
    else if (topFile && sideFile) setHint("사진 2장이 준비되었습니다. ‘분석’ 후 음식명을 선택하세요.");
    else setHint("사진 1장이 준비되었습니다. 가능하면 2장을 넣으면 더 좋습니다.");
  }

  function getSomeDbItems(limit = 20) {
    if (!foodDb?.loaded) return [];
    const out = [];
    for (const [, obj] of foodDb.index.entries()) {
      out.push({ name: obj.name, moisture: obj.moisture });
      if (out.length >= limit) break;
    }
    return out;
  }

  function mockAnalyze() {
    if (!topFile && !sideFile) {
      setHint("먼저 음식 사진(윗면/옆면)을 업로드/촬영해 주세요.");
      return;
    }

    if (!foodDb?.loaded) {
      setStatus("AI: Mock 연결 (DB 대기)");
      setHint("식품DB가 아직 로드되지 않았습니다. '음식 수동' 탭을 한번 열면 DB가 자동 로드됩니다.");
      return;
    }

    populateSelect(getSomeDbItems(20));
    setStatus("AI: Mock 연결 (후보 로드)");
    setHint("Mock 단계: DB 후보를 불러왔습니다. 음식명을 선택하면 수분 계산이 됩니다.");
  }

  // ------------------------------------------------------------
  // ✅ 파일 선택 처리: onPickTop / onPickSide
  // ------------------------------------------------------------
  function onPickTop(inputEl) {
    const file = inputEl?.files?.[0];
    if (!file) return;

    topFile = file;
    renderPreview("top");
    refreshEstimate();
  }

  function onPickSide(inputEl) {
    const file = inputEl?.files?.[0];
    if (!file) return;

    sideFile = file;
    renderPreview("side");
    refreshEstimate();
  }

  // ===== events: 기본 선택 버튼(프레임 중앙의 카메라/갤러리) =====
  if (btnTopCamera && fileTopCamera) btnTopCamera.addEventListener("click", () => fileTopCamera.click());
  if (btnTopGallery && fileTopGallery) btnTopGallery.addEventListener("click", () => fileTopGallery.click());
  if (btnSideCamera && fileSideCamera) btnSideCamera.addEventListener("click", () => fileSideCamera.click());
  if (btnSideGallery && fileSideGallery) btnSideGallery.addEventListener("click", () => fileSideGallery.click());

  // ===== events: 재선택 오버레이(이미지 위 우상단) =====
  if (btnTopReCamera && fileTopCamera) btnTopReCamera.addEventListener("click", () => fileTopCamera.click());
  if (btnTopReGallery && fileTopGallery) btnTopReGallery.addEventListener("click", () => fileTopGallery.click());
  if (btnSideReCamera && fileSideCamera) btnSideReCamera.addEventListener("click", () => fileSideCamera.click());
  if (btnSideReGallery && fileSideGallery) btnSideReGallery.addEventListener("click", () => fileSideGallery.click());

  // ===== events: file input change =====
  if (fileTopCamera) fileTopCamera.addEventListener("change", () => onPickTop(fileTopCamera));
  if (fileTopGallery) fileTopGallery.addEventListener("change", () => onPickTop(fileTopGallery));
  if (fileSideCamera) fileSideCamera.addEventListener("change", () => onPickSide(fileSideCamera));
  if (fileSideGallery) fileSideGallery.addEventListener("change", () => onPickSide(fileSideGallery));

  // ===== events: analyze =====
  if (btnAnalyze) btnAnalyze.addEventListener("click", mockAnalyze);

  // ===== events: select =====
  if (elFoodSelect) {
    elFoodSelect.addEventListener("change", () => {
      const opt = elFoodSelect.selectedOptions?.[0];
      const moisture = opt?.dataset ? Number(opt.dataset.moisture) : NaN;

      if (opt && opt.value && Number.isFinite(moisture)) selected = { name: opt.value, moisture };
      else selected = null;

      refreshEstimate();
    });
  }

  // ===== events: weight +/- =====
  if (elMinus) elMinus.addEventListener("click", () => { if (weightG > 0) setWeight(weightG - 5); });
  if (elPlus) elPlus.addEventListener("click", () => setWeight(weightG + 5));

  // ✅ 직접 입력 지원(blur/Enter)
  if (elWeightBox) {
    elWeightBox.addEventListener("blur", () => setWeight(elWeightBox.value));
    elWeightBox.addEventListener("keydown", (e) => {
      if (e.key === "Enter") elWeightBox.blur();
    });
  }

  // ===== events: add (✅ 로컬 저장 연결 완료) =====
  if (btnAdd) {
    btnAdd.addEventListener("click", () => {
      const hasAnyPhoto = !!topFile || !!sideFile;
      if (!hasAnyPhoto) {
        setHint("윗면/옆면 사진 중 최소 1장을 넣어주세요.");
        return;
      }
      if (!selected) {
        setHint("‘분석’ 후 음식명을 선택해 주세요.");
        return;
      }

      const estimated = computeEstimatedMl(weightG, selected.moisture);

      const now = new Date();
      const item = {
        id: `${now.getTime()}_${Math.random().toString(16).slice(2)}`,
        ts: now.toISOString(),
        dateKey: _dateKeyLocal(now),
        timeLabel: _formatTime12h(now),
        kind: "foodAI",
        name: selected.name,
        weightG,
        moisturePer100: selected.moisture,
        hasData: true,
        photoCount: (topFile ? 1 : 0) + (sideFile ? 1 : 0),
        volume: estimated,
      };

      const next = [item, ...getRecords()];
      setRecords(next);
      saveRecords(next);

      // ✅ 입력 상태 초기화 (음식수동과 동일 UX)
      selected = null;
      populateSelect([]);
      if (elFoodSelect) elFoodSelect.value = "";

      setWeight(100);
      clearPhotos();
      refreshEstimate();
      setStatus(foodDb?.loaded ? "AI: Mock 연결" : "AI: Mock 연결 (DB 대기)");
      setHint("저장되었습니다.");

      renderAll();
    });
  }

  // ===== init =====
  setStatus("AI: Mock 연결");
  setWeight(100);

  // 초기 상태: 파일 없음 → 기본 레이어 보이게
  renderPreview("top");
  renderPreview("side");

  refreshEstimate();

  return {
    render(recordsToday) {
      setStatus(foodDb?.loaded ? "AI: Mock 연결" : "AI: Mock 연결 (DB 대기)");

      const sum = (recordsToday || []).reduce((s, r) => s + (Number(r.volume) || 0), 0);
      if (elFoodAiTotal) elFoodAiTotal.textContent = `${sum} ml`;

      renderList(elFoodAiListBody, recordsToday, {
        kindText: false,
        kindLabel: () => "",
        onDelete: openDeleteModal,
      });

      return sum;
    },
  };
}