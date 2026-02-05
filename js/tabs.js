export function initTabs({ tabsEl, panelsByKey, onTabChanged }) {
  let activeTab = null;

  function setActiveTab(tabKey) {
    activeTab = tabKey;

    // 탭 버튼 active 처리
    tabsEl.querySelectorAll(".tab").forEach(tab => {
      tab.classList.toggle("active", tab.dataset.tab === tabKey);
    });

    // 패널 표시/숨김 (null 방어)
    Object.entries(panelsByKey).forEach(([key, panel]) => {
      if (!panel) {
        console.warn(`[tabs] panel is missing: key="${key}"`);
        return;
      }
      panel.style.display = key === tabKey ? "block" : "none";
    });

    // onTabChanged 예외가 UI를 깨지 않게 방어
    if (onTabChanged) {
      try {
        onTabChanged(tabKey);
      } catch (err) {
        console.error("[tabs] onTabChanged error:", err);
      }
    }
  }

  tabsEl.addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (!tab) return;

    // coming 탭은 클릭 막기(원하면 제거)
    if (tab.classList.contains("coming")) return;

    const tabKey = tab.dataset.tab;
    if (!tabKey) return;

    setActiveTab(tabKey);
  });

  return {
    setActiveTab,
    getActiveTab: () => activeTab
  };
}
