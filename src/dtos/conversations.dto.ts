import { IsNumber, IsNotEmpty } from 'class-validator';

export class CreateUserConversationDto {
  @IsNumber()
  @IsNotEmpty()
  public user_id: number;
}
