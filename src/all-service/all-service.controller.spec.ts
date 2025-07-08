import { Test, TestingModule } from '@nestjs/testing';
import { AllServiceController } from './all-service.controller';

describe('AllServiceController', () => {
  let controller: AllServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AllServiceController],
    }).compile();

    controller = module.get<AllServiceController>(AllServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
