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

- CI fix: nunca tinha funcionado (91 runs vermelhos). Corrigido pnpm version,
  lockfile, env vars placeholders, lint warnings.
- ESLint: no-explicit-any mudado de error pra warn (tech debt, revisitar)

- Phase 7: Dashboards gestores com Recharts. 3 níveis: teacher (turma),
  director (escola), secretary (rede/estado).
- Seed demo: dados fictícios pra demonstração em vendas.
  75 alunos, 3 turmas, 3 meses de atividade, distribuição realista.
  Identificáveis por org name "Escola Demonstração", deletáveis via /admin/seed-demo.
- Dashboard queries usam supabaseAdmin pra bypassar RLS.
  Server actions verificam role do user ANTES de executar query.
- dashboard.ts: getTeacherDashboard, getDirectorDashboard, getSecretaryDashboard
- Components em src/components/dashboard/dashboard-views.tsx
