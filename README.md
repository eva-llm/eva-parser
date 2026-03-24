# eva-parser

A converter for Promptfoo test formats and Red Teaming plugins into the EVA-LLM ecosystem.

## Features
- Converts Promptfoo YAML test suites to EVA-LLM compatible format
- Supports validation using Zod schemas
- Designed for integration with EVA-LLM tools and workflows

## Installation

```bash
npm install eva-parser
```

## Usage

```typescript
import { EvaParser } from 'eva-parser';
import fs from 'fs';

const yamlContent = fs.readFileSync('promptfooconfig.yaml', 'utf-8');
const evaTestSuite = EvaParser.fromPromptfoo(yamlContent);
console.log(evaTestSuite);
```

## API

### EvaParser.fromPromptfoo(yamlContent: string): object
Converts a Promptfoo YAML config string to an EVA-LLM test suite object.

#### Parameters
- `yamlContent`: The YAML string in Promptfoo format.

#### Returns
- An object representing the EVA-LLM test suite.

## Development

- Build: `npm run build`
- Type check: `tsc`

## License

MIT
