import { useLayoutEffect, useRef } from 'react';
import { LoadingIcon } from '@/components/LoadingIcon/LoadingIcon';
import { FCProps } from '@/types/fcProps.type';
import { useEncounterLogLines } from '../../../../hooks/useEncounterLogLines';
import { EncounterLogComposer } from './components/EncounterLogComposer/EncounterLogComposer';
import { EncounterLogEntry } from './components/EncounterLogEntry/EncounterLogEntry';
import './EncounterLogTab.css';

type Props = { isOpen: boolean };

export const EncounterLogTab: FCProps<Props> = ({ isOpen }) => {
  const { lines, loading } = useEncounterLogLines();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastLineId = lines.at(-1)?.id ?? null;

  // useLayoutEffect: a hidden panel has no scroll height, so the open tab must scroll to the newest line before it paints, or it would show at the top for a frame. A new last line scrolls the same way.
  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    if (isOpen && scroller) {
      scroller.scrollTop = scroller.scrollHeight;
    }
  }, [isOpen, lastLineId]);

  return (
    <div className='encounter-log-tab'>
      <div ref={scrollRef} className='encounter-log-tab-scroll'>
        {loading && (
          <div className='content-center'>
            <LoadingIcon />
          </div>
        )}
        {!loading && lines.length === 0 && <p>No entries yet.</p>}
        {lines.length > 0 && (
          <ul className='encounter-log-tab-list'>
            {lines.map((line) => (
              <EncounterLogEntry key={line.id} line={line} />
            ))}
          </ul>
        )}
      </div>

      <EncounterLogComposer />
    </div>
  );
};
