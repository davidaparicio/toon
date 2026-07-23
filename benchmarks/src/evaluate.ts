import type { LanguageModelV4 } from '@ai-sdk/provider'
import type { Format } from './formats.ts'
import type { EvaluationResult, Question } from './types.ts'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { xai } from '@ai-sdk/xai'
import { generateText } from 'ai'
import { compareAnswers } from './normalize.ts'

/**
 * Models used for evaluation
 */
export const models: LanguageModelV4[] = [
  anthropic('claude-haiku-4-5-20251001'),
  google('gemini-3.6-flash'),
  openai('gpt-5.4-nano'),
  xai('grok-4-1-fast-non-reasoning'),
]

/**
 * Evaluate a single question with a specific format and model
 */
export async function evaluateQuestion(
  {
    question,
    format,
    formattedData,
    model,
  }:
  {
    question: Question
    format: Format
    formattedData: string
    model: LanguageModelV4
  },
): Promise<EvaluationResult> {
  const prompt = `
${format.primer}

Given the following data in ${format.name} format:

\`\`\`${format.fence}
${formattedData}
\`\`\`

Question: ${question.prompt}

Answer format requirements:
- Provide only the value itself, no explanation
- For numbers: output digits only (no commas, currency symbols, or units)
- For dates/field names: use the exact string from the data
- For lists: output comma-separated values with no spaces

Answer:
`.trim()

  const startTime = performance.now()
  // The benchmark measures format comprehension, not reasoning – each provider
  // reads only its own namespace, so unrelated entries are ignored
  const { text, usage } = await generateText({
    model,
    prompt,
    providerOptions: {
      google: { thinkingConfig: { thinkingLevel: 'minimal' } },
      openai: { reasoningEffort: 'none' },
    },
  })

  const actual = text.trim()
  const latencyMs = performance.now() - startTime

  const comparisonResult = compareAnswers(
    actual,
    question.groundTruth,
    question.answerType ?? 'string',
    question.normalizationOptions,
  )
  const isCorrect = comparisonResult.match

  return {
    questionId: question.id,
    format: format.name,
    model: model.modelId,
    expected: question.groundTruth,
    actual,
    isCorrect,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    latencyMs,
  }
}
