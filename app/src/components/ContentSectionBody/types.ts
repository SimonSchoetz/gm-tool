import type { BaseEntityContentSection } from '@db/base-entity-content-section';

export type SectionBodyProps = {
  section: BaseEntityContentSection;
  baseEntityId: string;
  readOnly: boolean;
};
