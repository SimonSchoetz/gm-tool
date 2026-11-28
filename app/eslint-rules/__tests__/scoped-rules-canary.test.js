// @vitest-environment node

// @ts-check

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  canaryCases,
  lintCanaries,
  removeCanaries,
  writeCanaries,
} from './support/scopedRulesCanary.js';

/** @type {import('./support/scopedRulesCanary.js').CanaryLint} */
let lint;

beforeAll(async () => {
  writeCanaries();
  lint = await lintCanaries(null);
}, 120_000);

afterAll(removeCanaries);

for (const group of new Set(
  canaryCases.map((canaryCase) => canaryCase.group),
)) {
  describe(group, () => {
    it.each(
      canaryCases
        .filter((canaryCase) => canaryCase.group === group)
        .map(
          (canaryCase) => /** @type {const} */ ([canaryCase.name, canaryCase]),
        ),
    )(
      '%s',
      async (_name, canaryCase) => {
        for (const { label, actual, expected } of await canaryCase.compare(
          lint,
        )) {
          expect(actual, label).toEqual(expected);
        }
      },
      120_000,
    );
  });
}
