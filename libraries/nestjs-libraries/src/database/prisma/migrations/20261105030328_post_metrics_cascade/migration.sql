-- DropForeignKey
ALTER TABLE "PostMetrics" DROP CONSTRAINT "PostMetrics_postId_fkey";

-- AddForeignKey
ALTER TABLE "PostMetrics" ADD CONSTRAINT "PostMetrics_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
