import { useBaseEntityContentSections } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import { contentSectionLabel } from '@domain';
import { PanelBody } from '../PanelBody/PanelBody';
import { ReorderableNavList } from '../ReorderableNavList';
import './ContentSectionNav.css';

type Props = {
  baseEntityId: string;
  activeId: string | null;
  onSelect: (id: string) => void;
  newItem: React.ComponentProps<typeof ReorderableNavList>['newItem'];
  newItemRef: React.ComponentProps<typeof ReorderableNavList>['newItemRef'];
};

export const ContentSectionNav: FCProps<Props> = ({
  baseEntityId,
  activeId,
  onSelect,
  newItem,
  newItemRef,
}) => {
  const { sections, bulkReorder } = useBaseEntityContentSections(baseEntityId);

  return (
    <PanelBody className='content-section-nav'>
      <ReorderableNavList
        items={sections.map((section) => ({
          id: section.id,
          label: contentSectionLabel(section.name, section.type),
          isChecked: false,
        }))}
        activeId={activeId}
        onSelect={onSelect}
        onReorder={bulkReorder}
        newItem={newItem}
        newItemRef={newItemRef}
      />
    </PanelBody>
  );
};
