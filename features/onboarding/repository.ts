import { supabase } from "@/lib/db/client";
import type { UserProfile } from "@/lib/validation/schemas";

export async function getUserProfileById(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as UserProfile;
}

export async function getUserProfileByEmail(email: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !data) {
    return null;
  }

  return data as UserProfile;
}
