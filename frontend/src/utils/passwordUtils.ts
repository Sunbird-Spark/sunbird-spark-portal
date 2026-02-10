import bcrypt from 'bcryptjs';

/**
 * Hash a password using bcrypt
 * The backend will receive the hashed password and send it to the proxy
 * @param password - The plain text password to hash
 * @returns Promise with the bcrypt hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  // Using 10 rounds for bcrypt (good balance between security and performance)
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

/**
 * Verify a password against a bcrypt hash (for testing purposes)
 * @param password - The plain text password
 * @param hash - The bcrypt hash to compare against
 * @returns Promise with boolean indicating if password matches
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
