import { Test, TestingModule } from '@nestjs/testing';
import { AllServiceService } from './all-service.service';

describe('AllServiceService', () => {
  let service: AllServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AllServiceService],
    }).compile();

    service = module.get<AllServiceService>(AllServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
