import type { UserProfile } from "@/types/index";

export interface PermissionContext {
  user: UserProfile | null;
  userId?: string;
}

export class PermissionDenied extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionDenied";
  }
}

// M-7: Single source of truth for authorization checks
// All permission logic flows through these functions.

export function requireAuth(context: PermissionContext): UserProfile {
  if (!context.user) {
    throw new PermissionDenied("Authentication required");
  }
  return context.user;
}

export function canViewDailyReport(context: PermissionContext): boolean {
  // All authenticated users can view daily reports
  return !!context.user;
}

export function canSaveArticle(context: PermissionContext): boolean {
  // All authenticated users can save articles to their bookmarks
  return !!context.user;
}

export function canAccessAdminPanel(): boolean {
  // Admin access — will be expanded when admin feature is implemented
  // For now, placeholder that prevents unauthorized access
  return false;
}
