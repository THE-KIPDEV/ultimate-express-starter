export interface Article {
  id?: number;
  title: string;
  content: string;
  created_at: Date;
  user_id: number;
  status: string;
  excerpt: string;
  slug: string;
}
