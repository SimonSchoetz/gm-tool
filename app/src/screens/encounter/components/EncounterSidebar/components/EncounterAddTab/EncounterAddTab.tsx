import { useState } from 'react';
import { LabeledToggleButton } from '@/components/LabeledToggleButton/LabeledToggleButton';
import { EncounterAddEntities } from './components/EncounterAddEntities';
import { EncounterAddEvent } from './components/EncounterAddEvent/EncounterAddEvent';
import { EncounterAddRandomCombatant } from './components/EncounterAddRandomCombatant/EncounterAddRandomCombatant';
import './EncounterAddTab.css';

type Source = 'entities' | 'other';
type OtherKind = 'event' | 'random';

export const EncounterAddTab = () => {
  const [source, setSource] = useState<Source>('entities');
  const [otherKind, setOtherKind] = useState<OtherKind>('event');

  const sourceOptions: [
    { value: Source; label: string },
    { value: Source; label: string },
  ] = [
    { value: 'entities', label: 'Entities' },
    { value: 'other', label: 'Other' },
  ];

  const otherKindOptions: [
    { value: OtherKind; label: string },
    { value: OtherKind; label: string },
  ] = [
    { value: 'event', label: 'Event' },
    { value: 'random', label: 'Random Combatant' },
  ];

  return (
    <div className='encounter-add-tab'>
      <LabeledToggleButton
        options={sourceOptions}
        value={source}
        onChange={setSource}
      />
      {/* Rendered only while Other is open: a LabeledToggleButton measures its active label once per index change, and a toggle that mounts inside a display: none ancestor is assumed (not verified) to read a zero width and keep a zero-width slider. The outer switch always sits in the visible Add panel. */}
      {source === 'other' && (
        <LabeledToggleButton
          options={otherKindOptions}
          value={otherKind}
          onChange={setOtherKind}
        />
      )}
      {/* All three panels stay mounted and are hidden with the hidden attribute: a conditionally rendered panel would lose the drafts and the search text on every switch. */}
      <EncounterAddEntities hidden={source !== 'entities'} />
      <EncounterAddEvent hidden={source !== 'other' || otherKind !== 'event'} />
      <EncounterAddRandomCombatant
        hidden={source !== 'other' || otherKind !== 'random'}
      />
    </div>
  );
};
