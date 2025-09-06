-- CreateTable
CREATE TABLE "upgrade_tracking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "childId" TEXT,
    "triggerType" TEXT NOT NULL,
    "triggerData" JSONB,
    "popupShownAt" TIMESTAMP(3),
    "popupAction" TEXT,
    "upgradePageVisitedAt" TIMESTAMP(3),
    "conversionAt" TIMESTAMP(3),
    "subscriptionType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upgrade_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavioral_metrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "metricType" TEXT NOT NULL,
    "metricValue" DECIMAL(65,30) NOT NULL,
    "contextData" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "behavioral_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "popup_interactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "popupType" TEXT NOT NULL,
    "popupContent" JSONB,
    "action" TEXT NOT NULL,
    "actionData" JSONB,
    "sessionContext" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "popup_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_tracking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardType" TEXT NOT NULL,
    "rewardCode" TEXT,
    "rewardValue" DECIMAL(65,30),
    "rewardData" JSONB,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_performance_analysis" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "analysisType" TEXT NOT NULL,
    "analysisData" JSONB NOT NULL,
    "performanceLevel" TEXT NOT NULL,
    "confidence" DECIMAL(65,30) NOT NULL,
    "recommendations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "child_performance_analysis_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "upgrade_tracking" ADD CONSTRAINT "upgrade_tracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upgrade_tracking" ADD CONSTRAINT "upgrade_tracking_childId_fkey" FOREIGN KEY ("childId") REFERENCES "UserSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavioral_metrics" ADD CONSTRAINT "behavioral_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "popup_interactions" ADD CONSTRAINT "popup_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_tracking" ADD CONSTRAINT "reward_tracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_performance_analysis" ADD CONSTRAINT "child_performance_analysis_childId_fkey" FOREIGN KEY ("childId") REFERENCES "UserSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
