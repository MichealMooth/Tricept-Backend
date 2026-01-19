-- Add CHECK constraint for SkillAssessment rating (1-10)
-- SQLite does not support ALTER TABLE ADD CONSTRAINT, so we recreate the table with the constraint.
-- However, for simplicity and to maintain data, we use a TRIGGER-based approach for SQLite.

-- For SQLite: Use a trigger to enforce the constraint
-- (CHECK constraints added via CREATE TABLE work, but ALTER TABLE ADD CHECK is not supported)

-- Create a trigger to validate rating on INSERT
CREATE TRIGGER IF NOT EXISTS check_skill_assessment_rating_insert
BEFORE INSERT ON SkillAssessment
BEGIN
    SELECT CASE
        WHEN NEW.rating < 1 OR NEW.rating > 10 THEN
            RAISE(ABORT, 'SkillAssessment rating must be between 1 and 10')
    END;
END;

-- Create a trigger to validate rating on UPDATE
CREATE TRIGGER IF NOT EXISTS check_skill_assessment_rating_update
BEFORE UPDATE ON SkillAssessment
BEGIN
    SELECT CASE
        WHEN NEW.rating < 1 OR NEW.rating > 10 THEN
            RAISE(ABORT, 'SkillAssessment rating must be between 1 and 10')
    END;
END;
