import { Module } from '@nestjs/common'
import { DbService } from './db.service'
import { DbController } from './db.controller'
import { PrismaService } from '../prisma.service'

@Module({
  imports: [],
  controllers: [DbController],
  providers: [DbService, PrismaService],
})
export class DbModule {}
