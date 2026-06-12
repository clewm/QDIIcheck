import { getStorage } from "./storage";

export interface Subscription {
  email: string;
  notifyTime: string; // "HH:MM" 北京时间
  fundCodes: string[];
  active: boolean;
  createdAt: string;
}

async function readAll(): Promise<Subscription[]> {
  const raw = await getStorage().getSubscriptions();
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeAll(subs: Subscription[]): Promise<void> {
  await getStorage().saveSubscriptions(JSON.stringify(subs, null, 2));
}

export async function getAllSubscriptions(): Promise<Subscription[]> {
  return (await readAll()).filter((s) => s.active);
}

export async function getSubscription(
  email: string
): Promise<Subscription | undefined> {
  return (await readAll()).find((s) => s.email === email);
}

export async function upsertSubscription(
  email: string,
  notifyTime: string,
  fundCodes: string[]
): Promise<Subscription> {
  const all = await readAll();
  const existing = all.find((s) => s.email === email);

  if (existing) {
    existing.notifyTime = notifyTime;
    existing.fundCodes = fundCodes;
    existing.active = true;
  } else {
    all.push({
      email,
      notifyTime,
      fundCodes,
      active: true,
      createdAt: new Date().toISOString(),
    });
  }

  await writeAll(all);
  return all.find((s) => s.email === email)!;
}

export async function deactivateSubscription(
  email: string
): Promise<boolean> {
  const all = await readAll();
  const sub = all.find((s) => s.email === email);
  if (!sub) return false;
  sub.active = false;
  await writeAll(all);
  return true;
}
