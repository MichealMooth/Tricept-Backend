import { prismaTest, disconnect } from '../utils/prismaTestClient';

// DataScope type definition (validated at application layer)
// SQLite does not support native enums, so we use String type
type DataScope = 'GLOBAL' | 'TEAM' | 'USER';

// QuestionnaireStatus type definition (validated at application layer)
type QuestionnaireStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

describe('Scope and Questionnaire Models', () => {
  // Clean up after all tests
  afterAll(async () => {
    await disconnect();
  });

  // Clean up test data before each test
  beforeEach(async () => {
    // Delete in correct order due to foreign key constraints
    await prismaTest.question.deleteMany({});
    await prismaTest.questionnaire.deleteMany({});
    // Note: StrategicGoal cleanup should preserve existing data where possible
  });

  /**
   * Test 1: StrategicGoal with GLOBAL scope
   */
  it('should create StrategicGoal with GLOBAL scope', async () => {
    const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

    const goal = await prismaTest.strategicGoal.create({
      data: {
        key: `SG-TEST-${unique}`,
        title: 'Global Test Goal',
        description: 'A goal visible to all users',
        displayOrder: 1,
        isActive: true,
        scope: 'GLOBAL',
        teamGroupId: null,
      },
    });

    expect(goal.id).toBeDefined();
    expect(goal.scope).toBe('GLOBAL');
    expect(goal.teamGroupId).toBeNull();

    // Clean up
    await prismaTest.strategicGoal.delete({ where: { id: goal.id } });
  });

  /**
   * Test 2: StrategicGoal with TEAM scope and teamGroupId
   */
  it('should create StrategicGoal with TEAM scope and teamGroupId', async () => {
    const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

    // Create a TeamGroup first
    const teamGroup = await prismaTest.teamGroup.create({
      data: {
        name: `Test Team ${unique}`,
        isActive: true,
      },
    });

    const goal = await prismaTest.strategicGoal.create({
      data: {
        key: `SG-TEAM-${unique}`,
        title: 'Team Test Goal',
        description: 'A goal visible to team members only',
        displayOrder: 1,
        isActive: true,
        scope: 'TEAM',
        teamGroupId: teamGroup.id,
      },
    });

    expect(goal.id).toBeDefined();
    expect(goal.scope).toBe('TEAM');
    expect(goal.teamGroupId).toBe(teamGroup.id);

    // Clean up
    await prismaTest.strategicGoal.delete({ where: { id: goal.id } });
    await prismaTest.teamGroup.delete({ where: { id: teamGroup.id } });
  });

  /**
   * Test 3: StrategicGoal teamGroupId is nullable (for GLOBAL scope)
   */
  it('should allow StrategicGoal with null teamGroupId', async () => {
    const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

    // Create without teamGroupId - should work for GLOBAL scope
    const goal = await prismaTest.strategicGoal.create({
      data: {
        key: `SG-NULL-${unique}`,
        title: 'Global Goal Without Team',
        displayOrder: 1,
        isActive: true,
        scope: 'GLOBAL',
        // teamGroupId omitted (defaults to null)
      },
    });

    expect(goal.teamGroupId).toBeNull();

    // Clean up
    await prismaTest.strategicGoal.delete({ where: { id: goal.id } });
  });

  /**
   * Test 4: Questionnaire creation with all status values
   */
  it('should create Questionnaire with DRAFT, ACTIVE, and ARCHIVED status', async () => {
    const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const statuses: QuestionnaireStatus[] = ['DRAFT', 'ACTIVE', 'ARCHIVED'];

    for (const status of statuses) {
      const questionnaire = await prismaTest.questionnaire.create({
        data: {
          title: `Test Questionnaire ${status} ${unique}`,
          description: `A ${status.toLowerCase()} questionnaire`,
          version: 1,
          status: status,
          scope: 'GLOBAL',
          createdBy: 'test-user-id',
          updatedBy: 'test-user-id',
        },
      });

      expect(questionnaire.id).toBeDefined();
      expect(questionnaire.status).toBe(status);
      expect(questionnaire.version).toBe(1);
      expect(questionnaire.scope).toBe('GLOBAL');

      // Clean up
      await prismaTest.questionnaire.delete({ where: { id: questionnaire.id } });
    }
  });

  /**
   * Test 5: Question with questionType and displayOrder
   */
  it('should create Question with questionType and displayOrder', async () => {
    const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

    // Create questionnaire first
    const questionnaire = await prismaTest.questionnaire.create({
      data: {
        title: `Parent Questionnaire ${unique}`,
        version: 1,
        status: 'DRAFT',
        scope: 'GLOBAL',
      },
    });

    const question = await prismaTest.question.create({
      data: {
        questionnaireId: questionnaire.id,
        questionText: 'What is your skill level?',
        questionType: 'RATING',
        displayOrder: 1,
        isRequired: true,
        options: JSON.stringify([1, 2, 3, 4, 5]),
      },
    });

    expect(question.id).toBeDefined();
    expect(question.questionnaireId).toBe(questionnaire.id);
    expect(question.questionType).toBe('RATING');
    expect(question.displayOrder).toBe(1);
    expect(question.isRequired).toBe(true);
    expect(JSON.parse(question.options)).toEqual([1, 2, 3, 4, 5]);

    // Clean up
    await prismaTest.question.delete({ where: { id: question.id } });
    await prismaTest.questionnaire.delete({ where: { id: questionnaire.id } });
  });

  /**
   * Test 6: Questionnaire-Question relationship with cascade
   */
  it('should cascade delete Questions when Questionnaire is deleted', async () => {
    const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

    // Create questionnaire
    const questionnaire = await prismaTest.questionnaire.create({
      data: {
        title: `Cascade Test ${unique}`,
        version: 1,
        status: 'DRAFT',
        scope: 'GLOBAL',
      },
    });

    // Create multiple questions
    await prismaTest.question.create({
      data: {
        questionnaireId: questionnaire.id,
        questionText: 'Question 1',
        questionType: 'TEXT',
        displayOrder: 1,
        isRequired: false,
      },
    });

    await prismaTest.question.create({
      data: {
        questionnaireId: questionnaire.id,
        questionText: 'Question 2',
        questionType: 'CHOICE',
        displayOrder: 2,
        isRequired: true,
        options: JSON.stringify(['Yes', 'No', 'Maybe']),
      },
    });

    // Verify questions exist
    const questionsBefore = await prismaTest.question.findMany({
      where: { questionnaireId: questionnaire.id },
    });
    expect(questionsBefore).toHaveLength(2);

    // Delete the questionnaire
    await prismaTest.questionnaire.delete({
      where: { id: questionnaire.id },
    });

    // Verify questions are cascade deleted
    const questionsAfter = await prismaTest.question.findMany({
      where: { questionnaireId: questionnaire.id },
    });
    expect(questionsAfter).toHaveLength(0);
  });

  /**
   * Test 7: Questionnaire with TEAM scope requires teamGroupId relation
   */
  it('should create Questionnaire with TEAM scope and teamGroupId', async () => {
    const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

    // Create a TeamGroup first
    const teamGroup = await prismaTest.teamGroup.create({
      data: {
        name: `Questionnaire Team ${unique}`,
        isActive: true,
      },
    });

    const questionnaire = await prismaTest.questionnaire.create({
      data: {
        title: `Team Questionnaire ${unique}`,
        version: 1,
        status: 'ACTIVE',
        scope: 'TEAM',
        teamGroupId: teamGroup.id,
      },
    });

    expect(questionnaire.scope).toBe('TEAM');
    expect(questionnaire.teamGroupId).toBe(teamGroup.id);

    // Verify relation works
    const withTeam = await prismaTest.questionnaire.findUnique({
      where: { id: questionnaire.id },
      include: { teamGroup: true },
    });

    expect(withTeam?.teamGroup?.name).toBe(`Questionnaire Team ${unique}`);

    // Clean up
    await prismaTest.questionnaire.delete({ where: { id: questionnaire.id } });
    await prismaTest.teamGroup.delete({ where: { id: teamGroup.id } });
  });
});
