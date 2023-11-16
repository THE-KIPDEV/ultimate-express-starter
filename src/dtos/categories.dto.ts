import { IsString, IsNotEmpty, MinLength, MaxLength, IsNumber, IsIn, IsArray, Matches } from 'class-validator';
const status = ['draft', 'published'];

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(192)
  public title: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
  public color: string;
}
