-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReferenceProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_name" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "project_description" TEXT NOT NULL,
    "activity_description" TEXT NOT NULL,
    "duration_from" TEXT NOT NULL,
    "duration_to" TEXT NOT NULL,
    "contact_person" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "short_teaser" TEXT,
    "short_project_description" TEXT,
    "person_legacy" TEXT,
    "roleId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReferenceProject_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReferenceProjectTopic" (
    "referenceProjectId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    PRIMARY KEY ("referenceProjectId", "topicId"),
    CONSTRAINT "ReferenceProjectTopic_referenceProjectId_fkey" FOREIGN KEY ("referenceProjectId") REFERENCES "ReferenceProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReferenceProjectTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReferenceProjectEmployee" (
    "referenceProjectId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,

    PRIMARY KEY ("referenceProjectId", "employeeId"),
    CONSTRAINT "ReferenceProjectEmployee_referenceProjectId_fkey" FOREIGN KEY ("referenceProjectId") REFERENCES "ReferenceProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReferenceProjectEmployee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_name_key" ON "Topic"("name");

-- CreateIndex
CREATE INDEX "ReferenceProject_roleId_idx" ON "ReferenceProject"("roleId");

-- CreateIndex
CREATE INDEX "ReferenceProject_approved_idx" ON "ReferenceProject"("approved");

-- CreateIndex
CREATE INDEX "ReferenceProjectTopic_topicId_idx" ON "ReferenceProjectTopic"("topicId");

-- CreateIndex
CREATE INDEX "ReferenceProjectEmployee_employeeId_idx" ON "ReferenceProjectEmployee"("employeeId");
