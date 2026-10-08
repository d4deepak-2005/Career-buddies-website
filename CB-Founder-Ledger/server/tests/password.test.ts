import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/lib/password';

describe('password hashing', () => {
  it('never returns the plain password and uses bcrypt', async () => {
    const hash = await hashPassword('s3cret-passphrase!', 4);
    expect(hash).not.toContain('s3cret-passphrase!');
    expect(hash).toMatch(/^\$2[aby]\$04\$/);
  });

  it('verifies the right password and rejects the wrong one', async () => {
    const hash = await hashPassword('s3cret-passphrase!', 4);
    expect(await verifyPassword('s3cret-passphrase!', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('salts: the same password hashes differently each time', async () => {
    expect(await hashPassword('same-password-123', 4)).not.toBe(await hashPassword('same-password-123', 4));
  });
});
