export interface CreateKitRequest {
  company: string;
  company_url: string;
  role: string;
  location: string;
  jd_text: string;
  days_available: number;
}

export interface CreateKitResponse {
  ok: boolean;
  kit: {
    id: string;
    company: string;
    company_url: string;
    role_title: string;
    location: string | null;
    days_requested: number;
    status: "generating" | "ready" | "failed";
  };
}
