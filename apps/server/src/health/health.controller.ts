import { Controller, Get } from '@nestjs/common';
import { DeviceStatus } from '@tunefour/shared-types';
import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'tunefour-server',
      // Referenced to prove the shared-types package is wired in.
      deviceStatuses: Object.values(DeviceStatus),
      timestamp: new Date().toISOString(),
    };
  }
}
