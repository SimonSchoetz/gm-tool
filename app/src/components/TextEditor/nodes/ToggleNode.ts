import {
  $createParagraphNode,
  $isElementNode,
  $isParagraphNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementDOMSlot,
  ElementNode,
  LexicalEditor,
  LexicalNode,
  LexicalUpdateJSON,
  NodeKey,
  SerializedElementNode,
  Spread,
} from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { TOGGLE_GUTTER_CLASS } from '../TextEditor.constants';
import { $createToggleBodyNode } from './ToggleBodyNode';

export type SerializedToggleNode = Spread<
  { collapsed: boolean },
  SerializedElementNode
>;

const convertDetailsElement = (domNode: HTMLElement): DOMConversionOutput => {
  const collapsed = !domNode.hasAttribute('open');

  return {
    node: $createToggleNode(collapsed),
    after: (children) => {
      let header: LexicalNode;
      let rest: LexicalNode[];

      if (children.length === 0) {
        header = $createParagraphNode();
        rest = [];
      } else {
        [header, ...rest] = children;
      }

      if (!$isParagraphNode(header) && !$isHeadingNode(header)) {
        const paragraph = $createParagraphNode();
        if ($isElementNode(header)) {
          paragraph.append(...header.getChildren());
        } else {
          paragraph.append(header);
        }
        header = paragraph;
      }

      const body = $createToggleBodyNode();
      body.append(...(rest.length > 0 ? rest : [$createParagraphNode()]));

      return [header, body];
    },
  };
};

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

  // Makes getTopLevelElement() resolve to the header block rather than this node, so existing editor-wide logic (heading conversion, EmptyNodeHintPlugin, list buttons) targets the right block inside a toggle.
  isShadowRoot(): true {
    return true;
  }

  canBeEmpty(): false {
    return false;
  }

  canIndent(): false {
    return false;
  }

  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    const element = document.createElement('details');
    if (!this.__collapsed) {
      element.setAttribute('open', '');
    }

    return {
      element,
      after: (generatedElement) => {
        if (!(generatedElement instanceof HTMLElement)) return generatedElement;
        const header = generatedElement.firstElementChild;
        if (!header) return generatedElement;

        const summary = document.createElement('summary');
        header.replaceWith(summary);
        summary.append(header);
        return generatedElement;
      },
    };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      details: () => ({
        conversion: convertDetailsElement,
        priority: 1,
      }),
    };
  }
}

export const $createToggleNode = (collapsed = false): ToggleNode =>
  new ToggleNode(collapsed);

export const $isToggleNode = (
  node: LexicalNode | null | undefined,
): node is ToggleNode => node instanceof ToggleNode;
