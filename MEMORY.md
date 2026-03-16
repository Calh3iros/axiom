# MEMORY.md — Decisões Arquiteturais

## 2026-03-16
- Phase 5C: Escolhemos Recursive CTE (não materialized path, não ltree)
  porque profundidade máxima = 4 níveis, dataset pequeno (centenas de orgs),
  zero overhead de sync. Reversível pra ltree se escalar.
- Propagação hierárquica nos server actions, não no RLS.
  Razão: mais simples e debugável pra solo dev.
  RISCO: acesso direto via Supabase SDK client bypassaria a lógica.
  REVISITAR quando dados reais de alunos menores estiverem no sistema.

- Phase 6: Rankings organizacionais com 2 camadas
  - Camada aluno: problemas resolvidos, uso ativo, streak (métricas de ESFORÇO)
  - Camada gestor: + precisão, mastery, badges (métricas de PERFORMANCE)
  - Decisão: aluno NUNCA vê métricas de performance de outros alunos
  - Decisão: agregação via JOIN (não materializado), revisitar se performance degradar em 10k+ users
