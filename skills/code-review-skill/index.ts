import Anthropic from '@anthropic-ai/sdk';
import { execSync } from 'child_process';

const client = new Anthropic();

export interface ReviewIssue {
  severity: 'error' | 'warning' | 'info';
  file: string;
  message: string;
  suggestion?: string;
}

export interface ReviewResult {
  summary: string;
  issues: ReviewIssue[];
  suggestions: string[];
  approved: boolean;
}

function getDiff(base: string, head: string): string {
  try {
    return execSync(`git diff ${base}...${head} --unified=5`, {
      encoding: 'utf-8',
      maxBuffer: 1024 * 1024 * 10,
    });
  } catch {
    return execSync(`git diff ${base} ${head}`, { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10 });
  }
}

function getCommitMessages(base: string, head: string): string {
  try {
    return execSync(`git log ${base}..${head} --pretty=format:"%s"`, { encoding: 'utf-8' });
  } catch {
    return '';
  }
}

const SYSTEM_PROMPT = `Você é um revisor de código sênior especializado em:
- React Native / Expo Router
- TypeScript
- SQLite (expo-sqlite) com AnimeRepository e EpisodeRepository
- MCPs (Model Context Protocol) com @modelcontextprotocol/sdk
- Skills reutilizáveis para agentes
- Conventional Commits (feat, fix, docs, style, refactor, test, chore)

Responda SEMPRE em JSON válido com a seguinte estrutura:
{
  "summary": "string — resumo objetivo das mudanças",
  "issues": [
    {
      "severity": "error" | "warning" | "info",
      "file": "caminho/do/arquivo.ts",
      "message": "descrição do problema",
      "suggestion": "como corrigir (opcional)"
    }
  ],
  "suggestions": ["sugestão geral 1", "sugestão geral 2"],
  "approved": true | false
}

approved = true somente se não houver issues do tipo "error".`;

export async function run(input: {
  base?: string;
  head?: string;
  context?: string;
}): Promise<ReviewResult> {
  const base = input.base ?? 'main';
  const head = input.head ?? 'HEAD';
  const diff = getDiff(base, head);
  const commits = getCommitMessages(base, head);

  if (!diff.trim()) {
    return {
      summary: 'Nenhuma diferença encontrada entre as branches.',
      issues: [],
      suggestions: [],
      approved: true,
    };
  }

  const userContent = `
## Commits
${commits || '(sem commits listados)'}

## Contexto adicional
${input.context ?? 'Nenhum'}

## Diff
\`\`\`diff
${diff.slice(0, 80000)}
\`\`\`
`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const raw = (message.content[0] as { text: string }).text;
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Claude retornou resposta inválida');

  return JSON.parse(jsonMatch[0]) as ReviewResult;
}
