import { ApiProperty } from '@nestjs/swagger';
import {
    Role,
    UserStatus,
    OrderStatus,
    TripStatus,
    VehicleType,
    TransactionType,
    PaymentMethod,
} from '@prisma/client';

// === Sub-DTOs ===

export class FileManagerDto {
    @ApiProperty()
    fileUrl: string;

    @ApiProperty()
    fileType: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

export class TransactionDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    amount: number;

    @ApiProperty({ enum: TransactionType })
    type: TransactionType;

    @ApiProperty({ nullable: true })
    reference: string | null;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

export class WalletDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    balance: number;

    @ApiProperty({ type: [TransactionDto] })
    transactions: TransactionDto[];

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

export class VehicleDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    brand: string;

    @ApiProperty()
    capacity: number;

    @ApiProperty()
    fuel: string;

    @ApiProperty()
    color: string;

    @ApiProperty()
    model: string;

    @ApiProperty()
    registration: string;

    @ApiProperty()
    licensePlate: string;

    @ApiProperty()
    serialNumber: string;

    @ApiProperty({ enum: VehicleType })
    type: VehicleType;

    @ApiProperty()
    partnerId: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
    @ApiProperty({ type: [FileManagerDto] })
    files: FileManagerDto[];
}

export class StopPointDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    latitude: number;

    @ApiProperty()
    longitude: number;

    @ApiProperty()
    order: number;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

export class TripDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    departure: string;

    @ApiProperty()
    arrival: string;

    @ApiProperty()
    date: Date;

    @ApiProperty()
    estimatedArrival: Date;

    @ApiProperty()
    distance: number;

    @ApiProperty({ nullable: true })
    description: string | null;

    @ApiProperty({ nullable: true })
    instructions: string | null;

    @ApiProperty({ enum: TripStatus })
    status: TripStatus;

    @ApiProperty({ type: [StopPointDto] })
    stopPoints: StopPointDto[];

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

export class OrderDto {
    @ApiProperty()
    id: string;

    @ApiProperty({ enum: OrderStatus })
    status: OrderStatus;

    @ApiProperty({ enum: PaymentMethod })
    paymentMethod: PaymentMethod;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty({ type: TripDto })
    trip: TripDto;
}

export class MenuItemDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    price: number;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

export class ServiceOrderDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    quantity: number;

    @ApiProperty({ enum: OrderStatus })
    status: OrderStatus;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty({ type: MenuItemDto })
    menuItem: MenuItemDto;
}

export class ServiceWithMenusDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ nullable: true })
    description: string | null;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty({ type: [MenuItemDto] })
    menuItems: MenuItemDto[];
}

// === Final DTO ===

export class UserResponseDataDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ enum: Role })
    role: Role;

    @ApiProperty({ enum: UserStatus })
    status: UserStatus;

    @ApiProperty({ nullable: true })
    phoneCountryCode: string | null;

    @ApiProperty({ nullable: true })
    phoneNumber: string | null;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty({ nullable: true })
    imageUrl: string | null;

    @ApiProperty({ type: WalletDto, nullable: true })
    wallet: WalletDto | null;

    @ApiProperty({ type: [VehicleDto] })
    vehiclesOwned: VehicleDto[];

    @ApiProperty({ type: [VehicleDto] })
    vehiclesDriven: VehicleDto[];

    @ApiProperty({ type: [TripDto] })
    trips: TripDto[];

    @ApiProperty({ type: [OrderDto] })
    orders: OrderDto[];

    @ApiProperty({ type: [ServiceOrderDto] })
    serviceOrders: ServiceOrderDto[];

    @ApiProperty({ type: [ServiceWithMenusDto] })
    services: ServiceWithMenusDto[];


    // === ✅ Nouvelles relations ===

    @ApiProperty({ type: String, nullable: true })
    partnerId: string | null;

    @ApiProperty({ type: () => UserResponseDataDto, nullable: true })
    partner: UserResponseDataDto | null;

    @ApiProperty({ type: () => [UserResponseDataDto] })
    drivers: UserResponseDataDto[];

}
