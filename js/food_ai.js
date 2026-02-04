import { computeEstimatedMl } from "./utils.js";

export function initFoodAiTab(ctx) {
  const { foodDb, elFoodAiStatus } = ctx;

  // ===== DOM =====
  const btnCameraTop = document.getElementById("btnAiCameraTop");
  const btnUploadTop = document.getElementById("btnAiUploadTop");
  const btnCameraSide = document.getElementById("btnAiCameraSide");
  const btnUploadSide = document.getElementById("btnAiUploadSide");

  const fileCameraTop = document.getElementById("aiFileCameraTop");
  const fileUploadTop = document.getElementById("aiFileUploadTop");
  const fileCameraSide = document.getElementById("aiFileCameraSide");
  const fileUploadSide = document.getElementById("aiFileUploadSide");

  const previewTop = document.getElementById("aiPreviewTop");
  const previewSide = document.getElementById("aiPreviewSide");

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

  // 2장 상태
  let topFile = null;
  let sideFile = null;

  function setStatus(text) {
    if (elFoodAiStatus) elFoodAiStatus.textContent = text;
  }
  function setHint(text) {
    if (elHint) elHint.textContent = text;
  }

  function renderPreview(boxEl, file, placeholderText) {
    if (!boxEl) return;

    if (!file) {
      // 기본 문구 유지/표시
      boxEl.innerHTML = `<div style="opacity:0.6; font-size: 13px;">${placeholderText}</div>`;
      return;
    }

    boxEl.innerHTML = "";
    const url = URL.createObjectURL(file);
    const img = document.createElement("img");
    img.src = url;
    img.alt = "food preview";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    boxEl.appendChild(img);
  }

  function setWeight(next) {
    const n = Number(next);
    const snapped = Number.isFinite(n) ? Math.round(n / 5) * 5 : 100;
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
    const hasTop = !!topFile;
    const hasSide = !!sideFile;

    if (elMoistureBox) elMoistureBox.textContent = hasData ? String(selected.moisture) : "데이터 없음";

    const estimated = hasData ? computeEstimatedMl(weightG, selected.moisture) : 0;
    if (elEstimatedBox) elEstimatedBox.textContent = String(estimated || 0);
    if (elTotalBox) elTotalBox.textContent = String(estimated || 0);

    // ✅ 분석/저장 활성조건 (권장)
    // - 분석 버튼: 사진이 1장 이상 있으면 가능 (2장이면 더 좋음)
    // - 기록 추가: 사진 1장 이상 + 음식 선택이 있어야 가능
    if (btnAnalyze) btnAnalyze.disabled = !(hasTop || hasSide);
    if (btnAdd) btnAdd.disabled = !((hasTop || hasSide) && hasData);

    // 힌트
    if (!hasTop && !hasSide) setHint("윗면/옆면 사진 중 최소 1장을 넣어주세요. (2장이면 정확도↑)");
    else if (hasTop && hasSide) setHint("사진 2장이 준비되었습니다. 이제 '분석' → 음식 선택이 가능합니다.");
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
    const hasAny = !!topFile || !!sideFile;
    if (!hasAny) {
      setHint("먼저 음식 사진(윗면/옆면)을 업로드/촬영해 주세요.");
      return;
    }

    if (!foodDb?.loaded) {
      setStatus("AI: Mock 연결 (DB 대기)");
      setHint("식품DB가 아직 로드되지 않았습니다. '음식 수동' 탭을 한번 열면 DB가 자동 로드됩니다.");
      return;
    }

    const list = getSomeDbItems(20);
    populateSelect(list);
    setStatus("AI: Mock 연결 (후보 로드)");
    setHint("Mock 단계: DB 후보를 불러왔습니다. 음식명을 선택하면 수분 계산이 됩니다.");
  }

  // ===== events =====
  if (btnCameraTop && fileCameraTop) btnCameraTop.addEventListener("click", () => fileCameraTop.click());
  if (btnUploadTop && fileUploadTop) btnUploadTop.addEventListener("click", () => fileUploadTop.click());
  if (btnCameraSide && fileCameraSide) btnCameraSide.addEventListener("click", () => fileCameraSide.click());
  if (btnUploadSide && fileUploadSide) btnUploadSide.addEventListener("click", () => fileUploadSide.click());

  function onPickTop(inputEl) {
    const file = inputEl?.files?.[0];
    if (!file) return;
    topFile = file;
    renderPreview(previewTop, topFile, "윗면 사진");
    refreshEstimate();
  }
  function onPickSide(inputEl) {
    const file = inputEl?.files?.[0];
    if (!file) return;
    sideFile = file;
    renderPreview(previewSide, sideFile, "옆면 사진");
    refreshEstimate();
  }

  if (fileCameraTop) fileCameraTop.addEventListener("change", () => onPickTop(fileCameraTop));
  if (fileUploadTop) fileUploadTop.addEventListener("change", () => onPickTop(fileUploadTop));
  if (fileCameraSide) fileCameraSide.addEventListener("change", () => onPickSide(fileCameraSide));
  if (fileUploadSide) fileUploadSide.addEventListener("change", () => onPickSide(fileUploadSide));

  if (btnAnalyze) btnAnalyze.addEventListener("click", mockAnalyze);

  if (elFoodSelect) {
    elFoodSelect.addEventListener("change", () => {
      const opt = elFoodSelect.selectedOptions?.[0];
      const moisture = opt?.dataset ? Number(opt.dataset.moisture) : NaN;

      if (opt && opt.value && Number.isFinite(moisture)) selected = { name: opt.value, moisture };
      else selected = null;

      refreshEstimate();
    });
  }

  if (elMinus) elMinus.addEventListener("click", () => { if (weightG > 0) setWeight(weightG - 5); });
  if (elPlus) elPlus.addEventListener("click", () => setWeight(weightG + 5));

  if (btnAdd) {
    btnAdd.addEventListener("click", () => {
      setHint("‘기록 추가’ 저장 연결은 다음 단계에서 진행할게요. (현재는 2장 UI 먼저)");
    });
  }

  // ===== init =====
  setStatus("AI: Mock 연결");
  setWeight(100);

  renderPreview(previewTop, null, "윗면 사진");
  renderPreview(previewSide, null, "옆면 사진");

  refreshEstimate();

  return {
    render() {
      if (foodDb?.loaded) setStatus("AI: Mock 연결");
      else setStatus("AI: Mock 연결 (DB 대기)");
      return 0;
    },
  };
}
