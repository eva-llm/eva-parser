import { parse } from 'yaml';
import { z } from 'zod';


const PromptfooSchema = z.object({
  prompts: z.array(z.string()),
  providers: z.array(z.string()).optional(),
  tests: z.array(z.object({
    vars: z.record(z.any(), z.any()).optional(),
    assert: z.array(z.object({
      type: z.string(),
      value: z.union([z.string(), z.array(z.string())]),
      provider: z.string().optional(),
      temperature: z.number().optional(),
      threshold: z.number().optional(),
    }))
  }))
});

const LLM_JUDGE_ASSERT = ['g-eval', 'llm-rubric'];

interface IAssert {
  name: string;
  criteria: string;
  model?: string;
  provider?: string;
  temperature?: number;
  threshold?: number;
}

export function parsePromptfoo(yamlContent: string) {
  const promptfoo = PromptfooSchema.parse(parse(yamlContent));
  const evaTests = [];

  for (const provider of promptfoo.providers || []) {
    for (const prompt of promptfoo.prompts || []) {
      for (const test of promptfoo.tests || []) {

        const [_provider, _model] = provider.split(':');
        const evaTest = {
          provider: _provider,
          model: _model,
          prompt,
          asserts: [] as IAssert[],
        };

        for (const assert of test.assert || []) {
          if (!LLM_JUDGE_ASSERT.includes(assert.type)) {
            continue;
          }

          const criteria = Array.isArray(assert.value)
            ? assert.value
            : [assert.value];

          for (const criterion of criteria) {
            const [assertProvider, assertModel] = (assert.provider || ':').split(':');

            evaTest.asserts.push({
              name: assert.type,
              provider: assertProvider || _provider,
              model: assertModel || _model,
              criteria: criterion,
              temperature: assert.temperature || 0.0,
              threshold: assert.threshold || 0.5,
            });
          }
        }

        if (evaTest.asserts.length > 0) {
          evaTests.push(evaTest);
        }
      }
    }
  }

  return evaTests;
}
