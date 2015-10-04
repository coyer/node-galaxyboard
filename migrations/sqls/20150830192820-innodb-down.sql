ALTER TABLE topics
DROP FOREIGN KEY fk_topics_lastpost,
DROP FOREIGN KEY fk_topics_user,
ADD COLUMN voting INT(11),
DROP FOREIGN KEY fk_topics_board;
UPDATE topics
SET userid = 0
WHERE userid IS NULL;
ALTER TABLE topics CHANGE COLUMN userid userid INT(11) NOT NULL DEFAULT 0;

ALTER TABLE posts
DROP FOREIGN KEY fk_posts_user,
DROP FOREIGN KEY fk_posts_topic;

ALTER TABLE postbodies DROP FOREIGN KEY fk_postbodies_post;

ALTER TABLE post_reports
DROP FOREIGN KEY fk_postreports_post,
DROP FOREIGN KEY fk_postreports_reporter,
DROP FOREIGN KEY fk_postreports_board;

ALTER TABLE polls
DROP FOREIGN KEY fk_polls_topic;

ALTER TABLE poll_votes
DROP FOREIGN KEY fk_pollvotes_user,
DROP FOREIGN KEY fk_pollvotes_option;

ALTER TABLE poll_options
DROP FOREIGN KEY fk_polloptions_topic,
ADD KEY (pid),
DROP PRIMARY KEY;

ALTER TABLE mods
DROP FOREIGN KEY fk_mods_board,
DROP FOREIGN KEY fk_mods_user;

ALTER TABLE messages
DROP FOREIGN KEY fk_messages_userfrom,
DROP FOREIGN KEY fk_messages_userto;

ALTER TABLE group_members
DROP FOREIGN KEY fk_groupmembers_user,
DROP FOREIGN KEY fk_groupmembers_group;

ALTER TABLE board_config DROP FOREIGN KEY fk_boardconfig_board;
INSERT INTO board_config (boardid, prunedays, boardflags, boardrule, headline, description, prefixe)
    SELECT boardid, prunedays, boardflags, boardrule, headline, description, prefixe
FROM board_root_config_backup;
DROP TABLE board_root_config_backup;

ALTER TABLE boards DROP FOREIGN KEY fk_board_parentboard;
UPDATE boards SET parentboardid = 0 WHERE parentboardid IS NULL;
ALTER TABLE boards CHANGE COLUMN parentboardid parentboardid INT NOT NULL;

CREATE TABLE board_acl (
  boardid  INT,
  accessid INT,
  bflags   INT UNSIGNED,
  eflags   INT UNSIGNED,
  PRIMARY KEY (boardid, accessid)
);
INSERT INTO board_acl (boardid, accessid, bflags, eflags)
  SELECT
    boardid,
    userid,
    bflags,
    eflags
  FROM board_user_acl;
INSERT INTO board_acl (boardid, accessid, bflags, eflags)
  SELECT
    boardid,
    -groupid,
    bflags,
    eflags
  FROM board_group_acl;
DROP TABLE board_user_acl;
DROP TABLE board_group_acl;

ALTER TABLE banlist
DROP FOREIGN KEY fk_banlist_mod,
DROP FOREIGN KEY fk_banlist_user;

ALTER TABLE `banlist` ENGINE = MYISAM;
ALTER TABLE `board_acl` ENGINE = MYISAM;
ALTER TABLE `board_config` ENGINE = MYISAM;
ALTER TABLE `boards` ENGINE = MYISAM;
ALTER TABLE `group_members` ENGINE = MYISAM;
ALTER TABLE `groups` ENGINE = MYISAM;
ALTER TABLE `messages` ENGINE = MYISAM;
ALTER TABLE `mods` ENGINE = MYISAM;
ALTER TABLE `poll_options` ENGINE = MYISAM;
ALTER TABLE `poll_votes` ENGINE = MYISAM;
ALTER TABLE `polls` ENGINE = MYISAM;
ALTER TABLE `post_reports` ENGINE = MYISAM;
ALTER TABLE `postbodies` ENGINE = MYISAM;
ALTER TABLE `posts` ENGINE = MYISAM;
ALTER TABLE `topics` ENGINE = MYISAM;
ALTER TABLE `users` ENGINE = MYISAM;

DROP TABLE IF EXISTS `topic_votes`;
CREATE TABLE `topic_votes` (
  `topicid` INT(11) NOT NULL,
  `userid`  INT(11) NOT NULL,
  `voting`  INT(11) NOT NULL,
  PRIMARY KEY (`topicid`, `userid`)
) ENGINE = MyISAM  DEFAULT CHARSET = utf8;