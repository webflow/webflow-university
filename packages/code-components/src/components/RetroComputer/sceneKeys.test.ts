import { describe, expect, it } from 'vitest';

import { isPlainSceneKey } from './sceneKeys';

function pressOn(target: HTMLElement, init: KeyboardEventInit) {
  let result: boolean | null = null;
  const scene = document.createElement('div');
  document.body.append(scene);
  if (target !== scene) scene.append(target);
  scene.addEventListener('keydown', (event) => {
    result = isPlainSceneKey(event, scene);
  });
  (target === scene ? scene : target).dispatchEvent(
    new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })
  );
  scene.remove();
  return result;
}

describe('isPlainSceneKey', () => {
  it('accepts a plain key on the scene itself', () => {
    const scene = document.createElement('div');
    let result = false;
    scene.addEventListener('keydown', (event) => (result = isPlainSceneKey(event, scene)));
    scene.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(result).toBe(true);
  });

  it('ignores keys that bubble up from a child', () => {
    expect(pressOn(document.createElement('input'), { key: 'Enter' })).toBe(false);
  });

  it('ignores shortcuts with modifiers', () => {
    const scene = document.createElement('div');
    const results: boolean[] = [];
    scene.addEventListener('keydown', (event) => results.push(isPlainSceneKey(event, scene)));
    for (const modifier of ['metaKey', 'ctrlKey', 'altKey'] as const) {
      scene.dispatchEvent(new KeyboardEvent('keydown', { key: 's', [modifier]: true }));
    }
    expect(results).toEqual([false, false, false]);
  });

  it('ignores keys another handler already prevented', () => {
    const scene = document.createElement('div');
    let result = true;
    scene.addEventListener('keydown', (event) => event.preventDefault());
    scene.addEventListener('keydown', (event) => (result = isPlainSceneKey(event, scene)));
    scene.dispatchEvent(new KeyboardEvent('keydown', { key: 's', cancelable: true }));
    expect(result).toBe(false);
  });
});
