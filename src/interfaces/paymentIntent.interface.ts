export interface PaymentsIntent {
  id?: number;
  created_at: Date;
  user_id: number;
  session_stripe: string;
  customer_id: string;
  payment_id: string;
  product: string;
}
