export function showSceneActions(actions: Array<[string, () => void]>) {
  const root = document.querySelector<HTMLElement>('.scene-actions')!;
  root.replaceChildren();
  for (const [label, activate] of actions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', activate);
    root.append(button);
  }
  root.hidden = false;
  return () => {
    root.hidden = true;
    root.replaceChildren();
  };
}
