const fs = require('fs');
const path = require('path');

const langs = ['en', 'pt', 'es', 'fr', 'de', 'zh'];

// Mapped translations for the remaining untranslated components
const data = {
  en: {
    Auth: {
      checkInbox: 'Check your inbox',
      checkEmail: 'Check your email',
      orContinue: 'or continue with email',
      namePlaceholder: 'Your name',
      emailPlaceholder: 'you@email.com',
      minChars: 'Min. 6 characters'
    },
    Share: {
      chatNotFound: 'Chat not found',
      invalidLink: 'This link may be invalid or the chat is no longer shared.',
      solvedBy: 'Solved by Axiom in 5 seconds',
      returnHome: 'Return to Axiom',
      tryFree: 'Try Free',
      sharedSolution: 'Shared Solution:',
      untitledChat: 'Untitled Session',
      snapshotDesc: 'This is a read-only snapshot of a conversation solved by Axiom AI.',
      stopWaiting: 'Stop waiting. Start solving.',
      joinThousands: 'Join thousands of students getting instant, step-by-step solutions to their hardest questions.',
      createFree: 'Create your free account'
    },
    Components: {
      emergencyActive: 'EMERGENCY MODE ACTIVE',
      clickToFlip: 'Click a card to flip it',
      input: 'Input',
      humanizedResult: 'Humanized Result',
      applyingImperfections: 'Applying subtle imperfections...',
      pasteText: 'Paste AI-generated text here to humanize...',
      copyToClipboard: 'Copy to clipboard',
      howCanIHelp: 'How can I help you?',
      thinking: 'Thinking...',
      imageAttached: 'Image attached',
      attachedImage: 'Attached image',
      shareWithClass: 'Share with Class',
      preview: 'Preview',
      uploadPhoto: 'Upload photo',
      yourText: 'Your Text',
      writing: 'Writing...',
      selectAction: 'Select an action from the toolbar to generate content.',
      noCitations: 'No citations yet.',
      selectToCite: 'Select text and click "Cite" to generate sources.',
      clearBtn: 'Clear',
      pasteEssayTopic: 'Paste your essay topic, paragraph, or text here...',
      copyOutput: 'Copy output',
      copyBtn: 'Copy',
      axiomUltra: 'Axiom Ultra',
      ultraPlanIncludes: 'ULTRA PLAN INCLUDES:'
    },
    Language: {
      en: 'English',
      pt: 'Português',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      zh: '中文'
    }
  },
  pt: {
    Auth: {
      checkInbox: 'Olhe sua caixa de entrada',
      checkEmail: 'Verifique seu email',
      orContinue: 'ou continue com email',
      namePlaceholder: 'Seu nome',
      emailPlaceholder: 'voce@email.com',
      minChars: 'Mín. 6 caracteres'
    },
    Share: {
      chatNotFound: 'Chat não encontrado',
      invalidLink: 'Este link pode ser inválido ou o chat não é mais compartilhado.',
      solvedBy: 'Resolvido pelo Axiom em 5 segundos',
      returnHome: 'Voltar para o Axiom',
      tryFree: 'Testar Grátis',
      sharedSolution: 'Solução Compartilhada:',
      untitledChat: 'Sessão sem título',
      snapshotDesc: 'Este é um instantâneo somente leitura de uma conversa resolvida pela Axiom AI.',
      stopWaiting: 'Pare de esperar. Comece a resolver.',
      joinThousands: 'Junte-se a milhares de estudantes recebendo soluções instantâneas passo a passo para as perguntas mais difíceis.',
      createFree: 'Crie sua conta grátis'
    },
    Components: {
      emergencyActive: 'MODO DE EMERGÊNCIA ATIVO',
      clickToFlip: 'Clique em um card para virar',
      input: 'Entrada',
      humanizedResult: 'Resultado Humanizado',
      applyingImperfections: 'Aplicando imperfeições sutis...',
      pasteText: 'Cole o texto gerado por IA aqui para humanizar...',
      copyToClipboard: 'Copiar para área de transferência',
      howCanIHelp: 'Como posso te ajudar?',
      thinking: 'Pensando...',
      imageAttached: 'Imagem anexada',
      attachedImage: 'Imagem em anexo',
      shareWithClass: 'Compartilhar com a Turma',
      preview: 'Visualização',
      uploadPhoto: 'Fazer upload de foto',
      yourText: 'Seu Texto',
      writing: 'Escrevendo...',
      selectAction: 'Selecione uma ação da barra de ferramentas para gerar conteúdo.',
      noCitations: 'Nenhuma citação ainda.',
      selectToCite: 'Selecione o texto e clique em "Citar" para gerar fontes.',
      clearBtn: 'Limpar',
      pasteEssayTopic: 'Cole o tópico da sua redação, parágrafo ou texto aqui...',
      copyOutput: 'Copiar resultado',
      copyBtn: 'Copiar',
      axiomUltra: 'Axiom Ultra',
      ultraPlanIncludes: 'O PLANO ULTRA INCLUI:'
    },
    Language: {
      en: 'English',
      pt: 'Português',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      zh: '中文'
    }
  },
  es: {
    Auth: {
      checkInbox: 'Revisa tu bandeja de entrada',
      checkEmail: 'Verifica tu correo electrónico',
      orContinue: 'o continúa con correo electrónico',
      namePlaceholder: 'Tu nombre',
      emailPlaceholder: 'tu@email.com',
      minChars: 'Mín. 6 caracteres'
    },
    Share: {
      chatNotFound: 'Chat no encontrado',
      invalidLink: 'Este enlace puede no ser válido o el chat ya no está compartido.',
      solvedBy: 'Resuelto por Axiom en 5 segundos',
      returnHome: 'Volver a Axiom',
      tryFree: 'Probar Gratis',
      sharedSolution: 'Solución Compartida:',
      untitledChat: 'Sesión sin título',
      snapshotDesc: 'Esta es una instantánea de solo lectura de una conversación resuelta por Axiom AI.',
      stopWaiting: 'Deja de esperar. Empieza a resolver.',
      joinThousands: 'Únete a miles de estudiantes que obtienen soluciones instantáneas paso a paso a sus preguntas más difíciles.',
      createFree: 'Crea tu cuenta gratis'
    },
    Components: {
      emergencyActive: 'MODO DE EMERGENCIA ACTIVO',
      clickToFlip: 'Haz clic en una tarjeta para voltearla',
      input: 'Entrada',
      humanizedResult: 'Resultado Humanizado',
      applyingImperfections: 'Aplicando imperfecciones sutiles...',
      pasteText: 'Pega el texto generado por IA aquí para humanizar...',
      copyToClipboard: 'Copiar al portapapeles',
      howCanIHelp: '¿Cómo puedo ayudarte?',
      thinking: 'Pensando...',
      imageAttached: 'Imagen adjunta',
      attachedImage: 'Imagen adjuntada',
      shareWithClass: 'Compartir con la Clase',
      preview: 'Vista previa',
      uploadPhoto: 'Subir foto',
      yourText: 'Tu Texto',
      writing: 'Escribiendo...',
      selectAction: 'Selecciona una acción de la barra de herramientas para generar contenido.',
      noCitations: 'No hay citas todavía.',
      selectToCite: 'Selecciona texto y haz clic en "Citar" para generar fuentes.',
      clearBtn: 'Limpiar',
      pasteEssayTopic: 'Pega el tema de tu ensayo, párrafo o texto aquí...',
      copyOutput: 'Copiar resultado',
      copyBtn: 'Copiar',
      axiomUltra: 'Axiom Ultra',
      ultraPlanIncludes: 'EL PLAN ULTRA INCLUYE:'
    },
    Language: {
      en: 'English',
      pt: 'Português',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      zh: '中文'
    }
  },
  fr: {
    Auth: {
      checkInbox: "Vérifiez votre boîte de réception",
      checkEmail: "Vérifiez votre e-mail",
      orContinue: "ou continuez avec l'e-mail",
      namePlaceholder: "Votre nom",
      emailPlaceholder: "vous@email.com",
      minChars: "Min. 6 caractères"
    },
    Share: {
      chatNotFound: "Discussion introuvable",
      invalidLink: "Ce lien peut être invalide ou la discussion n'est plus partagée.",
      solvedBy: "Résolu par Axiom en 5 secondes",
      returnHome: "Retour à Axiom",
      tryFree: "Essayer Gratuitement",
      sharedSolution: "Solution Partagée :",
      untitledChat: "Session sans titre",
      snapshotDesc: "Ceci est un aperçu en lecture seule d'une conversation résolue par Axiom AI.",
      stopWaiting: "Arrêtez d'attendre. Commencez à résoudre.",
      joinThousands: "Rejoignez des milliers d'étudiants obtenant des solutions instantanées étape par étape à leurs questions les plus difficiles.",
      createFree: "Créez votre compte gratuit"
    },
    Components: {
      emergencyActive: "MODE D URGENT ACTIF",
      clickToFlip: "Cliquez sur une carte pour la retourner",
      input: "Entrée",
      humanizedResult: "Résultat Humanisé",
      applyingImperfections: "Application de subtiles imperfections...",
      pasteText: "Collez le texte généré par l IA ici pour l humaniser...",
      copyToClipboard: "Copier dans le presse-papiers",
      howCanIHelp: "Comment puis-je vous aider ?",
      thinking: "Réflexion...",
      imageAttached: "Image jointe",
      attachedImage: "Image attachée",
      shareWithClass: "Partager avec la Classe",
      preview: "Aperçu",
      uploadPhoto: "Télécharger une photo",
      yourText: "Votre Texte",
      writing: "Écriture...",
      selectAction: "Sélectionnez une action dans la barre d outils pour générer du contenu.",
      noCitations: "Aucune citation pour le moment.",
      selectToCite: "Sélectionnez du texte et cliquez sur Citer pour générer des sources.",
      clearBtn: "Effacer",
      pasteEssayTopic: "Collez le sujet de votre essai, paragraphe ou texte ici...",
      copyOutput: "Copier le résultat",
      copyBtn: "Copier",
      axiomUltra: "Axiom Ultra",
      ultraPlanIncludes: "LE PLAN ULTRA COMPREND :"
    },
    Language: {
      en: 'English',
      pt: 'Português',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      zh: '中文'
    }
  },
  de: {
    Auth: {
      checkInbox: 'Überprüfe deinen Posteingang',
      checkEmail: 'Überprüfe deine E-Mail',
      orContinue: 'oder weiter mit E-Mail',
      namePlaceholder: 'Dein Name',
      emailPlaceholder: 'du@email.com',
      minChars: 'Min. 6 Zeichen'
    },
    Share: {
      chatNotFound: 'Chat nicht gefunden',
      invalidLink: 'Dieser Link ist möglicherweise ungültig oder der Chat wird nicht mehr geteilt.',
      solvedBy: 'Gelöst von Axiom in 5 Sekunden',
      returnHome: 'Zurück zu Axiom',
      tryFree: 'Kostenlos testen',
      sharedSolution: 'Geteilte Lösung:',
      untitledChat: 'Unbenannte Sitzung',
      snapshotDesc: 'Dies ist ein schreibgeschützter Schnappschuss eines Gesprächs, das von Axiom AI gelöst wurde.',
      stopWaiting: 'Hör auf zu warten. Fange an zu lösen.',
      joinThousands: 'Schließe dich Tausenden von Studenten an, die sofortige Schritt-für-Schritt-Lösungen für ihre härtesten Fragen erhalten.',
      createFree: 'Erstelle dein kostenloses Konto'
    },
    Components: {
      emergencyActive: 'NOTFALLMODUS AKTIV',
      clickToFlip: 'Klicke auf eine Karte, um sie umzudrehen',
      input: 'Eingabe',
      humanizedResult: 'Vermenschlichtes Ergebnis',
      applyingImperfections: 'Wende subtile Unvollkommenheiten an...',
      pasteText: 'Füge KI-generierten Text hier ein, um ihn zu vermenschlichen...',
      copyToClipboard: 'In die Zwischenablage kopieren',
      howCanIHelp: 'Wie kann ich dir helfen?',
      thinking: 'Denke nach...',
      imageAttached: 'Bild angehängt',
      attachedImage: 'Angehängtes Bild',
      shareWithClass: 'Mit der Klasse teilen',
      preview: 'Vorschau',
      uploadPhoto: 'Foto hochladen',
      yourText: 'Dein Text',
      writing: 'Schreibe...',
      selectAction: 'Wähle eine Aktion aus der Symbolleiste, um Inhalte zu generieren.',
      noCitations: 'Noch keine Zitate.',
      selectToCite: 'Wähle Text aus und klicke auf "Zitieren", um Quellen zu generieren.',
      clearBtn: 'Löschen',
      pasteEssayTopic: 'Füge hier dein Aufsatzthema, deinen Absatz oder deinen Text ein...',
      copyOutput: 'Ausgabe kopieren',
      copyBtn: 'Kopieren',
      axiomUltra: 'Axiom Ultra',
      ultraPlanIncludes: 'DER ULTRA-PLAN BEINHALTET:'
    },
    Language: {
      en: 'English',
      pt: 'Português',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      zh: '中文'
    }
  },
  zh: {
    Auth: {
      checkInbox: '检查你的收件箱',
      checkEmail: '验证你的电子邮件',
      orContinue: '或使用电子邮件继续',
      namePlaceholder: '你的名字',
      emailPlaceholder: 'you@email.com',
      minChars: '最少 6 个字符'
    },
    Share: {
      chatNotFound: '找不到聊天',
      invalidLink: '此链接可能无效或聊天不再共享。',
      solvedBy: 'Axiom 在 5 秒内解决',
      returnHome: '返回 Axiom',
      tryFree: '免费试用',
      sharedSolution: '共享的解决方案：',
      untitledChat: '无标题会话',
      snapshotDesc: '这是Axiom AI解决的对话的只读快照。',
      stopWaiting: '不要等待。开始解决。',
      joinThousands: '加入成千上万的学生，获取最难问题的即时逐步解决方案。',
      createFree: '创建您的免费帐户'
    },
    Components: {
      emergencyActive: '紧急模式处于活动状态',
      clickToFlip: '点击卡片翻转',
      input: '输入',
      humanizedResult: '人性化结果',
      applyingImperfections: '应用微妙的不完美之处...',
      pasteText: '在此粘贴AI生成的文本以进行人性化处理...',
      copyToClipboard: '复制到剪贴板',
      howCanIHelp: '我能帮你什么？',
      thinking: '思考中...',
      imageAttached: '附图',
      attachedImage: '附件图片',
      shareWithClass: '与班级分享',
      preview: '预览',
      uploadPhoto: '上传照片',
      yourText: '你的文本',
      writing: '正在写作...',
      selectAction: '从工具栏中选择一个操作以生成内容。',
      noCitations: '暂无引用。',
      selectToCite: '选择文本并点击“引用”生成来源。',
      clearBtn: '清除',
      pasteEssayTopic: '在这里粘贴你的论文题目、段落或文本...',
      copyOutput: '复制输出',
      copyBtn: '复制',
      axiomUltra: 'Axiom Ultra',
      ultraPlanIncludes: 'ULTRA 计划包括：'
    },
    Language: {
      en: 'English',
      pt: 'Português',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      zh: '中文'
    }
  }
};

