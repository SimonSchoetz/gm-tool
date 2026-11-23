import { useRef, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { SettingsIcon } from 'lucide-react';
import { entityTypeLabel, type EntityType } from '@domain';
import { ClickableIcon } from '@/components/ClickableIcon/ClickableIcon';
import { FCProps } from '@/types/fcProps.type';
import { EntityActionsPopup } from './components/EntityActionsPopup/EntityActionsPopup';
import { getEntityRouteId } from './helper/getEntityRouteId';

type Props = { entityType: EntityType };

export const ScreensEntityActionsMenu: FCProps<Props> = ({ entityType }) => {
  const params = useParams({ strict: false });
  const gearRef = useRef<HTMLButtonElement | null>(null);
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(
    null,
  );

  const onGearClick = () => {
    const rect = gearRef.current?.getBoundingClientRect() ?? null;
    if (!rect) return;
    setAnchor({ top: rect.top, right: window.innerWidth - rect.right });
  };

  const onClose = () => {
    setAnchor(null);
  };

  const entityId = getEntityRouteId(entityType, params);
  const adventureId = params.adventureId ?? '';
  const gearLabel = `${entityTypeLabel(entityType)} actions`;

  return (
    <>
      <ClickableIcon
        ref={gearRef}
        icon={<SettingsIcon />}
        label={gearLabel}
        onClick={onGearClick}
      />
      {anchor && (
        <EntityActionsPopup
          entityType={entityType}
          entityId={entityId}
          adventureId={adventureId}
          anchor={anchor}
          onClose={onClose}
        />
      )}
    </>
  );
};
