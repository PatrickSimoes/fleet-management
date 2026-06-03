import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  licensePlate!: string;

  @IsString()
  @IsNotEmpty()
  chassis!: string;

  @IsString()
  @IsNotEmpty()
  renavam!: string;

  @IsInt()
  @Min(1900)
  year!: number;

  @IsString()
  @IsNotEmpty()
  color!: string;

  @IsUUID()
  modelId!: string;
}
