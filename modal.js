export function createDeleteModal({ overlayEl, modalEl, cancelBtn, confirmBtn }) {
  let deleteTargetId = null;

  function open(id) {
    deleteTargetId = id;
    overlayEl.style.display = "grid";
    overlayEl.setAttribute("aria-hidden", "false");
  }

  function close() {
    deleteTargetId = null;
    overlayEl.style.display = "none";
    overlayEl.setAttribute("aria-hidden", "true");
  }

  // 바깥 클릭하면 닫기
  overlayEl.addEventListener("mousedown", (e) => {
    if (e.target === overlayEl) close();
  });

  // 모달 내부 클릭은 전파 방지
  modalEl.addEventListener("mousedown", (e) => e.stopPropagation());

  // 취소 버튼
  cancelBtn.addEventListener("click", close);

  return {
    open,
    close,
    /** @returns {string|null} */
    getTargetId() {
      return deleteTargetId;
    },
    bindConfirm(handler) {
      confirmBtn.addEventListener("click", () => handler(deleteTargetId));
    },
  };
}
