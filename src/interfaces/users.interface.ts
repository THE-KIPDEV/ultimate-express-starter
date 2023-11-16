export interface User {
  id?: number;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  created_at: Date;
  role: string;
  reset_password_token: string;
  reset_password_expires: Date;
}
