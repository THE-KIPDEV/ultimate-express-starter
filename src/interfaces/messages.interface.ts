export interface ConversationUser {
  id?: number;
  user_id: number;
  created_at?: Date;
  updated_at?: Date;
  content: string;
  read: boolean;
  read_at?: Date;
}
