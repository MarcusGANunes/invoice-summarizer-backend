import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common'
import { OpenaiService } from './openai.service'

@Controller('openai')
export class OpenaiController {
  constructor(private readonly openaiService: OpenaiService) {}

  @Post('generate-prompt')
  async generatePrompt(
    @Body('baseText') baseText: string,
    @Body('userInput') userInput: string
  ): Promise<{ prompt: string }> {
    try {
      const prompt = await this.openaiService.generatePrompt(baseText, userInput)
      return { prompt }
    } catch (error) {
      console.error('Error in generatePrompt controller:', error)

      if (error instanceof HttpException) {
        throw error
      }

      throw new HttpException(
        'An error occurred while generating the prompt',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Post('mount-summary')
  async mountSummary(
    @Body('summary') summary: string,
  ): Promise<{ summaryText: string }> {
    try {
      const summaryText = await this.openaiService.generateSummary(summary)
      return { summaryText }
    } catch (error) {
      console.error('Error in generatePrompt controller:', error)

      if (error instanceof HttpException) {
        throw error
      }

      throw new HttpException(
        'An error occurred while generating the prompt',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
