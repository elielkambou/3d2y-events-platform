-- CreateEnum
CREATE TYPE "EventDeletionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELED');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedByUserId" TEXT,
ADD COLUMN     "deletionReason" TEXT,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "EventDeletionRequest" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "reviewedByUserId" TEXT,
    "reason" TEXT NOT NULL,
    "adminComment" TEXT,
    "status" "EventDeletionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "EventDeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventDeletionRequest_eventId_idx" ON "EventDeletionRequest"("eventId");

-- CreateIndex
CREATE INDEX "EventDeletionRequest_agencyId_idx" ON "EventDeletionRequest"("agencyId");

-- CreateIndex
CREATE INDEX "EventDeletionRequest_status_idx" ON "EventDeletionRequest"("status");

-- AddForeignKey
ALTER TABLE "EventDeletionRequest" ADD CONSTRAINT "EventDeletionRequest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDeletionRequest" ADD CONSTRAINT "EventDeletionRequest_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDeletionRequest" ADD CONSTRAINT "EventDeletionRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDeletionRequest" ADD CONSTRAINT "EventDeletionRequest_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
