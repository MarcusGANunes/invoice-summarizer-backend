import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class DbService {
  constructor(private prisma: PrismaService) {}

  async addInvoice(name: string, summary: string): Promise<any> {
    return this.prisma.invoiceSummary.upsert({
      where: {
        fileName: name,
      },
      update: {
        summary: summary,
      },
      create: {
        fileName: name,
        summary: summary,
        comments: {
          create: [],
        },
      },
    })
  }

  async addComment(invoiceId: string, commentData: { name: string, comment: string }): Promise<{ comments: any[], newComment: any }> {
    const comments = await this.prisma.comments.create({
      data: {
        name: commentData.name,
        comment: commentData.comment,
        invoice: {
          connect: { id: invoiceId },
        },
      },
      include: {
        invoice: {
          include: {
            comments: true,
          },
        },
      },
    })

    return {
      comments: comments.invoice.comments,
      newComment: commentData
    }
  }
  

  async getInvoiceById(id: string): Promise<any> {
    return this.prisma.invoiceSummary.findUnique({
      where: { id },
      include: { comments: true },
    })
  }

  async getAllInvoices(): Promise<any[]> {
    return this.prisma.invoiceSummary.findMany({
      include: { comments: true },
    })
  }
}
