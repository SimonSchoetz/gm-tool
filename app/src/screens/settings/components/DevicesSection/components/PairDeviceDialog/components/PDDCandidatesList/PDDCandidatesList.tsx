import { FCProps } from '@/types';
import './PDDCandidatesList.css';
import { PairingCandidatePayload } from '@domain';
import { cn } from '@/util';
import { ActionContainer } from '@/components';
import { getShortenedDeviceId } from '../../../../helper';

type Props = {
  candidates: PairingCandidatePayload[];
  onClick: (candidateId: PairingCandidatePayload['endpointId']) => void;
  selectedId: string | null;
};

export const PDDCandidatesList: FCProps<Props> = ({
  candidates,
  onClick,
  selectedId,
}) => {
  return (
    <ul className='PDD-candidates-list'>
      {candidates.map(({ endpointId, name }) => (
        <li key={endpointId}>
          <ActionContainer
            disabled={endpointId === selectedId}
            label='Pair device'
            className={cn(
              'PDD-candidate',
              endpointId === selectedId && 'PDD-candidate--selected',
            )}
            onClick={() => {
              onClick(endpointId);
            }}
          >
            {(!!name && name) || getShortenedDeviceId(endpointId)}
          </ActionContainer>
        </li>
      ))}
    </ul>
  );
};
