import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('root')
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'API 루트 — 살아있는지 간단 확인' })
  root() {
    return {
      name: 'nestjs-tutorial API',
      docs: '/api/docs',
      health: '/api/health',
    };
  }
}
