// Decides whether a commit message's subject has the form `<type>(<scope>): <description>`, and builds the refusal when it does not. On a branch named `<type>/<slug>` the scope is the slug. A subject in one of the quoted forms git writes for a merge or a revert passes unchecked.

const TYPES = [
  'feat',
  'fix',
  'refactor',
  'chore',
  'docs',
  'test',
  'style',
  'perf',
];

const GIT_WRITTEN_SUBJECT_STARTS = [
  "Merge branch '",
  "Merge branches '",
  "Merge remote-tracking branch '",
  "Merge remote-tracking branches '",
  "Merge tag '",
  "Merge tags '",
  "Merge commit '",
  "Merge commits '",
  'Revert "',
  'Reapply "',
];

const SUBJECT_FORM = /^(?<type>[^\s()]+)\((?<scope>[^()]+)\): .+$/;

const TYPED_BRANCH = new RegExp(`^(?:${TYPES.join('|')})/(?<scope>.+)$`);

// The first non-blank line. Under its default cleanup git drops `#` lines as comments from a message it opened an editor for, and keeps them otherwise, so such a line can then be the subject. Trailing whitespace is trimmed, as that cleanup drops it.
const subjectOf = (message: string, editorOpened: boolean) =>
  message
    .split('\n')
    .map((line) => line.trimEnd())
    .find((line) => line !== '' && !(editorOpened && line.startsWith('#'))) ??
  '';

const faultOf = (subject: string, requiredScope: string | null) => {
  const parts = SUBJECT_FORM.exec(subject)?.groups;
  if (!parts) return 'it does not have the expected form';
  if (!TYPES.includes(parts.type)) {
    return `"${parts.type}" is not an allowed type`;
  }
  if (requiredScope !== null && parts.scope !== requiredScope) {
    return `"${parts.scope}" is not the scope of this branch`;
  }
  return null;
};

export const commitMessageRefusal = ({
  message,
  branch,
  editorOpened,
}: {
  message: string;
  branch: string;
  editorOpened: boolean;
}) => {
  const subject = subjectOf(message, editorOpened);
  if (GIT_WRITTEN_SUBJECT_STARTS.some((start) => subject.startsWith(start))) {
    return null;
  }
  const requiredScope = TYPED_BRANCH.exec(branch)?.groups?.scope ?? null;
  const fault = faultOf(subject, requiredScope);
  if (fault === null) return null;
  return [
    `commit-msg-check: refused "${subject}": ${fault}.`,
    'Expected form: <type>(<scope>): <description>',
    `Types: ${TYPES.join(', ')}`,
    ...(requiredScope === null
      ? []
      : [`Scope required on this branch: ${requiredScope}`]),
  ].join('\n');
};
