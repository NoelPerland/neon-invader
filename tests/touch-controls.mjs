import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

class Button extends EventTarget {
  held = new Set();
  classList = { add: value => this.held.add(value), remove: value => this.held.delete(value) };
  setPointerCapture(id) { assert.equal(typeof id, 'number'); }
}
const buttons = { left: new Button(), right: new Button(), fire: new Button() };
const root = {
  hidden: true,
  querySelector: selector => buttons[selector.match(/"(.*?)"/)[1]],
  querySelectorAll: () => Object.values(buttons),
};
globalThis.window = new EventTarget();
globalThis.document = Object.assign(new EventTarget(), { querySelector: () => root });
const source = await readFile(new URL('../src/ui/touchControls.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } });
const { createTouchControls } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);
const press = key => buttons[key].dispatchEvent(Object.assign(new Event('pointerdown', { cancelable: true }), { pointerId: 1 }));
const input = createTouchControls();
assert.equal(root.hidden, false);
press('left'); press('fire');
assert.deepEqual(input.state, { left: true, right: false, fire: true });
buttons.left.dispatchEvent(new Event('pointercancel'));
assert.equal(input.state.left, false);
assert.equal(input.state.fire, true);
window.dispatchEvent(new Event('blur'));
assert.deepEqual(input.state, { left: false, right: false, fire: false });
press('right');
buttons.right.dispatchEvent(new Event('lostpointercapture'));
assert.equal(input.state.right, false);
press('fire');
document.dispatchEvent(new Event('visibilitychange'));
assert.equal(input.state.fire, false);
input.destroy();
assert.equal(root.hidden, true);
press('left');
assert.equal(input.state.left, false);
const restarted = createTouchControls();
press('right');
assert.equal(restarted.state.right, true);
buttons.right.dispatchEvent(new Event('pointerup'));
assert.equal(restarted.state.right, false);
restarted.destroy();
console.log('Touch controls: concurrent movement/fire, release/cancel, focus loss, cleanup and restart pass.');
