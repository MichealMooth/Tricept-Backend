-- CreateTable
CREATE TABLE "StrategicGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StrategicGoalRating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "goalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StrategicGoalRating_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "StrategicGoal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StrategicGoalRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "StrategicGoal_key_key" ON "StrategicGoal"("key");

-- CreateIndex
CREATE INDEX "StrategicGoalRating_year_month_idx" ON "StrategicGoalRating"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "StrategicGoalRating_goalId_userId_year_month_key" ON "StrategicGoalRating"("goalId", "userId", "year", "month");
