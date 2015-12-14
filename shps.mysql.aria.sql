SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;


CREATE TABLE IF NOT EXISTS `accesskey` (
  `ID` int(10) unsigned NOT NULL,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=1 TRANSACTIONAL=1;

CREATE TABLE IF NOT EXISTS `content` (
  `ID` int(10) unsigned NOT NULL,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `namespace` int(10) unsigned NOT NULL DEFAULT '0',
  `language` int(10) unsigned NOT NULL,
  `accessKey` int(10) unsigned NOT NULL DEFAULT '0',
  `tls` tinyint(1) DEFAULT '1',
  `extSB` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'extended sandbox'
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=0 TRANSACTIONAL=1;

CREATE TABLE IF NOT EXISTS `css` (
  `ID` int(10) unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `namespace` int(10) unsigned NOT NULL DEFAULT '0',
  `language` int(10) unsigned NOT NULL,
  `mediaQuery` int(10) unsigned NOT NULL DEFAULT '0'
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=0 TRANSACTIONAL=1;

CREATE TABLE IF NOT EXISTS `filetype` (
  `ID` int(10) unsigned NOT NULL,
  `name` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mimeType` int(10) unsigned NOT NULL
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=1;

CREATE TABLE IF NOT EXISTS `group` (
  `ID` int(10) unsigned NOT NULL,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=0 TRANSACTIONAL=1;

CREATE TABLE IF NOT EXISTS `groupsecurity` (
  `gid` int(10) unsigned NOT NULL COMMENT 'group ID',
  `accesskey` int(10) unsigned NOT NULL,
  `from` int(10) unsigned NOT NULL DEFAULT '0',
  `to` int(10) unsigned NOT NULL DEFAULT '4294967295',
  `authorizer` int(10) unsigned NOT NULL COMMENT 'uid'
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=0 TRANSACTIONAL=1;

CREATE TABLE IF NOT EXISTS `groupuser` (
  `uid` int(10) unsigned NOT NULL,
  `gid` int(10) unsigned NOT NULL,
  `from` int(10) unsigned NOT NULL DEFAULT '0',
  `to` int(10) unsigned NOT NULL DEFAULT '4294967295'
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=0 TRANSACTIONAL=1;

CREATE TABLE IF NOT EXISTS `include` (
  `file` int(10) unsigned NOT NULL,
  `fileType` int(10) unsigned NOT NULL,
  `namespace` int(10) unsigned NOT NULL DEFAULT '0'
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=1;

CREATE TABLE IF NOT EXISTS `language` (
  `ID` int(10) unsigned NOT NULL,
  `name` varchar(2) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=1 TRANSACTIONAL=1;

CREATE TABLE IF NOT EXISTS `log` (
  `ID` int(10) unsigned NOT NULL,
  `time` int(10) unsigned NOT NULL,
  `type` int(11) NOT NULL DEFAULT '0',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=0 TRANSACTIONAL=1;

CREATE TABLE IF NOT EXISTS `loginquery` (
  `uid` int(10) unsigned NOT NULL,
  `time` int(10) unsigned NOT NULL
) ENGINE=MEMORY DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `loglevel` (
  `ID` int(10) unsigned NOT NULL,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `level` int(10) unsigned NOT NULL
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=1;

CREATE TABLE IF NOT EXISTS `mediaquery` (
  `ID` int(10) unsigned NOT NULL,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `query` text COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=1;

CREATE TABLE IF NOT EXISTS `mimetype` (
  `ID` int(10) unsigned NOT NULL,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=1;

CREATE TABLE IF NOT EXISTS `namespace` (
  `ID` int(10) unsigned NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=1;

CREATE TABLE IF NOT EXISTS `oldpassword` (
  `ID` int(10) unsigned NOT NULL,
  `uid` int(10) unsigned NOT NULL,
  `timestamp` int(10) unsigned NOT NULL,
  `salt` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pass` varchar(129) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=1;

CREATE TABLE IF NOT EXISTS `partial` (
  `ID` int(10) unsigned NOT NULL,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `language` int(10) unsigned NOT NULL,
  `content` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `namespace` int(10) unsigned NOT NULL DEFAULT '0',
  `accessKey` int(10) unsigned NOT NULL DEFAULT '0',
  `extSB` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'extended sandbox'
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=0 TRANSACTIONAL=1;

CREATE TABLE IF NOT EXISTS `passquery` (
  `pass` varchar(129) COLLATE utf8mb4_unicode_ci NOT NULL,
  `time` int(10) unsigned NOT NULL
) ENGINE=MEMORY DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `plugin` (
  `GUID` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `namespace` int(10) unsigned NOT NULL DEFAULT '0',
  `status` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '1:unins, 2:inactive, 3:active',
  `accessKey` int(10) unsigned NOT NULL DEFAULT '0',
  `order` int(10) unsigned NOT NULL DEFAULT '1'
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=0 TRANSACTIONAL=1;

CREATE TABLE IF NOT EXISTS `request` (
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `script` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `language` int(10) unsigned NOT NULL,
  `accessKey` int(10) unsigned NOT NULL DEFAULT '0',
  `namespace` int(10) unsigned NOT NULL DEFAULT '0',
  `tls` tinyint(1) NOT NULL DEFAULT '1',
  `extSB` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'extended sandbox'
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=0 TRANSACTIONAL=1;

CREATE TABLE IF NOT EXISTS `scriptlanguage` (
  `ID` int(10) unsigned NOT NULL,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=0;

CREATE TABLE IF NOT EXISTS `session` (
  `ID` int(10) unsigned NOT NULL,
  `name` varchar(45) NOT NULL,
  `timeStamp` int(10) unsigned NOT NULL
) ENGINE=Aria DEFAULT CHARSET=ascii PAGE_CHECKSUM=1;

CREATE TABLE IF NOT EXISTS `sessioncontent` (
  `sid` int(10) unsigned NOT NULL COMMENT 'Session ID',
  `key` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=1;

CREATE TABLE IF NOT EXISTS `string` (
  `ID` int(10) unsigned NOT NULL,
  `langID` int(10) unsigned NOT NULL DEFAULT '0',
  `namespace` int(10) unsigned NOT NULL,
  `group` int(10) unsigned NOT NULL,
  `key` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=1 TRANSACTIONAL=1;

CREATE TABLE IF NOT EXISTS `stringgroup` (
  `ID` int(10) unsigned NOT NULL,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=1 TRANSACTIONAL=1;

CREATE TABLE IF NOT EXISTS `upload` (
  `ID` int(10) unsigned NOT NULL,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fileName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploadTime` int(10) unsigned NOT NULL,
  `lastModified` int(10) unsigned NOT NULL,
  `mimeType` int(10) unsigned NOT NULL,
  `cache` tinyint(1) unsigned NOT NULL DEFAULT '1',
  `ttc` int(10) unsigned NOT NULL DEFAULT '604800' COMMENT 'time to cache',
  `accessKey` int(10) unsigned NOT NULL DEFAULT '0',
  `hash` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'MD5',
  `size` int(10) unsigned NOT NULL DEFAULT '0',
  `compressedSize` int(10) unsigned NOT NULL DEFAULT '0'
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=0 TRANSACTIONAL=1;

CREATE TABLE IF NOT EXISTS `user` (
  `ID` int(10) unsigned NOT NULL,
  `user` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pass` varchar(129) COLLATE utf8mb4_unicode_ci NOT NULL,
  `salt` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `host` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `regDate` int(10) unsigned NOT NULL,
  `token` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `lastIP` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lastActivity` int(10) unsigned NOT NULL,
  `isLoggedIn` tinyint(1) NOT NULL DEFAULT '0',
  `lastSID` varchar(35) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `isLocked` tinyint(1) unsigned NOT NULL DEFAULT '1',
  `autoLoginToken` varchar(35) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `xForward` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uaInfo` int(10) unsigned NOT NULL
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=0 TRANSACTIONAL=1;

CREATE TABLE IF NOT EXISTS `usersecurity` (
  `uid` int(10) unsigned NOT NULL COMMENT 'user ID or group ID',
  `accesskey` int(10) unsigned NOT NULL,
  `from` int(10) unsigned NOT NULL,
  `to` int(10) unsigned NOT NULL,
  `authorizer` int(10) unsigned NOT NULL COMMENT 'uid'
) ENGINE=Aria DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci PAGE_CHECKSUM=0 TRANSACTIONAL=1;


ALTER TABLE `accesskey`
  ADD PRIMARY KEY (`ID`);

ALTER TABLE `content`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `keys` (`name`,`namespace`);

ALTER TABLE `css`
  ADD PRIMARY KEY (`ID`);

ALTER TABLE `filetype`
  ADD PRIMARY KEY (`ID`);

ALTER TABLE `group`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `name` (`name`);

ALTER TABLE `groupsecurity`
  ADD UNIQUE KEY `UNIQUE` (`gid`,`accesskey`,`from`,`to`),
  ADD KEY `uid` (`gid`);

ALTER TABLE `groupuser`
  ADD KEY `uid` (`uid`);

ALTER TABLE `include`
  ADD PRIMARY KEY (`file`);

ALTER TABLE `language`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `name` (`name`);

ALTER TABLE `log`
  ADD PRIMARY KEY (`ID`);

ALTER TABLE `loglevel`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `level` (`level`);

ALTER TABLE `mediaquery`
  ADD PRIMARY KEY (`ID`);

ALTER TABLE `mimetype`
  ADD PRIMARY KEY (`ID`);

ALTER TABLE `namespace`
  ADD PRIMARY KEY (`ID`);

ALTER TABLE `oldpassword`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `UNIQUE` (`uid`,`timestamp`);

ALTER TABLE `partial`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `name` (`name`);

ALTER TABLE `plugin`
  ADD PRIMARY KEY (`GUID`),
  ADD UNIQUE KEY `keys` (`namespace`,`name`);

ALTER TABLE `request`
  ADD PRIMARY KEY (`name`);

ALTER TABLE `scriptlanguage`
  ADD PRIMARY KEY (`ID`);

ALTER TABLE `session`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `name` (`name`);

ALTER TABLE `sessioncontent`
  ADD UNIQUE KEY `UNIQUE` (`sid`,`key`);

ALTER TABLE `string`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `keys` (`langID`,`namespace`,`group`,`key`);

ALTER TABLE `stringgroup`
  ADD PRIMARY KEY (`ID`);

ALTER TABLE `upload`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `keys` (`name`);

ALTER TABLE `user`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `UNIQUE_SID` (`lastSID`);

ALTER TABLE `usersecurity`
  ADD UNIQUE KEY `UNIQUE` (`uid`,`accesskey`,`from`,`to`),
  ADD KEY `uid` (`uid`);


ALTER TABLE `accesskey`
  MODIFY `ID` int(10) unsigned NOT NULL AUTO_INCREMENT;
ALTER TABLE `content`
  MODIFY `ID` int(10) unsigned NOT NULL AUTO_INCREMENT;
ALTER TABLE `css`
  MODIFY `ID` int(10) unsigned NOT NULL AUTO_INCREMENT;
ALTER TABLE `filetype`
  MODIFY `ID` int(10) unsigned NOT NULL AUTO_INCREMENT;
ALTER TABLE `group`
  MODIFY `ID` int(10) unsigned NOT NULL AUTO_INCREMENT;
ALTER TABLE `include`;
ALTER TABLE `language`
  MODIFY `ID` int(10) unsigned NOT NULL AUTO_INCREMENT;
ALTER TABLE `log`
  MODIFY `ID` int(10) unsigned NOT NULL AUTO_INCREMENT;
ALTER TABLE `loglevel`
  MODIFY `ID` int(10) unsigned NOT NULL AUTO_INCREMENT;
ALTER TABLE `mediaquery`
  MODIFY `ID` int(10) unsigned NOT NULL AUTO_INCREMENT;
ALTER TABLE `mimetype`
  MODIFY `ID` int(10) unsigned NOT NULL AUTO_INCREMENT;
ALTER TABLE `namespace`
  MODIFY `ID` int(10) unsigned NOT NULL AUTO_INCREMENT;
ALTER TABLE `oldpassword`
  MODIFY `ID` int(10) unsigned NOT NULL AUTO_INCREMENT;
ALTER TABLE `partial`
  MODIFY `ID` int(10) unsigned NOT NULL AUTO_INCREMENT;
ALTER TABLE `scriptlanguage`
  MODIFY `ID` int(10) unsigned NOT NULL AUTO_INCREMENT;
ALTER TABLE `string`
  MODIFY `ID` int(10) unsigned NOT NULL AUTO_INCREMENT;
ALTER TABLE `stringgroup`
  MODIFY `ID` int(10) unsigned NOT NULL AUTO_INCREMENT;
ALTER TABLE `upload`
  MODIFY `ID` int(10) unsigned NOT NULL AUTO_INCREMENT;
ALTER TABLE `user`
  MODIFY `ID` int(10) unsigned NOT NULL AUTO_INCREMENT;
  
  
/* SHPS specific alterations */
INSERT INTO `accesskey` (`ID`,`name`,`description`) VALUES (0, 'SYS_NULL', 'Default Key for everyone');
UPDATE `accesskey` SET `ID`=0 WHERE `ID`=1;
ALTER TABLE `accesskey` AUTO_INCREMENT = 1;

INSERT INTO `namespace` (`ID`,`name`) VALUES (0, 'default');
UPDATE `namespace` SET `ID`=0 WHERE `ID`=1;
ALTER TABLE `namespace` AUTO_INCREMENT = 1;

INSERT INTO `scriptlanguage` (`ID`,`name`) VALUES (0, 'NONE');
UPDATE `scriptlanguage` SET `ID`=0 WHERE `ID`=1;
ALTER TABLE `scriptlanguage` AUTO_INCREMENT = 1;
INSERT INTO `scriptlanguage` (`name`) VALUES ('Pure JS'), ('Lodash JS Preprocessor');
  
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;