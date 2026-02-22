const fs = require('fs');
const path = require('path');

const langs = ['en', 'pt', 'es', 'fr', 'de', 'zh'];
const data = {
  en: {
    Learn: {
      title: 'Learn Tutor',
      description: 'Your AI study companion. Ask anything — "Teach me calculus from zero".',
      panicBtn: '🚨 PANIC MODE',
      whatToLearn: 'What do you want to learn?',
      askMeAnythingDesc: 'Ask me anything — "Teach me derivatives from scratch", "Explain photosynthesis", or "Help me understand recursion".',
      sug1: 'Teach me calculus basics',
      sug2: 'Explain DNA replication',
      sug3: 'How does recursion work?',
      sug4: 'Prep me for my physics exam',
      thinking: 'Thinking...',
      inputPlaceholder: 'Ask me anything... "Teach me about..."'
    },
    Panic: {
      backBtn: 'Back to Tutor',
      title: 'Panic Mode',
      description: 'Generate a complete exam prep package in seconds',
      subjectPlaceholder: 'Subject (e.g. Organic Chemistry)',
      chapterPlaceholder: 'Chapter or topic (optional)',
      generating: 'Generating study package...',
      activateBtn: '🚨 ACTIVATE PANIC MODE',
      tabSummary: 'Summary',
      tabQA: 'Q&A',
      tabFlashcards: 'Flashcards',
      tabPlan: 'Study Plan'
    }
  },
  pt: {
    Learn: {
      title: 'Tutor Interativo',
      description: 'Seu companheiro de estudos com IA. Pergunte qualquer coisa — "Ensine cálculo do zero".',
      panicBtn: '🚨 MODO PÂNICO',
      whatToLearn: 'O que você quer aprender?',
      askMeAnythingDesc: 'Pergunte qualquer coisa — "Me ensine derivadas do zero", "Explique a fotossíntese", ou "Me ajude a entender recursão".',
      sug1: 'Me ensine o básico de cálculo',
      sug2: 'Explique a replicação do DNA',
      sug3: 'Como funciona a recursão?',
      sug4: 'Me prepare para a prova de física',
      thinking: 'Pensando...',
      inputPlaceholder: 'Pergunte qualquer coisa... "Me ensine sobre..."'
    },
    Panic: {
      backBtn: 'Voltar ao Tutor',
      title: 'Modo Pânico',
      description: 'Gere um pacote completo de estudo em segundos',
      subjectPlaceholder: 'Matéria (ex: Química Orgânica)',
      chapterPlaceholder: 'Capítulo ou tópico (opcional)',
      generating: 'Gerando pacote de estudo...',
      activateBtn: '🚨 ATIVAR MODO PÂNICO',
      tabSummary: 'Resumo',
      tabQA: 'P&R',
      tabFlashcards: 'Flashcards',
      tabPlan: 'Plano de Estudo'
    }
  },
  es: {
    Learn: {
      title: 'Tutor Interactivo',
      description: 'Tu compañero de estudio con IA. Pregunta cualquier cosa — "Enséñame cálculo desde cero".',
      panicBtn: '🚨 MODO PÁNICO',
      whatToLearn: '¿Qué quieres aprender?',
      askMeAnythingDesc: 'Pregunta cualquier cosa — "Enséñame derivadas desde cero", "Explica la fotosíntesis", o "Ayúdame a entender la recursión".',
      sug1: 'Enséñame lo básico de cálculo',
      sug2: 'Explica la replicación del ADN',
      sug3: '¿Cómo funciona la recursión?',
      sug4: 'Prepárame para mi examen de física',
      thinking: 'Pensando...',
      inputPlaceholder: 'Pregunta cualquier cosa... "Enséñame sobre..."'
    },
    Panic: {
      backBtn: 'Volver al Tutor',
      title: 'Modo Pánico',
      description: 'Genera un paquete completo de estudio en segundos',
      subjectPlaceholder: 'Materia (ej: Química Orgánica)',
      chapterPlaceholder: 'Capítulo o tema (opcional)',
      generating: 'Generando paquete de estudio...',
      activateBtn: '🚨 ACTIVAR MODO PÁNICO',
      tabSummary: 'Resumen',
      tabQA: 'P y R',
      tabFlashcards: 'Tarjetas',
      tabPlan: 'Plan de Estudio'
    }
  },
  fr: {
    Learn: {
      title: "Tuteur Interactif",
      description: "Votre compagnon d'étude IA. Demandez n'importe quoi — \"Apprends-moi le calcul depuis le début\".",
      panicBtn: "🚨 MODE PANIQUE",
      whatToLearn: "Que voulez-vous apprendre ?",
      askMeAnythingDesc: "Demandez n'importe quoi — \"Explique-moi les dérivées\", \"Comment fonctionne la photosynthèse\", ou \"Aide-moi à comprendre la récursivité\".",
      sug1: "Apprends-moi les bases du calcul",
      sug2: "Explique-moi la réplication de l'ADN",
      sug3: "Comment fonctionne la récursivité ?",
      sug4: "Prépare-moi pour mon examen de physique",
      thinking: "Réflexion...",
      inputPlaceholder: "Demandez n'importe quoi... \"Explique-moi...\""
    },
    Panic: {
      backBtn: "Retour au Tuteur",
      title: "Mode Panique",
      description: "Générez un package de préparation aux examens en quelques secondes",
      subjectPlaceholder: "Matière (ex: Chimie Organique)",
      chapterPlaceholder: "Chapitre ou sujet (optionnel)",
      generating: "Génération en cours...",
      activateBtn: "🚨 ACTIVER LE MODE PANIQUE",
      tabSummary: "Résumé",
      tabQA: "Questions-Réponses",
      tabFlashcards: "Flashcards",
      tabPlan: "Plan d'Étude"
    }
  },
  de: {
    Learn: {
      title: 'Interaktiver Tutor',
      description: 'Dein KI-Studienbegleiter. Frag alles — "Bring mir Infinitesimalrechnung von Null auf bei".',
      panicBtn: '🚨 PANIK-MODUS',
      whatToLearn: 'Was möchtest du lernen?',
      askMeAnythingDesc: 'Frag alles — "Erkläre mir Ableitungen von Grund auf", "Erkläre Photosynthese" oder "Hilf mir, Rekursion zu verstehen".',
      sug1: 'Bring mir die Grundlagen der Infinitesimalrechnung bei',
      sug2: 'Erkläre die DNA-Replikation',
      sug3: 'Wie funktioniert Rekursion?',
      sug4: 'Bereite mich auf meine Physikprüfung vor',
      thinking: 'Denke nach...',
      inputPlaceholder: 'Frag alles... "Bring mir etwas bei über..."'
    },
    Panic: {
      backBtn: 'Zurück zum Tutor',
      title: 'Panik-Modus',
      description: 'Generiere ein komplettes Prüfungsvorbereitungspaket in Sekunden',
      subjectPlaceholder: 'Fach (z.B. Organische Chemie)',
      chapterPlaceholder: 'Kapitel oder Thema (optional)',
      generating: 'Generiere Studienpaket...',
      activateBtn: '🚨 PANIK-MODUS AKTIVIEREN',
      tabSummary: 'Zusammenfassung',
      tabQA: 'F&A',
      tabFlashcards: 'Karteikarten',
      tabPlan: 'Studienplan'
    }
  },
  zh: {
    Learn: {
      title: '互动导师',
      description: '你的AI学习伙伴。随便问——“从零开始教我微积分”。',
      panicBtn: '🚨 恐慌模式',
      whatToLearn: '你想学什么？',
      askMeAnythingDesc: '随便问——“从头教我导数”、“解释光合作用”或“帮我理解递归”。',
      sug1: '教我微积分基础',
      sug2: '解释DNA复制',
      sug3: '递归是怎么工作的？',
      sug4: '帮我准备物理考试',
      thinking: '思考中...',
      inputPlaceholder: '随便问...“教我...”'
    },
    Panic: {
      backBtn: '返回导师',
      title: '恐慌模式',
      description: '在几秒钟内生成完整的备考包',
      subjectPlaceholder: '科目（如：有机化学）',
      chapterPlaceholder: '章节或主题（可选）',
      generating: '正在生成学习包...',
      activateBtn: '🚨 激活恐慌模式',
      tabSummary: '摘要',
      tabQA: '问答',
      tabFlashcards: '抽认卡',
      tabPlan: '学习计划'
    }
  }
};

const messagesDir = path.join(process.cwd(), 'src/messages');

for (const lang of langs) {
  const filePath = path.join(messagesDir, lang + '.json');
  if (fs.existsSync(filePath)) {
    const jsonStr = fs.readFileSync(filePath, 'utf8');
    const dict = JSON.parse(jsonStr);
    dict.Dashboard = dict.Dashboard || {};
    dict.Dashboard.Learn = data[lang].Learn;
    dict.Dashboard.Panic = data[lang].Panic;
    fs.writeFileSync(filePath, JSON.stringify(dict, null, 2), 'utf8');
    console.log(`Updated ${lang}.json`);
  }
}
