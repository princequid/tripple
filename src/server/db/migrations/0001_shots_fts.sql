-- ADR-001: FTS5 external-content index over shots. Hand-written; Drizzle schema files never declare these objects.
-- Columns (BR-39 weights applied at query time): title 3, description 1, tags 2, author 1.
-- Any later migration that rebuilds `shots` MUST recreate these three triggers (ADR-001 rule 4; checked by
-- tests/integration/migrations.test.ts).
CREATE VIRTUAL TABLE `shots_fts` USING fts5(title, description, tags, author, content='shots', content_rowid='id', tokenize='unicode61 remove_diacritics 2', prefix='2 3');
--> statement-breakpoint
CREATE TRIGGER `shots_fts_ai` AFTER INSERT ON `shots` BEGIN
  INSERT INTO shots_fts(rowid, title, description, tags, author) VALUES (new.id, new.title, new.description, new.search_tags, new.search_author);
END;
--> statement-breakpoint
CREATE TRIGGER `shots_fts_ad` AFTER DELETE ON `shots` BEGIN
  INSERT INTO shots_fts(shots_fts, rowid, title, description, tags, author) VALUES ('delete', old.id, old.title, old.description, old.search_tags, old.search_author);
END;
--> statement-breakpoint
-- Fires only when an indexed column changes, so counter updates (likes, views) do not rewrite the index.
CREATE TRIGGER `shots_fts_au` AFTER UPDATE OF title, description, search_tags, search_author ON `shots` BEGIN
  INSERT INTO shots_fts(shots_fts, rowid, title, description, tags, author) VALUES ('delete', old.id, old.title, old.description, old.search_tags, old.search_author);
  INSERT INTO shots_fts(rowid, title, description, tags, author) VALUES (new.id, new.title, new.description, new.search_tags, new.search_author);
END;
