export interface Subscription {
  id?: number;
  periodicity: string;
  created_at: Date;
  status: string;
  user_id: number;
  session_stripe: string;
  sub_id: string;
  customer_id: string;
}
