export const ASSERT_NAMES = {
  BEVAL: 'b-eval',
  GEVAL: 'g-eval',
  LLM_RUBRIC: 'llm-rubric',
  EQUALS: 'equals',
  NOT_EQUALS: 'not-equals',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'not-contains',
  REGEX: 'regex',
} as const;

export type TAssertName = (typeof ASSERT_NAMES)[keyof typeof ASSERT_NAMES];

export type TAssert = {
  name: TAssertName;
  criteria: string;
  threshold?: number;
  provider?: string;
  model?: string;
  temperature?: number;
  must_fail?: boolean;
  answer_only?: boolean;
  case_sensitive?: boolean;
}

export type TEvaTest = {
  vars: undefined | Record<string, any>;
  output?: string;
  asserts: TAssert[];
}

export type TEvaTestWithPrompt = {
  prompt: string;
  output?: string;
  asserts: TAssert[];
}

export type TTest = {
  prompt: string;
  output: string;
  asserts: TAssert[];
} | {
  provider: string;
  model: string;
  options?: TVercelOptions
  prompt: string;
  asserts: TAssert[];
}

export type TProviderObj = {
  id: string;
  config: Record<string, any>;
}

export type TVercelOptions = Record<string, any>;
