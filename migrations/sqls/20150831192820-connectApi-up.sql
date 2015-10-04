CREATE TABLE systems (
  system_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100)
);

ALTER TABLE users ADD COLUMN system_id INT;
ALTER TABLE users ADD CONSTRAINT fk_users_system FOREIGN KEY (system_id) REFERENCES systems(system_id);

CREATE TABLE sessions (
  session_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(200) NOT NULL,
  expires DATETIME NOT NULL,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id)
);