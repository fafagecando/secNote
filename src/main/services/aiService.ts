export const AI_PROVIDER_INTERFACE = `
interface IAIProvider {
  summarize(text: string): Promise<string>
  enhanceSearch(query: string): Promise<string>
  classify(text: string): Promise<string[]>
  generateEmbedding(text: string): Promise<number[]>
}
`

export class StubAIProvider {
  async summarize(_text: string): Promise<string> {
    throw new Error('AI provider not configured')
  }

  async enhanceSearch(_query: string): Promise<string> {
    throw new Error('AI provider not configured')
  }

  async classify(_text: string): Promise<string[]> {
    throw new Error('AI provider not configured')
  }

  async generateEmbedding(_text: string): Promise<number[]> {
    throw new Error('AI provider not configured')
  }
}

export const aiProvider = new StubAIProvider()
