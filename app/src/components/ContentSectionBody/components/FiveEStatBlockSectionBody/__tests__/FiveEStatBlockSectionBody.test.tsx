import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BaseEntityContentSection } from '@db/base-entity-content-section';
import { patchFiveEStatBlockContent, readFiveEStatBlockContent } from '@domain';
import { FiveEStatBlockSectionBody } from '../FiveEStatBlockSectionBody';

const { updateSectionContent } = vi.hoisted(() => ({
  updateSectionContent: vi.fn(),
}));

vi.mock('@/data-access-layer', () => ({
  useBaseEntityContentSections: () => ({ updateSectionContent }),
}));

const section: BaseEntityContentSection = {
  id: 'section-1',
  base_entity_id: 'entity-1',
  name: null,
  type: '5e-stat-block',
  content: null,
  checked: 0,
  sort_order: 0,
  created_at: '2026-01-10T09:00:00.000Z',
  updated_at: '2026-01-10T09:00:00.000Z',
};

const renderBody = () => {
  render(
    <FiveEStatBlockSectionBody
      section={section}
      baseEntityId='entity-1'
      readOnly={false}
    />,
  );
  return userEvent.setup();
};

const lastCompose = (): ((current: string | null) => string) => {
  const call = updateSectionContent.mock.lastCall as [
    string,
    (current: string | null) => string,
  ];
  return call[1];
};

describe('FiveEStatBlockSectionBody', () => {
  beforeEach(() => {
    updateSectionContent.mockClear();
  });

  it("composes an edit against the cached content the callback receives, not the rendered section's content", async () => {
    const user = renderBody();

    await user.type(screen.getByLabelText('Speed:'), '3');

    expect(updateSectionContent).toHaveBeenLastCalledWith(
      'section-1',
      expect.any(Function),
    );
    const cached = patchFiveEStatBlockContent(null, 'hp', 40);
    const saved = readFiveEStatBlockContent(lastCompose()(cached));
    expect(saved.fiveEStatBlock.hp).toBe(40);
    expect(saved.fiveEStatBlock.speed).toBe('3');
  });

  it('composes a number edit and a text edit in turn against successive current values, so the second result holds both', async () => {
    const user = renderBody();

    await user.type(screen.getByLabelText('HP:'), '9');
    const afterNumber = lastCompose()(null);
    await user.type(screen.getByLabelText('Senses:'), 'x');
    const afterText = readFiveEStatBlockContent(lastCompose()(afterNumber));

    expect(afterText.fiveEStatBlock.hp).toBe(9);
    expect(afterText.fiveEStatBlock.senses).toBe('x');
  });
});
