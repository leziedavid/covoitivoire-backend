import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'admin@gmail.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password123' })
    @IsNotEmpty()
    @MinLength(6)
    password: string;
    
    @ApiPropertyOptional()
    @IsOptional()
    @ApiProperty({ example: '+33 612345678' })
    phoneNumber?: string;
}
