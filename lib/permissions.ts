import type { UserProfile } from "@/lib/validation/schemas";

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

export function canAccessAdminPanel(context: PermissionContext): boolean {
  // E-4: Admin role required for admin panel access
  if (!context.user) return false;
  return context.user.role === "admin";
}

export function canApproveReports(context: PermissionContext): boolean {
  // Admin role required to approve held reports
  if (!context.user) return false;
  return context.user.role === "admin";
}

export function canRejectReports(context: PermissionContext): boolean {
  // Admin role required to reject held reports
  if (!context.user) return false;
  return context.user.role === "admin";
}
