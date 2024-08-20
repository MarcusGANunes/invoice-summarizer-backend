import { Controller, Post, Body, Param, Get } from '@nestjs/common'
import { DbService } from './db.service'

@Controller('db')
export class DbController {
  constructor(private readonly dbService: DbService) {}

  @Post('add-invoice')
  async addElement(@Body('name') name: string, @Body('summary') summary: string) {
    const newElement = await this.dbService.addInvoice(name, summary)
    return newElement
  }

  @Post('add-comment/:id')
  async addComment(
    @Param('id') id: string,
    @Body('name') name: string,
    @Body('comment') comment: string,
  ) {
    const newComment = { name, comment }
    const results = await this.dbService.addComment(id, newComment)
    return results
  }

  @Get('invoice/:id')
  async getInvoiceById(@Param('id') id: string) {
    const element = await this.dbService.getInvoiceById(id)
    return element
  }

  @Get('invoices')
  async getAllInvoices() {
    const elements = await this.dbService.getAllInvoices()
    return elements
  }
}
