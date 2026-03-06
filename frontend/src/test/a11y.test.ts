import { describe, it, expect } from 'vitest';
import { axe } from 'vitest-axe';
import 'vitest-axe/extend-expect';

describe('accessibility setup', () => {
  it('should demonstrate a passing accessibility test', async () => {
    const html = '<main><h1>Hello World</h1></main>';
    const results = await axe(html);
    expect(results).toHaveNoViolations();
  });
});
