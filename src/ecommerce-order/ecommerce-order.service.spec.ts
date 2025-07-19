import { Test, TestingModule } from '@nestjs/testing';
import { EcommerceOrderService } from './ecommerce-order.service';

describe('EcommerceOrderService', () => {
  let service: EcommerceOrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EcommerceOrderService],
    }).compile();

    service = module.get<EcommerceOrderService>(EcommerceOrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
