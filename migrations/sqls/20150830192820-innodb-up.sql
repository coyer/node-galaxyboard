ALTER TABLE `banlist` ENGINE = INNODB;
ALTER TABLE `board_acl` ENGINE = INNODB;
ALTER TABLE `board_config` ENGINE = INNODB;
ALTER TABLE `boards` ENGINE = INNODB;
ALTER TABLE `group_members` ENGINE = INNODB;
ALTER TABLE `groups` ENGINE = INNODB;
ALTER TABLE `messages` ENGINE = INNODB;
ALTER TABLE `mods` ENGINE = INNODB;
ALTER TABLE `poll_options` ENGINE = INNODB;
ALTER TABLE `poll_votes` ENGINE = INNODB;
ALTER TABLE `polls` ENGINE = INNODB;
ALTER TABLE `post_reports` ENGINE = INNODB;
ALTER TABLE `postbodies` ENGINE = INNODB;
ALTER TABLE `posts` ENGINE = INNODB;
DROP TABLE topic_votes;
ALTER TABLE `topics` ENGINE = INNODB;
ALTER TABLE `users` ENGINE = INNODB;

ALTER TABLE banlist
CHANGE COLUMN ban_fromid ban_fromid INT,
CHANGE COLUMN ban_userid ban_userid INT,
ADD CONSTRAINT fk_banlist_mod FOREIGN KEY (ban_fromid) REFERENCES users (id),
ADD CONSTRAINT fk_banlist_user FOREIGN KEY (ban_userid) REFERENCES users (id);

CREATE TABLE board_user_acl (
  boardid INT,
  userid INT,
  bflags INT UNSIGNED,
  eflags INT UNSIGNED,
  PRIMARY KEY (boardid, userid),
  CONSTRAINT fk_boarduseracl_board FOREIGN KEY (boardid) REFERENCES boards(boardid),
  CONSTRAINT fk_boarduseracl_user FOREIGN KEY (userid) REFERENCES users(id)
);
CREATE TABLE board_group_acl (
  boardid INT,
  groupid INT,
  bflags INT UNSIGNED,
  eflags INT UNSIGNED,
  PRIMARY KEY (boardid, groupid),
  CONSTRAINT fk_boardgroupacl_board FOREIGN KEY (boardid) REFERENCES boards(boardid),
  CONSTRAINT fk_boardgrouopacl_group FOREIGN KEY (groupid) REFERENCES groups(groupid)
);
INSERT INTO board_user_acl(boardid, userid, bflags, eflags)
SELECT boardid, accessid, bflags, eflags
FROM board_acl
WHERE accessid > 0;
INSERT INTO board_group_acl(boardid, groupid, bflags, eflags)
SELECT boardid, -accessid, bflags, eflags
FROM board_acl
WHERE accessid < 0;
DROP TABLE board_acl;

ALTER TABLE boards CHANGE COLUMN parentboardid parentboardid INT;
UPDATE boards SET parentboardid = NULL WHERE parentboardid = 0;
ALTER TABLE boards ADD CONSTRAINT fk_board_parentboard FOREIGN KEY (parentboardid) REFERENCES boards (boardid);

CREATE TABLE board_root_config_backup (
  boardid INT PRIMARY KEY,
  prunedays SMALLINT NOT NULL,
  boardflags INT UNSIGNED NOT NULL,
  boardrule TEXT NOT NULL,
  headline VARCHAR(128) NOT NULL,
  description VARCHAR(256) NOT NULL,
  prefixe VARCHAR(2048)
);
INSERT INTO board_root_config_backup(boardid, prunedays, boardflags, boardrule, headline, description, prefixe)
    SELECT boardid, prunedays, boardflags, boardrule, headline, description, prefixe
FROM board_config
WHERE boardid = 0;
DELETE FROM board_config WHERE boardid = 0;
ALTER TABLE board_config ADD CONSTRAINT fk_boardconfig_board FOREIGN KEY (boardid) REFERENCES boards (boardid);

ALTER TABLE group_members
ADD CONSTRAINT fk_groupmembers_user FOREIGN KEY (userid) REFERENCES users (id),
ADD CONSTRAINT fk_groupmembers_group FOREIGN KEY (groupid) REFERENCES groups (groupid);

ALTER TABLE messages
ADD CONSTRAINT fk_messages_userfrom FOREIGN KEY (fromid) REFERENCES users (id),
ADD CONSTRAINT fk_messages_userto FOREIGN KEY (userid) REFERENCES users (id);

ALTER TABLE mods
ADD CONSTRAINT fk_mods_board FOREIGN KEY (boardid) REFERENCES boards (boardid),
ADD CONSTRAINT fk_mods_user FOREIGN KEY (userid) REFERENCES users (id);

ALTER TABLE poll_options
ADD CONSTRAINT pk_poll_options PRIMARY KEY (pid, `value`),
DROP KEY pid,
ADD CONSTRAINT fk_polloptions_topic FOREIGN KEY (pid) REFERENCES topics (topicid);

ALTER TABLE poll_votes
ADD CONSTRAINT fk_pollvotes_user FOREIGN KEY (userid) REFERENCES users (id),
ADD CONSTRAINT fk_pollvotes_option FOREIGN KEY (pid, vote) REFERENCES poll_options (pid, `value`);

ALTER TABLE polls ADD CONSTRAINT fk_polls_topic FOREIGN KEY (pid) REFERENCES topics (topicid);

ALTER TABLE post_reports
ADD CONSTRAINT fk_postreports_post FOREIGN KEY (postid) REFERENCES posts (postid),
ADD CONSTRAINT fk_postreports_reporter FOREIGN KEY (reporterid) REFERENCES users (id),
ADD CONSTRAINT fk_postreports_board FOREIGN KEY (boardid) REFERENCES boards (boardid);

ALTER TABLE postbodies ADD CONSTRAINT fk_postbodies_post FOREIGN KEY (postid) REFERENCES posts (postid);

ALTER TABLE posts
ADD CONSTRAINT fk_posts_topic FOREIGN KEY (topicid) REFERENCES topics (topicid),
ADD CONSTRAINT fk_posts_user FOREIGN KEY (userid) REFERENCES users (id);

ALTER TABLE topics CHANGE COLUMN userid userid INT DEFAULT NULL;
UPDATE topics
SET userid = NULL
WHERE userid = 0;
ALTER TABLE topics
ADD CONSTRAINT fk_topics_board FOREIGN KEY (boardid) REFERENCES boards (boardid),
DROP COLUMN voting,
ADD CONSTRAINT fk_topics_user FOREIGN KEY (userid) REFERENCES users (id),
ADD CONSTRAINT fk_topics_lastpost FOREIGN KEY (lastpostid) REFERENCES posts (postid);

