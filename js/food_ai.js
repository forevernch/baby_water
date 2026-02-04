import { computeEstimatedMl } from "./utils.js";

/**
 * 음식 AI 탭 (UI 우선 구성)
 * - index.html의 foodAiCard 내부 UI를 제어
 * - DB는 음식수동과 동일한 FoodDb 인스턴스를 공유(food_db.json)
 * - AI 연결은 추후(현재는 Mock: "분석" 클릭 시 DB 후보를 select에 채움)
 */
export function initFoodAiTab(ctx) {
  const { foodDb, elFoodAiStatus } = ctx;

  // ===== DOM (index.html: foodAiCard 내부) =====
  const btnCamera = document.getElementById("btnAiCamera");
  const btnUpload = document.getElementById("btnAiUpload");
  const fileCamera = document.getElementById("aiFileCamera");
  const fileUpload = document.getElementById("aiFileUpload");
  const previewBox = document.getElementById("aiPreviewBox");

  const btnAnalyze = document.getElementById("btnAiAnalyze");

  const elFoodSelect = document.getElementById("aiFoodSelect");
  const elMinus = document.getElementById("aiBtnMinus");
  const elPlus = document.getElementById("aiBtnPlus");
  const elWeightBox = document.getElementById("aiWeightBox");

  const elMoistureBox = document.getElementById("aiMoistureBox");
  const elEstimatedBox = document.getElementById("aiEstimatedBox");
  const elTotalBox = document.getElementById("aiTotalBox");

  const btnAdd = document.getElementById("btnAiAdd");
  const elHint = document.getElementById("aiHint");

  // ===== state =====
  let weightG = 100;
  let selected = null; // { name, moisture }
  let imageSelected = false;

  function setStatus(text) {
    if (elFoodAiStatus) elFoodAiStatus.textContent = text;
  }

  function setHint(text) {
    if (elHint) elHint.textContent = text;
  }

  function setPreview(file) {
    if (!previewBox) return;

    previewBox.innerHTML = "";

    if (!file) {
      const msg = document.createElement("div");
      msg.style.opacity = "0.6";
      msg.style.fontSize = "13px";
      msg.textContent = "이미지를 선택하세요";
      previewBox.appendChild(msg);
      return;
    }

    const url = URL.createObjectURL(file);
    const img = document.createElement("img");
    img.src = url;
    img.alt = "food preview";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    previewBox.appendChild(img);
  }

  function setWeight(next) {
    const n = Number(next);
    const snapped = Number.isFinite(n) ? Math.round(n / 10) * 10 : 100;
    weightG = Math.max(0, snapped);

    if (elWeightBox) elWeightBox.textContent = String(weightG);

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

  function refreshEstimate() {
    const hasData = !!selected;

    if (elMoistureBox) {
      elMoistureBox.textContent = hasData ? String(selected.moisture) : "데이터 없음";
    }

    const estimated = hasData ? computeEstimatedMl(weightG, selected.moisture) : 0;

    if (elEstimatedBox) elEstimatedBox.textContent = String(estimated || 0);
    if (elTotalBox) elTotalBox.textContent = String(estimated || 0);

    // Mock 단계: 이미지 + DB 선택이 모두 되어야만 활성화
    if (btnAdd) btnAdd.disabled = !(imageSelected && hasData);
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
    if (!imageSelected) {
      setHint("먼저 음식 사진을 업로드/촬영해 주세요.");
      return;
    }

    if (!foodDb?.loaded) {
      setStatus("AI: Mock 연결 (DB 대기)");
      setHint("식품DB가 아직 로드되지 않았습니다. '음식 수동' 탭을 한번 열면 DB가 자동 로드됩니다.");
      return;
    }

    // Mock: DB에서 임의 20개 후보를 채워넣습니다.
    const list = getSomeDbItems(20);
    populateSelect(list);

    setStatus("AI: Mock 연결 (후보 로드)");
    setHint("Mock 단계: DB 후보를 불러왔습니다. 음식명을 선택하면 수분 계산이 됩니다.");
  }

  // ===== events =====
  if (btnCamera && fileCamera) {
    btnCamera.addEventListener("click", () => fileCamera.click());
  }

  if (btnUpload && fileUpload) {
    btnUpload.addEventListener("click", () => fileUpload.click());
  }

  function handleFileInput(inputEl) {
    const file = inputEl?.files?.[0];
    if (!file) return;

    imageSelected = true;
    setPreview(file);
    refreshEstimate();
  }

  if (fileCamera) {
    fileCamera.addEventListener("change", () => handleFileInput(fileCamera));
  }

  if (fileUpload) {
    fileUpload.addEventListener("change", () => handleFileInput(fileUpload));
  }

  if (btnAnalyze) {
    btnAnalyze.addEventListener("click", mockAnalyze);
  }

  if (elFoodSelect) {
    elFoodSelect.addEventListener("change", () => {
      const opt = elFoodSelect.selectedOptions?.[0];
      const moisture = opt?.dataset ? Number(opt.dataset.moisture) : NaN;

      if (opt && opt.value && Number.isFinite(moisture)) {
        selected = { name: opt.value, moisture };
      } else {
        selected = null;
      }
      refreshEstimate();
    });
  }

  if (elMinus) {
    elMinus.addEventListener("click", () => {
      if (weightG <= 0) return;
      setWeight(weightG - 5);
    });
  }

  if (elPlus) {
    elPlus.addEventListener("click", () => setWeight(weightG + 5));
  }

  if (btnAdd) {
    btnAdd.addEventListener("click", () => {
      // 현재 app.js에서 Records ctx를 주지 않아서 저장은 다음 단계에서 연결
      setHint("현재는 UI 단계입니다. 기록 저장/삭제는 다음 단계에서 연결할게요.");
    });
  }

  // ===== init =====
  setStatus("AI: Mock 연결");
  setWeight(100);
  refreshEstimate();
  setPreview(null);

  return {
    render() {
      // 탭 이동 시 가벼운 상태 갱신만
      if (foodDb?.loaded) setStatus("AI: Mock 연결");
      else setStatus("AI: Mock 연결 (DB 대기)");
      return 0;
    },
  };
}
