import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateModelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsUUID()
  brandId!: string;
}
