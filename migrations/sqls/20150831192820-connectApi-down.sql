DROP TABLE sessions;

ALTER TABLE users DROP FOREIGN KEY fk_users_system;
ALTER TABLE users DROP COLUMN system_id;

DROP TABLE systems;