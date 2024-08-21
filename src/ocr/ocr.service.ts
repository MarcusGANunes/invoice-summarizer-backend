import { Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  TextractClient,
  AnalyzeDocumentCommand,
  FeatureType,
  AnalyzeDocumentCommandOutput,
  Block
} from '@aws-sdk/client-textract'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { Readable } from 'stream'

@Injectable()
export class OcrService {
  private textractClient: TextractClient
  private s3Client: S3Client
  private httpService: HttpService

  constructor() {
    this.textractClient = new TextractClient({ region: process.env.AWS_REGION })
    this.s3Client = new S3Client({ region: process.env.AWS_REGION })
    this.httpService = new HttpService();
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

  async analyzeDocument(bucketName: string, documentKey: string): Promise<string | AnalyzeDocumentCommandOutput> {
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
        const command = new AnalyzeDocumentCommand(params);
        const response = await this.textractClient.send(command);
        const text = this.extractText(response.Blocks || []);
        // const text = "Recibo do Sacado\nImpressão Itaú Devtools.com\n542.318.678-10\nDEVTOOLS.COM.BR\nAvenida Exemplo, 456 Bairro Comercial\nSão Paulo / SF\nItaú\nBanco Itaú S.A.\n341-7\n34191.75124 34567.891238 45678.903001 6 98150000050000\nCedente\nAgência/Código do Cedente\nEspécie\nQuantidade\nNosso numero\nEmpresa Exemplo Ltda\n1234/567890-3\nR$\n1\n175/12345678-9\nNúmero do documento\nCPF/CNPJ\nVencimento\nValor documento\n0123\n542.318.678-10\n21/08/2024\n500,00\n(-) Desconto / Abatimentos\n(-) Outras deduções\n(+) Mora/Multa\n(+) Outros acréscimos\n(=) Valor cobrado\nSacado\nJoão da Silva\nDemonstrativo\nAutenticação mecânica\nPagamento referente ao serviço X.\nValido até o vencimento.\nCorte na inha pontihada\nItaú\nBanco Itaú S.A.\n341-7\n34191.75124 34567.891238 45678.903001 6 98150000050000\nLocal de pagamento\nVencimento\nPagável em qualquer Banco até o vencimento\n21/08/2024\nCedente\nAgência/Código cedente\nEmpresa Exemplo Ltda\n1234 / 567890-3\nData do documento\nNo documento\nEspécie doc\nAceite\nData processamento\nNosso numero\n21/08/2024\n0123\nNP\nN\n21/08/2024\n175/12345678-9\nUso do banco\nCarteira\nEspecie\nQuantidade\nValor Documento\n(=) Valor documento\n175\nR$\n1\n500,00\n500.00\ninstruções (Texto de responsabilidade do cedente\n(-) Desconto / Abatimentos\nApós o vencimento, cobrar 2% de multa.\n(-) Outras deduções\nPagamento disponível em qualquer agência bancária.\nNão aceitar cheques.\n(+) Mora/Multa\nNão conceder abatimentos.\n(+) Outros acréscimos\n(=) Valor cobrado\nSacado\nJoão da Silva\nRua Exemplo, 123 - Centro\nSão Paulo / SP\nCód baixa\n5acador/Avaista\nAutenticação mecânica Ficha de Compensação\nCorte na inha pontihada"
        const url = process.env.BASE_URL + '/openai/mount-summary'
        try {
          const summaryResponse = await firstValueFrom(
            this.httpService
              .post(url, { summary: text })
              .pipe(map((response) => response.data))
          );
          return summaryResponse.summaryText;
        } catch (error) {
          console.error('Erro ao realizar a requisição POST:', error);
          throw error;
        }
    } catch (error) {
        console.log(error);
        throw new Error('Failed to analyze document');
    }
  }

  async generatePdf(imageBuffer: Buffer, analysisResult: any, mimeType: string): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    let image;

    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
        image = await pdfDoc.embedJpg(imageBuffer);
    } else if (mimeType === 'image/png') {
        image = await pdfDoc.embedPng(imageBuffer);
    } else {
        throw new Error(`Unsupported image format: ${mimeType}`);
    }

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
    });

    const textPage = pdfDoc.addPage();
    const textFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fontSize = 12;
    const lineHeight = fontSize + 2;
    const { width, height } = textPage.getSize();
    const textMargin = 50;

    const analysisLines = analysisResult.split('\n');
    let currentY = height - textMargin;

    analysisLines.forEach(line => {
        textPage.drawText(line, {
            x: textMargin,
            y: currentY,
            size: fontSize,
            font: textFont,
            maxWidth: width - 2 * textMargin,
            color: rgb(0, 0, 0),
        });
        currentY -= lineHeight;
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
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

  private extractText(blocks: Block[]): string {
    return blocks
        .filter(block => block.BlockType === "LINE")
        .map(block => block.Text)
        .join("\n")
        .trim()
}
}
