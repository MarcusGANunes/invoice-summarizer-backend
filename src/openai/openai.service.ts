import { Injectable, InternalServerErrorException } from '@nestjs/common'
import OpenAI from 'openai'

@Injectable()
export class OpenaiService {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
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
        max_tokens: 50,
        temperature: 0.7,
      })

      const generatedPrompt = response.choices[0].message.content.trim()
      return generatedPrompt
    } catch (error) {
      console.error('Error generating prompt:', error)
      throw new InternalServerErrorException('Failed to generate prompt from OpenAI')
    }
  }
}
