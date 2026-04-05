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

export type AssertName = (typeof ASSERT_NAMES)[keyof typeof ASSERT_NAMES];

export type AssertT = {
  name: AssertName;
  criteria: string;
  threshold?: number;
  provider?: string;
  model?: string;
  temperature?: number;
  must_fail?: boolean;
  answer_only?: boolean;
  case_sensitive?: boolean;
}

export type ProviderObjT = {
  id: string;
  config: Record<string, any>;
}

export type ModelOptionsT = {
  temperature?: number;
}
