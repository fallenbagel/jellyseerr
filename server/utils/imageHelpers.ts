import type { User } from '@server/entity/User';
import { createHash } from 'crypto';

export function computeImageHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export function getUserAvatarUrl(user: User): string {
  return `/avatarproxy/${user.jellyfinUserId}?v=${user.avatarVersion}`;
}
