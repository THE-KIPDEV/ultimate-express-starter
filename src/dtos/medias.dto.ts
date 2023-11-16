import { IsString, IsNotEmpty, MinLength, MaxLength, IsNumber, IsIn, IsArray, Matches, IsBase64 } from 'class-validator';
const type = ['document', 'image'];
const security = ['private', 'public'];

export class CreateMediaDto {
  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(type)
  public type: string;

  @IsString()
  @IsNotEmpty()
  public file_type: string;

  @IsNotEmpty()
  public file: string;

  @IsArray()
  public format: string[];

  @IsString()
  @IsNotEmpty()
  @IsIn(security)
  public security: string;
}
