import { GoogleGenerativeAI } from '@google/generative-ai';

export interface VariantGenerationRequest {
  elementType: string;
  originalContent: string;
  hypothesis: string;
  targetUrl?: string;
  industry?: string;
  context?: string;
}

export interface GeneratedVariant {
  name: string;
  description: string;
  changes: string;
  rationale: string;
}

export class GeminiAIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async generateVariants(request: VariantGenerationRequest, count: number = 3): Promise<GeneratedVariant[]> {
    try {
      const prompt = this.buildPrompt(request, count);
      console.log('Gemini AI: Generating variants with prompt:', prompt.substring(0, 200) + '...');

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('Gemini AI: Raw response:', text.substring(0, 300) + '...');

      // Parse the JSON response
      const variants = this.parseVariantsResponse(text);

      // Validate and limit to requested count
      const validVariants = variants.filter(v =>
        v.name && v.description && v.changes && v.rationale
      ).slice(0, count);

      console.log(`Gemini AI: Generated ${validVariants.length} valid variants`);
      return validVariants;

    } catch (error) {
      console.error('Gemini AI: Error generating variants:', error);

      // Fallback to basic variants if AI fails
      return this.generateFallbackVariants(request, count);
    }
  }

  async generateHypothesis(request: Omit<VariantGenerationRequest, 'hypothesis'>): Promise<string> {
    try {
      const prompt = `
You are an expert A/B testing strategist. Generate a clear, testable hypothesis for optimizing this element:

Element Type: ${request.elementType}
Original Content: "${request.originalContent}"
Website URL: ${request.targetUrl || 'Not provided'}
Industry: ${request.industry || 'Not specified'}
Additional Context: ${request.context || 'None'}

Generate a hypothesis following this format:
"If we [specific change], then [expected outcome] will happen because [reasoning based on UX principles]."

Focus on:
- Specific, measurable improvements
- Clear psychological or UX reasoning
- Realistic expected outcomes
- Industry-specific considerations

Respond with ONLY the hypothesis statement, no additional text.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const hypothesis = response.text().trim();

      console.log('Gemini AI: Generated hypothesis:', hypothesis);
      return hypothesis;

    } catch (error) {
      console.error('Gemini AI: Error generating hypothesis:', error);
      return this.generateFallbackHypothesis(request);
    }
  }

  async generateTestDescription(request: VariantGenerationRequest): Promise<string> {
    try {
      const prompt = `
Generate a concise, professional description for this A/B test:

Element Type: ${request.elementType}
Original Content: "${request.originalContent}"
Hypothesis: ${request.hypothesis}
Target URL: ${request.targetUrl || 'Not provided'}
Industry: ${request.industry || 'Not specified'}

Create a description that:
- Summarizes what will be tested
- Explains the expected impact
- Is suitable for stakeholders and team members
- Is 1-2 sentences maximum

Respond with ONLY the description, no additional text.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const description = response.text().trim();

      console.log('Gemini AI: Generated test description:', description);
      return description;

    } catch (error) {
      console.error('Gemini AI: Error generating test description:', error);
      return this.generateFallbackDescription(request);
    }
  }

  private buildPrompt(request: VariantGenerationRequest, count: number): string {
    return `
You are an expert A/B testing copywriter and conversion rate optimization specialist. Generate ${count} high-quality variants for testing.

CONTEXT:
- Element Type: ${request.elementType}
- Original Content: "${request.originalContent}"
- Hypothesis: ${request.hypothesis}
- Website URL: ${request.targetUrl || 'Not provided'}
- Industry: ${request.industry || 'Not specified'}
- Additional Context: ${request.context || 'None'}

REQUIREMENTS:
1. Generate exactly ${count} unique variants
2. Each variant should test different psychological triggers or UX principles
3. Variants should be significantly different from each other and the original
4. Focus on proven conversion optimization techniques
5. Consider the specific industry and element type

RESPONSE FORMAT:
Return a valid JSON array with exactly this structure:
[
  {
    "name": "Variant name (e.g., 'Urgency-Focused', 'Benefit-Driven')",
    "description": "The actual content/copy to test",
    "changes": "Detailed explanation of what changed and why",
    "rationale": "Psychological/UX reasoning behind this approach"
  }
]

OPTIMIZATION TECHNIQUES TO CONSIDER:
- Urgency and scarcity
- Social proof and authority
- Clarity and specificity
- Emotional triggers
- Action-oriented language
- Benefit vs feature focus
- Risk reduction
- Curiosity gaps

Respond with ONLY the JSON array, no additional text or formatting.
`;
  }

  private parseVariantsResponse(text: string): GeneratedVariant[] {
    try {
      // Clean up the response text
      let cleanText = text.trim();

      // Remove markdown code blocks if present
      cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*/g, '');

      // Find JSON array in the response
      const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }

      const variants = JSON.parse(cleanText);

      if (!Array.isArray(variants)) {
        throw new Error('Response is not an array');
      }

      return variants;

    } catch (error) {
      console.error('Gemini AI: Error parsing variants response:', error);
      console.error('Raw text:', text);

      // Try to extract partial data if JSON parsing fails
      return this.extractVariantsFromText(text);
    }
  }

  private extractVariantsFromText(text: string): GeneratedVariant[] {
    // Fallback method to extract variants from malformed text
    const variants: GeneratedVariant[] = [];

    // Look for patterns that might contain variant information
    const lines = text.split('\n').filter(line => line.trim());

    let currentVariant: Partial<GeneratedVariant> = {};

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.includes('name') || trimmed.includes('Name')) {
        if (Object.keys(currentVariant).length > 0) {
          if (this.isValidVariant(currentVariant)) {
            variants.push(currentVariant as GeneratedVariant);
          }
          currentVariant = {};
        }
        currentVariant.name = this.extractValue(trimmed);
      } else if (trimmed.includes('description') || trimmed.includes('Description')) {
        currentVariant.description = this.extractValue(trimmed);
      } else if (trimmed.includes('changes') || trimmed.includes('Changes')) {
        currentVariant.changes = this.extractValue(trimmed);
      } else if (trimmed.includes('rationale') || trimmed.includes('Rationale')) {
        currentVariant.rationale = this.extractValue(trimmed);
      }
    }

    // Add the last variant if valid
    if (this.isValidVariant(currentVariant)) {
      variants.push(currentVariant as GeneratedVariant);
    }

    return variants;
  }

  private extractValue(line: string): string {
    // Extract value from various formats like "name": "value" or "Name: value"
    const patterns = [
      /"([^"]+)":\s*"([^"]+)"/,
      /:\s*"([^"]+)"/,
      /:\s*(.+)$/
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return match[match.length - 1].replace(/[",]/g, '').trim();
      }
    }

    return line.trim();
  }

  private isValidVariant(variant: Partial<GeneratedVariant>): boolean {
    return !!(variant.name && variant.description && variant.changes && variant.rationale);
  }

  private generateFallbackVariants(request: VariantGenerationRequest, count: number): GeneratedVariant[] {
    console.log('Gemini AI: Using fallback variant generation');

    const fallbackVariants: GeneratedVariant[] = [
      {
        name: 'Clarity Focused',
        description: this.improveClarityVersion(request.originalContent, request.elementType),
        changes: 'Simplified language and made the message more direct and clear',
        rationale: 'Clear, straightforward messaging reduces cognitive load and improves user comprehension'
      },
      {
        name: 'Benefit Driven',
        description: this.improveBenefitVersion(request.originalContent, request.elementType),
        changes: 'Emphasized specific benefits and value proposition',
        rationale: 'Users are more motivated by benefits than features, leading to higher engagement'
      },
      {
        name: 'Action Oriented',
        description: this.improveActionVersion(request.originalContent, request.elementType),
        changes: 'Used stronger action verbs and more compelling language',
        rationale: 'Action-oriented language creates urgency and encourages immediate user response'
      }
    ];

    return fallbackVariants.slice(0, count);
  }

  private improveClarityVersion(original: string, elementType: string): string {
    if (elementType.toLowerCase().includes('button')) {
      return original.replace(/click|here|now/gi, '').trim() + ' Today';
    } else if (elementType.toLowerCase().includes('headline')) {
      return `Clear & Simple: ${original}`;
    }
    return `${original} - Made Simple`;
  }

  private improveBenefitVersion(original: string, elementType: string): string {
    if (elementType.toLowerCase().includes('button')) {
      return `Get ${original.replace(/click|here|get|now/gi, '').trim()} & Save Time`;
    } else if (elementType.toLowerCase().includes('headline')) {
      return `${original} - See Results Fast`;
    }
    return `${original} - Proven Benefits`;
  }

  private improveActionVersion(original: string, elementType: string): string {
    if (elementType.toLowerCase().includes('button')) {
      return `Start ${original.replace(/click|here|get|start/gi, '').trim()} Now`;
    } else if (elementType.toLowerCase().includes('headline')) {
      return `Transform Your ${original}`;
    }
    return `Unlock ${original}`;
  }

  private generateFallbackHypothesis(request: Omit<VariantGenerationRequest, 'hypothesis'>): string {
    const elementType = request.elementType.toLowerCase();

    if (elementType.includes('button')) {
      return `If we make the button text more action-oriented and clear, then click-through rates will increase because users better understand the expected outcome.`;
    } else if (elementType.includes('headline')) {
      return `If we optimize the headline to be more compelling and specific, then user engagement will increase because clearer value propositions reduce bounce rates.`;
    }

    return `If we improve the ${request.elementType} to be more user-focused, then conversion rates will increase because better messaging aligns with user motivations.`;
  }

  private generateFallbackDescription(request: VariantGenerationRequest): string {
    return `Testing ${request.elementType.toLowerCase()} variations to improve user engagement and conversion rates based on the hypothesis: ${request.hypothesis}`;
  }
}

export const geminiAIService = new GeminiAIService();
