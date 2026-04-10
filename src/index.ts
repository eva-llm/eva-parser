import * as Mustache from 'mustache';
import { parse } from 'yaml';


import {
  ASSERT_NAMES,
  type AssertT,
  type ProviderObjT,
  type ModelOptionsT,
} from './types';


export * from './types';

const parseProvider = (providerObj: string | ProviderObjT) => {
  const options: ModelOptionsT = {};

  if (typeof providerObj === 'string') {
    const [ provider, model ] = providerObj.split(':');

    return { provider, model, options };
  }

  const [ provider, model ] = providerObj.id.split(':');
  const temperature = providerObj.config?.temperature;

  if (temperature !== undefined) {
    options.temperature = temperature;
  }

  return { provider, model, options };
}

const injectVars = (prompt: string, vars: undefined | Record<string, any>) => {
  if (!vars) {
    return prompt;
  }
  return Mustache.render(prompt, vars);
}

const parseAssert = (fooAssert: any): Omit<AssertT, 'criteria'> => {
  let assert: Omit<AssertT, 'criteria'> = {
    name: fooAssert.type,
  };

  if (fooAssert.threshold !== undefined) {
    assert.threshold = fooAssert.threshold;
  }

  switch (fooAssert.type) {
    case ASSERT_NAMES.BEVAL:
    case ASSERT_NAMES.GEVAL:
    case ASSERT_NAMES.LLM_RUBRIC:{
      if (fooAssert.provider !== undefined) {
        const parsedProvider = parseProvider(fooAssert.provider);

        assert = {
          ...assert,
          ...parsedProvider,
        }
      }

      if (fooAssert.must_fail !== undefined) {
        assert.must_fail = fooAssert.must_fail;
      }

      if (fooAssert.answer_only !== undefined && fooAssert.type !== ASSERT_NAMES.LLM_RUBRIC) {
        assert.answer_only = fooAssert.answer_only;
      }

      return assert;
    }
    case ASSERT_NAMES.EQUALS:
    case ASSERT_NAMES.NOT_EQUALS:
    case ASSERT_NAMES.CONTAINS:
    case ASSERT_NAMES.NOT_CONTAINS:
    case ASSERT_NAMES.REGEX: {
      if (fooAssert.case_sensitive !== undefined && fooAssert.type !== ASSERT_NAMES.REGEX) {
        assert.case_sensitive = fooAssert.case_sensitive;
      }

      return assert;
    }
    default:
      throw new Error(`Unsupported assert type: ${fooAssert.type}`);
  }
}

export function parsePromptfoo(yamlContent: string) {
  const promptfoo = parse(yamlContent);
  const evaTests = [];

  for (const fooTest of promptfoo.tests || []) {
    for (let i = 0; i < (fooTest.times || 1); i++) {

      if (!fooTest.assert) {
        continue;
      }

      const evaTest = {
        vars: fooTest.vars,
        asserts: [] as AssertT[],
      };

      for (const fooAssert of fooTest.assert) {
        if (!Object.values(ASSERT_NAMES).includes(fooAssert.type)) {
          continue;
        }

        let criteria = Array.isArray(fooAssert.value)
          ? fooAssert.value
          : [fooAssert.value];

        if (fooAssert.times !== undefined) {
          criteria = new Array(Number(fooAssert.times)).fill(criteria).flat();
        }

        const evaAssert = parseAssert(fooAssert);

        for (const criterion of criteria) {
          evaTest.asserts.push({
              ...evaAssert,
              criteria: criterion,
            });
        }
      }
      evaTests.push(evaTest);
    }
  }

  if (!evaTests.length) {
    return [];
  }

  const evaTestsWithPrompts = [];
  for (const fooPrompt of promptfoo.prompts || []) {
    for (const evaTest of evaTests) {

      evaTestsWithPrompts.push({
        prompt: injectVars(fooPrompt, evaTest.vars),
        asserts: evaTest.asserts,
      });
    } 
  }

  const finalTests = [];
  for (const providerObj of promptfoo.providers || []) {
    const parsedProvider = parseProvider(providerObj);

    for (const evaTestWithPrompt of evaTestsWithPrompts) {
      const asserts = evaTestWithPrompt.asserts.map(assert => {
        if (assert.provider === undefined) {
          return {
            ...assert,
            ...parsedProvider,
          }
        }
        return assert;
      });

      finalTests.push({
        ...parsedProvider,
        prompt: evaTestWithPrompt.prompt,
        asserts,
      });
    }
  }
  return finalTests;
}
