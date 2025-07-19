import { Test, TestingModule } from '@nestjs/testing';
import { EcommerceOrderController } from './ecommerce-order.controller';

describe('EcommerceOrderController', () => {
  let controller: EcommerceOrderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EcommerceOrderController],
    }).compile();

    controller = module.get<EcommerceOrderController>(EcommerceOrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
