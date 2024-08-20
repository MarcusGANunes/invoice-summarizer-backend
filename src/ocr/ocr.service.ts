import { Injectable } from '@nestjs/common'
import {
  TextractClient,
  AnalyzeDocumentCommand,
  FeatureType,
  AnalyzeDocumentCommandOutput,
} from '@aws-sdk/client-textract'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { Readable } from 'stream'

@Injectable()
export class OcrService {
  private textractClient: TextractClient
  private s3Client: S3Client

  constructor() {
    this.textractClient = new TextractClient({ region: process.env.AWS_REGION })
    this.s3Client = new S3Client({ region: process.env.AWS_REGION })
  }

  async uploadDocumentToS3(bucketName: string, documentKey: string, fileBuffer: Buffer): Promise<void> {
    const params = {
      Bucket: bucketName,
      Key: documentKey,
      Body: fileBuffer,
    }

    const command = new PutObjectCommand(params)
    await this.s3Client.send(command)
  }

  async downloadFileFromS3(bucketName: string, key: string): Promise<Readable> {
    const params = {
      Bucket: bucketName,
      Key: key,
    }

    const command = new GetObjectCommand(params)
    const response = await this.s3Client.send(command)
    return response.Body as Readable
  }

  async analyzeDocument(bucketName: string, documentKey: string): Promise<AnalyzeDocumentCommandOutput> {
    try {
      const params = {
        Document: {
          S3Object: {
            Bucket: bucketName,
            Name: documentKey,
          },
        },
        FeatureTypes: [FeatureType.FORMS],
      }

      const command = new AnalyzeDocumentCommand(params)
      const response = await this.textractClient.send(command)
      return response
    } catch (error) {
      console.error(error)
      throw new Error('Failed to analyze document')
    }
  }

  async generatePdf(imageBuffer: Buffer, analysisResult: any, mimeType: string): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create()
    let image

    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      image = await pdfDoc.embedJpg(imageBuffer)
    } else if (mimeType === 'image/png') {
      image = await pdfDoc.embedPng(imageBuffer)
    } else {
      throw new Error(`Unsupported image format: ${mimeType}`)
    }

    const page = pdfDoc.addPage([image.width, image.height])
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    })

    const textPage = pdfDoc.addPage()
    const textFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    const analysisText = JSON.stringify(analysisResult, null, 2)
    const fontSize = 12
    const { width, height } = textPage.getSize()
    const textMargin = 50

    textPage.drawText(analysisText, {
      x: textMargin,
      y: height - textMargin,
      size: fontSize,
      font: textFont,
      maxWidth: width - 2 * textMargin,
      color: rgb(0, 0, 0),
    })

    const pdfBytes = await pdfDoc.save()
    return Buffer.from(pdfBytes)
  }

  async uploadPdfToS3(bucketName: string, key: string, pdfBuffer: Buffer) {
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    }

    const command = new PutObjectCommand(params)
    await this.s3Client.send(command)
  }

  // private processTextractResult(response: AnalyzeDocumentCommandOutput): { [key: string]: string } {
  //   const formData: { [key: string]: string } = {}

  //   response.Blocks?.forEach(block => {
  //     if (block.BlockType === 'KEY_VALUE_SET' && block.EntityTypes?.includes('KEY')) {
  //       let key = ''
  //       let value = ''

  //       if (block.Relationships) {
  //         block.Relationships.forEach(relationship => {
  //           if (relationship.Type === 'VALUE' && relationship.Ids) {
  //             relationship.Ids.forEach(id => {
  //               const valueBlock = response.Blocks?.find(b => b.Id === id)
  //               if (valueBlock && valueBlock.BlockType === 'KEY_VALUE_SET' && valueBlock.EntityTypes?.includes('VALUE')) {
  //                 value = valueBlock.Text || ''
  //               }
  //             })
  //           }
  //         })
  //       }

  //       key = block.Text || ''
  //       if (key && value) {
  //         formData[key] = value
  //       }
  //     }
  //   })

  //   return formData
  // }
}
