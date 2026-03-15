Auditoria completa do projeto atual. Analise como senior consultant.

1. **Arquitetura**: estrutura de pastas coerente? Separação de responsabilidades? Acoplamento?
2. **TypeScript**: erros de tipo? Uso de `any`? Type assertions desnecessárias?
3. **Segurança**: secrets expostos? Input não validado? SQL injection? XSS? CORS?
4. **Performance**: N+1 queries? Memory leaks? Bundle size? Re-renders?
5. **Testes**: cobertura adequada? Testes frágeis? Edge cases cobertos?
6. **Dead code**: imports não usados? Funções órfãs? Arquivos abandonados?
7. **Dependências**: desatualizadas? Vulnerabilidades conhecidas? Deps desnecessárias?
8. **CLAUDE.md**: existe? <200 linhas? Regras relevantes? @imports atualizados?
9. **DX**: scripts de dev funcionam? CI/CD configurado? Lint + format?

Formato:
## Score: [A/B/C/D/F]

### 🚨 Crítico (corrigir imediatamente)
[lista]

### ⚠️ Importante (corrigir esta semana)
[lista]

### 💡 Melhorias (backlog)
[lista]

### ✅ Pontos fortes
[lista]

### Plano de ação
[3-5 itens priorizados com estimativa de esforço]
