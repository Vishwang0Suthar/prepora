import { supabase } from "../db/supabase";
import type { PracticeProgress, PracticeItemType } from "../types/practice";
import type { UpdatePracticeProgressInput } from "../validators/practice.validator";

async function verifyKitOwnership(kitId: string, userId: string) {
  const { data, error } = await supabase
    .from("kits")
    .select("id")
    .eq("id", kitId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

export async function upsertPracticeProgress(
  kitId: string,
  userId: string,
  input: UpdatePracticeProgressInput,
): Promise<PracticeProgress> {
  const ownsKit = await verifyKitOwnership(kitId, userId);

  if (!ownsKit) {
    throw new Error("KIT_NOT_FOUND");
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("practice_progress")
    .upsert(
      {
        user_id: userId,
        kit_id: kitId,
        item_type: input.item_type,
        item_id: input.item_id,
        status: input.status,
        confidence_rating: input.confidence_rating ?? null,
        last_reviewed_at: now,
        updated_at: now,
      },
      {
        onConflict: "user_id,kit_id,item_type,item_id",
      },
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to update practice progress: ${
        error?.message ?? "Unknown error"
      }`,
    );
  }

  return data as PracticeProgress;
}

export async function getPracticeProgress(
  kitId: string,
  userId: string,
  itemType?: PracticeItemType,
) {
  const ownsKit = await verifyKitOwnership(kitId, userId);

  if (!ownsKit) {
    throw new Error("KIT_NOT_FOUND");
  }

  let query = supabase
    .from("practice_progress")
    .select("*")
    .eq("kit_id", kitId)
    .eq("user_id", userId)
    .order("updated_at", {
      ascending: false,
    });

  if (itemType) {
    query = query.eq("item_type", itemType);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to retrieve practice progress: ${error.message}`);
  }

  return data as PracticeProgress[];
}
