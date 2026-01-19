-- CreateTable
CREATE TABLE "UserCapacity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "allocations" TEXT NOT NULL DEFAULT '[]',
    "totalPercent" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserCapacity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UserCapacity_year_idx" ON "UserCapacity"("year");

-- CreateIndex
CREATE UNIQUE INDEX "UserCapacity_userId_year_month_key" ON "UserCapacity"("userId", "year", "month");
