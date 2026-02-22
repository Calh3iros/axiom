# Pontos de Atenção Estruturais e de Escalabilidade

Análise técnica focada em estabilidade, custos e potencial de escala do Axiom.

## 1. Fragilidade do "Free Anônimo" (Abuso)

**O Plano:** Permitir uso gratuito de 3 soluções/dia baseado em IP e `localStorage` para reduzir o atrito inicial.
**A Falha:** Estudantes são experts em burlar sistemas. `localStorage` é zerado abrindo uma aba anônima. Bloqueio por IP tem outro problema grave: redes de faculdades, bibliotecas ou repúblicas estudantis dividem o mesmo IP (NAT). Se você bloquear o IP de uma faculdade após 3 usos, dezenas de outros estudantes legítimos lá dentro ficarão bloqueados no primeiro toque.
**A Solução Estrutural:**

- Usar "Device Fingerprinting" no Edge (via Edge Middleware da Vercel) pareado com um Redis super rápido (ex: Upstash) para contar requisições de forma descentralizada.
- Adicionar um captcha invisível (como Cloudflare Turnstile) na API pública para evitar que bots coreanos/russos drenem sua API Key do Claude raspando o site indiscriminadamente.

## 2. Timeouts em Funcionalidades Pesadas ("Panic Mode")

**O Plano:** O Panic Mode gera um resumo, 10 perguntas e flashcards de uma vez via `/api/panic` usando `generateObject`.
**A Falha:** Rotas de API Serverless padrão da Vercel têm limite de tempo máximo (timeout de 10 a 15 segundos no plano base, e até 60s em contas Pro). Se o Claude demorar 25 segundos para pensar e gerar todo o conteúdo do Panic Mode, a Vercel vai "matar" a requisição no meio e o estudante receberá um clássico "504 Gateway Timeout".
**A Solução Estrutural:**

- Tudo o que demorar mais de 5-10 segundos precisa obrigatoriamente usar **Streaming** para manter a conexão HTTP viva do lado do cliente.
- Se for imperativo usar `generateObject` pesado sem streaming, precisaremos de processamento assíncrono (Upstash QStash, Inngest ou Supabase Edge Functions invocadas via webhooks), onde despachamos o serviço em background e a UI fica fazendo "polling" ou aguarda via WebSockets.

## 3. Histórico e Limite de Contexto do LLM (Custo Oculto)

**O Plano:** O tutor (Learn) analisa todo o histórico de questões resolvidas do aluno para traçar os pontos fracos.
**A Falha:** Se o aluno usou o app por 3 meses e resolveu 200 questões de matemática, despejar as 200 questões inteiras no "System Prompt" do Claude em cada nova interação vai devorar milhares de tokens (aumentando absurdamente o custo por mensagem) e rapidamente esgotará a janela de contexto.
**A Solução Estrutural (RAG Avançado e Resumos):**

- Ativar a extensão `pgvector` no Supabase. Em vez de jogar o histórico cru pro Claude, quando o aluno resolve uma questão, vetorizamos a essência do erro (ex: metacontent "erro em integrais por partes"). Quando o tutor interagir, puxamos apenas os vetores/resumos mais recentes e relevantes. Isso reduz >90% de custo na API e mantém a interação absurdamente rápida.

## 4. Gestão de Contexto e Gerenciamento de Estado UI

**A Falha:** O estado da aplicação (typing indicator, uploads de câmera em andamento, timers) em React pode se tornar caótico se usarmos apenas `useState` espalhados, causando re-renderizações excessivas em dispositivos móveis mais fracos.
**A Solução:** Garantir que o `zustand` seja a única fonte de verdade centralizada. Além disso, os buffers das imagens tiradas na câmera precisam ser formatados (resize via Canvas, transformados em Base64 ou FormData) e imediatamento descartados da HEAP memory do navegador, para não crashar abas web no iOS Safari.

## 5. Necessidade de um Admin Panel (Internal Dashboard)

**Vale a pena ter um Admin Panel?**
SIM. Um produto B2C SaaS (alta escalabilidade, ticket baixo, uso maciço) precisa de observabilidade absoluta. A longo prazo, você não passará os dias usando o painel padrão do Supabase ou Stripe de forma isolada—é ineficiente.

**Onde ele deve ficar?**
O ideal é um domínio apartado (ex: `admin.axiom.com` ou `hq.axiom.com`). Colocá-lo no mesmo front-end (ex: `axiom.com/admin`) inflaria o bundle React do estudante e exigiria mais roteamento lógico misturado no app principal. Ele ligará com as mesmas chaves ao banco do Supabase e sua conta com nível de segurança estrito (`is_admin = true` nas rules de RLS).

### O MVP do Painel Admin Ideal

Poderemos dividir as áreas importantes por setor:

#### 1. Visão de FinOps e API (Custos)

- **Token Burndown Chart:** Visualização em tempo real de tokens consumidos vs receita gerada no dia. Monitoramento do gasto Haiku vs Sonnet.
- **Master Killswitch:** Um botão gigante no estilo "Anthropic Caiu". Se as requisições API estiverem dando timeout, esse botão muda o app temporariamente para outro provedor (OpenAI / Gemini) ou força cache local.
- **Shadowban & Rate Limits:** Tabela ao vivo de IPs/Fingerprints batendo os limites do free tier. Botão de "Shadowban": o aluno não sabe que foi bloqueado, as requisições dele só são deliberadamente atrasadas em 15 segundos ou respondem genérico, travando bots e abusadores.

#### 2. Visão de Produto e Conteúdo (CS & QA)

- **Query Inspector (Privacy-first):** Dashboard anonimizando os inputs (texto e imagem) da roleta de "Solve". Crucial para lermos os _erros e alucinações_ da IA ("olha como o Claude errou essa derivada") e fazermos o ajuste fino do prompt de back-end.
- **Topics Heatmap:** Nuvem de tags sobre quais matérias estão tracionando agora e o % de falhas. "Opa, o app tá com dificuldade enorme de resolver Álgebra Linear hoje."

#### 3. Visão de Marketing e Growth

- **Métricas de Funil "Time to Panic":** Gráficos analisando conversão do Panic Mode (quantos usaram a ferramenta 1 dia antes da prova e assinaram o Pro ali mesmo vs quantos só viram o free).
- **Viralidade ("Solve pra Turma"):** Quantos compartilhamentos geraram leads reais do freemium nos últimos dias, ranqueados por escola ou IP regional (o app viralizou na biblioteca do MIT?).
