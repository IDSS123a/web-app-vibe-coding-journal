import { hash, compare } from "bcryptjs";

const BCRYPT_COST_FACTOR = 12; // E-4: minimum cost factor

export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_COST_FACTOR);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return compare(password, hash);
}
