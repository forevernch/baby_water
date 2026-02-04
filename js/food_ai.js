import { computeEstimatedMl } from "./utils.js";

export function initFoodAiTab(ctx) {
  const { foodDb, elFoodAiStatus } = ctx;

  // ===== DOM =====
  const previewTop = document.getElementById("aiPreviewTop");
  const previewSide = document.getElementById("aiPreviewSide");

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
  const elTotalBox = document.getElementById("aiTotalBox");

  const btnAdd = document.getElementById("btnAiAdd");
  const elHint = document.getElementById("aiHint");

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

  // ✅ 이미지가 선택되었을 때만 프레임을 이미지로 덮어쓴다.
  // ✅ file이 없으면 HTML(텍스트+버튼 정렬)을 그대로 유지한다.
  function renderPreview(boxEl, file) {
    if (!boxEl) return;
    if (!file) return;

    boxEl.innerHTML = "";

    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.alt = "food preview";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.borderRadius = "12px";

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

  // ===== events =====
  if (btnTopCamera && fileTopCamera) btnTopCamera.addEventListener("click", () => fileTopCamera.click());
  if (btnTopGallery && fileTopGallery) btnTopGallery.addEventListener("click", () => fileTopGallery.click());
  if (btnSideCamera && fileSideCamera) btnSideCamera.addEventListener("click", () => fileSideCamera.click());
  if (btnSideGallery && fileSideGallery) btnSideGallery.addEventListener("click", () => fileSideGallery.click());

  function onPickTop(inputEl) {
    const file = inputEl?.files?.[0];
    if (!file) return;

    topFile = file;
    renderPreview(previewTop, topFile); // ✅ 2인자
    refreshEstimate();
  }

  function onPickSide(inputEl) {
    const file = inputEl?.files?.[0];
    if (!file) return;

    sideFile = file;
    renderPreview(previewSide, sideFile); // ✅ 2인자
    refreshEstimate();
  }

  if (fileTopCamera) fileTopCamera.addEventListener("change", () => onPickTop(fileTopCamera));
  if (fileTopGallery) fileTopGallery.addEventListener("change", () => onPickTop(fileTopGallery));
  if (fileSideCamera) fileSideCamera.addEventListener("change", () => onPickSide(fileSideCamera));
  if (fileSideGallery) fileSideGallery.addEventListener("change", () => onPickSide(fileSideGallery));

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
      setHint("‘기록 추가’ 저장 연결은 다음 단계에서 진행할게요. (지금은 UI/2장 입력 먼저)");
    });
  }

  // ===== init =====
  setStatus("AI: Mock 연결");
  setWeight(100);

  // 초기에는 file이 없으므로 HTML 레이아웃(중앙정렬/줄바꿈)을 그대로 둔다.
  renderPreview(previewTop, null);
  renderPreview(previewSide, null);

  refreshEstimate();

  return {
    render() {
      setStatus(foodDb?.loaded ? "AI: Mock 연결" : "AI: Mock 연결 (DB 대기)");
      return 0;
    },
  };
}
