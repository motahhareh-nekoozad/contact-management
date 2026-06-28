export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type Status = 'NEW' | 'IN_PROGRESS' | 'RESOLVED';

export interface Message {
  id: string;
  name: string;
  contact_info: string;
  priority: Priority;
  status: Status;
  description: string;
  internal_notes?: string;
  done_at?:string,
  created_at: string;
  is_spam?: boolean;
}