import type { TestDatabase } from '@db/__tests__/support/sqlite-test-database';
import type { getDatabase } from '@db/database';

// The in-memory database a services test reaches through getDatabase(), with its failure injection: the test's `vi.mock('@tauri-apps/plugin-sql', …)` loads openTestDatabase() in place of plugin-sql.
export const testDatabase = async (
  get: typeof getDatabase,
): Promise<TestDatabase> => (await get()) as unknown as TestDatabase;

// Runs `write` with its database call number `callNumber` (1 for its first) failing, and swallows the rejection, so the test can assert what the failed write left stored. The injection is cleared afterwards, so a write that made fewer calls leaves no failure armed for the test's later calls: no call is ever number 0.
export const writeFailingOnCall = async (
  db: TestDatabase,
  callNumber: number,
  write: () => Promise<unknown>,
): Promise<void> => {
  db.failOnCall(db.callCount() + callNumber);
  try {
    await write();
  } catch {
    // The failure is the point: the caller asserts the stored state.
  }
  db.failOnCall(0);
};

// Runs `write` once to count its database calls, then once more for each of those calls with that call failing, and awaits `afterFailedWrite` after each failed run, so a test can assert that a failure at any point leaves the same stored state.
export const writeFailingOnEachCall = async (
  db: TestDatabase,
  write: () => Promise<unknown>,
  afterFailedWrite: (callNumber: number) => Promise<void>,
): Promise<void> => {
  const callsBefore = db.callCount();
  await write();
  const callsPerWrite = db.callCount() - callsBefore;

  for (let callNumber = 1; callNumber <= callsPerWrite; callNumber++) {
    await writeFailingOnCall(db, callNumber, write);
    await afterFailedWrite(callNumber);
  }
};
