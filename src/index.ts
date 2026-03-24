import { parse } from 'yaml';
import { z } from 'zod';

const PromptfooConfigSchema = z.object({
  prompts: z.array(z.string()),
  providers: z.array(z.string()).optional(),
  tests: z.array(z.object({
    vars: z.record(z.any(), z.any()).optional(),
    assert: z.array(z.any())
  }))
});

export class EvaParser {
  static fromPromptfoo(yamlContent: string) {

    const raw = parse(yamlContent);

    const validated = PromptfooConfigSchema.parse(raw);

    return {
      version: '1.0',
      kind: 'EvaTestSuite',
      spec: {
      }
    };
  }
}
