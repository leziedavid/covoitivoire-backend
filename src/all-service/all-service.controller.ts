// src/service/all-service.controller.ts
import {Controller, Get, Post, Patch, Delete, Param, Body, UseGuards,UploadedFile, UseInterceptors, Req, Query} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth, ApiBody, ApiQuery} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { AllServiceService } from './all-service.service';
import { CreateServiceDto, UpdateServiceDto } from 'src/dto/request/service.dto';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';

@ApiTags('Services')
@ApiBearerAuth('access-token')
@Controller('services')

export class AllServiceController {
    constructor(private readonly serviceService: AllServiceService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer un nouveau service' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    @ApiBody({ type: CreateServiceDto })
    @ApiResponse({ status: 201, description: 'Service créé avec succès' })
    async create( @UploadedFile() file: Express.Multer.File,@Body() dto: CreateServiceDto,) {
        dto.file = file;
        return this.serviceService.create(dto);
    }

    // @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'Récupérer tous les services' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Liste des services récupérée' })
    async getAll(@Query() params: PaginationParamsDto) {
        return this.serviceService.getAll(params);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer un service par son ID' })
    @ApiResponse({ status: 200, description: 'Service récupéré' })
    @ApiResponse({ status: 404, description: 'Service introuvable' })
    async getOne(@Param('id') id: string) {
        return this.serviceService.getOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour un service' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    @ApiBody({ type: UpdateServiceDto })
    @ApiResponse({ status: 200, description: 'Service mis à jour' })
    async update(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UpdateServiceDto,
    ) {
        dto.file = file;
        return this.serviceService.update(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un service' })
    @ApiResponse({ status: 200, description: 'Service supprimé' })
    @ApiResponse({ status: 404, description: 'Service introuvable' })
    async delete(@Param('id') id: string) {
        return this.serviceService.delete(id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('type/:type')
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Services filtrés par type' })
    async getAllByType(@Param('type') type: string, @Query() params: PaginationParamsDto) {
        return this.serviceService.getAllByType(type, params);
    }

    @UseGuards(JwtAuthGuard)
    @Get('partner/:partnerId')
    @ApiOperation({ summary: 'Lister les services d’un partenaire donné' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Services du partenaire récupérés' })
    async getAllByPartner(@Param('partnerId') partnerId: string, @Query() params: PaginationParamsDto) {
        return this.serviceService.getAllByPartner(partnerId, params);
    }

}