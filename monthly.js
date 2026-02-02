export function initMonthlyTab(ctx) {
  const { elMonthlyStatus } = ctx || {};

  return {
    render() {
      if (elMonthlyStatus) {
        elMonthlyStatus.textContent = "아직 준비중입니다. (탭 이동/레이아웃만 활성화)";
      }
    },
  };
}
