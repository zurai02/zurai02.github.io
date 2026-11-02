(() => {
  const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  if (isTouchDevice) {
    window.__desktopHoverDisabled = true;
    return;
  }

  window.__desktopHoverDisabled = false;
})();
