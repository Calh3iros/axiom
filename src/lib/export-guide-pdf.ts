"use client";

import jsPDF from "jspdf";

// --- Colors ---------------------------------------------------------------
const ORANGE = [249, 115, 22] as const;
const DARK = [51, 51, 51] as const;
const DIM = [136, 136, 136] as const;
const WHITE = [255, 255, 255] as const;

// --- Helpers --------------------------------------------------------------
function setColor(doc: jsPDF, c: readonly [number, number, number]) {
  doc.setTextColor(c[0], c[1], c[2]);
}

function setFillColor(doc: jsPDF, c: readonly [number, number, number]) {
  doc.setFillColor(c[0], c[1], c[2]);
}

function safeText(text: string): string {
  return text
    .replace(/—/g, "-")
    .replace(/·/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E\u00C0-\u00FF]/g, ""); // strip non-ascii to avoid font issues
}

function addHeader(doc: jsPDF, roleName: string) {
  const pw = doc.internal.pageSize.getWidth();
  setFillColor(doc, ORANGE);
  doc.rect(0, 0, pw, 32, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  setColor(doc, WHITE);
  doc.text("AXIOM", 20, 15);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Guia do ${roleName}`, 20, 24);
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  setColor(doc, DIM);
  doc.text("axiom-solver.com", pw / 2, ph - 10, { align: "center" });
  doc.text(`${pageNum}/${totalPages}`, pw - 20, ph - 10);
}

interface GuideStep {
  title: string;
  desc: string;
  wpp?: string;
}

export async function exportGuidePdf(role: string): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const margin = 20;

  // Determine role content
  let roleTitle = "";
  let steps: GuideStep[] = [];
  let mainTitle = "";

  if (role === "director" || role === "admin") {
    roleTitle = "Diretor";
    mainTitle = "Como configurar sua escola";
    steps = [
      { title: "Criar turmas", desc: "Va ao dashboard da escola e crie as turmas manualmente ou clique em 'Criar em Lote' para adicionar varias de uma so vez." },
      { title: "Gerar codigo de professores (PRF)", desc: "Acesso a aba 'Professores' para pegar o codigo exclusivo para o cadastro da sua equipe pedagógica." },
      { title: "Compartilhe com a equipe", desc: "Copie a mensagem abaixo e envie no WhatsApp da sua equipe.", wpp: "Ola professores! Este e o codigo da nossa escola no Axiom. Cadastrem-se e entrem na nossa equipe: [SEU-CODIGO-AQUI]" },
      { title: "Acompanhe o painel", desc: "Acompanhe KPIs, classificacao (ranking) e engajamento diario da sua escola direto da pagina inicial." }
    ];
  } else if (role === "coordinator") {
    roleTitle = "Coordenador";
    mainTitle = "Visao pedagogica";
    steps = [
      { title: "Painel Comparativo", desc: "Analise dados cross-turma na barra do dashboard: compare adesao, rendimento e limites usados." },
      { title: "Alertas Pedagogicos", desc: "Localize turmas estrategicas onde a adesao esta caindo repentinamente e trace um plano de acao preventivo antes das notas." },
      { title: "Reatribuir turmas e CSVs", desc: "Ative ou delegue novas turmas acessando a lista de turmas sem tutores atribuidos, mantendo o painel e os links atualizados." }
    ];
  } else if (role === "teacher") {
    roleTitle = "Professor";
    mainTitle = "Guia Rapido - 3 minutos";
    steps = [
      { title: "Obter codigo da Turma", desc: "Entre na sua turma individual, no card de 'Minhas Turmas', e copie o codigo unico de convite exibido no topo." },
      { title: "Enviar aos alunos", desc: "Compartilhe o codigo da turma com seus estudantes para que ingressem e os exercicios ja entrem no seu acompanhamento.", wpp: "Turma, acessem axiom-solver.com e fiquem na vanguarda do aprendizado com IA! Entrem na nossa turma: [CODIGO-DA-TURMA]" },
      { title: "Seu Painel Exclusivo", desc: "Acompanhe evolucao, notas individualizadas, alertas de engajamento baseados na atividade dos alunos, e o ranking da turma a cliques de distancia." },
      { title: "Relatorios e PDFs", desc: "Exporte e imprima rapidamente boletins em PDF com todo o diagnostico do uso da plataforma de forma agregada." }
    ];
  } else if (role === "owner" || role === "secretary") {
    roleTitle = "Mantenedor / Secretaria";
    mainTitle = "Gerenciando sua rede";
    steps = [
      { title: "Criar escolas filiais", desc: "No hub central, clique no botao em '+ Nova Escola'." },
      { title: "Distribuir codigos (DIR)", desc: "Assegure-se de que cada escola recem-criada gera um codigo administrativo automatico. Distribua cada codigo aos diretores/gestores de polo para que criem e editem sua configuracao estrutural de la." },
      { title: "Dashboard Geral e Drill-Down", desc: "Semaforo visual que demonstra e sinaliza a adesao global de todas as escolas simultaneamente na rede. Explorar as escolas em vermelho te leva para resolucoes granulares das escolas sob pressao!" },
      { title: "Acompanhamento Organizacional", desc: "Garanta que a organizacao tenha as matriculas e as licencas atualizadas no portal para os professores terem acesso Elite." },
      { title: "Add administradores", desc: "Voce pode ceder e delegar licencas administrativas superiores pelo portal principal." }
    ];
  } else {
    roleTitle = "Usuario Geral";
    mainTitle = "Como usar o Axiom";
    steps = [
      { title: "Dashboard", desc: "Descubra todo o leque de opcoes disponivel" }
    ];
  }

  // Generate Document
  addHeader(doc, roleTitle);

  let y = 50;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  setColor(doc, DARK);
  doc.text(safeText(mainTitle), margin, y);
  y += 15;

  steps.forEach((step, idx) => {
    // Page break prevention
    if (y > 240) {
      doc.addPage();
      addHeader(doc, roleTitle);
      y = 50;
    }

    // Step Number
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    setColor(doc, ORANGE);
    doc.text(`${idx + 1}.`, margin, y);

    // Step Title
    doc.setFontSize(11);
    setColor(doc, DARK);
    doc.text(safeText(step.title), margin + 8, y);
    
    y += 6;

    // Step Desc
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    setColor(doc, DIM);
    const splitDesc = doc.splitTextToSize(safeText(step.desc), pw - margin * 2 - 8);
    doc.text(splitDesc, margin + 8, y);
    
    y += splitDesc.length * 4 + 4;

    // Wpp Quote String block
    if (step.wpp) {
      if (y > 260) {
        doc.addPage();
        addHeader(doc, roleTitle);
        y = 50;
      }
      
      setFillColor(doc, [230, 245, 230]); // light green
      const splitWpp = doc.splitTextToSize(safeText(`"${step.wpp}"`), pw - margin * 2 - 12);
      const h = splitWpp.length * 5 + 6;
      doc.roundedRect(margin + 8, y, pw - margin * 2 - 8, h, 2, 2, "F");
      
      setColor(doc, [34, 197, 94]); // Green text equivalent
      doc.setFont("helvetica", "italic");
      doc.text(splitWpp, margin + 11, y + 6);
      
      y += h + 6;
    } else {
      y += 2; // subtle gap
    }
  });

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    addFooter(doc, p, totalPages);
  }

  doc.save(`axiom-guia-${role}.pdf`);
}
