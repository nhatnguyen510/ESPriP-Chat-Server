import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { join } from 'path';
import { ConfigModule } from 'src/config/config.module';
import { MailConfig } from 'src/config';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule], // 👈 import ConfigModule
      inject: [MailConfig],
      useFactory: (mailConfig: MailConfig) => ({
        transport: {
          host: mailConfig.host,
          secure: mailConfig.secure,
          auth: {
            user: mailConfig.user,
            pass: mailConfig.pass,
          },
        },
        defaults: {
          from: mailConfig.from,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(), // or new PugAdapter() or new EjsAdapter()
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService], // 👈 export for DI
})
export class MailModule {}
