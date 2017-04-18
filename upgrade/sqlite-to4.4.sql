CREATE TABLE IF NOT EXISTS [cssLayer] (
    [ID] INT UNSIGNED NOT NULL PRIMARY KEY AUTOINCREMENT,
    [name] VARCHAR(30) NOT NULL,
    [order] INT NOT NULL DEFAULT 0
);

INSERT INTO [cssLayer]([ID],[name],[order]) VALUES (0,'default',0);

ALTER TABLE [css] ADD [layer] INT UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE [upload] ADD [dataRoot] VARCHAR(30) NOT NULL DEFAULT '/pool';