import {
  DecoratorNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  NodeKey,
  SerializedLexicalNode,
} from 'lexical';
import { JSX } from 'react';
import { MentionBadge } from '../components';

export type SerializedMentionNode = SerializedLexicalNode & {
  entityId: string;
  entityType: string;
  displayName: string;
  color: string;
  adventureId?: string;
};

const convertMentionElement = (
  domNode: HTMLElement,
): DOMConversionOutput | null => {
  const entityId = domNode.getAttribute('data-lexical-mention-entity-id');
  const entityType = domNode.getAttribute('data-lexical-mention-entity-type');
  if (!entityId || !entityType) return null;

  const adventureId = domNode.getAttribute('data-lexical-mention-adventure-id');
  const displayName = domNode.textContent.replace(/^@/, '');

  return {
    node: new MentionNode(entityId, entityType, displayName, '', adventureId),
  };
};

export class MentionNode extends DecoratorNode<JSX.Element> {
  __entityId: string;
  __entityType: string;
  __displayName: string;
  __color: string;
  __adventureId: string | null;

  constructor(
    entityId: string,
    entityType: string,
    displayName: string,
    color: string,
    adventureId?: string | null,
    key?: NodeKey,
  ) {
    super(key);
    this.__entityId = entityId;
    this.__entityType = entityType;
    this.__displayName = displayName;
    this.__color = color;
    this.__adventureId = adventureId ?? null;
  }

  static getType(): string {
    return 'mention';
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(
      node.__entityId,
      node.__entityType,
      node.__displayName,
      node.__color,
      node.__adventureId,
      node.__key,
    );
  }

  static importJSON(json: SerializedMentionNode): MentionNode {
    return new MentionNode(
      json.entityId,
      json.entityType,
      json.displayName,
      json.color,
      json.adventureId ?? null,
    );
  }

  createDOM(): HTMLElement {
    return document.createElement('span');
  }

  updateDOM(): boolean {
    return false;
  }

  isInline(): boolean {
    return true;
  }

  getTextContent(): string {
    return `@${this.__displayName}`;
  }

  exportJSON(): SerializedMentionNode {
    const json: SerializedMentionNode = {
      type: 'mention',
      version: 1,
      entityId: this.__entityId,
      entityType: this.__entityType,
      displayName: this.__displayName,
      color: this.__color,
    };
    if (this.__adventureId !== null) {
      json.adventureId = this.__adventureId;
    }
    return json;
  }

  decorate(): JSX.Element {
    return (
      <MentionBadge
        entityId={this.__entityId}
        entityType={this.__entityType}
        displayName={this.__displayName}
        color={this.__color}
        adventureId={this.__adventureId}
      />
    );
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span');
    element.setAttribute('data-lexical-mention-entity-id', this.__entityId);
    element.setAttribute('data-lexical-mention-entity-type', this.__entityType);
    if (this.__adventureId !== null) {
      element.setAttribute(
        'data-lexical-mention-adventure-id',
        this.__adventureId,
      );
    }
    element.textContent = this.getTextContent();
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-mention-entity-id')) {
          return null;
        }
        return {
          conversion: convertMentionElement,
          priority: 1,
        };
      },
    };
  }
}
