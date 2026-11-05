-- CreateTable
CREATE TABLE "PostMetrics" (
    "postId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "publishDate" TIMESTAMP(3) NOT NULL,
    "metrics" TEXT NOT NULL DEFAULT '{}',
    "reads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostMetrics_pkey" PRIMARY KEY ("postId")
);

-- CreateIndex
CREATE INDEX "PostMetrics_integrationId_publishDate_idx" ON "PostMetrics"("integrationId", "publishDate");

-- AddForeignKey
ALTER TABLE "PostMetrics" ADD CONSTRAINT "PostMetrics_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
