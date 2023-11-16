export interface Media {
  id?: number;
  name: string;
  type: string;
  url: string;
  sub_type: string;
  file_type: string;
  created_at: Date;
  updated_at: Date;
  created_by: number;
  updated_by: number;
  formats: string;
  security: string;
  weight: number;
}
