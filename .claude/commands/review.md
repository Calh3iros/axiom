Code review adversarial do último commit (ou dos arquivos modificados).

Analise com rigor de senior reviewer. Sem passar pano. Verifique:

1. **Tipos**: TypeScript strict, sem `any`, sem type assertions desnecessárias
2. **Edge cases**: null, undefined, array vazio, string vazia, 0, NaN
3. **Segurança**: SQL injection, XSS, secrets expostos, input não validado
4. **Performance**: N+1 queries, memory leaks, re-renders desnecessários
5. **Erros**: tratamento adequado, mensagens úteis, propagação correta
6. **Testes**: existem? cobrem os edge cases? são frágeis?
7. **Estilo**: consistente com o codebase, sem console.log, naming claro
8. **UNTOUCHABLE**: arquivos protegidos foram tocados?
9. **Lógica**: o código faz o que deveria? Há bugs sutis?

Formato do report:
- 🚨 CRÍTICO: [item] — deve corrigir antes de merge
- ⚠️ ATENÇÃO: [item] — deveria corrigir
- 💡 SUGESTÃO: [item] — melhoraria qualidade
- ✅ BOM: [aspecto positivo] — reforçar pattern

Se tudo impecável: "Review limpo. Código world-class."
