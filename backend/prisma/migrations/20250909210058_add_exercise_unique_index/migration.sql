/*
  Warnings:

  - A unique constraint covering the columns `[competenceId,title]` on the table `Exercise` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Exercise_competenceId_title_key" ON "Exercise"("competenceId", "title");
