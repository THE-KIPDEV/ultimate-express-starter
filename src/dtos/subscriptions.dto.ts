import { IsString, IsNotEmpty, IsIn } from 'class-validator';
const periodicity = ['yearly', 'monthly'];

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(periodicity)
  public periodicity: string;
}
