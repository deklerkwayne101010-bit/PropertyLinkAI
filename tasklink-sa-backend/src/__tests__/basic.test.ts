/**
 * Basic test to verify testing infrastructure is working
 */
describe('Testing Infrastructure', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });

  it('should validate basic data structures', () => {
    const validData = {
      phone: '+27712345678',
      location: 'Cape Town, Western Cape',
      budget: 500.00,
    };

    expect(validData.phone).toMatch(/^\+27[0-9]{9}$/);
    expect(validData.location).toContain('Cape Town');
    expect(validData.budget).toBeGreaterThan(0);
    expect(validData.budget).toBeLessThan(100000);
  });

  it('should handle arrays and objects', () => {
    const skills = ['cleaning', 'gardening', 'tutoring'];
    const user = {
      name: 'Test User',
      skills,
      verified: true,
    };

    expect(skills).toHaveLength(3);
    expect(skills).toContain('cleaning');
    expect(user.name).toBe('Test User');
    expect(user.verified).toBe(true);
    expect(user.skills).toEqual(['cleaning', 'gardening', 'tutoring']);
  });
});