const messagesDir = path.join(process.cwd(), 'src/messages');

for (const lang of langs) {
  const filePath = path.join(messagesDir, lang + '.json');
  if (fs.existsSync(filePath)) {
    const jsonStr = fs.readFileSync(filePath, 'utf8');
    const dict = JSON.parse(jsonStr);
    
    // Inject the new namespaces
    dict.Dashboard = dict.Dashboard || {};
    dict.Dashboard.Auth = data[lang].Auth;
    dict.Dashboard.Share = data[lang].Share;
    dict.Dashboard.Components = data[lang].Components;
    dict.Language = data[lang].Language;

    // Fix translation mappings
    if (!dict.Dashboard.Panic) dict.Dashboard.Panic = {};
    if (dict.Dashboard.Components.emergencyActive) {
      dict.Dashboard.Panic.emergencyActive = dict.Dashboard.Components.emergencyActive;
      delete dict.Dashboard.Components.emergencyActive;
    }
    if (dict.Dashboard.Components.clickToFlip) {
      dict.Dashboard.Panic.clickToFlip = dict.Dashboard.Components.clickToFlip;
      delete dict.Dashboard.Components.clickToFlip;
    }
    
    fs.writeFileSync(filePath, JSON.stringify(dict, null, 2), 'utf8');
    console.log(`Updated ${lang}.json with Auth, Share, Components and Language components.`);
  }
}
