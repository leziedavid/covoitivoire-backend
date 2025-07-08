import { Injectable, InternalServerErrorException, NotFoundException, } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { CreateServiceDto, UpdateServiceDto, } from 'src/dto/request/service.dto';
import { CloudinaryService } from 'src/utils/cloudinary.service';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';
import { FunctionService } from 'src/utils/pagination.service';

@Injectable()
export class AllServiceService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinary: CloudinaryService,
        private readonly functionService: FunctionService,
    ) { }

    /** 🔄 Ajouter l’image à chaque service retourné */
    private async enrichWithImage(service: any): Promise<any> {
        const file = await this.prisma.fileManager.findFirst({
            where: {
                targetId: service.id,
                fileType: 'serviceImage',
            },
            orderBy: { createdAt: 'desc' },
        });

        return { ...service, imageUrl: file?.fileUrl || null, };
    }

    /** 🔍 Liste paginée de tous les services */
    async getAll(params: PaginationParamsDto): Promise<BaseResponse<any>> {

        const { page, limit } = params;
        const data = await this.functionService.paginate({
            model: 'Service',
            page: Number(page),
            limit: Number(limit),
            conditions: {},
            selectAndInclude: {
                select: null,
                include: { partner: true },
            },
            orderBy: { createdAt: 'desc' },
            fileTypeListes: ['serviceImage'],
        });

        return new BaseResponse(200, 'Liste des services récupérée', data);
    }

    async getOne(id: string): Promise<BaseResponse<any>> {
        const service = await this.prisma.service.findUnique({
            where: { id },
            include: { partner: true },
        });

        if (!service) throw new NotFoundException('Service introuvable');

        const enriched = await this.enrichWithImage(service);

        return new BaseResponse(200, 'Service récupéré', enriched);
    }

    async create(data: CreateServiceDto): Promise<BaseResponse<{ serviceId: string }>> {
        const { file, ...rest } = data;

        // Conversion manuelle des types
        const serviceData = {
            ...rest,
            price: Number(rest.price),
            promoPrice: Number(rest.promoPrice),
            isActivePromo: typeof rest.isActivePromo === 'string' ? rest.isActivePromo === 'true' : !!rest.isActivePromo,
            statusService: typeof rest.statusService === 'string' ? rest.statusService === 'true' : !!rest.statusService,
        };

        const service = await this.prisma.service.create({ data: serviceData });

        if (file) {
            try {
                const upload = await this.cloudinary.uploadFile(file.buffer, 'services');

                await this.prisma.fileManager.create({
                    data: {
                        ...upload,
                        fileType: 'serviceImage',
                        targetId: service.id,
                    },
                });

                await this.prisma.service.update({
                    where: { id: service.id },
                    data: { imageUrl: upload.fileUrl },
                });

            } catch (err) {
                throw new InternalServerErrorException('Erreur lors de l’upload de l’image du service');
            }
        }

        return new BaseResponse(201, 'Service créé', { serviceId: service.id });
    }


    async update(id: string, data: UpdateServiceDto): Promise<BaseResponse<{ serviceId: string }>> {
        const existing = await this.prisma.service.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Service introuvable');

        const { file, ...rest } = data;

        // Conversion manuelle des types
        const serviceData = {
            ...rest,
            price: rest.price !== undefined ? Number(rest.price) : undefined,
            promoPrice: rest.promoPrice !== undefined ? Number(rest.promoPrice) : undefined,
            isActivePromo: rest.isActivePromo !== undefined ? (typeof rest.isActivePromo === 'string' ? rest.isActivePromo === 'true' : !!rest.isActivePromo) : undefined,
            statusService: rest.statusService !== undefined ? (typeof rest.statusService === 'string' ? rest.statusService === 'true' : !!rest.statusService) : undefined,
        };

        await this.prisma.service.update({
            where: { id },
            data: serviceData,
        });

        if (file) {
            try {
                const upload = await this.cloudinary.uploadFile(file.buffer, 'services');

                await this.prisma.fileManager.create({
                    data: {
                        ...upload,
                        fileType: 'serviceImage',
                        targetId: id,
                    },
                });

                await this.prisma.service.update({
                    where: { id },
                    data: { imageUrl: upload.fileUrl },
                });
            } catch (err) {
                throw new InternalServerErrorException('Erreur lors de l’upload de l’image du service');
            }
        }

        return new BaseResponse(200, 'Service mis à jour', { serviceId: id });
    }


    async delete(id: string): Promise<BaseResponse<any>> {
        const existing = await this.prisma.service.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Service introuvable');

        await this.prisma.service.delete({ where: { id } });

        return new BaseResponse(200, 'Service supprimé', null);
    }

    /** 🔍 Services filtrés par type */
    async getAllByType(type: string, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page, limit } = params;

        const data = await this.functionService.paginate({
            model: 'Service',
            page: Number(page),
            limit: Number(limit),
            conditions: { type },
            selectAndInclude: {
                select: null,
                include: { partner: true },
            },
            orderBy: { createdAt: 'desc' },
            fileTypeListes: ['serviceImage'],
        });

        return new BaseResponse(200, `Services de type ${type} récupérés`, data);
    }

    /** 🔍 Services d’un partenaire */
    async getAllByPartner(partnerId: string, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page, limit } = params;

        const data = await this.functionService.paginate({
            model: 'Service',
            page: Number(page),
            limit: Number(limit),
            conditions: { partnerId },
            selectAndInclude: {
                select: null,
                include: { partner: true },
            },
            orderBy: { createdAt: 'desc' },
            fileTypeListes: ['serviceImage'],
        });

        return new BaseResponse(200, `Services du partenaire ${partnerId} récupérés`, data);
    }

}
