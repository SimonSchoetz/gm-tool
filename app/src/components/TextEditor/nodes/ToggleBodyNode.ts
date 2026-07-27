import {
  ElementDOMSlot,
  ElementNode,
  LexicalNode,
  SerializedElementNode,
} from 'lexical';

export class ToggleBodyNode extends ElementNode {
  static getType(): string {
    return 'toggle-body';
  }

  static clone(node: ToggleBodyNode): ToggleBodyNode {
    return new ToggleBodyNode(node.__key);
  }

  static importJSON(serializedNode: SerializedElementNode): ToggleBodyNode {
    return new ToggleBodyNode().updateFromJSON(serializedNode);
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'toggle-body';

    const inner = document.createElement('div');
    inner.className = 'toggle-body-inner';
    dom.append(inner);

    return dom;
  }

  getDOMSlot(element: HTMLElement): ElementDOMSlot {
    const innerElement = element.lastElementChild;
    if (!(innerElement instanceof HTMLElement)) {
      throw new Error(
        'ToggleBodyNode.getDOMSlot: expected createDOM to produce an inner element',
      );
    }
    return super.getDOMSlot(element).withElement(innerElement);
  }

  updateDOM(): boolean {
    return false;
  }

  // See ToggleNode.isShadowRoot — the same reasoning applies to the body's own blocks.
  isShadowRoot(): true {
    return true;
  }

  canBeEmpty(): false {
    return false;
  }

  canIndent(): false {
    return false;
  }
}

export const $createToggleBodyNode = (): ToggleBodyNode => new ToggleBodyNode();

export const $isToggleBodyNode = (
  node: LexicalNode | null | undefined,
): node is ToggleBodyNode => node instanceof ToggleBodyNode;
