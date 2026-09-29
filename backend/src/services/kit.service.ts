import { randomUUID } from "crypto";
import type { InterviewKit } from "../types/kit";
import { supabase } from "../db/supabase";
import type { CreateKitRequestInput } from "../validators/kit-request.validator";

export async function createKit(input: CreateKitRequestInput, userId: string) {
  const kitId = randomUUID();

  const { data, error } = await supabase
    .from("kits")
    .insert({
      id: kitId,
      user_id: userId,
      company: input.company,
      company_url: input.company_url,
      role_title: input.role,
      location: input.location || null,
      jd_text: input.jd_text,
      days_requested: input.days_available,
      status: "generating",
      kit_json: null,
      error_code: null,
      error_message: null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create kit: ${error.message}`);
  }

  return data;
}

export async function markKitReady(
  kitId: string,
  userId: string,
  kit: InterviewKit,
) {
  const { data, error } = await supabase
    .from("kits")
    .update({
      status: "ready",
      kit_json: kit,
      error_code: null,
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", kitId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save completed kit: ${error.message}`);
  }

  return data;
}

export async function markKitFailed(
  kitId: string,
  userId: string,
  errorCode: string,
  errorMessage: string,
) {
  const { data, error } = await supabase
    .from("kits")
    .update({
      status: "failed",
      error_code: errorCode,
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", kitId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save kit failure: ${error.message}`);
  }

  return data;
}
export async function getKit(kitId: string, userId: string) {
  const { data, error } = await supabase
    .from("kits")
    .select("*")
    .eq("id", kitId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to retrieve kit: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return data;
}
export async function updateKitProgress(
  kitId: string,
  userId: string,
  progressStep: string,
) {
  const { error } = await supabase
    .from("kits")
    .update({
      progress_step: progressStep,
      updated_at: new Date().toISOString(),
    })
    .eq("id", kitId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to update kit progress: ${error.message}`);
  }
}
export async function getKits(userId: string) {
  const { data, error } = await supabase
    .from("kits")
    .select("id, company, role_title, status, days_requested, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to retrieve kits: ${error.message}`);
  }

  return data;
}

export async function updateKitJson(
  kitId: string,
  userId: string,
  kitJson: InterviewKit,
) {
  const { error } = await supabase
    .from("kits")
    .update({
      kit_json: kitJson,
      updated_at: new Date().toISOString(),
    })
    .eq("id", kitId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to update kit JSON: ${error.message}`);
  }
}
