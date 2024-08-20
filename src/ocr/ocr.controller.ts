import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  InternalServerErrorException,
  Get,
  Param,
  Res,
  HttpException,
  HttpStatus
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { OcrService } from './ocr.service'
import { Response } from 'express'

@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Get('download/original/:filename')
  async downloadOriginal(
    @Param('filename') filename: string,
    @Res() res: Response
  ) {
    const bucketName = process.env.S3_BUCKET_NAME
    const documentKey = `invoice-originals/${filename}`

    try {
      const fileStream = await this.ocrService.downloadFileFromS3(bucketName, documentKey)
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      fileStream.pipe(res)
    } catch (error) {
      throw new HttpException('Failed to download the original file', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get('download/summarized/:filename')
  async downloadSummarized(
    @Param('filename') filename: string,
    @Res() res: Response
  ) {
    const bucketName = process.env.S3_BUCKET_NAME
    const summaryPdfName = `invoice-summarized/${filename.replace(/\.[^/.]+$/, '')}-summarized.pdf`

    try {
      const fileStream = await this.ocrService.downloadFileFromS3(bucketName, summaryPdfName)
      res.setHeader('Content-Disposition', `attachment; filename="${filename.replace(/\.[^/.]+$/, '')}-summarized.pdf"`)
      fileStream.pipe(res)
    } catch (error) {
      throw new HttpException('Failed to download the summarized file', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAndAnalyzeDocument(
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException('File is required')
    }

    const supportedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!supportedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only image files (jpg, jpeg, png) are supported')
    }

    const bucketName = process.env.S3_BUCKET_NAME
    const documentKey = `invoice-originals/${file.originalname}`
    const summaryPdfName = `invoice-summarized/${file.originalname.replace(/\.[^/.]+$/, '')}-summarized.pdf`
    let analysisResult = null

    try {
      await this.ocrService.uploadDocumentToS3(bucketName, documentKey, file.buffer)
    } catch (error) {
      throw new InternalServerErrorException('Failed to upload the document to S3', error.message)
    }

    try {
      analysisResult = 'analysis result 123445'
    } catch (error) {
      throw new InternalServerErrorException('Failed to analyze the document', error.message)
    }

    let pdfBytes: Buffer
    try {
      pdfBytes = await this.ocrService.generatePdf(file.buffer, analysisResult, file.mimetype)
    } catch (error) {
      throw new InternalServerErrorException('Failed to generate the PDF', error.message)
    }

    try {
      await this.ocrService.uploadPdfToS3(bucketName, summaryPdfName, pdfBytes)
    } catch (error) {
      throw new InternalServerErrorException('Failed to upload the summarized PDF to S3', error.message)
    }

    return {
      msg: 'Operation completed successfully',
      res: analysisResult
    }
  }
}
