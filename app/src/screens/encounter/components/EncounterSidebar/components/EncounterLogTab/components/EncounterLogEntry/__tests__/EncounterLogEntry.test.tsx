import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as logEntryService from '@services/encounterLogEntryService';
import { ROUTE_ENCOUNTER_ID } from '@/__tests__/support/encounterRouteParams';
import { queryClient, TanstackQueryClientProvider } from '@/data-access-layer';
import type { LogLine } from '../../../../../../../helper/buildLogLines';
import { EncounterLogEntry } from '../EncounterLogEntry';

const getLogEntries = vi.hoisted(() =>
  vi.fn<typeof logEntryService.getLogEntries>(),
);
const recordLogEntry = vi.hoisted(() =>
  vi.fn<typeof logEntryService.recordLogEntry>(),
);
const deleteLogMessage = vi.hoisted(() =>
  vi.fn<typeof logEntryService.deleteLogMessage>(),
);

vi.mock('@services/encounterLogEntryService', () => ({
  getLogEntries,
  recordLogEntry,
  deleteLogMessage,
}));

vi.mock('@tanstack/react-router', async () => {
  const { encounterRouteParams } =
    await import('@/__tests__/support/encounterRouteParams');
  return { useParams: encounterRouteParams };
});

// One paragraph holding the text "Round 1".
const MESSAGE_STATE =
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Round 1","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}';

const automatic = (
  id: string,
  overrides: Partial<Extract<LogLine, { kind: 'automatic' }>> = {},
): LogLine => ({
  kind: 'automatic',
  id,
  createdAt: '2024-03-15T14:05:00',
  parts: [{ kind: 'text', text: `Damage: ${id}` }],
  isReverted: false,
  isRevertible: true,
  ...overrides,
});
const message = (id: string): LogLine => ({
  kind: 'message',
  id,
  createdAt: '2024-03-15T14:05:00',
  editorState: MESSAGE_STATE,
});
const unreadable = (id: string): LogLine => ({
  kind: 'unreadable',
  id,
  createdAt: '2024-03-15T14:05:00',
});

const renderLines = (...lines: LogLine[]) =>
  render(
    <ul>
      {lines.map((line) => (
        <EncounterLogEntry key={line.id} line={line} />
      ))}
    </ul>,
    { wrapper: TanstackQueryClientProvider },
  );

// The buttons show on hover only (visibility: hidden, which jsdom applies from the stylesheet) and a hidden element has no accessible name, so they are found by label; a role query would miss a button that exists and make every absence assertion hold.
const getButton = (label: string) => screen.getByLabelText(label);
const getAllButtons = (label: string) => screen.getAllByLabelText(label);
const expectNoButtons = () => {
  expect(screen.queryByLabelText('Revert')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Delete')).not.toBeInTheDocument();
};

describe('EncounterLogEntry', () => {
  beforeEach(() => {
    queryClient.clear();
    getLogEntries.mockReset().mockResolvedValue([]);
    recordLogEntry.mockReset().mockResolvedValue();
    deleteLogMessage.mockReset().mockResolvedValue();
  });

  it('records one revert entry naming the line when Revert is clicked, without asking for confirmation', async () => {
    const user = userEvent.setup();
    renderLines(automatic('entry-1'));

    await user.click(getButton('Revert'));

    await waitFor(() => {
      expect(recordLogEntry).toHaveBeenCalledTimes(1);
    });
    expect(recordLogEntry).toHaveBeenCalledWith(ROUTE_ENCOUNTER_ID, 'revert', {
      entryId: 'entry-1',
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('deletes the message once when Delete is clicked', async () => {
    const user = userEvent.setup();
    renderLines(message('message-1'), message('message-2'));

    await user.click(getAllButtons('Delete')[1]);

    await waitFor(() => {
      expect(deleteLogMessage).toHaveBeenCalledTimes(1);
    });
    expect(deleteLogMessage).toHaveBeenCalledWith('message-2');
  });

  it('disables Revert and Delete on every line while another line is writing', async () => {
    recordLogEntry.mockReturnValue(Promise.withResolvers<never>().promise);
    const user = userEvent.setup();
    renderLines(
      automatic('entry-1'),
      automatic('entry-2'),
      message('message-1'),
    );
    const [firstRevert, secondRevert] = getAllButtons('Revert');
    expect(secondRevert).toBeEnabled();

    await user.click(firstRevert);

    await waitFor(() => {
      expect(secondRevert).toBeDisabled();
    });
    expect(getButton('Delete')).toBeDisabled();
  });

  it('strikes a reverted line through and offers no Revert for it', () => {
    renderLines(
      automatic('entry-1', { isReverted: true, isRevertible: false }),
    );

    expect(screen.getByRole('deletion')).toHaveTextContent('Damage: entry-1');
    expect(screen.queryByLabelText('Revert')).not.toBeInTheDocument();
  });

  it('shows an automatic line as plain text with its time, and a message with its text and time', () => {
    renderLines(automatic('entry-1'), message('message-1'));

    expect(screen.getByText('Damage: entry-1')).toBeInTheDocument();
    expect(screen.queryByRole('deletion')).not.toBeInTheDocument();
    expect(screen.getByText('Round 1')).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.getAllByText('2:05 PM')).toHaveLength(2);
  });

  it('gives only the entity name of an automatic line its full text as a title, so a name cut at the line’s width stays readable on hover', () => {
    renderLines(
      automatic('entry-1', {
        isRevertible: false,
        parts: [
          { kind: 'text', text: 'Damage: ' },
          { kind: 'name', text: 'Goblin' },
          { kind: 'text', text: ' (3)' },
        ],
      }),
    );

    const titled = screen.getAllByTitle(/./);

    expect(titled).toHaveLength(1);
    expect(titled[0]).toHaveTextContent('Goblin');
  });

  it('reads an unreadable line as Unreadable entry with a time and no buttons', () => {
    renderLines(unreadable('entry-1'));

    expect(screen.getByText('Unreadable entry')).toBeInTheDocument();
    expect(screen.getByText('2:05 PM')).toBeInTheDocument();
    expectNoButtons();
  });

  it('offers Delete and no Revert on a message', () => {
    renderLines(message('message-1'));

    expect(screen.queryByLabelText('Revert')).not.toBeInTheDocument();
    expect(getButton('Delete')).toBeInTheDocument();
  });

  it('offers no button on an automatic line that is not revertible', () => {
    renderLines(automatic('entry-1', { isRevertible: false }));

    expectNoButtons();
  });

  it('offers Revert and no Delete on a revertible automatic line', () => {
    renderLines(automatic('entry-1'));

    expect(getButton('Revert')).toBeInTheDocument();
    expect(screen.queryByLabelText('Delete')).not.toBeInTheDocument();
  });
});
