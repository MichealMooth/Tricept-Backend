-- CreateTable
CREATE TABLE "TeamModuleConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamGroupId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "scope" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "TeamModuleConfig_teamGroupId_fkey" FOREIGN KEY ("teamGroupId") REFERENCES "TeamGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModuleConfigAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamGroupId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValues" TEXT,
    "newValues" TEXT,
    "performedBy" TEXT NOT NULL,
    "performedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "TeamModuleConfig_teamGroupId_idx" ON "TeamModuleConfig"("teamGroupId");

-- CreateIndex
CREATE INDEX "TeamModuleConfig_moduleId_idx" ON "TeamModuleConfig"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamModuleConfig_teamGroupId_moduleId_key" ON "TeamModuleConfig"("teamGroupId", "moduleId");

-- CreateIndex
CREATE INDEX "ModuleConfigAudit_teamGroupId_idx" ON "ModuleConfigAudit"("teamGroupId");

-- CreateIndex
CREATE INDEX "ModuleConfigAudit_moduleId_idx" ON "ModuleConfigAudit"("moduleId");

-- CreateIndex
CREATE INDEX "ModuleConfigAudit_performedAt_idx" ON "ModuleConfigAudit"("performedAt");
