CREATE VIRTUAL TABLE `shots_fts` USING fts5(title, description, tags, content='shots', content_rowid='id', tokenize='unicode61 remove_diacritics 2', prefix='2 3');
--> statement-breakpoint
CREATE TRIGGER `shots_ai` AFTER INSERT ON `shots` BEGIN INSERT INTO shots_fts(rowid,title,description,tags) VALUES (new.id,new.title,new.description,new.tags); END;
--> statement-breakpoint
CREATE TRIGGER `shots_ad` AFTER DELETE ON `shots` BEGIN INSERT INTO shots_fts(shots_fts,rowid,title,description,tags) VALUES('delete',old.id,old.title,old.description,old.tags); END;
--> statement-breakpoint
CREATE TRIGGER `shots_au` AFTER UPDATE ON `shots` BEGIN INSERT INTO shots_fts(shots_fts,rowid,title,description,tags) VALUES('delete',old.id,old.title,old.description,old.tags); INSERT INTO shots_fts(rowid,title,description,tags) VALUES (new.id,new.title,new.description,new.tags); END;
