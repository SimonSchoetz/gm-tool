import {
  EditorConfig,
  ElementDOMSlot,
  ElementNode,
  LexicalNode,
  LexicalUpdateJSON,
  NodeKey,
  SerializedElementNode,
  Spread,
} from 'lexical';
import { TOGGLE_GUTTER_CLASS } from '../TextEditor.constants';

export type SerializedToggleNode = Spread<
  { collapsed: boolean },
  SerializedElementNode
>;

export class ToggleNode extends ElementNode {
  __collapsed: boolean;

  constructor(collapsed = false, key?: NodeKey) {
    super(key);
    this.__collapsed = collapsed;
  }

  static getType(): string {
    return 'toggle';
  }

  static clone(node: ToggleNode): ToggleNode {
    return new ToggleNode(node.__collapsed, node.__key);
  }

  static importJSON(serializedNode: SerializedToggleNode): ToggleNode {
    return new ToggleNode().updateFromJSON(serializedNode);
  }

  updateFromJSON(
    serializedNode: LexicalUpdateJSON<SerializedToggleNode>,
  ): this {
    return super
      .updateFromJSON(serializedNode)
      .setCollapsed(serializedNode.collapsed);
  }

  exportJSON(): SerializedToggleNode {
    return {
      ...super.exportJSON(),
      collapsed: this.__collapsed,
    };
  }

  isCollapsed(): boolean {
    return this.__collapsed;
  }

  setCollapsed(collapsed: boolean): this {
    const self = this.getWritable();
    self.__collapsed = collapsed;
    return self;
  }

  toggleCollapsed(): this {
    return this.setCollapsed(!this.__collapsed);
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'toggle-node';
    if (this.__collapsed) {
      dom.classList.add('toggle-node--collapsed');
    }

    const gutter = document.createElement('div');
    gutter.className = TOGGLE_GUTTER_CLASS;
    gutter.setAttribute('contenteditable', 'false');

    const chevron = document.createElement('span');
    chevron.className = 'toggle-chevron';
    gutter.append(chevron);

    const content = document.createElement('div');
    content.className = 'toggle-content';

    dom.append(gutter, content);
    return dom;
  }

  getDOMSlot(element: HTMLElement): ElementDOMSlot {
    const contentElement = element.lastElementChild;
    if (!(contentElement instanceof HTMLElement)) {
      throw new Error(
        'ToggleNode.getDOMSlot: expected createDOM to produce a content element',
      );
    }
    return super.getDOMSlot(element).withElement(contentElement);
  }

  updateDOM(prevNode: this, dom: HTMLElement): boolean {
    if (prevNode.__collapsed !== this.__collapsed) {
      dom.classList.toggle('toggle-node--collapsed', this.__collapsed);
    }
    return false;
  }
}

export const $createToggleNode = (collapsed = false): ToggleNode =>
  new ToggleNode(collapsed);

export const $isToggleNode = (
  node: LexicalNode | null | undefined,
): node is ToggleNode => node instanceof ToggleNode;
