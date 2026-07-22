CREATE TYPE "BannerMediaType" AS ENUM ('IMAGE', 'VIDEO');

CREATE TABLE "HeroBanner" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "mediaType" "BannerMediaType" NOT NULL DEFAULT 'IMAGE',
  "desktopImageUrl" TEXT,
  "desktopImagePublicId" TEXT,
  "mobileImageUrl" TEXT,
  "mobileImagePublicId" TEXT,
  "desktopVideoUrl" TEXT,
  "desktopVideoPublicId" TEXT,
  "mobileVideoUrl" TEXT,
  "mobileVideoPublicId" TEXT,
  "posterImageUrl" TEXT,
  "posterImagePublicId" TEXT,
  "videoDuration" DOUBLE PRECISION,
  "videoWidth" INTEGER,
  "videoHeight" INTEGER,
  "videoFormat" TEXT,
  "videoBytes" INTEGER,
  "altText" TEXT,
  "textColorVariant" TEXT,
  "imagePosition" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HeroBanner_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HeroBanner_isActive_displayOrder_idx" ON "HeroBanner"("isActive", "displayOrder");
CREATE INDEX "HeroBanner_startsAt_endsAt_idx" ON "HeroBanner"("startsAt", "endsAt");
