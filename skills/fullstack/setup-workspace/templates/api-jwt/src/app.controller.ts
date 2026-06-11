import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { HealthResponseDto, RootResponseDto } from '@/app.dto';

const API_NAME = 'GraphLand API';
const API_VERSION = '1.0';

@ApiTags('Root')
@AllowAnonymous()
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'API entry point with HATEOAS links' })
  @ApiOkResponse({ type: RootResponseDto })
  root(): RootResponseDto {
    return {
      name: API_NAME,
      version: API_VERSION,
      _links: {
        self: { href: '/', rel: 'self', method: 'GET' },
        health: {
          href: '/health',
          rel: 'health',
          method: 'GET',
          type: 'application/json',
        },
        coreApiDocs: {
          href: '/docs',
          rel: 'documentation',
          method: 'GET',
          type: 'text/html',
        },
        authApiDocs: {
          href: '/auth/reference',
          rel: 'auth-documentation',
          method: 'GET',
          type: 'text/html',
        },
      },
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({ type: HealthResponseDto })
  health(): HealthResponseDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      _links: {
        self: {
          href: '/health',
          rel: 'self',
          method: 'GET',
          type: 'application/json',
        },
        root: { href: '/', rel: 'root', method: 'GET' },
      },
    };
  }
}
