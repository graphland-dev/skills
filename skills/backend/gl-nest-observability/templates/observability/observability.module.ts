import { type DynamicModule, Module } from "@nestjs/common";
import { driver } from "./telemetry";

/** Request instrumentation and global exception reporting. Import first in the root module. */
@Module({})
export class ObservabilityModule {
  static forRoot(): DynamicModule {
    return { module: ObservabilityModule, ...driver.nestModule() };
  }
}
