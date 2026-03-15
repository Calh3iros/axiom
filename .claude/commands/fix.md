Diagnostique e corrija: $ARGUMENTS

Protocolo (nesta ordem exata):
1. INVESTIGATE: leia os arquivos relevantes, logs, erros
2. DIAGNÓSTICO: identifique a CAUSA ROOT, não o sintoma
3. PROPONHA o fix antes de implementar (1-2 frases)
4. IMPLEMENTE o fix
5. VERIFIQUE: rode typecheck + testes
6. CONFIRME: o fix resolve sem efeitos colaterais?

Se o diagnóstico não é claro após investigação:
- Liste 3 hipóteses ordenadas por probabilidade
- Teste a mais provável primeiro
- Se falhar, teste a segunda

NUNCA: aplique fix sem entender a causa root.
NUNCA: modifique arquivos fora do escopo do bug.
