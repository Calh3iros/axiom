import { chromium } from 'playwright';

(async () => {
  console.log('🚀 Supabase Fixer On...');
  console.log('----------------------------------------------------');
  console.log('🌐 Abrindo um navegador Chrome limpo na sua tela...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://supabase.com/dashboard/project/wsgoeojeyhxtakvjtubh/auth/url-configuration');

  console.log('----------------------------------------------------');
  console.log('⚠️ AÇÃO NECESSÁRIA NO NAVEGADOR QUE ACABOU DE ABRIR:');
  console.log('1. Se pedir, faça login com a conta do Supabase.');
  console.log('2. Em "Redirect URLs", clique em "Add URL".');
  console.log('3. Copie e cole EXATAMENTE ISSO:  http://localhost:3000/*/auth/callback');
  console.log('4. Clique em "Save" (ou Add).');
  console.log('----------------------------------------------------');
  console.log('Quando terminar, pode fechar a janela do navegador que este script vai encerrar automaticamente.');

  await new Promise(() => {}); // Manter aberto até fecharem manuamente.
})();
