-- CreateTable
CREATE TABLE "PublishUsage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "providerIdentifier" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "posts" INTEGER NOT NULL DEFAULT 0,
    "linkPosts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublishUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PublishUsage_organizationId_idx" ON "PublishUsage"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "PublishUsage_organizationId_providerIdentifier_periodStart_key" ON "PublishUsage"("organizationId", "providerIdentifier", "periodStart");

-- AddForeignKey
ALTER TABLE "PublishUsage" ADD CONSTRAINT "PublishUsage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Channels deleted before this release kept their tokens and profile details.
-- Remove them, leaving only the md5 of the platform id that the repeat trial
-- check reads.
UPDATE "Integration"
SET
  "name" = '',
  "internalId" = 'deleted_' || "id",
  "customName" = NULL,
  "picture" = NULL,
  "token" = '',
  "tokenExpiration" = NULL,
  "refreshToken" = NULL,
  "profile" = NULL,
  "customInstanceDetails" = NULL,
  "additionalSettings" = '[]',
  "rootInternalId" = CASE
    WHEN "rootInternalId" IS NULL OR "rootInternalId" ~ '^[a-f0-9]{32}$' THEN "rootInternalId"
    ELSE md5("rootInternalId")
  END
WHERE "deletedAt" IS NOT NULL;
