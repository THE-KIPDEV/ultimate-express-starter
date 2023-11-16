import { IsString, IsNotEmpty, MinLength, MaxLength, IsNumber, IsIn, IsArray } from 'class-validator';
const status = ['draft', 'published'];

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(192)
  public title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(10000)
  public content: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(380)
  public excerpt: string;

  @IsNumber()
  @IsNotEmpty()
  public user_id: number;

  @IsString()
  @IsIn(status)
  public status: string;

  @IsArray()
  @IsNotEmpty()
  public categories: number[];

  @IsArray()
  public medias: number[];
}
