export function createTouchControls() {
  const root = document.querySelector<HTMLElement>('.touch-controls')!;
  const state = { left: false, right: false, fire: false };
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const reset = () => {
    state.left = state.right = state.fire = false;
    root.querySelectorAll('button').forEach((button) => button.classList.remove('held'));
  };

  root.hidden = false;
  for (const key of ['left', 'right', 'fire'] as const) {
    const button = root.querySelector<HTMLButtonElement>(`[data-input="${key}"]`)!;
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      state[key] = true;
      button.classList.add('held');
    }, options);
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(name, () => {
        state[key] = false;
        button.classList.remove('held');
      }, options);
    }
  }
  window.addEventListener('blur', reset, options);
  document.addEventListener('visibilitychange', reset, options);

  return {
    state,
    destroy() {
      reset();
      controller.abort();
      root.hidden = true;
    },
  };
}
