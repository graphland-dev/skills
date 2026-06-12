import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiLinkDto {
  @ApiProperty({ example: '/health' })
  href: string;

  @ApiProperty({ example: 'health' })
  rel: string;

  @ApiPropertyOptional({ example: 'GET' })
  method?: string;

  @ApiPropertyOptional({ example: 'application/json' })
  type?: string;
}

export class ApiLinksDto {
  @ApiProperty({ type: ApiLinkDto })
  self: ApiLinkDto;

  @ApiProperty({ type: ApiLinkDto })
  health: ApiLinkDto;

  @ApiProperty({ type: ApiLinkDto })
  coreApiDocs: ApiLinkDto;

  @ApiProperty({ type: ApiLinkDto })
  authApiDocs: ApiLinkDto;
}

export class RootResponseDto {
  @ApiProperty({ example: 'GraphLand API' })
  name: string;

  @ApiProperty({ example: '1.0' })
  version: string;

  @ApiProperty({ type: ApiLinksDto })
  _links: ApiLinksDto;
}

export class HealthLinksDto {
  @ApiProperty({ type: ApiLinkDto })
  self: ApiLinkDto;

  @ApiProperty({ type: ApiLinkDto })
  root: ApiLinkDto;
}

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: '2026-05-24T10:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: 123.456 })
  uptime: number;

  @ApiProperty({ type: HealthLinksDto })
  _links: HealthLinksDto;
}
