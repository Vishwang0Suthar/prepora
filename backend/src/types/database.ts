export type KitStatus = "generating" | "ready" | "failed";

export interface Kit {
  id: string;
  user_id: string;
  company: string;
  company_url: string;
  role_title: string;
  location: string | null;
  jd_text: string;
  days_requested: number;
  status: KitStatus;
  progress_step: string | null;
  kit_json: unknown;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
