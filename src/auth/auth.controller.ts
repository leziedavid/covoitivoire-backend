// src/auth/auth.controller.ts
import {Controller,Post,Get,Patch,Delete,Body,UseGuards,Req,Param,UploadedFile,UseInterceptors, UnauthorizedException, Res, Query, UploadedFiles, ParseEnumPipe,} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import {ApiTags,ApiOperation,ApiResponse,ApiConsumes,ApiBody, ApiBearerAuth, ApiQuery,} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from 'src/dto/request/register.dto';
import { LoginDto } from 'src/dto/request/login.dto';
import { ChangePasswordDto } from 'src/dto/request/change-password.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { UpdateUserDto } from 'src/dto/request/updateUser.dto';
import { UserOrTokenAuthGuard } from 'src/guards/user-or-token.guard';
import { Request } from 'express';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';
import { UserStatus } from '@prisma/client';
import { FilesUpdateDto } from 'src/dto/request/filesUpdatedto';
import { UpdateProfileDto } from 'src/dto/request/update-profile.dto';


@ApiTags('Auth Api')
@ApiBearerAuth('access-token') // <- Ajout ici pour Swagger
@Controller('auth')

export class AuthController {
    constructor(private readonly authService: AuthService) { }


    @Post('register')
    @ApiOperation({ summary: 'Enregistrement d’un nouvel utilisateur' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors( FileFieldsInterceptor([ { name: 'file', maxCount: 1 }, { name: 'carte', maxCount: 1 }, { name: 'permis', maxCount: 1 } ]))
    @ApiBody({ type: RegisterDto })
    @ApiResponse({ status: 201, description: 'Utilisateur enregistré avec succès.' })
    async register(
        @UploadedFiles() files: { file?: Express.Multer.File[]; carte?: Express.Multer.File[]; permis?: Express.Multer.File[] },
        @Body() dto: RegisterDto,
    ) {
        dto.file = files.file?.[0] ?? null;
        dto.carte = files.carte?.[0] ?? null;
        dto.permis = files.permis?.[0] ?? null;
        // console.log('🚀 Dto:', dto);
        return this.authService.register(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('update/:id')
    @ApiOperation({ summary: 'Mise à jour du profil utilisateur' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'file', maxCount: 1 },
            { name: 'carte', maxCount: 1 },
            { name: 'permis', maxCount: 1 },
        ])
    )
    @ApiBody({ type: UpdateUserDto })
    @ApiResponse({ status: 200, description: 'Profil mis à jour.' })
    async updateUser(
        @Param('id') id: string,
        @UploadedFiles() files: { file?: Express.Multer.File[]; carte?: Express.Multer.File[]; permis?: Express.Multer.File[] },
        @Body() dto: UpdateUserDto,
    ) {
        dto.file = files.file?.[0] ?? null;
        dto.carte = files.carte?.[0] ?? null;
        dto.permis = files.permis?.[0] ?? null;
        return this.authService.updateUser(id, dto);
    }



    @Post('login')
    @ApiOperation({ summary: 'Connexion utilisateur' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, description: 'Utilisateur connecté avec succès.' })
    @ApiResponse({ status: 401, description: 'Identifiants invalides.' })
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post('refresh')
    @ApiOperation({ summary: 'Rafraîchir le token d’accès' })
    @ApiBody({ schema: { type: 'object',required: ['refresh_token'], properties: { refresh_token: { type: 'string' } }, },})
    @ApiResponse({ status: 200, description: 'Token rafraîchi.' })
    @ApiResponse({ status: 401, description: 'Refresh token invalide.' })
    async refresh(@Body('refresh_token') token: string) {
        return this.authService.refreshToken(token);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('change-password')
    @ApiOperation({ summary: 'Changer le mot de passe utilisateur' })
    @ApiBody({ type: ChangePasswordDto })
    @ApiResponse({ status: 200, description: 'Mot de passe changé avec succès.' })
    @ApiResponse({ status: 401, description: 'Ancien mot de passe incorrect.' })
    async changePassword(@Body() dto: ChangePasswordDto) {
        return this.authService.changePassword(dto);
    }


    @UseGuards(JwtAuthGuard) // Protège l'accès à la liste des utilisateurs
    @Get('users')
    @ApiOperation({ summary: 'Liste paginée de tous les utilisateurs avec relations' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiResponse({ status: 200, description: 'Liste des utilisateurs récupérée avec succès.' })
    async getAllUsers(@Query() params: PaginationParamsDto) {
        return this.authService.getAllUsers(params);
    }

    // @UseGuards(JwtAuthGuard)
    // @Patch('validate/:id')
    // @ApiOperation({ summary: 'Valider un compte utilisateur' })
    // @ApiResponse({ status: 200, description: 'Compte validé.' })
    // async validateCompte(@Param('id') id: string, @Param('status') status: string) {
    //     return this.authService.validateCompte(id, status);
    // }

    @Patch('validate/:id/:status')
    @ApiOperation({ summary: 'Valider un compte utilisateur' })
    @ApiResponse({ status: 200, description: 'Compte validé.' })
    async validateCompte(
        @Param('id') id: string,
        @Param('status', new ParseEnumPipe(UserStatus)) status: UserStatus,
    ) {
        return this.authService.validateCompte(id, status);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('delete/:id')
    @ApiOperation({ summary: 'Supprimer un utilisateur' })
    @ApiResponse({ status: 200, description: 'Utilisateur supprimé.' })
    async deleteUser(@Param('id') id: string) {
        return this.authService.deleteUser(id);
    }


    @Get('userdata')
    @UseGuards(UserOrTokenAuthGuard)
    @ApiBearerAuth()
    @ApiQuery({ name: 'userId', required: false, description: 'ID utilisateur si pas de token' })
    @ApiOperation({ summary: 'Récupérer les données utilisateur avec userId ou token' })
    @ApiResponse({ status: 200, description: 'Données utilisateur récupérées.' })
    @ApiResponse({ status: 401, description: 'Token ou userId manquant/invalide.' })
    async getUserData(@Req() req: any) {
        return this.authService.mapUserToResponse(req.user);
    }

    // ParametresuserData get userData

    @Get('parametres/user/infos')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Récupérer les données utilisateur pour le parametre' })
    @ApiResponse({ status: 200, description: 'Données utilisateur récupérées.' })
    @ApiResponse({ status: 401, description: 'Token ou userId manquant/invalide.' })
    async ParametresuserData(@Req() req: any) {
        // console.log("🚀 ParametresuserData",req.user);
        return this.authService.ParametresuserData(req.user.userId);
    }

    // updateFiles
    @UseGuards(JwtAuthGuard)
    @Patch('users/files/update')
    @ApiOperation({ summary: 'Mise à jour des fichiers utilisateur' })
    @ApiResponse({ status: 200, description: 'Fichiers mis à jour avec succès.' })
    @ApiResponse({ status: 401, description: 'Token ou userId manquant/invalide.' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors( FileFieldsInterceptor([ { name: 'file', maxCount: 1 }, ]))
    async updateFiles(
        @Req() req: any,
        @UploadedFiles() files: { file?: Express.Multer.File[]},
        @Body() dto: FilesUpdateDto) {
        dto.file = files.file?.[0] ?? null;
        return this.authService.updateFiles(req.user.userId, dto);
    }

    // updateProfile
    @UseGuards(JwtAuthGuard)
    @Patch('users/profile/update/data')
    @ApiOperation({ summary: 'Mise à jour du profil utilisateur' })
    @ApiResponse({ status: 200, description: 'Profil mis à jour avec succès.' })
    @ApiResponse({ status: 401, description: 'Token ou userId manquant/invalide.' })
    async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
        return this.authService.updateProfile(req.user.userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('vehicle/:vehicleId/assign-driver/:driverId')
    @ApiOperation({ summary: 'Affecter un chauffeur à un véhicule' })
    @ApiResponse({ status: 200, description: 'Chauffeur affecté au véhicule' })
    @ApiResponse({ status: 404, description: 'Véhicule introuvable' })
    @ApiResponse({ status: 401, description: 'Chauffeur invalide' })
    async assignVehicleToDriver( @Param('vehicleId') vehicleId: string, @Param('driverId') driverId: string,) {
        return this.authService.assignVehicleToDriver(vehicleId, driverId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('vehicle/:vehicleId/remove-driver/:driverId')
    @ApiOperation({ summary: 'Retirer un chauffeur d’un véhicule' })
    @ApiResponse({ status: 200, description: 'Chauffeur retiré du véhicule' })
    @ApiResponse({ status: 404, description: 'Véhicule introuvable' })
    async removeDriverFromVehicle( @Param('vehicleId') vehicleId: string, @Param('driverId') driverId: string,) {
        return this.authService.removeDriverFromVehicle(vehicleId, driverId);
    }


    @UseGuards(JwtAuthGuard)
    @Post('partner/add-driver/one')
    @ApiOperation({ summary: 'Ajouter un chauffeur par un partenaire' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors( FileFieldsInterceptor([ { name: 'file', maxCount: 1 }, { name: 'carte', maxCount: 1 }, { name: 'permis', maxCount: 1 } ]))
    @ApiBody({ type: RegisterDto })
    @ApiResponse({ status: 201, description: 'Utilisateur enregistré avec succès.' })
    async addDriverByPartner(
        @UploadedFiles() files: { file?: Express.Multer.File[]; carte?: Express.Multer.File[]; permis?: Express.Multer.File[] },
        @Body() dto: RegisterDto,
        @Req() req: Request,) {
        const user = req.user as any;
        dto.file = files.file?.[0] ?? null;
        dto.carte = files.carte?.[0] ?? null;
        dto.permis = files.permis?.[0] ?? null;
        // console.log('🚀 Dto:', dto,user.userId);
        return this.authService.addDriverByPartner(user.userId,dto);
    }



    @UseGuards(JwtAuthGuard)
    @Get('drivers/by-partner/all')
    @ApiOperation({ summary: 'Liste des chauffeurs du partenaire connecté (ou tous si ADMIN)' })
    @ApiResponse({ status: 200, description: 'Liste des chauffeurs retournée avec succès.' })
    async getDriversByPartner(@Req() req: Request) {
    const user = req.user as any;
    return this.authService.getDriversByPartner(user.userId);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Accès au profil utilisateur (JWT requis)' })
    @ApiResponse({ status: 200, description: 'Profil retourné.' })
    getProfile(@Req() req) { return req.user; }

}



// UPDATE public."User"
// SET
//   "phoneCountryCode" = '+225',
//   "phoneNumber" = '0153686821'
// WHERE id = 'd21bf1d2-d311-4c3d-b927-9bf298665c71';
