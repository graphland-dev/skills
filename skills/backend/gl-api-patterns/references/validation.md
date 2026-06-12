# Validation — class-validator DTOs + global ValidationPipe

## Why this pattern

All request validation happens declaratively on DTO classes; handlers receive already-validated, already-transformed, whitelisted objects. No hand-rolled checks in services.

## Global pipe (once, in main.ts)

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,             // strip unknown properties
    transform: true,             // instantiate DTO classes + run @Type coercion
    forbidNonWhitelisted: true,  // reject requests with unknown properties
  }),
);
```

All three flags are mandatory — `forbidNonWhitelisted` turns client typos into 400s instead of silently dropping data.

## DTO conventions

```ts
export class CreateEntityDto {
  @ApiProperty({ example: 'My entity' })      // every field gets Swagger metadata
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()                               // optional = @ApiPropertyOptional + @IsOptional
  @IsString()
  description?: string;
}
```

- Query DTOs need `@Type(() => Number)` for numeric params (query strings arrive as strings) — `PaginationQueryDto` shows the pattern.
- Enums: `@IsEnum(EntityStatus)` + `@ApiPropertyOptional({ enum: EntityStatus })`, with the enum living in `<feature>.contracts.ts`.
- Update DTOs are explicit (every field optional + validated), not `PartialType` magic — keeps Swagger output exact.
- Response DTOs (`EntityResponseDto`) are plain classes with `@ApiProperty` only — no validators; they document the contract and type the service's `toResponse()`.

## Cross-field rules — custom validator constraint

When validity spans fields ("either `text` or `mediaUrl` required"):

```ts
@ValidatorConstraint({ name: 'textOrMediaUrl', async: false })
class TextOrMediaUrlConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const input = args.object as SendMessageDto;
    return Boolean(input.text?.trim() || input.mediaUrl?.trim());
  }
  defaultMessage(): string {
    return 'Either text or mediaUrl must be provided';
  }
}

export class SendMessageDto {
  // ...fields...
  @Validate(TextOrMediaUrlConstraint)
  private readonly _textOrMediaUrl?: never;  // phantom field hosts the rule
}
```

## Error shape

The global `HttpExceptionFilter` (`templates/common/http-exception.filter.ts`) normalizes every error to `{ statusCode, message, error }`; ValidationPipe failures pass through it as 400s with the per-field messages array. Frontends can rely on `message` being a string or string[].

## Format validation belongs in the DTO

Regex/format rules live on the DTO (`@Matches`, `@IsUrl({ require_protocol: true })`, `@IsEmail`), with a human `message` — never inside services. Environment validation is separate (Joi at boot — see [config.md](config.md)).
