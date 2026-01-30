import { renderWaterTab } from './tabs/water.js';

const STORAGE_KEY = "hydration_records_v1";
let records = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const tabContent = document.getElementById('tabContent');

// 탭 전환 로직
document.getElementById('tabs').onclick = (e) => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    const tabName = tab.dataset.tab;
    loadTab(tabName);
};

export function loadTab(name) {
    tabContent.innerHTML = '';
    if (name === 'water') {
        renderWaterTab(tabContent, records, updateRecords);
    } else if (name === 'monthly') {
        tabContent.innerHTML = '<div class="card"><h3>🗓️ 월별요약</h3><p>준비 중입니다...</p></div>';
    } else {
        tabContent.innerHTML = `<div class="card"><h3>${name}</h3><p>개발 진행 예정입니다.</p></div>`;
    }
}

function updateRecords(newRecords) {
    records = newRecords;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    loadTab('water'); // 현재는 물 탭만 있으므로 강제 리로드
}

// 초기 로드
loadTab('water');