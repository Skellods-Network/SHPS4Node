SET SESSION sql_mode='NO_AUTO_VALUE_ON_ZERO';
CREATE TABLE IF NOT EXISTS `cssLayer` (
    `ID` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(30) NOT NULL,
    `order` INT NOT NULL DEFAULT 0
) ENGINE=ARIA DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `cssLayer`(`ID`,`name`,`order`) VALUES (0,'default',0);

ALTER TABLE `css` ADD `layer` INT UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE `upload` ADD `dataRoot` VARCHAR(30) NOT NULL DEFAULT '/pool';
