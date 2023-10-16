import { TypedConfigModule, selectConfig } from 'nest-typed-config';
import { AppConfig, RootConfig } from '.';
import { loadConfig } from 'src/utils/load-config';

export const ConfigModule = TypedConfigModule.forRoot({
  schema: RootConfig,
  load: loadConfig,
});

export const appConfig = selectConfig(ConfigModule, AppConfig);
