import { cookies } from "next/headers";
import { COOKIE, verifySession } from "./auth";

export async function getSessionUserId(): Promise<number | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  return verifySession(raw);
}
