Execute a Retention Rule completa — ritual de fim de sessão.

1. **state.md**: atualize com:
   - O que foi feito nesta sessão
   - Próximo passo exato (o que fazer ao retomar)
   - Bloqueios ou decisões pendentes
   - Timestamp

2. **MEMORY.md**: adicione entrada com:
   - Decisões tomadas e razões
   - Patterns descobertos
   - Lições aprendidas (se houve erro/correção)

3. **Quality gate**:
   - Rode: typecheck (ou equivalente do projeto)
   - Rode: testes (ou equivalente do projeto)
   - Se falharem: reporte MAS não tente corrigir (sessão está encerrando)

4. **Git**: se tudo passa e há mudanças:
   - git add -A
   - git commit -m "session: [resumo de 1 linha do que foi feito]"

5. **UNTOUCHABLE check**: verifique que arquivos protegidos não foram modificados

6. **Report**:
   - Resumo da sessão (3-5 linhas)
   - Custo: /cost
   - Próximo passo ao retomar
