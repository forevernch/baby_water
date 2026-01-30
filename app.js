import { renderWaterTab } from './water.js';

const storageKey = "hydration_records_v1";
let records = JSON.parse(localStorage.getItem(storageKey) || "[]");

const tabContent = document.getElementById('tabContent');
const tabs = document.querySelectorAll('.tab');

// 공통 데이터 업데이트 함수
export function updateRecords(newRecords) {
    records = newRecords;
    localStorage.setItem(storageKey, JSON.stringify(records));
    // 현재 활성화된 탭을 다시 그립니다.
    const activeTab = document.querySelector('.tab.active').dataset.tab;
    navigateTo(activeTab);
}

function navigateTo(tabName) {
    tabContent.innerHTML = ''; // 초기화

    if (tabName === 'water') {
        renderWaterTab(tabContent, records);
    } else if (tabName === 'monthly') {
        tabContent.innerHTML = '<div class="card"><h3>준비중...</h3></div>';
    } else {
        tabContent.innerHTML = `<div class="card"><h3>${tabName}</h3><p>작업 예정입니다.</p></div>`;
    }
}

// 탭 클릭 이벤트
document.getElementById('tabMenu').addEventListener('click', (e) => {
    const target = e.target.closest('.tab');
    if (!target) return;
    
    tabs.forEach(t => t.classList.remove('active'));
    target.classList.add('active');
    navigateTo(target.dataset.tab);
});

// 첫 진입 시 물 탭 로드
navigateTo('water');