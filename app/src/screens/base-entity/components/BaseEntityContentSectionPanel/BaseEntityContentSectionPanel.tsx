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
import { ContentSectionNav } from '@/components/ContentSectionNav/ContentSectionNav';
import { UpDownBtns } from '@/components/UpDownBtns/UpDownBtns';
import { SlideTransition } from '@/components/SlideTransition/SlideTransition';
import { ContentSectionBody } from '@/components/ContentSectionBody';
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
  const {
    selected,
    isNavAvailable,
    isNavVisible,
    select,
    toggleNav,
    closeNav,
    hasPrevious,
    hasNext,
    stepPrevious,
    stepNext,
    transition,
    endTransition,
  } = useListNavigation(sections);
  const { openDeleteDialog } = useDeleteDialog();
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const burgerRef = useRef<HTMLButtonElement | null>(null);
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

  const onAddClick = () => {
    setTypeMenuAnchor('menu-bar');
  };

  const onNameCommit = (name: string) => {
    if (selected) updateSection(selected.id, { name });
  };

  const onDeleteSelected = () => {
    if (selected) handleDelete(selected);
  };

  const onNavClose = () => {
    // The type picker anchors to a button inside this popup, so a click in the picker must not close the popup under it.
    if (typeMenuAnchor === null) closeNav();
  };

  const newItem = {
    label: 'Add section',
    onClick: () => {
      setTypeMenuAnchor('nav');
    },
  };

  const getTypeMenuAnchorRect = () =>
    (typeMenuAnchor === 'nav'
      ? newItemButtonRef
      : addButtonRef
    ).current?.getBoundingClientRect() ?? null;

  const onTypeSelect = (type: BaseEntityContentSectionType) => {
    void handleCreate(type);
  };

  const onTypeMenuClose = () => {
    setTypeMenuAnchor(null);
  };

  // The name input renders only while a section is selected, so the `''` fallback below is never shown.
  const namePlaceholder = selected && contentSectionTypeLabel(selected.type);

  const leading = isNavAvailable ? (
    <>
      <ContentSectionNavToggle
        ref={burgerRef}
        isOpen={isNavVisible}
        onToggle={toggleNav}
      />
      <div>
        <UpDownBtns
          upLabel='Previous section'
          downLabel='Next section'
          isUpDisabled={!hasPrevious}
          isDownDisabled={!hasNext}
          onUp={stepPrevious}
          onDown={stepNext}
        />
      </div>
    </>
  ) : (
    <ClickableIcon
      ref={addButtonRef}
      icon={<PlusIcon />}
      label='Add content section'
      title='Add section'
      onClick={onAddClick}
    />
  );

  const title = selected ? (
    // Keyed by section id, so switching sections resets the input's local value.
    <SyncedInput
      key={selected.id}
      className='base-entity-content-section-panel-name-input'
      initValue={selected.name ?? ''}
      placeholder={namePlaceholder ?? ''}
      onCommit={onNameCommit}
    />
  ) : (
    'Popup Content'
  );

  const slide =
    transition === null
      ? null
      : {
          direction: transition.direction,
          outgoing: (
            <ContentSectionBody
              section={transition.from}
              baseEntityId={baseEntityId}
              readOnly
              className='base-entity-content-section-panel-body'
            />
          ),
        };

  return (
    <GlassPanel
      intensity='bright'
      className='base-entity-content-section-panel'
    >
      <PanelMenuBar leading={leading} title={title}>
        {selected && (
          <ClickableIcon
            icon={<Trash2Icon />}
            variant='danger'
            label='Delete section'
            title='Delete section'
            onClick={onDeleteSelected}
          />
        )}
      </PanelMenuBar>

      {selected && (
        <PanelBody>
          <SlideTransition slide={slide} onEnd={endTransition}>
            <ContentSectionBody
              section={selected}
              baseEntityId={baseEntityId}
              readOnly={false}
              className='base-entity-content-section-panel-body'
            />
          </SlideTransition>
        </PanelBody>
      )}

      {isNavVisible && (
        <ContentSectionNav
          baseEntityId={baseEntityId}
          activeId={selected?.id ?? null}
          anchorRef={burgerRef}
          popupZIndex={null}
          onSelect={select}
          onClose={onNavClose}
          newItem={newItem}
          newItemRef={newItemButtonRef}
        />
      )}

      {typeMenuAnchor !== null && (
        <ContentSectionTypeMenu
          getAnchorRect={getTypeMenuAnchorRect}
          onSelect={onTypeSelect}
          onClose={onTypeMenuClose}
        />
      )}
    </GlassPanel>
  );
};
