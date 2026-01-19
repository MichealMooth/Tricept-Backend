import { prismaTest } from './prismaTestClient';

export async function seedBasic() {
  const unique = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`

  const emp = await prismaTest.employee.create({
    data: {
      email: `emp+${unique}@example.com`,
      firstName: 'Erika',
      lastName: 'Mustermann',
      passwordHash: 'x', // not used in tests
      department: 'Consulting',
      isAdmin: false,
    },
  });

  const cat = await prismaTest.skillCategory.create({
    data: { name: `Testing_${unique}`, isActive: true, displayOrder: 0 },
  });

  const skill = await prismaTest.skill.create({
    data: { name: `Unit Testing_${unique}`, categoryId: cat.id, isActive: true, displayOrder: 0 },
  });

  return { emp, cat, skill };
}
