import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { OcrModule } from './ocr/ocr.module'
import { OpenaiModule } from './openai/openai.module'
import { DbModule } from './db/db.module'
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    OcrModule,
    OpenaiModule,
    DbModule,
    HttpModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}