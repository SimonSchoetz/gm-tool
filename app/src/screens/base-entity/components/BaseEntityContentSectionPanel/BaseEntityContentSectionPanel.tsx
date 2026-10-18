import { useRef, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useBaseEntityContentSections } from '@/data-access-layer';
import { useDeleteDialog } from '@/providers/DeleteDialogProvider';
import type { BaseEntityContentSection } from '@db/base-entity-content-section';
import { GlassPanel } from '@/components/GlassPanel/GlassPanel';
import { PanelMenuBar } from '@/components/PanelMenuBar/PanelMenuBar';
import { PanelBody } from '@/components/PanelBody/PanelBody';
import { ClickableIcon } from '@/components/ClickableIcon/ClickableIcon';
import { SyncedInput } from '@/components/SyncedInput/SyncedInput';
import { TextEditor } from '@/components/TextEditor';
import { ContentSectionNav } from '@/components/ContentSectionNav/ContentSectionNav';
import { ContentSectionNavToggle } from '@/components/ContentSectionNavToggle/ContentSectionNavToggle';
import { useListNavigation } from '@/hooks/useListNavigation';
import {
  contentSectionLabel,
  contentSectionTypeLabel,
  type BaseEntityContentSectionType,
} from '@domain';
import { ContentSectionTypeMenu } from './components/ContentSectionTypeMenu/ContentSectionTypeMenu';
import { getIdAfterRemoval } from './helper/getIdAfterRemoval';
import './BaseEntityContentSectionPanel.css';

export const BaseEntityContentSectionPanel = () => {
  const params = useParams({ strict: false });
  const baseEntityId = params.baseEntityId ?? '';

  const { sections, loading, createSection, updateSection, deleteSection } =
    useBaseEntityContentSections(baseEntityId);
  const { selected, isNavAvailable, isNavVisible, select, toggleNav } =
    useListNavigation(sections);
  const { openDeleteDialog } = useDeleteDialog();
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const newItemButtonRef = useRef<HTMLButtonElement | null>(null);
  const [typeMenuAnchor, setTypeMenuAnchor] = useState<
    'menu-bar' | 'nav' | null
  >(null);

  if (loading) return;

  const handleDelete = (section: BaseEntityContentSection) => {
    openDeleteDialog({
      name: `Section: ${contentSectionLabel(section.name, section.type)}`,
      oneClickConfirm: true,
      onDeletionConfirm: () => {
        const nextId = getIdAfterRemoval(
          sections.map((s) => s.id),
          section.id,
        );
        if (nextId !== null) select(nextId);
        void deleteSection(section.id);
      },
    });
  };

  const handleCreate = async (type: BaseEntityContentSectionType) => {
    setTypeMenuAnchor(null);
    const id = await createSection(type, contentSectionTypeLabel(type));
    select(id);
  };

  return (
    <GlassPanel
      intensity='bright'
      className='base-entity-content-section-panel'
    >
      <PanelMenuBar
        leading={
          isNavAvailable ? (
            <ContentSectionNavToggle
              isOpen={isNavVisible}
              onToggle={toggleNav}
            />
          ) : (
            <ClickableIcon
              ref={addButtonRef}
              icon={<PlusIcon />}
              label='Add content section'
              title='Add section'
              onClick={() => {
                setTypeMenuAnchor('menu-bar');
              }}
            />
          )
        }
        title={
          selected ? (
            // Keyed by section id, so switching sections resets the input's local value.
            <SyncedInput
              key={selected.id}
              className='base-entity-content-section-panel-name-input'
              initValue={selected.name ?? ''}
              placeholder={contentSectionTypeLabel(selected.type)}
              onCommit={(name) => {
                updateSection(selected.id, { name });
              }}
            />
          ) : (
            'Content Section'
          )
        }
      >
        {selected && (
          <ClickableIcon
            icon={<Trash2Icon />}
            variant='danger'
            label='Delete section'
            title='Delete section'
            onClick={() => {
              handleDelete(selected);
            }}
          />
        )}
      </PanelMenuBar>

      {isNavVisible ? (
        <ContentSectionNav
          baseEntityId={baseEntityId}
          activeId={selected?.id ?? null}
          onSelect={select}
          newItem={{
            label: 'Add section',
            onClick: () => {
              setTypeMenuAnchor('nav');
            },
          }}
          newItemRef={newItemButtonRef}
        />
      ) : (
        selected && (
          <PanelBody>
            <div className='base-entity-content-section-panel-content'>
              {/* Includes the section id, so switching sections remounts TextEditor (it keys on textEditorId) instead of keeping the previous section's content. */}
              <TextEditor
                textEditorId={`content-section-${selected.id}`}
                value={selected.content ?? ''}
                placeholder='Start typing or use / for commands'
                onChange={(content) => {
                  updateSection(selected.id, { content });
                }}
              />
            </div>
          </PanelBody>
        )
      )}

      {typeMenuAnchor !== null && (
        <ContentSectionTypeMenu
          getAnchorRect={() =>
            (typeMenuAnchor === 'nav'
              ? newItemButtonRef
              : addButtonRef
            ).current?.getBoundingClientRect() ?? null
          }
          onSelect={(type) => {
            void handleCreate(type);
          }}
          onClose={() => {
            setTypeMenuAnchor(null);
          }}
        />
      )}
    </GlassPanel>
  );
};
