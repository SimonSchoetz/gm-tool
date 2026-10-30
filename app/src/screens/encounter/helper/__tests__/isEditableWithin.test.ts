import { afterEach, describe, expect, it } from 'vitest';
import { isEditableWithin } from '../isEditableWithin';

const mount = (html: string): HTMLElement => {
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.append(container);
  return container;
};

const inside = (container: HTMLElement, selector: string): HTMLElement => {
  const element = container.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`No element matches ${selector}`);
  return element;
};

describe('isEditableWithin', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('is false without a container', () => {
    const outside = mount('<input />');

    expect(isEditableWithin(null, inside(outside, 'input'))).toBe(false);
  });

  it('is false for a target outside the container', () => {
    const container = mount('<button></button>');
    const outside = mount('<input />');

    expect(isEditableWithin(container, inside(outside, 'input'))).toBe(false);
  });

  it('is false for a target that is not an element', () => {
    const container = mount('<input />');

    expect(isEditableWithin(container, document)).toBe(false);
    expect(isEditableWithin(container, null)).toBe(false);
  });

  it.each([
    ['an input', '<input />', 'input'],
    ['a textarea', '<textarea></textarea>', 'textarea'],
    [
      'a contenteditable element',
      '<div contenteditable="true"></div>',
      'div[contenteditable]',
    ],
    [
      'a child of a contenteditable element',
      '<div contenteditable="true"><p></p></div>',
      'p',
    ],
  ])('is true for %s inside the container', (_label, html, selector) => {
    const container = mount(html);

    expect(isEditableWithin(container, inside(container, selector))).toBe(true);
  });

  it.each([
    ['a button', '<button></button>', 'button'],
    [
      'a contenteditable="false" element',
      '<div contenteditable="false"></div>',
      'div',
    ],
  ])('is false for %s inside the container', (_label, html, selector) => {
    const container = mount(html);

    expect(isEditableWithin(container, inside(container, selector))).toBe(
      false,
    );
  });
});
