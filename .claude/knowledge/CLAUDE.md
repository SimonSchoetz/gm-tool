# Knowledge entries

How entries in this directory are cited, split and refreshed. Where the store lives, its one-file-per-external-system layout, the Step 0 grep of the headings, and the entry shape are in `CLAUDE.md` — Epistemological Discipline, Knowledge base.

- The store holds verified facts about external systems. A fact about this repository's own files, such as a dependency in `package.json` or a `tsconfig.json` flag, is read from the file and never recorded here.
- Entries whose body needs more than three sentences state more than one fact and are split; a claim needing different evidence is a second fact.
- The `Citation` line holds one bracketed citation per kind of check (documentation, observation, file read) that supports the current body, and drops any the body no longer rests on.
- Reverification refreshes the entry in place: an unchanged fact updates `Verified at` and `Citation`; a changed fact revises the body, and the heading when the claim it states changed; an incorrect entry is corrected the same way; a block is never appended, and git holds the history.
