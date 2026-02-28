
import { jsPDF } from "jspdf";
import { Member, Transaction } from "../types";
import { APP_CONFIG } from "../config";

// Helper para carregar imagem de forma assíncrona
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Tenta evitar erros de CORS com imagens externas
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
};

export const generateMembershipCard = async (member: Member) => {
  // Tamanho Cartão de Crédito (85.6mm x 53.98mm)
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [85.6, 54]
  });

  const width = 85.6;
  const height = 54;
  const margin = 3;
  
  // Cores Base
  const darkBlue = "#1e3a8a"; // Azul Escuro (Bordas e Textos)
  const bgGrey = "#e5e7eb";   // Fundo Cinza Claro

  // --- FRENTE DO CARTÃO ---
  
  // Fundo Geral
  doc.setFillColor(bgGrey);
  doc.rect(0, 0, width, height, 'F');

  // Borda Externa Grossa Azul (Simulando o design arredondado)
  doc.setDrawColor(darkBlue);
  doc.setLineWidth(2);
  doc.roundedRect(1, 1, width - 2, height - 2, 3, 3, 'D'); // 'D' apenas desenha a borda

  // Cabeçalho
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.setTextColor(darkBlue);
  doc.text("Assembleia de Deus em Cristalina Ministério Betel", width / 2, 6, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(0, 0, 0); // Preto
  doc.text("Rua Prof. José de Foiás Brasil, 302 DNER CEP 73850-000 Cristalina Goiás", width / 2, 9, { align: "center" });
  
  doc.setFont("times", "italic");
  doc.setFontSize(6);
  doc.text('"Nós de recebemos de braços abertos" (Igreja Missão)', width / 2, 12, { align: "center" });

  // Configuração dos Campos (FRENTE)
  // Campos: NOME, FUNÇÃO, REGISTRO
  const fieldHeight = 7;
  const fieldWidth = 50; // Largura do campo de texto (deixa espaço para foto/logo na direita)
  const leftX = 4;
  
  // Função auxiliar para desenhar campo
  const drawField = (label: string, value: string, y: number, w: number = fieldWidth) => {
    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(0, 0, 0);
    doc.text(label, leftX, y - 1);

    // Box
    doc.setDrawColor(darkBlue);
    doc.setLineWidth(0.8);
    doc.setFillColor(255, 255, 255); // Branco
    doc.roundedRect(leftX, y, w, fieldHeight, 1, 1, 'FD');

    // Value
    doc.setFont("helvetica", "bold"); // Ou normal, dependendo da preferência
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    // Centraliza verticalmente no box
    doc.text(value.toUpperCase().substring(0, 30), leftX + 1, y + 5);
  };

  drawField("NOME", member.name, 19);
  drawField("FUNÇÃO", member.role, 30);
  
  // Registro (Código)
  const code = member.code || member.id.substring(0, 8).toUpperCase();
  drawField("REGISTRO", code, 41);

  // ÁREA DA DIREITA (Logo / Foto)
  // No modelo "Cristalina", há um logo grande da Assembleia de Deus Missão
  // Vou colocar o logo (placeholder desenhado) e a FOTO do membro sobreposta ou acima.
  
  const rightX = 58;
  const rightY = 18;
  const rightW = 24;
  const rightH = 30;

  // Desenha Círculo do Logo (Simulado)
  doc.setDrawColor(darkBlue);
  doc.setLineWidth(0.5);
  doc.setFillColor(255, 255, 255);
  doc.circle(rightX + (rightW/2), rightY + (rightH/2), 11, 'S'); // 'S' stroke
  
  // Texto do Logo Simulado (Curvado seria complexo, vamos simplificar)
  doc.setFontSize(4);
  doc.setTextColor(darkBlue);
  doc.text("ASSEMBLEIA DE DEUS", rightX + (rightW/2), rightY + 3, { align: "center" });
  doc.text("MINISTÉRIO BETEL", rightX + (rightW/2), rightY + 27, { align: "center" });

  // SE TIVER FOTO, DESENHA A FOTO NO LUGAR DO LOGO (Ou sobre ele)
  // ID cards geralmente priorizam a foto. Vamos desenhar a foto dentro de uma caixa na direita.
  if (member.photoUrl && !member.photoUrl.includes('ui-avatars')) {
       try {
          const profilePic = await loadImage(member.photoUrl);
          // Desenha foto
          doc.addImage(profilePic, 'JPEG', rightX, rightY, rightW, rightH);
          // Borda na foto
          doc.setDrawColor(darkBlue);
          doc.setLineWidth(0.5);
          doc.rect(rightX, rightY, rightW, rightH);
       } catch (e) {
          // Se falhar, desenha texto FOTO
          doc.text("FOTO", rightX + (rightW/2), rightY + (rightH/2), { align: "center" });
       }
  } else {
       // Placeholder Foto
       doc.setFillColor(240, 240, 240);
       doc.rect(rightX, rightY, rightW, rightH, 'F');
       doc.setFontSize(6);
       doc.setTextColor(150, 150, 150);
       doc.text("FOTO 3x4", rightX + (rightW/2), rightY + (rightH/2), { align: "center" });
  }


  // --- VERSO DO CARTÃO ---
  doc.addPage();
  
  // Fundo e Borda (Igual frente)
  doc.setFillColor(bgGrey);
  doc.rect(0, 0, width, height, 'F');
  doc.setDrawColor(darkBlue);
  doc.setLineWidth(2);
  doc.roundedRect(1, 1, width - 2, height - 2, 3, 3, 'D');

  // Configuração Grid do Verso
  // 2 Colunas
  const col1X = 5;
  const col2X = 44;
  const colW = 37;
  const rowH = 6;
  const labelH = 4; // Espaço para label
  const inputH = 5; // Altura do box input

  // Função auxiliar Verso
  const drawBackField = (label: string, value: string, x: number, y: number, w: number) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5);
      doc.setTextColor(0, 0, 0);
      doc.text(label, x, y - 0.5);

      doc.setDrawColor(darkBlue);
      doc.setLineWidth(0.5);
      doc.setFillColor(255, 255, 255);
      doc.rect(x, y, w, inputH, 'FD');

      doc.setFontSize(7);
      doc.text(value ? value.substring(0, 25) : "", x + 1, y + 3.5);
  };

  let currY = 8;
  // Linha 1: Mãe (Largura total 76mm aprox)
  drawBackField("NOME DA MÃE", member.motherName || "", col1X, currY, 37);
  drawBackField("CPF", member.cpf || "", col2X, currY, 37); // Layout original poe CPF na direita? Vamos por
  
  currY += 9;
  // Linha 2: Pai e Estado Civil
  drawBackField("NOME DO PAI", member.fatherName || "", col1X, currY, 37);
  drawBackField("ESTADO CIVIL", member.maritalStatus || "", col2X, currY, 37);

  currY += 9;
  // Linha 3: Nacionalidade e Data Nasc
  drawBackField("NACIONALIDADE", member.nationality || "Brasileira", col1X, currY, 37);
  // Formata Data
  const birth = member.birthDate ? new Date(member.birthDate).toLocaleDateString('pt-BR') : "";
  drawBackField("DATA DE NASCIMENTO", birth, col2X, currY, 37);

  currY += 9;
  // Linha 4: Naturalidade e Data Batismo
  const nat = member.naturalness ? `${member.naturalness} - ${member.naturalnessState || ''}` : "";
  drawBackField("NATURALIDADE", nat, col1X, currY, 37);
  
  const batismo = member.baptismDate ? new Date(member.baptismDate).toLocaleDateString('pt-BR') : "";
  drawBackField("DATA DE BATISMO", batismo, col2X, currY, 37);

  // Assinatura (Rodapé)
  const sigY = 46;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(25, sigY, 60, sigY); // Linha assinatura

  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text("Jeziel Buarque de Gusmão", width / 2, sigY + 3, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("Pastor Presidente", width / 2, sigY + 5.5, { align: "center" });

  doc.save(`carteirinha_${member.name.replace(/\s+/g, '_').toLowerCase()}.pdf`);
};

