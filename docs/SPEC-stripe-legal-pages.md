# SPEC: Stripe Compliance — Footer + Legal Pages

## SESSION RULES
- **Auto-reflexão**: Antes de cada edit, confirmar que entendeu O QUÊ e POR QUÊ
- **Cirúrgico**: Não tocar em NADA fora do escopo desta spec
- **UNTOUCHABLE**: Auth, dashboard, API routes, billing logic, qualquer coisa que não seja footer e legal pages
- **INVESTIGATE FIRST**: Antes de implementar qualquer coisa, investigar a estrutura atual do projeto

---

## CONTEXTO

Axiom Solver precisa passar na verificação automática da Stripe. O bot da Stripe vai crawlear `https://axiom-solver.com` e procurar:
1. Nome da empresa visível no site
2. Email de contato
3. Terms of Service
4. Refund & Cancellation Policy
5. Privacy Policy

Se faltar QUALQUER um desses, a conta é rejeitada com error codes específicos. Esta spec implementa tudo de uma vez.

---

## FASE 1: INVESTIGATE

Antes de escrever uma linha de código:

1. Verificar estrutura do projeto:
   - Framework (Next.js? versão?)
   - Estrutura de pastas (`/app` ou `/pages`?)
   - Existe footer component? Onde?
   - Existe sistema de i18n? Qual? Como funciona?
   - Existe pasta/padrão para páginas estáticas/legais?
   - Qual o layout global? (`layout.tsx`?)
   - Qual a font/design system usado? (Tailwind? CSS modules?)

2. Verificar o footer atual:
   - Existe? Onde está?
   - O que contém atualmente?
   - Está no layout global ou em páginas individuais?

3. Verificar routing:
   - Como funciona o routing? (App Router? Pages Router?)
   - Existe padrão para páginas de conteúdo estático?

**OUTPUT DA INVESTIGAÇÃO**: Reportar findings antes de prosseguir.

---

## FASE 2: IMPLEMENT — FOOTER

### Requisito
Footer visível na landing page (no mínimo). Idealmente no layout global pra aparecer em todas as páginas.

### Conteúdo exato do footer

```
© 2025 Axiom Solver — RC Aulas Particulares LTDA
CNPJ: 41.771.175/0001-80
Contact: support@axiom-solver.com

Terms of Service | Privacy Policy | Refund Policy
```

### Regras de implementação

- Os 3 links devem apontar para as respectivas páginas legais (ver Fase 3)
- `support@axiom-solver.com` deve ser um `mailto:` link clicável
- Se existe i18n, os textos do footer devem ir nos arquivos de tradução:
  - "Contact" → PT: "Contato"
  - "Terms of Service" → PT: "Termos de Serviço"
  - "Privacy Policy" → PT: "Política de Privacidade"
  - "Refund Policy" → PT: "Política de Reembolso"
  - Os dados factuais (nome da empresa, CNPJ, email) NÃO mudam entre idiomas
- Se NÃO existe i18n, hardcode em inglês
- Design: limpo, discreto, consistente com o design system existente. Texto pequeno, cor secundária/muted. Não deve competir visualmente com o conteúdo principal.
- Ano `2025` → extrair dinamicamente com `new Date().getFullYear()` para não ficar desatualizado

### Estrutura sugerida (adaptar ao design system)

```
<footer>
  <div> <!-- Container com max-width do site -->
    <p>© {year} Axiom Solver — RC Aulas Particulares LTDA</p>
    <p>CNPJ: 41.771.175/0001-80</p>
    <p>Contact: <a href="mailto:support@axiom-solver.com">support@axiom-solver.com</a></p>
    <nav>
      <a href="/legal/terms">Terms of Service</a>
      <a href="/legal/privacy">Privacy Policy</a>
      <a href="/legal/refund">Refund Policy</a>
    </nav>
  </div>
</footer>
```

---

## FASE 3: IMPLEMENT — LEGAL PAGES

### 3 páginas a criar:

| Rota | Conteúdo |
|---|---|
| `/legal/terms` | Terms of Service |
| `/legal/privacy` | Privacy Policy |
| `/legal/refund` | Refund & Cancellation Policy |

### Onde buscar o conteúdo

