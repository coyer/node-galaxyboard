-- MySQL dump 10.11
--
-- Host: localhost    Database: board
-- ------------------------------------------------------
-- Server version	5.0.51a-24+lenny2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `banlist`
--

DROP TABLE IF EXISTS `banlist`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `banlist` (
  `ban_id` mediumint(8) unsigned NOT NULL auto_increment,
  `ban_fromid` int(10) unsigned NOT NULL,
  `ban_userid` int(10) unsigned NOT NULL default '0',
  `ban_ip` varchar(40) NOT NULL,
  `ban_email` varchar(100) NOT NULL,
  `ban_start` int(11) unsigned NOT NULL default '0',
  `ban_end` int(11) unsigned NOT NULL default '0',
  `ban_exclude` tinyint(1) unsigned NOT NULL default '0',
  `ban_reason` text NOT NULL,
  `ban_give_reason` text NOT NULL,
  PRIMARY KEY  (`ban_id`),
  KEY `ban_end` (`ban_end`),
  KEY `ban_user` (`ban_userid`,`ban_exclude`),
  KEY `ban_email` (`ban_email`,`ban_exclude`),
  KEY `ban_ip` (`ban_ip`,`ban_exclude`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Dumping data for table `banlist`
--

LOCK TABLES `banlist` WRITE;
/*!40000 ALTER TABLE `banlist` DISABLE KEYS */;
/*!40000 ALTER TABLE `banlist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `board_acl`
--

DROP TABLE IF EXISTS `board_acl`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `board_acl` (
  `boardid` int(11) NOT NULL,
  `accessid` int(11) NOT NULL COMMENT 'a negative id is used for groups and a positive id for users. ',
  `bflags` int(10) unsigned NOT NULL default '0',
  `eflags` int(10) unsigned NOT NULL default '0' COMMENT 'extended flags',
  PRIMARY KEY  (`boardid`,`accessid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COMMENT='AccessControllList. Defines permissions of user or group';
SET character_set_client = @saved_cs_client;

--
-- Dumping data for table `board_acl`
--

LOCK TABLES `board_acl` WRITE;
/*!40000 ALTER TABLE `board_acl` DISABLE KEYS */;
INSERT INTO `board_acl` VALUES (1,-2,0,0),(1,-1,0,0),(1,-3,4294967295,4294967295),(2,-1,0,0);
/*!40000 ALTER TABLE `board_acl` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `board_config`
--

DROP TABLE IF EXISTS `board_config`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `board_config` (
  `boardid` int(11) NOT NULL default '0',
  `prunedays` smallint(6) NOT NULL default '0',
  `boardflags` int(10) unsigned NOT NULL default '0',
  `boardrule` text NOT NULL,
  `headline` varchar(128) NOT NULL,
  `description` varchar(256) NOT NULL,
  `prefixe` varchar(2048) default NULL,
  PRIMARY KEY  (`boardid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Dumping data for table `board_config`
--

LOCK TABLES `board_config` WRITE;
/*!40000 ALTER TABLE `board_config` DISABLE KEYS */;
INSERT INTO `board_config` VALUES (0,0,0,'Optional notification about special rules in this board.','I am a board','',NULL),(1,0,64,'','√úbersicht','',NULL),(2,0,0,'Sowieso unbenutzt?','A childboard','Subline',NULL);
/*!40000 ALTER TABLE `board_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `boards`
--

DROP TABLE IF EXISTS `boards`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `boards` (
  `boardid` int(11) NOT NULL auto_increment,
  `parentboardid` int(11) NOT NULL default '0',
  `sortid` int(11) NOT NULL default '0',
  `topiccount` int(11) NOT NULL default '0',
  `postcount` int(11) NOT NULL default '0',
  `lasttopicid` int(11) NOT NULL default '0',
  PRIMARY KEY  (`boardid`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 DELAY_KEY_WRITE=1;
SET character_set_client = @saved_cs_client;

--
-- Dumping data for table `boards`
--

LOCK TABLES `boards` WRITE;
/*!40000 ALTER TABLE `boards` DISABLE KEYS */;
INSERT INTO `boards` VALUES (1,0,0,0,0,2),(2,1,0,0,0,0);
/*!40000 ALTER TABLE `boards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_members`
--

DROP TABLE IF EXISTS `group_members`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `group_members` (
  `userid` int(11) NOT NULL default '0',
  `groupid` int(11) NOT NULL default '0',
  KEY `userid` (`userid`),
  KEY `groupid_idx` (`groupid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COMMENT='gruppenzugehrigkeit';
SET character_set_client = @saved_cs_client;

--
-- Dumping data for table `group_members`
--

LOCK TABLES `group_members` WRITE;
/*!40000 ALTER TABLE `group_members` DISABLE KEYS */;
INSERT INTO `group_members` VALUES (1,3);
/*!40000 ALTER TABLE `group_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `groups`
--

DROP TABLE IF EXISTS `groups`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `groups` (
  `groupid` int(11) NOT NULL auto_increment,
  `description` varchar(64) NOT NULL,
  PRIMARY KEY  (`groupid`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Dumping data for table `groups`
--

LOCK TABLES `groups` WRITE;
/*!40000 ALTER TABLE `groups` DISABLE KEYS */;
INSERT INTO `groups` VALUES (1,'@@@anonymous@@@'),(2,'@@@registered@@@'),(3,'Free defined Group');
/*!40000 ALTER TABLE `groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `messages` (
  `id` int(11) NOT NULL auto_increment,
  `empfangen` timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP,
  `flag` tinyint(4) NOT NULL default '0',
  `userid` int(11) NOT NULL default '0',
  `fromid` int(11) NOT NULL default '0',
  `subject` varchar(128) NOT NULL,
  `message` text NOT NULL,
  PRIMARY KEY  (`id`),
  KEY `userid` (`userid`),
  KEY `empfangen` (`empfangen`),
  KEY `uidflag_idx` (`userid`,`flag`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mods`
--

DROP TABLE IF EXISTS `mods`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `mods` (
  `boardid` int(11) NOT NULL,
  `userid` int(11) NOT NULL,
  `flags` int(10) unsigned NOT NULL default '0',
  PRIMARY KEY  (`boardid`,`userid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Dumping data for table `mods`
--

LOCK TABLES `mods` WRITE;
/*!40000 ALTER TABLE `mods` DISABLE KEYS */;
INSERT INTO `mods` VALUES (1,1,3475327);
/*!40000 ALTER TABLE `mods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `poll_options`
--

DROP TABLE IF EXISTS `poll_options`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `poll_options` (
  `pid` int(11) NOT NULL,
  `value` int(11) NOT NULL,
  `poption` varchar(128) default NULL,
  KEY `pid` (`pid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Dumping data for table `poll_options`
--

LOCK TABLES `poll_options` WRITE;
/*!40000 ALTER TABLE `poll_options` DISABLE KEYS */;
/*!40000 ALTER TABLE `poll_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `poll_votes`
--

DROP TABLE IF EXISTS `poll_votes`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `poll_votes` (
  `pid` int(11) NOT NULL,
  `userid` int(11) NOT NULL,
  `vote` int(11) NOT NULL,
  PRIMARY KEY  (`pid`,`userid`,`vote`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Dumping data for table `poll_votes`
--

LOCK TABLES `poll_votes` WRITE;
/*!40000 ALTER TABLE `poll_votes` DISABLE KEYS */;
/*!40000 ALTER TABLE `poll_votes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `polls`
--

DROP TABLE IF EXISTS `polls`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `polls` (
  `id` int(11) NOT NULL auto_increment,
  `pid` int(11) NOT NULL default '0',
  `laufzeit` int(11) NOT NULL default '0',
  `maxoptions` int(11) NOT NULL default '0',
  `startdate` datetime NOT NULL default '0000-00-00 00:00:00',
  PRIMARY KEY  (`id`),
  KEY `pid` (`pid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Dumping data for table `polls`
--

LOCK TABLES `polls` WRITE;
/*!40000 ALTER TABLE `polls` DISABLE KEYS */;
/*!40000 ALTER TABLE `polls` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_reports`
--

DROP TABLE IF EXISTS `post_reports`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `post_reports` (
  `postid` int(11) NOT NULL,
  `reporterid` int(11) NOT NULL,
  `boardid` int(11) NOT NULL,
  PRIMARY KEY  (`postid`,`reporterid`),
  KEY `boardid` (`boardid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Dumping data for table `post_reports`
--

LOCK TABLES `post_reports` WRITE;
/*!40000 ALTER TABLE `post_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `postbodies`
--

DROP TABLE IF EXISTS `postbodies`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `postbodies` (
  `postid` int(11) NOT NULL,
  `lastedit` int(11) NOT NULL,
  `content` text NOT NULL,
  PRIMARY KEY  (`postid`),
  FULLTEXT KEY `content` (`content`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 DELAY_KEY_WRITE=1;
SET character_set_client = @saved_cs_client;

--
-- Dumping data for table `postbodies`
--

LOCK TABLES `postbodies` WRITE;
/*!40000 ALTER TABLE `postbodies` DISABLE KEYS */;
INSERT INTO `postbodies` VALUES (1,0,'Test posting.'),(2,0,'Banane');
/*!40000 ALTER TABLE `postbodies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `posts` (
  `postid` int(11) NOT NULL auto_increment,
  `topicid` int(11) NOT NULL default '0',
  `userid` int(11) NOT NULL default '0',
  `postflags` int(10) unsigned NOT NULL,
  `postdate` int(11) NOT NULL,
  `username` char(32) NOT NULL,
  `userip` char(16) NOT NULL,
  PRIMARY KEY  (`postid`),
  KEY `userid` (`userid`),
  KEY `postdate` (`postdate`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 DELAY_KEY_WRITE=1;
SET character_set_client = @saved_cs_client;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (1,1,1,0,1437256277,'admin','192.168.192.44'),(2,2,1,0,1437257608,'admin','');
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `topic_votes`
--

DROP TABLE IF EXISTS `topic_votes`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `topic_votes` (
  `topicid` int(11) NOT NULL,
  `userid` int(11) NOT NULL,
  `voting` int(11) NOT NULL,
  PRIMARY KEY  (`topicid`,`userid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Dumping data for table `topic_votes`
--

LOCK TABLES `topic_votes` WRITE;
/*!40000 ALTER TABLE `topic_votes` DISABLE KEYS */;
/*!40000 ALTER TABLE `topic_votes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `topics`
--

DROP TABLE IF EXISTS `topics`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `topics` (
  `topicid` int(11) NOT NULL auto_increment,
  `boardid` int(11) NOT NULL default '0',
  `hits` int(11) NOT NULL default '0',
  `posts` int(11) NOT NULL default '0',
  `voting` int(11) NOT NULL,
  `icon` int(11) NOT NULL default '0',
  `userid` int(11) NOT NULL default '0',
  `username` char(32) NOT NULL,
  `headline` char(100) NOT NULL,
  `flags` int(11) NOT NULL,
  `lastpostid` int(11) NOT NULL,
  `lastpostdate` int(11) NOT NULL,
  PRIMARY KEY  (`topicid`),
  KEY `board_date_idx` (`boardid`,`lastpostdate`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Dumping data for table `topics`
--

LOCK TABLES `topics` WRITE;
/*!40000 ALTER TABLE `topics` DISABLE KEYS */;
INSERT INTO `topics` VALUES (1,1,0,0,0,0,0,'ich wars','This is a topic',0,1,1437256277),(2,1,0,0,0,0,1,'admin','Test',0,2,1437257608);
/*!40000 ALTER TABLE `topics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `users` (
  `id` int(11) NOT NULL auto_increment,
  `nick` varchar(32) NOT NULL,
  `snp_hash` binary(20) NOT NULL COMMENT 'Salt''n''Pepper Hash',
  `country` char(2) NOT NULL,
  `city` varchar(64) NOT NULL,
  `email` varchar(96) NOT NULL,
  `created` int(10) unsigned NOT NULL default '0' COMMENT 'unix_timestamp',
  `lastlogin` int(10) unsigned NOT NULL default '0' COMMENT 'unix_timestamp',
  `posts` int(11) unsigned NOT NULL default '0',
  `flags` int(10) unsigned NOT NULL default '0',
  `titel` varchar(32) NOT NULL,
  `signature` varchar(255) NOT NULL,
  `language` varchar(2) NOT NULL,
  `dformat` varchar(24) NOT NULL default '%d.%m.%y %H:%M',
  `timezone` int(11) NOT NULL default '0',
  PRIMARY KEY  (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=10656002 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','\r9-rÇd–NU≤o„õòù','DE','','coyer@bogatz.de',1437254941,2015,764,2684354582,'Entwickler','','','%d.%m.%y %H:%M',0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2015-07-18 22:39:58
