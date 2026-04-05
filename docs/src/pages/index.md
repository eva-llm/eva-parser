A converter for [Promptfoo](https://www.promptfoo.dev/docs/category/configuration/) test formats into the EVA-LLM ecosystem `eva-run` format.

**NOTE!** It supports restricted Promptfoo format and extends it with own features (see examples below).

## Quick Start

```bash
npm i @eva-llm/eva-parser
```

```ts
import { parsePromptfoo } from '@eva-llm/eva-parser';

const evaTests = parsePromptfoo(promptfooYamlContent);
```

## Supported Promptfoo Items

### Providers

```yml
providers:
  - openai:gpt-5-mini
  - openai:gpt-4.1-mini
```

```yml
providers:
  - id: openai:gpt-5.2
    config:
      temperature: 0
```

### Prompts

```yml
prompts:
  - Hello, how are you?
  - What is the capital of France?
```

```yml
prompts:
  - What is the capital of {{country}}
```

### Variables

```yml
test:
  - vars:
      country: France
```

### Asserts

**NOTE!** All LLM asserts support natively [Dark Teaming](https://eva-llm.github.io/dark-teaming) to measure Epistemic Honesty via Symmetry Deviation, and extend Promptfoo format with field `must_fail`

#### [b-eval](https://eva-llm.github.io/eva-judge/#beval-binary-g-eval) (binary g-eval - eva-llm specific)

```yml
test:
  - assert:
      - type: b-eval
        value: answer is coherent to question # can be array as well
        threshold: 0.5 # optional (default is 0.5 in eva-run)
        provider: # optional (default is test provider)
          - id: openai:gpt-4.1-mini
            config:
              temperature: 0 # optional (default is 0 in eva-run as factual standard for better judging)
        must_fail: true # optional (default false, eva-run specific) - Dark Teaming field
        answer_only: true # optional (default false, eva-run specific) - analyze only LLM answer without prompt involvement
```

#### g-eval

```yml
test:
  - assert:
      - type: g-eval
        value: answer is coherent to question # can be array as well
        threshold: 0.5 # optional (default is 0.5 in eva-run)
        provider: # optional (default is test provider)
          - id: openai:gpt-4.1-mini
            config:
              temperature: 0 # optional (default is 0 in eva-run as factual standard for better judging)
        must_fail: true # optional (default false, eva-run specific) - Dark Teaming field
        answer_only: true # optional (default false, eva-run specific) - analyze only LLM answer without prompt involvement
```

#### llm-rubric

```yml
test:
  - assert:
      - type: llm-rubric
        value: answer is polite # can be array as well
        threshold: 0.5 # optional (default is 0.5 in eva-run)
        provider: # optional (default is test provider)
          - id: openai:gpt-4.1-mini
            config:
              temperature: 0 # optional (default is 0 in eva-run as factual standard for better judging)
        must_fail: true # optional (default false, eva-run specific) - Dark Teaming field
```

#### equals

```yml
test:
  - assert:
    - type: equals
      value: Paris
      case_sensitive: false # optional (default true, eva-run specific)
```

#### not-equals

```yml
test:
  - assert:
    - type: not-equals
      value: Chicago
      case_sensitive: false # optional (default true, eva-run specific)
```

#### contains

```yml
test:
  - assert:
    - type: contains
      value: Paris
      case_sensitive: false # optional (default true, eva-run specific)
```

#### not-contains

```yml
test:
  - assert:
    - type: not-contains
      value: Chicago
      case_sensitive: false # optional (default true, eva-run specific)
```

#### regex

```yml
test:
  - assert:
    - type: regex
      value: /paris/i
```

## License

MIT
