import { DecoratorNode, NodeKey, SerializedLexicalNode } from 'lexical';
import { JSX } from 'react';
import { MentionBadge } from '../components';

export type SerializedMentionNode = SerializedLexicalNode & {
  entityId: string;
  entityType: string;
  displayName: string;
  color: string;
  adventureId?: string;
};

export class MentionNode extends DecoratorNode<JSX.Element> {
  __entityId: string;
  __entityType: string;
  __displayName: string;
  __color: string;
  __adventureId?: string;

  constructor(
    entityId: string,
    entityType: string,
    displayName: string,
    color: string,
    adventureId?: string,
    key?: NodeKey,
  ) {
    super(key);
    this.__entityId = entityId;
    this.__entityType = entityType;
    this.__displayName = displayName;
    this.__color = color;
    this.__adventureId = adventureId;
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
      json.adventureId,
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
    if (this.__adventureId !== undefined) {
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
}
