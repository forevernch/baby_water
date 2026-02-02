export function initTabs({ tabsEl, panelsByKey, onTabChanged }) {
  let activeTab = null;

  function setActiveTab(tabKey) {
    activeTab = tabKey;

    // 탭 버튼 active 처리
    tabsEl.querySelectorAll(".tab").forEach(tab => {
      tab.classList.toggle("active", tab.dataset.tab === tabKey);
    });

    // 패널 표시/숨김
    Object.entries(panelsByKey).forEach(([key, panel]) => {
      panel.style.display = key === tabKey ? "block" : "none";
    });

    if (onTabChanged) onTabChanged(tabKey);
  }

  // 탭 클릭 이벤트
  tabsEl.addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (!tab) return;

    const tabKey = tab.dataset.tab;
    if (!tabKey) return;

    setActiveTab(tabKey);
  });

  return {
    setActiveTab,
    getActiveTab: () => activeTab
  };
}
