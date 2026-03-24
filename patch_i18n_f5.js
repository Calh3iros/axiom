const fs = require('fs');
const path = require('path');

const locales = ['pt', 'en', 'es', 'fr', 'de', 'zh'];
const dir = path.join(__dirname, 'src', 'messages');

const newKeys = {
  batch: {
    title: "Criar Turmas em Lote",
    errorEmpty: "Selecione séries e turmas para criar.",
    create: "Criar Turmas",
    createdSuccess: "{count} turmas criadas com sucesso!",
    printCodes: "Copiar Lista de Códigos"
  }
};

for (const locale of locales) {
  const file = path.join(dir, `${locale}.json`);
  if (!fs.existsSync(file)) continue;
  
  const content = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  if (!content.Org) content.Org = {};
  if (!content.Org.batch) content.Org.batch = {};
  
  // Mapeamento simples de pt-BR para outras línguas ou fallback
  let tTitle = "Criar Turmas em Lote";
  let tError = "Selecione séries e turmas para criar.";
  let tCreate = "Criar Turmas";
  let tSuccess = "{count} turmas criadas com sucesso!";
  let tPrint = "Copiar Lista de Códigos";

  if (locale === 'en') {
    tTitle = "Batch Create Classes";
    tError = "Select grades and sections to create classes.";
    tCreate = "Create Classes";
    tSuccess = "{count} classes created successfully!";
    tPrint = "Copy Code List";
  } else if (locale === 'es') {
    tTitle = "Crear Clases por Lote";
    tError = "Selecciona grados y secciones para crear clases.";
    tCreate = "Crear Clases";
    tSuccess = "¡{count} clases creadas con éxito!";
    tPrint = "Copiar Lista de Códigos";
  }
  
  content.Org.batch.title = tTitle;
  content.Org.batch.errorEmpty = tError;
  content.Org.batch.create = tCreate;
  content.Org.batch.createdSuccess = tSuccess;
  content.Org.batch.printCodes = tPrint;
  
  fs.writeFileSync(file, JSON.stringify(content, null, 2));
}

console.log("i18n keys for Batch Creation added successfully.");
