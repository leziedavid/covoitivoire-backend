// src/users/dto/update-profile.dto.ts
import { IsOptional, IsString, IsEmail, MinLength } from 'class-validator'

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    name?: string

    @IsOptional()
    @IsEmail()
    email?: string

    @IsOptional()
    @IsString()
    phoneNumber?: string

    @IsOptional()
    @IsString()
    phoneCountryCode?: string

    @IsOptional()
    @IsString()
    @MinLength(6)
    password?: string
}
