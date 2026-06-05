---
name: code-review-skill
description: >
  Use esta skill para revisar o código de uma branch ou PR automaticamente usando Claude.
  Analisa o diff em relação à main, aponta problemas de qualidade, segurança, performance
  e conformidade com a arquitetura do projeto (MCPs, Skills, SQLite, Expo Router).
  Triggers: criação de branch, abertura de PR, push para branch não-main.
  Não usar quando: branch é main ou não há diff.
---

## Inputs
- base: string — branch base para comparação (default: 'main')
- head: string — branch a revisar (default: HEAD)
- context: string? — contexto adicional sobre a mudança

## Outputs
- summary: string — resumo das mudanças
- issues: ReviewIssue[] — lista de problemas encontrados
- suggestions: string[] — sugestões de melhoria
- approved: boolean — se o código está pronto para merge

## Exemplo de uso
```ts
const review = await codeReviewSkill.run({
  base: 'main',
  head: 'feat/anime-search',
  context: 'Nova funcionalidade de busca de animes via Jikan API'
});
// => { summary: '...', issues: [...], suggestions: [...], approved: false }
```

## Critérios de revisão
1. **Arquitetura**: respeitou separação MCP / Skill / App?
2. **Tipos**: TypeScript correto, sem `any` desnecessário?
3. **Segurança**: sem credenciais hardcoded, sem injection?
4. **Testes**: mudanças críticas têm cobertura?
5. **Conventional Commits**: mensagens seguem o padrão?
6. **Performance**: queries SQLite indexadas? Cache utilizado onde necessário?