export const generateCertificate = async (member: Member, type: string, description: string) => {
  // A4 Landscape
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  try {
    // 1. TENTA CARREGAR IMAGEM SE HOUVER URL (Placeholder logic removed for brevity, assuming standard drawing)
    
    // Borda Padrão
    doc.setDrawColor(37, 99, 235); // Blue Border
    doc.setLineWidth(2);
    doc.rect(10, 10, width - 20, height - 20);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(15, 15, width - 30, height - 30);
    
    // Linhas Assinatura
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(40, 180, 110, 180);
    doc.line(186, 180, 256, 180);

    // Texto
    doc.setFont("times", "bold");
    doc.setFontSize(40);
    doc.setTextColor(50, 50, 50);
    doc.text("CERTIFICADO", width / 2, 50, { align: "center" });

    doc.setFont("times", "bold");
    doc.setFontSize(24);
    doc.setTextColor(37, 99, 235); // Blue
    doc.text(type.toUpperCase(), width / 2, 70, { align: "center" });

    doc.setFont("times", "normal");
    doc.setFontSize(16);
    doc.setTextColor(80, 80, 80);
    const text = `Certificamos que, para os devidos fins,`;
    doc.text(text, width / 2, 90, { align: "center" });

    doc.setFont("times", "bolditalic");
    doc.setFontSize(32);
    doc.setTextColor(0, 0, 0);
    doc.text(member.name, width / 2, 110, { align: "center" });
    
    if(member.code) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`Matrícula: ${member.code}`, width / 2, 120, { align: "center" });
    }

    doc.setFont("times", "normal");
    doc.setFontSize(16);
    doc.setTextColor(80, 80, 80);
    const descSplit = doc.splitTextToSize(description, 200);
    doc.text(descSplit, width / 2, 135, { align: "center" });

    const dateStr = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFontSize(14);
    doc.text(`São Paulo, ${dateStr}`, width / 2, 155, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(0,0,0);
    doc.text("Pr. Presidente Jeziel", 75, 187, { align: "center" });
    doc.text("Secretaria Geral", 221, 187, { align: "center" });

    doc.save(`certificado_${type.replace(/\s+/g, '_').toLowerCase()}_${member.name.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  
  } catch (error) {
    console.error("Erro ao gerar certificado:", error);
    alert("Erro ao gerar PDF.");
  }
};

export const generateLgpdTerm = (member: Member) => {
    const doc = new jsPDF();
    const width = doc.internal.pageSize.getWidth();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("TERMO DE CONSENTIMENTO PARA TRATAMENTO DE DADOS", width / 2, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text("(LGPD - Lei Geral de Proteção de Dados - Lei 13.709/2018)", width / 2, 28, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    
    let y = 45;
    const text1 = `Eu, ${member.name.toUpperCase()}, portador(a) do CPF ${member.cpf || '_________________'}, na qualidade de membro/visitante da ${APP_CONFIG.churchName}, manifesto meu CONSENTIMENTO LIVRE, INFORMADO E INEQUÍVOCO para que a instituição realize o tratamento de meus dados pessoais.`;
    
    const lines1 = doc.splitTextToSize(text1, 180);
    doc.text(lines1, 15, y);
    y += (lines1.length * 6) + 5;

    doc.setFont("helvetica", "bold");
    doc.text("1. FINALIDADE DO TRATAMENTO:", 15, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    
    const purposes = [
        "- Gestão administrativa e eclesiástica de membros;",
        "- Comunicação interna (avisos, eventos, escalas, aniversários);",
        "- Histórico de sacramentos (batismos, casamentos, consagrações);",
        "- Controle de acesso e segurança nas dependências da igreja;",
        "- Registro de contribuições financeiras (dízimos e ofertas) para fins fiscais e de transparência."
    ];
    
    purposes.forEach(p => {
        doc.text(p, 15, y);
        y += 6;
    });
    y += 5;

    doc.setFont("helvetica", "bold");
    doc.text("2. COMPARTILHAMENTO DE DADOS:", 15, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const text2 = "A Igreja compromete-se a não compartilhar seus dados pessoais com terceiros para fins comerciais. O compartilhamento poderá ocorrer apenas para cumprimento de obrigações legais ou com prestadores de serviço essenciais (ex: software de gestão, contabilidade), desde que estes também garantam a segurança dos dados.";
    const lines2 = doc.splitTextToSize(text2, 180);
    doc.text(lines2, 15, y);
    y += (lines2.length * 6) + 5;

    doc.setFont("helvetica", "bold");
    doc.text("3. DIREITOS DO TITULAR:", 15, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const text3 = "O titular poderá, a qualquer momento, solicitar acesso, correção, atualização ou a revogação deste consentimento (exceto para dados necessários ao cumprimento de obrigações legais), mediante requerimento à secretaria da igreja.";
    const lines3 = doc.splitTextToSize(text3, 180);
    doc.text(lines3, 15, y);
    y += (lines3.length * 6) + 5;
    
    // Assinatura
    y = 240;
    const dateStr = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(`Cidade/UF: ______________________, ${dateStr}`, width / 2, y - 20, { align: "center" });

    doc.line(40, y, 170, y);
    doc.setFont("helvetica", "bold");
    doc.text(member.name.toUpperCase(), width / 2, y + 5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Assinatura do Titular (ou Responsável Legal)", width / 2, y + 10, { align: "center" });

    doc.save(`Termo_LGPD_${member.name.replace(/\s+/g, '_')}.pdf`);
};

export const generateFinancialReport = (transactions: Transaction[]) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(30, 58, 138); // Blue 900
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("ADBetel Conectada - Relatório Financeiro", 10, 13);

    // Summary
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;

    doc.setTextColor(0,0,0);
    doc.setFontSize(12);
    doc.text("Resumo do Período", 10, 30);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Entradas: R$ ${totalIncome.toFixed(2)}`, 10, 40);
    doc.text(`Total Saídas: R$ ${totalExpense.toFixed(2)}`, 80, 40);
    
    doc.setFont("helvetica", "bold");
    if(balance >= 0) doc.setTextColor(22, 163, 74); // Green
    else doc.setTextColor(220, 38, 38); // Red
    doc.text(`Saldo Final: R$ ${balance.toFixed(2)}`, 150, 40);

    // Table Header
    doc.setTextColor(0,0,0);
    let y = 55;
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.rect(10, y-5, pageWidth-20, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Data", 12, y);
    doc.text("Descrição", 40, y);
    doc.text("Categoria", 110, y);
    doc.text("Tipo", 150, y);
    doc.text("Valor", 180, y);

    // Table Rows
    y += 10;
    doc.setFont("helvetica", "normal");
    
    transactions.forEach((t) => {
        if(y > 280) {
            doc.addPage();
            y = 20;
        }
        
        doc.text(new Date(t.date).toLocaleDateString('pt-BR'), 12, y);
        doc.text(t.description.substring(0, 35), 40, y);
        doc.text(t.category, 110, y);
        
        if(t.type === 'income') {
            doc.setTextColor(22, 163, 74);
            doc.text("Entrada", 150, y);
        } else {
            doc.setTextColor(220, 38, 38);
            doc.text("Saída", 150, y);
        }
        
        doc.text(`R$ ${t.amount.toFixed(2)}`, 180, y);
        
        doc.setTextColor(0,0,0);
        // Line
        doc.setDrawColor(226, 232, 240);
        doc.line(10, y+2, pageWidth-10, y+2);
        
        y += 8;
    });

    doc.save("relatorio_financeiro.pdf");
};