Os textos completos em markdown estão nos 3 arquivos que serão colocados no projeto:

1. `terms-of-service.md` — Terms of Service completo
2. `privacy-policy.md` — Privacy Policy completo
3. `refund-cancellation-policy.md` — Refund & Cancellation Policy completo

### Opção de implementação (escolher baseado na investigação)

**Opção A — Páginas React diretas**: Se o projeto não tem sistema de markdown, criar as 3 páginas como componentes React com o conteúdo inline em JSX. Usar elementos semânticos (`<h1>`, `<h2>`, `<p>`, `<ul>`).

**Opção B — Markdown rendering**: Se o projeto já usa MDX ou tem setup de markdown, usar os .md files diretamente.

**Opção C — Página única com âncoras**: Uma rota `/legal` com as 3 seções e navigation interna. Footer links apontam para `/legal#terms`, `/legal#privacy`, `/legal#refund`. Menos arquivos, mas página longa.

**Recomendação**: Opção A ou B. Páginas separadas são melhores pro bot (URL dedicada pra cada política) e pra UX (link direto no footer leva exatamente ao conteúdo esperado).

### Regras de implementação

- Layout: usar o mesmo layout/wrapper das outras páginas do site
- Largura máxima do texto: ~720px centrado (legibilidade)
- Typography: respeitar o design system existente. Headings, parágrafos, listas devem seguir o mesmo estilo do resto do site.
- Sem sidebar, sem navegação complexa. Conteúdo puro com back link ou breadcrumb pro home.
- Mobile responsive
- Se existe i18n: O conteúdo completo de cada página deve estar nos arquivos de tradução (EN + PT). Os textos em PT serão adicionados depois — por agora, criar a estrutura com os textos EN e colocar placeholders nos arquivos de i18n PT se necessário.
- A frase no topo de cada documento: "This document is available in Portuguese for convenience. In case of conflict, the English version prevails." — só aparece na versão PT. Na versão EN, não mostrar.

### Conteúdo das páginas — TRANSCRIÇÃO EXATA

Os arquivos .md contêm o texto final aprovado. Transcrever fielmente. NÃO adicionar, remover ou alterar parágrafos. NÃO mudar a estrutura de headings. NÃO inventar cláusulas extras.

Única alteração permitida: adaptar markdown syntax → JSX/HTML conforme necessário pela implementação.

---

## FASE 4: TEST

1. `npm run build` — deve compilar sem erros
2. Verificar em localhost:
   - [ ] Footer aparece na landing page
   - [ ] Footer aparece nas legal pages
   - [ ] Link "Terms of Service" abre `/legal/terms` com conteúdo completo
   - [ ] Link "Privacy Policy" abre `/legal/privacy` com conteúdo completo
   - [ ] Link "Refund Policy" abre `/legal/refund` com conteúdo completo
   - [ ] Email no footer é clicável (mailto)
   - [ ] Todas as páginas são acessíveis sem login
   - [ ] Layout responsivo (desktop + mobile)
   - [ ] Textos completos, nenhuma seção faltando

3. Testar em aba anônima: `https://axiom-solver.com` após deploy deve mostrar landing com footer e legal pages acessíveis sem autenticação

---

## FASE 5: DEPLOY

1. `git add .`
2. `git commit -m "feat: add Stripe-compliant footer and legal pages (Terms, Privacy, Refund)"`
3. `git push`
4. Aguardar deploy no Vercel
5. Após deploy: abrir `https://axiom-solver.com` via `start ""` (nunca arquivo local)
6. Verificar em aba anônima que tudo funciona em produção

---

## RESUMO — ENTREGÁVEIS

| # | Entregável | Descrição |
|---|---|---|
| 1 | Footer component | Atualizado/criado com nome legal, CNPJ, email, links |
| 2 | `/legal/terms` | Página Terms of Service completa |
| 3 | `/legal/privacy` | Página Privacy Policy completa |
| 4 | `/legal/refund` | Página Refund & Cancellation Policy completa |
| 5 | i18n entries | Se aplicável: chaves de tradução no sistema existente |

**NADA MAIS. Não refatorar, não "melhorar" outros componentes, não adicionar features.**
