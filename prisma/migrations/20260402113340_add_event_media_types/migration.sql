-- CreateEnum
CREATE TYPE "EventMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "EventMedia" ADD COLUMN     "mediaType" "EventMediaType" NOT NULL DEFAULT 'IMAGE',
ADD COLUMN     "posterUrl" TEXT,
ADD COLUMN     "provider" TEXT;
