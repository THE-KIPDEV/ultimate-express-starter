import { IsNumber } from 'class-validator';

export class CreateAdminDto {
  @IsNumber()
  public user_id: number;
}
