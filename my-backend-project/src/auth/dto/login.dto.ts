import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  tendn!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  matkhau!: string;
}
