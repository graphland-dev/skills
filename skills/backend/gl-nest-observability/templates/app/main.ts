import "./instrument"; // must stay the first import

import { Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  AppLogger,
  ObservabilityModule,
  traceProviders,
} from "../observability";

@Module({
  imports: [ObservabilityModule.forRoot() /* , ...feature modules */],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: new AppLogger() });
  traceProviders(app);
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
