CREATE TABLE dbo.[cssLayer] (
    [ID] INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
    [name] VARCHAR(30) NOT NULL,
    [order] INT NOT NULL DEFAULT 0,
);

SET IDENTITY_INSERT dbo.[cssLayer] ON;
INSERT INTO dbo.[cssLayer]([ID],[name],[order]) VALUES (0,'default',0);
SET IDENTITY_INSERT dbo.[cssLayer] OFF;

ALTER TABLE [css] ADD [layer] INT UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE [upload] ADD [dataRoot] VARCHAR(30) NOT NULL DEFAULT '/pool';
