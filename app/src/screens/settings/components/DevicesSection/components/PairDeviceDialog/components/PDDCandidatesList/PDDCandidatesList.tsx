import { FCProps } from '@/types';
import './PDDCandidatesList.css';
import { PairingCandidatePayload } from '@domain';
import { ActionContainer } from '@/components';
import { getShortenedDeviceId } from '../../../../helper';

type Props = {
  candidates: PairingCandidatePayload[];
  onClick: (candidateId: PairingCandidatePayload['endpointId']) => void;
};

export const PDDCandidatesList: FCProps<Props> = ({ candidates, onClick }) => {
  return (
    <ul className='PDD-candidates-list'>
      {candidates.map(({ endpointId, name }) => (
        <li key={endpointId}>
          <ActionContainer
            label='Pair device'
            className='PDD-candidate'
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
