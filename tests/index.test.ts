import { parsePromptfoo, ASSERT_NAMES } from '../src/index';

describe('parsePromptfoo', () => {
  it('returns empty array for empty YAML object', () => {
    const result = parsePromptfoo('{}');
    expect(result).toEqual([]);
  });

  it('returns empty array when tests is an empty array', () => {
    const yaml = `
prompts: ['Hello']
providers: ['openai:gpt-4o']
tests: []
`;
    expect(parsePromptfoo(yaml)).toEqual([]);
  });

  it('skips tests that have no assert field', () => {
    const yaml = `
prompts: ['Hello']
providers: ['openai:gpt-4o']
tests:
  - vars:
      topic: cats
`;
    expect(parsePromptfoo(yaml)).toEqual([]);
  });

  it('skips assert entries with unsupported types, producing an entry with empty asserts', () => {
    const yaml = `
prompts: ['Hello']
providers: ['openai:gpt-4o']
tests:
  - assert:
      - type: unknown-type
        value: some value
`;
    const results = parsePromptfoo(yaml);
    expect(results).toHaveLength(1);
    expect(results[0].asserts).toEqual([]);
  });

  describe('equals assert', () => {
    it('parses a basic equals assert', () => {
      const yaml = `
prompts: ['Say hi']
providers: ['openai:gpt-4o']
tests:
  - assert:
      - type: equals
        value: Hello
`;
      const results = parsePromptfoo(yaml);
      expect(results).toHaveLength(1);
      expect(results[0].asserts[0]).toMatchObject({
        name: ASSERT_NAMES.EQUALS,
        criteria: 'Hello',
        provider: 'openai',
        model: 'gpt-4o',
      });
    });

    it('parses case_sensitive flag on equals', () => {
      const yaml = `
prompts: ['Say hi']
providers: ['openai:gpt-4o']
tests:
  - assert:
      - type: equals
        value: Hello
        case_sensitive: false
`;
      const results = parsePromptfoo(yaml);
      expect(results[0].asserts[0].case_sensitive).toBe(false);
    });

    it('parses threshold on equals', () => {
      const yaml = `
prompts: ['Say hi']
providers: ['openai:gpt-4o']
tests:
  - assert:
      - type: equals
        value: Hello
        threshold: 0.8
`;
      const results = parsePromptfoo(yaml);
      expect(results[0].asserts[0].threshold).toBe(0.8);
    });
  });

  describe('not-equals assert', () => {
    it('parses a not-equals assert', () => {
      const yaml = `
prompts: ['Say hi']
providers: ['openai:gpt-4o']
tests:
  - assert:
      - type: not-equals
        value: Goodbye
        case_sensitive: true
`;
      const results = parsePromptfoo(yaml);
      expect(results[0].asserts[0]).toMatchObject({
        name: ASSERT_NAMES.NOT_EQUALS,
        criteria: 'Goodbye',
        case_sensitive: true,
      });
    });
  });

  describe('contains assert', () => {
    it('parses a contains assert', () => {
      const yaml = `
prompts: ['Tell me about dogs']
providers: ['openai:gpt-4o']
tests:
  - assert:
      - type: contains
        value: dog
`;
      const results = parsePromptfoo(yaml);
      expect(results[0].asserts[0].name).toBe(ASSERT_NAMES.CONTAINS);
      expect(results[0].asserts[0].criteria).toBe('dog');
    });
  });

  describe('not-contains assert', () => {
    it('parses a not-contains assert', () => {
      const yaml = `
prompts: ['Tell me about dogs']
providers: ['openai:gpt-4o']
tests:
  - assert:
      - type: not-contains
        value: cat
        case_sensitive: false
`;
      const results = parsePromptfoo(yaml);
      expect(results[0].asserts[0]).toMatchObject({
        name: ASSERT_NAMES.NOT_CONTAINS,
        criteria: 'cat',
        case_sensitive: false,
      });
    });
  });

  describe('regex assert', () => {
    it('parses a regex assert', () => {
      const yaml = `
prompts: ['Say hi']
providers: ['openai:gpt-4o']
tests:
  - assert:
      - type: regex
        value: '^Hello'
`;
      const results = parsePromptfoo(yaml);
      expect(results[0].asserts[0]).toMatchObject({
        name: ASSERT_NAMES.REGEX,
        criteria: '^Hello',
      });
    });

    it('does not set case_sensitive on regex assert', () => {
      const yaml = `
prompts: ['Say hi']
providers: ['openai:gpt-4o']
tests:
  - assert:
      - type: regex
        value: '^Hello'
        case_sensitive: false
`;
      const results = parsePromptfoo(yaml);
      expect(results[0].asserts[0].case_sensitive).toBeUndefined();
    });
  });

  describe('g-eval assert', () => {
    it('parses g-eval without provider (inherits from top-level)', () => {
      const yaml = `
prompts: ['Explain quantum computing']
providers: ['openai:gpt-4o']
tests:
  - assert:
      - type: g-eval
        value: The response is accurate
`;
      const results = parsePromptfoo(yaml);
      expect(results[0].asserts[0]).toMatchObject({
        name: ASSERT_NAMES.GEVAL,
        criteria: 'The response is accurate',
        provider: 'openai',
        model: 'gpt-4o',
      });
    });

    it('parses g-eval with provider string override', () => {
      const yaml = `
prompts: ['Explain quantum computing']
providers: ['openai:gpt-4o']
tests:
  - assert:
      - type: g-eval
        value: The response is accurate
        provider: anthropic:claude-3-5-sonnet
`;
      const results = parsePromptfoo(yaml);
      expect(results[0].asserts[0]).toMatchObject({
        name: ASSERT_NAMES.GEVAL,
        provider: 'anthropic',
        model: 'claude-3-5-sonnet',
      });
    });

    it('parses g-eval with provider object override including temperature', () => {
      const yaml = `
prompts: ['Explain quantum computing']
providers: ['openai:gpt-4o']
tests:
  - assert:
      - type: g-eval
        value: The response is accurate
        provider:
          id: openai:gpt-4o-mini
          config:
            temperature: 0.2
`;
      const results = parsePromptfoo(yaml);
      expect(results[0].asserts[0]).toMatchObject({
        name: ASSERT_NAMES.GEVAL,
        provider: 'openai',
        model: 'gpt-4o-mini',
      });
      expect((results[0].asserts[0] as any).options).toEqual({ temperature: 0.2 });
    });

    it('parses g-eval with must_fail flag', () => {
      const yaml = `
prompts: ['Say something rude']
providers: ['openai:gpt-4o']
tests:
  - assert:
      - type: g-eval
        value: The response is polite
        must_fail: true
`;
      const results = parsePromptfoo(yaml);
      expect(results[0].asserts[0].must_fail).toBe(true);
    });

    it('parses g-eval with answer_only flag', () => {
      const yaml = `
prompts: ['What is 2+2?']
providers: ['openai:gpt-4o']
tests:
  - assert:
      - type: g-eval
        value: The answer is correct
        answer_only: true
`;
      const results = parsePromptfoo(yaml);
      expect(results[0].asserts[0].answer_only).toBe(true);
    });
  });

  describe('b-eval assert', () => {
    it('parses b-eval with answer_only', () => {
      const yaml = `
prompts: ['What is 2+2?']
providers: ['openai:gpt-4o']
tests:
  - assert:
      - type: b-eval
        value: The response contains the number 4
        answer_only: false
`;
      const results = parsePromptfoo(yaml);
      expect(results[0].asserts[0]).toMatchObject({
        name: ASSERT_NAMES.BEVAL,
        answer_only: false,
      });
    });
  });

  describe('llm-rubric assert', () => {
    it('parses llm-rubric assert', () => {
      const yaml = `
prompts: ['Summarize this text']
providers: ['openai:gpt-4o']
tests:
  - assert:
      - type: llm-rubric
        value: The summary is concise
`;
      const results = parsePromptfoo(yaml);
      expect(results[0].asserts[0]).toMatchObject({
        name: ASSERT_NAMES.LLM_RUBRIC,
        criteria: 'The summary is concise',
      });
    });

    it('does not set answer_only on llm-rubric assert', () => {
      const yaml = `
prompts: ['Summarize this text']
providers: ['openai:gpt-4o']
tests:
  - assert:
      - type: llm-rubric
        value: The summary is concise
        answer_only: true
`;
      const results = parsePromptfoo(yaml);
      expect(results[0].asserts[0].answer_only).toBeUndefined();
    });
  });

  describe('multiple criteria (array value)', () => {
    it('expands array value into multiple assert entries', () => {
      const yaml = `
prompts: ['Tell me about space']
providers: ['openai:gpt-4o']
tests:
  - assert:
      - type: contains
        value:
          - planet
          - star
          - galaxy
`;
      const results = parsePromptfoo(yaml);
      expect(results[0].asserts).toHaveLength(3);
      expect(results[0].asserts[0].criteria).toBe('planet');
      expect(results[0].asserts[1].criteria).toBe('star');
      expect(results[0].asserts[2].criteria).toBe('galaxy');
    });
  });

  describe('multiple asserts in one test', () => {
    it('collects all asserts', () => {
      const yaml = `
prompts: ['Say hi']
providers: ['openai:gpt-4o']
tests:
  - assert:
      - type: contains
        value: Hello
      - type: not-contains
        value: Goodbye
`;
      const results = parsePromptfoo(yaml);
      expect(results[0].asserts).toHaveLength(2);
      expect(results[0].asserts[0].name).toBe(ASSERT_NAMES.CONTAINS);
      expect(results[0].asserts[1].name).toBe(ASSERT_NAMES.NOT_CONTAINS);
    });
  });

  describe('variable injection', () => {
    it('renders Mustache variables in prompts', () => {
      const yaml = `
prompts: ['Tell me about {{topic}}']
providers: ['openai:gpt-4o']
tests:
  - vars:
      topic: dolphins
    assert:
      - type: contains
        value: dolphin
`;
      const results = parsePromptfoo(yaml);
      expect(results[0].prompt).toBe('Tell me about dolphins');
    });

    it('leaves prompt unchanged when no vars are defined', () => {
      const yaml = `
prompts: ['Hello world']
providers: ['openai:gpt-4o']
tests:
  - assert:
      - type: contains
        value: world
`;
      const results = parsePromptfoo(yaml);
      expect(results[0].prompt).toBe('Hello world');
    });
  });

  describe('cross-product of providers, prompts, and tests', () => {
    it('produces provider × prompt × test combinations', () => {
      const yaml = `
prompts:
  - 'Prompt A'
  - 'Prompt B'
providers:
  - openai:gpt-4o
  - anthropic:claude-3-5-sonnet
tests:
  - assert:
      - type: contains
        value: answer
`;
      const results = parsePromptfoo(yaml);
      // 2 providers × 2 prompts × 1 test = 4
      expect(results).toHaveLength(4);
    });

    it('assigns the correct provider to each result', () => {
      const yaml = `
prompts: ['Hello']
providers:
  - openai:gpt-4o
  - anthropic:claude-3-5
tests:
  - assert:
      - type: contains
        value: Hi
`;
      const results = parsePromptfoo(yaml);
      expect(results.find(r => r.provider === 'openai')).toBeDefined();
      expect(results.find(r => r.provider === 'anthropic')).toBeDefined();
    });
  });

  describe('provider inheritance', () => {
    it('assert without provider inherits the top-level provider', () => {
      const yaml = `
prompts: ['Hello']
providers: ['openai:gpt-4o']
tests:
  - assert:
      - type: g-eval
        value: The response is friendly
`;
      const results = parsePromptfoo(yaml);
      expect(results[0].asserts[0].provider).toBe('openai');
      expect(results[0].asserts[0].model).toBe('gpt-4o');
    });

    it('assert with provider keeps its own provider instead of top-level', () => {
      const yaml = `
prompts: ['Hello']
providers: ['openai:gpt-4o']
tests:
  - assert:
      - type: g-eval
        value: The response is friendly
        provider: anthropic:claude-3-5-sonnet
`;
      const results = parsePromptfoo(yaml);
      expect(results[0].asserts[0].provider).toBe('anthropic');
      expect(results[0].asserts[0].model).toBe('claude-3-5-sonnet');
    });
  });

  describe('provider as object', () => {
    it('parses top-level provider object with temperature', () => {
      const yaml = `
prompts: ['Hello']
providers:
  - id: openai:gpt-4o
    config:
      temperature: 0.5
tests:
  - assert:
      - type: equals
        value: Hi
`;
      const results = parsePromptfoo(yaml);
      expect(results[0].provider).toBe('openai');
      expect(results[0].model).toBe('gpt-4o');
      expect(results[0].options).toEqual({ temperature: 0.5 });
    });

    it('parses top-level provider object without temperature', () => {
      const yaml = `
prompts: ['Hello']
providers:
  - id: openai:gpt-4o
    config: {}
tests:
  - assert:
      - type: equals
        value: Hi
`;
      const results = parsePromptfoo(yaml);
      expect(results[0].options).toEqual({});
    });
  });
});
