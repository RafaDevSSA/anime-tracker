import { run } from './index';

const [, , base = 'main', head = 'HEAD', context = ''] = process.argv;

run({ base, head, context })
  .then((result) => {
    console.log('\n## Code Review\n');
    console.log(`**Resumo:** ${result.summary}\n`);

    if (result.issues.length > 0) {
      console.log('### Problemas encontrados\n');
      for (const issue of result.issues) {
        const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${icon} **[${issue.severity.toUpperCase()}]** \`${issue.file}\``);
        console.log(`   ${issue.message}`);
        if (issue.suggestion) console.log(`   > Sugestão: ${issue.suggestion}`);
        console.log();
      }
    }

    if (result.suggestions.length > 0) {
      console.log('### Sugestões gerais\n');
      result.suggestions.forEach((s, i) => console.log(`${i + 1}. ${s}`));
      console.log();
    }

    const status = result.approved ? '✅ APROVADO' : '🚫 REQUER REVISÃO';
    console.log(`**Status:** ${status}`);

    process.exit(result.approved ? 0 : 1);
  })
  .catch((err) => {
    console.error('Erro no code review:', err.message);
    process.exit(1);
  });
