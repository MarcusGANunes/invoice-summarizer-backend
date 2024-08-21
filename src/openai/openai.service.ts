import { Injectable, InternalServerErrorException } from '@nestjs/common'
import OpenAI from 'openai'

@Injectable()
export class OpenaiService {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  async generatePrompt(baseText: string, userInput: string): Promise<string> {
    try {
      const promptText = `${baseText}\n\nBaseado nas informações acima de um texto extraido de um boleto por um ocr, de o que o se pede: ${userInput}\n\nPrompt:`

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um assistente útil e reponderá às perguntas do usuário sobre um boleto.' },
          { role: 'user', content: promptText },
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
      const generatedPrompt = response.choices[0].message.content.trim()
      return generatedPrompt
    } catch (error) {
      console.error('Error generating prompt:', error)
      throw new InternalServerErrorException('Failed to generate prompt from OpenAI')
    }
  }

  async generateSummary(summary: string): Promise<string> {
    try {
      const promptText = `
      Input: ${summary}
      
      A seguir estão as informações de um boleto de pagamento. Estruture essas informações de forma clara e precisa, utilizando o formato exato fornecido abaixo. Não modifique o layout, siga exatamente como está. Não inclua símbolos extras, não altere a formatação, e caso falte [informação] use 'Dado Ausente' no lugar:
      
      Informações do Beneficiário:\n
      - Nome: [Nome do Beneficiário]\n
      - Agência/Código do Beneficiário: [Agência/Código do Cedente]\n
      - Banco: [Banco do Beneficiário]\n
      - Código do Banco: [Código do Banco]\n
      
      Informações do Pagador:\n
      - Nome: [Nome do Pagador]\n
      - CPF/CNPJ: [CPF/CNPJ do Pagador]\n
      
      Informações do Documento:\n
      - Código de Barras:\n[Código de Barras]\n
      - Valor: R$ [Valor do Documento]\n
      - Data de Processamento: [Data de Processamento]\n
      - Data de Vencimento: [Data de Vencimento]\n
      
      A resposta deve seguir exatamente esse layout, sem alterações ou adições, apenas as quebras de linha feitas.
      `
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: promptText },
        ],
        max_tokens: 1000,
        temperature: 0.1
      })

      return response.choices[0].message.content

    } catch (error) {
      console.error('Erro ao gerar o resumo:', error)
      throw error
    }
  }
}
