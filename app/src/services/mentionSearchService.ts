import * as mentionSearch from '@db/mention-search';
import type { TableConfig } from '@db/table-config';
import { MentionSearchError } from '@/domain/mentions';

export type MentionSearchResult = {
  id: string;
  name: string;
  tableName: string;
  color: string;
  adventureId?: string;
  updatedAt: string;
};

export const searchMentions = async (
  query: string,
  adventureId: string,
  tableConfigs: TableConfig[],
): Promise<MentionSearchResult[]> => {
  try {
    const enabledConfigs = tableConfigs.filter((c) => c.tagging_enabled === 1);
    const allResults: MentionSearchResult[] = [];

    for (const config of enabledConfigs) {
      const rows = await mentionSearch.searchByName(
        config.table_name,
        query,
        config.scope === 'adventure' ? adventureId : null,
      );

      const enriched = rows.map((row) => {
        const result: MentionSearchResult = {
          id: row.id,
          name: row.name,
          tableName: config.table_name,
          color: config.color,
          updatedAt: row.updated_at,
        };
        if (config.scope === 'adventure') {
          result.adventureId = adventureId;
        }
        return result;
      });

      allResults.push(...enriched);
    }

    return allResults.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  } catch (err) {
    throw new MentionSearchError(err);
  }
};
