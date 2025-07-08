// src/auth/auth.controller.ts
import {Controller,Post,Get,Patch,Delete,Body,UseGuards,Req,Param,UploadedFile,UseInterceptors, UnauthorizedException, Res, Query, UploadedFiles,} from '@nestjs/common';
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


@ApiTags('Auth Api')
@ApiBearerAuth('access-token') // <- Ajout ici pour Swagger
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }


    @Post('register')
    @ApiOperation({ summary: 'Enregistrement d’un nouvel utilisateur' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'file', maxCount: 1 },
            { name: 'carte', maxCount: 1 },
            { name: 'permis', maxCount: 1 },
        ])
    )
    @ApiBody({ type: RegisterDto })
    @ApiResponse({ status: 201, description: 'Utilisateur enregistré avec succès.' })
    async register(
        @UploadedFiles() files: { file?: Express.Multer.File[]; carte?: Express.Multer.File[]; permis?: Express.Multer.File[] },
        @Body() dto: RegisterDto,
    ) {
        dto.file = files.file?.[0] ?? null;
        dto.carte = files.carte?.[0] ?? null;
        dto.permis = files.permis?.[0] ?? null;
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

    // @UseGuards(JwtAuthGuard)
    @Patch('validate/:id')
    @ApiOperation({ summary: 'Valider un compte utilisateur' })
    @ApiResponse({ status: 200, description: 'Compte validé.' })
    async validateCompte(@Param('id') id: string) {
        return this.authService.validateCompte(id);
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
    @Post('partner/:partnerId/add-driver')
    @ApiOperation({ summary: 'Ajouter un chauffeur par un partenaire' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    @ApiBody({ type: RegisterDto })
    @ApiResponse({ status: 201, description: 'Chauffeur ajouté avec succès' })
    @ApiResponse({ status: 401, description: 'Partenaire invalide ou email déjà utilisé' })
    async addDriverByPartner(
        @Req() req: Request,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: RegisterDto,) {
        const user = req.user as any;
        dto.file = file;
        return this.authService.addDriverByPartner(user.userId, dto);
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
