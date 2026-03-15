Execute RALF (Recursive Autonomous Loop) para: $ARGUMENTS

OBJECTIVE: [extraído de $ARGUMENTS — deve ser mensurável]

CONSTRAINTS:
- Mantenha todos os testes passando
- Não instale dependências sem aprovação
- Não modifique arquivos fora do escopo
- Siga patterns existentes do codebase

EXIT CONDITIONS:
- Sucesso: objetivo mensurável atingido
- Loop: 2 iterações com mesmo resultado → PARE
- Limite: máximo 5 iterações
- Timeout: 10 minutos por iteração

GUARDRAILS:
- Checkpoint: git commit a cada iteração bem-sucedida
- Rollback: git checkout se testes falharem
- UNTOUCHABLE: respeitar lista do CLAUDE.md do projeto

CICLO (para cada iteração):
1. PLAN: descreva o que vai fazer e o resultado esperado
2. EXECUTE: implemente
3. VALIDATE: typecheck + testes + métrica do objetivo
4. DECIDE: sucesso → DONE | falha → ajuste e ITERATE | loop → PARE

LOGGING: registre cada iteração em ralf-log.md:
## Iteração N — [timestamp]
- Plano: [...]
- Resultado: [sucesso/falha + dados]
- Métrica: [valor atual vs meta]
- Decisão: [continuar/done/pare]

REPORT FINAL: iterações, o que funcionou, resultado, custo (/cost).
