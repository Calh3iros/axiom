export type InviteCodeType =
  | "secretary"
  | "gre"
  | "director"
  | "teacher"
  | "owner";

export interface InviteCode {
  id: string;
  code: string;
  type: InviteCodeType;
  org_id: string;
  created_by: string;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RedeemResult {
  success: boolean;
  role: string;
  orgId: string;
  orgName: string;
  requiresSubjects: boolean;
}
