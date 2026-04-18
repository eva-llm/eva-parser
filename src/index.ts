import * as Mustache from 'mustache';
import { parse } from 'yaml';

import {
  ASSERT_NAMES,
  type TAssert,
  type TEvaTest,
  type TEvaTestWithPrompt,
  type TProviderObj,
  type TTest,
  type TVercelOptions,
} from './types';


export {
  ASSERT_NAMES,
  type TTest,
  type TAssert,
} from './types';

const parseProvider = (providerObj: string | TProviderObj) => {
  let options: TVercelOptions = {};

  if (typeof providerObj === 'string') {
    const [ provider, model ] = providerObj.split(':');

    return { provider, model, options };
  }

  const [ provider, model ] = providerObj.id.split(':');

  if (providerObj.config !== undefined) {
    options = providerObj.config;
  }

  return { provider, model, options };
}

const injectVars = (prompt: string, vars: undefined | Record<string, any>) => {
  if (!vars) {
    return prompt;
  }
  return Mustache.render(prompt, vars);
}

const parseAssert = (fooAssert: any): Omit<TAssert, 'criteria'> => {
  let assert: Omit<TAssert, 'criteria'> = {
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
  const evaTests: TEvaTest[] = [];

  for (const fooTest of promptfoo.tests || []) {
    for (let i = 0; i < (fooTest.times || 1); i++) {

      if (!fooTest.assert) {
        continue;
      }

      const evaTest: TEvaTest = {
        vars: fooTest.vars,
        asserts: [] as TAssert[],
      };

      if (fooTest.output !== undefined) {
        evaTest.output = fooTest.output;
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

  const evaTestsWithPrompts: TEvaTestWithPrompt[] = [];
  for (const fooPrompt of promptfoo.prompts || []) {
    for (const evaTest of evaTests) {

      const evaTestWithPrompt: TEvaTestWithPrompt = {
        prompt: injectVars(fooPrompt, evaTest.vars),
        asserts: evaTest.asserts,
      };

      if (evaTest.output !== undefined) {
        evaTestWithPrompt.output = evaTest.output;
      }

      evaTestsWithPrompts.push(evaTestWithPrompt);
    } 
  }

  const evaRunTasks: TTest[] = [];
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

      if (evaTestWithPrompt.output !== undefined) {
        evaRunTasks.push({
          prompt: evaTestWithPrompt.prompt,
          output: evaTestWithPrompt.output,
          asserts,
        });
      } else {
        evaRunTasks.push({
          ...parsedProvider,
          prompt: evaTestWithPrompt.prompt,
          asserts,
        });
      }
    }
  }
  return evaRunTasks;
}
