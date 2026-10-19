# Glossary

Terms the feature pages in `features/` use. The entity vocabulary grounded in the database schema — base entity, content section and the rest — is the Domain Glossary in `app/CLAUDE.md`.

- **Basic stat block** — A content-section type (`basic-stat-block`) of a base entity: an HP number field with a text editor underneath, stored together as one JSON value in the section's content. See `features/basic-stat-block.md`.
- **HP** — In a basic stat block, the creature's hit points as written in its stat block: empty or a whole number, negatives included. It is not current HP or damage taken during an encounter.
