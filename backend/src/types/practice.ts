export type PracticeItemType = "question" | "flashcard";

export type PracticeStatus = "unseen" | "attempted" | "completed";

export interface PracticeProgress {
  id: string;
  user_id: string;
  kit_id: string;
  item_type: PracticeItemType;
  item_id: string;
  status: PracticeStatus;
  confidence_rating: number | null;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}
