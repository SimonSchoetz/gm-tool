import { MenuOption } from '@lexical/react/LexicalTypeaheadMenuPlugin';
import type { MentionSearchResult } from '@services/mentionSearchService';

export class MentionMenuOption extends MenuOption {
  result: MentionSearchResult;

  constructor(result: MentionSearchResult) {
    super(result.id);
    this.result = result;
  }
}
