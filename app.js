const STORAGE_KEY = "hydration_records_v2";
const FOOD_DB_FILE = "./food_db.json";

// 전역 상태
let records = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let activeTab = "water";

// 유틸리티 함수
const utils = {
    pad2: (n) => String(n).padStart(2, "0"),
    formatTime12h: (date) => {
        const h24 = date.getHours();
        const m = date.getMinutes();
        const ampm = h24 >= 12 ? "pm" : "am";
        const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
        return `${ampm} ${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    },
    dateKey: (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    save: (data) => {
        records = data;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        renderAll(); // 모든 탭의 렌더링을 갱신
    }
};

// 탭 전환 이벤트
document.getElementById("tabs").addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (!tab) return;
    activeTab = tab.dataset.tab;
    document.querySelectorAll(".tab").forEach(el => el.classList.toggle("active", el.dataset.tab === activeTab));
    document.querySelectorAll(".card").forEach(el => el.style.display = el.dataset.panel === activeTab ? "block" : "none");
    renderAll();
});

function renderAll() {
    if (typeof renderWater === "function") renderWater();
    if (typeof renderFoodManual === "function") renderFoodManual();
    if (typeof renderFoodAI === "function") renderFoodAI();
    if (typeof renderSummary === "function") renderSummary();
}