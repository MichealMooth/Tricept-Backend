-- Add CHECK constraint for StrategicGoalRating rating (1-5)
-- SQLite does not support ALTER TABLE ADD CONSTRAINT, so we use triggers.

-- Create a trigger to validate rating on INSERT
CREATE TRIGGER IF NOT EXISTS check_strategic_goal_rating_insert
BEFORE INSERT ON StrategicGoalRating
BEGIN
    SELECT CASE
        WHEN NEW.rating < 1 OR NEW.rating > 5 THEN
            RAISE(ABORT, 'StrategicGoalRating rating must be between 1 and 5')
    END;
END;

-- Create a trigger to validate rating on UPDATE
CREATE TRIGGER IF NOT EXISTS check_strategic_goal_rating_update
BEFORE UPDATE ON StrategicGoalRating
BEGIN
    SELECT CASE
        WHEN NEW.rating < 1 OR NEW.rating > 5 THEN
            RAISE(ABORT, 'StrategicGoalRating rating must be between 1 and 5')
    END;
END;
