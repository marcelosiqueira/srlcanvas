import { hash, verify } from "@node-rs/argon2";

// Defaults da lib: argon2id com parametros sadios (m=19456 KiB, t=2, p=1),
// alinhados a recomendacao OWASP. Sem opcoes customizadas de proposito.
export async function hashPassword(plain: string): Promise<string> {
  return hash(plain);
}

export async function verifyPassword(hashValue: string, plain: string): Promise<boolean> {
  try {
    return await verify(hashValue, plain);
  } catch {
    // Hash malformado/ilegivel: trata como credencial invalida.
    return false;
  }
}
