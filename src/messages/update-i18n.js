const fs = require('fs');
const path = require('path');

const locales = ['pt', 'en', 'es', 'fr', 'de', 'zh'];

const translations = {
  pt: {
    "step1Title": "Tipo de instituição",
    "particular": "Particular",
    "particularDesc": "Escola privada ou rede",
    "publica": "Pública",
    "publicaDesc": "Rede municipal ou estadual",
    "step2Title": "Detalhamento",
    "singleSchool": "1 Escola",
    "singleSchoolDesc": "Escola com 1 unidade",
    "network": "Rede de Escolas",
    "networkDesc": "Múltiplas unidades",
    "municipal": "Municipal",
    "municipalDesc": "Secretaria municipal",
    "state": "Estadual",
    "stateDesc": "Secretaria estadual",
    "step3Title": "Dados da organização",
    "name": "Nome",
    "maxStudents": "Máximo de alunos",
    "expiresAt": "Expira em",
    "notes": "Observações (opcional)",
    "summary": "Resumo",
    "create": "Criar e Gerar Código",
    "back": "Voltar",
    "successTitle": "Organização criada!",
    "sendTo": {
      "privateSchool": "Envie este código ao diretor da escola.",
      "privateNetwork": "Envie este código ao dono da rede.",
      "publicMunicipal": "Envie este código ao secretário municipal.",
      "publicState": "Envie este código ao secretário estadual."
    },
    "copyCode": "Copiar Código",
    "copyLink": "Copiar Link"
  },
  en: {
    "step1Title": "Institution Type",
    "particular": "Private",
    "particularDesc": "Private school or network",
    "publica": "Public",
    "publicaDesc": "Municipal or state network",
    "step2Title": "Details",
    "singleSchool": "1 School",
    "singleSchoolDesc": "Single unit school",
    "network": "School Network",
    "networkDesc": "Multiple units",
    "municipal": "Municipal",
    "municipalDesc": "Municipal department",
    "state": "State",
    "stateDesc": "State department",
    "step3Title": "Organization Data",
    "name": "Name",
    "maxStudents": "Max students",
    "expiresAt": "Expires at",
    "notes": "Notes (optional)",
    "summary": "Summary",
    "create": "Create & Generate Code",
    "back": "Back",
    "successTitle": "Organization created!",
    "sendTo": {
      "privateSchool": "Send this code to the school director.",
      "privateNetwork": "Send this code to the network owner.",
      "publicMunicipal": "Send this code to the municipal secretary.",
      "publicState": "Send this code to the state secretary."
    },
    "copyCode": "Copy Code",
    "copyLink": "Copy Link"
  },
  es: {
    "step1Title": "Tipo de institución",
    "particular": "Particular",
    "particularDesc": "Escuela privada o red",
    "publica": "Pública",
    "publicaDesc": "Red municipal o estatal",
    "step2Title": "Detalles",
    "singleSchool": "1 Escuela",
    "singleSchoolDesc": "Escuela de una unidad",
    "network": "Red de Escuelas",
    "networkDesc": "Múltiples unidades",
    "municipal": "Municipal",
    "municipalDesc": "Secretaría municipal",
    "state": "Estatal",
    "stateDesc": "Secretaría estatal",
    "step3Title": "Datos de organización",
    "name": "Nombre",
    "maxStudents": "Máximo de alumnos",
    "expiresAt": "Expira en",
    "notes": "Notas (opcional)",
    "summary": "Resumen",
    "create": "Crear y Generar Código",
    "back": "Volver",
    "successTitle": "¡Organización creada!",
    "sendTo": {
      "privateSchool": "Envíe este código al director de la escuela.",
      "privateNetwork": "Envíe este código al dueño de la red.",
      "publicMunicipal": "Envíe este código al secretario municipal.",
      "publicState": "Envíe este código al secretario estatal."
    },
    "copyCode": "Copiar Código",
    "copyLink": "Copiar Enlace"
  },
  fr: {
    "step1Title": "Type d'établissement",
    "particular": "Privé",
    "particularDesc": "École privée ou réseau",
    "publica": "Public",
    "publicaDesc": "Réseau municipal ou départemental",
    "step2Title": "Détails",
    "singleSchool": "1 École",
    "singleSchoolDesc": "École à unité unique",
    "network": "Réseau d'Écoles",
    "networkDesc": "Unités multiples",
    "municipal": "Municipal",
    "municipalDesc": "Secrétariat municipal",
    "state": "État",
    "stateDesc": "Secrétariat d'État",
    "step3Title": "Données d'organisation",
    "name": "Nom",
    "maxStudents": "Élèves maximum",
    "expiresAt": "Expire le",
    "notes": "Notes (facultatif)",
    "summary": "Résumé",
    "create": "Créer et Générer",
    "back": "Retour",
    "successTitle": "Organisation créée !",
    "sendTo": {
      "privateSchool": "Envoyez ce code au directeur de l'école.",
      "privateNetwork": "Envoyez ce code au propriétaire du réseau.",
      "publicMunicipal": "Envoyez ce code au secrétaire municipal.",
      "publicState": "Envoyez ce code au secrétaire d'État."
    },
    "copyCode": "Copier Code",
    "copyLink": "Copier Lien"
  },
  de: {
    "step1Title": "Art der Einrichtung",
    "particular": "Privat",
    "particularDesc": "Privatschule oder Netzwerk",
    "publica": "Öffentlich",
    "publicaDesc": "Kommunales oder staatliches Netzwerk",
    "step2Title": "Details",
    "singleSchool": "1 Schule",
    "singleSchoolDesc": "Einzelschule",
    "network": "Schulnetzwerk",
    "networkDesc": "Mehrere Standorte",
    "municipal": "Kommunal",
    "municipalDesc": "Kommunales Sekretariat",
    "state": "Staatlich",
    "stateDesc": "Staatliches Sekretariat",
    "step3Title": "Organisationsdaten",
    "name": "Name",
    "maxStudents": "Maximale Schülerzahl",
    "expiresAt": "Läuft ab am",
    "notes": "Notizen (optional)",
    "summary": "Zusammenfassung",
    "create": "Erstellen und Code generieren",
    "back": "Zurück",
    "successTitle": "Organisation erstellt!",
    "sendTo": {
      "privateSchool": "Senden Sie diesen Code an den Schuldirektor.",
      "privateNetwork": "Senden Sie diesen Code an den Eigentümer.",
      "publicMunicipal": "Senden Sie diesen Code an den Kommunalsekretär.",
      "publicState": "Senden Sie diesen Code an den Staatssekretär."
    },
    "copyCode": "Code kopieren",
    "copyLink": "Link kopieren"
  },
  zh: {
    "step1Title": "机构类型",
    "particular": "私立",
    "particularDesc": "私立学校或网络",
    "publica": "公立",
    "publicaDesc": "市级或省级网络",
    "step2Title": "细节",
    "singleSchool": "1所学校",
    "singleSchoolDesc": "单一学校",
    "network": "学校网络",
    "networkDesc": "多个单位",
    "municipal": "市级",
    "municipalDesc": "市级教育局",
    "state": "省级",
    "stateDesc": "省级教育局",
    "step3Title": "组织数据",
    "name": "名称",
    "maxStudents": "最大访问学生数",
    "expiresAt": "过期时间",
    "notes": "备注 (可选)",
    "summary": "概要",
    "create": "创建并生成代码",
    "back": "返回",
    "successTitle": "组织已创建！",
    "sendTo": {
      "privateSchool": "请将此代码发送给学校校长。",
      "privateNetwork": "请将此代码发送给网络所有者。",
      "publicMunicipal": "请将此代码发送给市教育局局长。",
      "publicState": "请将此代码发送给省教育厅厅长。"
    },
    "copyCode": "复制代码",
    "copyLink": "复制链接"
  }
};

for (const loc of locales) {
  const file = path.join(__dirname, loc + '.json');
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!data.Admin) data.Admin = {};
    data.Admin.createOrg = translations[loc];
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
    console.log(`Updated ${loc}.json`);
  }
}
