-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "mainFocus" TEXT NOT NULL,
    "projectReferences" TEXT NOT NULL DEFAULT '{}',
    "experience" TEXT NOT NULL,
    "certifications" TEXT NOT NULL,
    "tools" TEXT NOT NULL DEFAULT '[]',
    "methods" TEXT NOT NULL DEFAULT '[]',
    "softSkills" TEXT NOT NULL DEFAULT '[]',
    "education" TEXT NOT NULL,
    "profileImageUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");
