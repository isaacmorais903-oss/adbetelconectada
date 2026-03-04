
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
  // Tamanho Cartão de Crédito Padrão (85.6mm x 54mm)
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [85.6, 54]
  });

  const width = 85.6;
  const height = 54;

  try {
    // =====================================================================
    // PÁGINA 1: FRENTE DA CARTEIRINHA
    // =====================================================================
    
    // 1. CARREGA O MODELO DE FUNDO DA FRENTE
    try {
      const templateFrente = await loadImage('/carteirinha_frente.png');
      doc.addImage(templateFrente, 'PNG', 0, 0, width, height);
    } catch (e) {
      console.warn("Imagem carteirinha_frente.png não encontrada. Usando fundo branco.");
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, width, height, 'F');
    }

    // 2. CONFIGURAÇÕES DE FONTE (FRENTE)
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);

    // 3. DADOS DO MEMBRO (FRENTE)
    
    // NOME
    doc.setFontSize(8);
    doc.text(member.name.toUpperCase(), 5, 24.5); // X: 5mm, Y: 24.5mm (Descido um pouco)

    // FUNÇÃO
    doc.setFontSize(8);
    doc.text(member.role.toUpperCase(), 5, 31.5); // X: 5mm, Y: 31.5mm (Subido um pouco)

    // REGISTRO
    const code = member.code || member.id.substring(0, 8).toUpperCase();
    doc.setFontSize(7);
    doc.text(code, 5, 38.5); // X: 5mm, Y: 38.5mm (Subido consideravelmente)

    // CONGREGAÇÃO (Assumindo que seja a Sede por padrão, ou pode vir do member.location)
    doc.setFontSize(7);
    doc.text("SEDE", 35, 38.5); // X: 35mm, Y: 38.5mm

    // DATA VÁLIDA (Exemplo: 1 ano a partir de hoje)
    const validade = new Date();
    validade.setFullYear(validade.getFullYear() + 1);
    const validadeStr = validade.toLocaleDateString('pt-BR');
    doc.setFontSize(7);
    doc.text(validadeStr, 5, 45.5); // X: 5mm, Y: 45.5mm

    // DATA DE BATISMO
    const batismoFrente = member.baptismDate ? new Date(member.baptismDate).toLocaleDateString('pt-BR') : "";
    doc.setFontSize(7);
    doc.text(batismoFrente, 35, 45.5); // X: 35mm, Y: 45.5mm

    // 4. FOTO DO MEMBRO
    // Ajuste as coordenadas e tamanho para encaixar no quadrado branco da direita
    const photoX = 66; // Posição X da foto (Movido para a direita)
    const photoY = 21; // Posição Y da foto (Descido um pouco)
    const photoW = 16; // Largura da foto (Reduzido)
    const photoH = 21; // Altura da foto (Reduzido)

    if (member.photoUrl && !member.photoUrl.includes('ui-avatars')) {
      try {
        const profilePic = await loadImage(member.photoUrl);
        doc.addImage(profilePic, 'JPEG', photoX, photoY, photoW, photoH);
      } catch (e) {
        console.log("Erro ao carregar foto do membro");
      }
    }

    // =====================================================================
    // PÁGINA 2: VERSO DA CARTEIRINHA
    // =====================================================================
    doc.addPage();

    // 1. CARREGA O MODELO DE FUNDO DO VERSO
    try {
      const templateVerso = await loadImage('/carteirinha_verso.png');
      doc.addImage(templateVerso, 'PNG', 0, 0, width, height);
    } catch (e) {
      console.warn("Imagem carteirinha_verso.png não encontrada. Usando fundo branco.");
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, width, height, 'F');
    }

    // 2. CONFIGURAÇÕES DE FONTE (VERSO)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);

    // 3. DADOS DO MEMBRO (VERSO)
    
    // PAI (Linha 1)
    doc.text((member.fatherName || "").toUpperCase().substring(0, 40), 5, 30.5); // X: 5mm, Y: 30.5mm

    // MÃE (Linha 2)
    doc.text((member.motherName || "").toUpperCase().substring(0, 40), 5, 37.5); // X: 5mm, Y: 37.5mm

    // Coluna 1 (Esquerda)
    const col1X = 5;
    // Coluna 2 (Direita)
    const col2X = 45;

    // Linha 3 (Naturalidade e Estado Civil - Assumindo que o segundo "Naturalidade" no seu design seja Estado Civil ou Data Nasc)
    // No seu print, o verso tem "Naturalidade" duas vezes. Vou assumir que o da direita seja Data de Nascimento ou Estado Civil.
    // Vou colocar Naturalidade na esquerda e Data de Nascimento na direita para seguir um padrão comum.
    const nat = member.naturalness ? `${member.naturalness} - ${member.naturalnessState || ''}` : "";
    doc.text(nat.toUpperCase().substring(0, 25), col1X, 44.5); // X: 5mm, Y: 44.5mm
    
    const birth = member.birthDate ? new Date(member.birthDate).toLocaleDateString('pt-BR') : "";
    doc.text(birth, col2X, 44.5); // X: 45mm, Y: 44.5mm (Substituindo o segundo "Naturalidade")

    // Linha 4 (CPF e RG)
    doc.text((member.cpf || ""), col1X, 51.5); // X: 5mm, Y: 51.5mm
    doc.text((member.rg || ""), col2X, 51.5); // X: 45mm, Y: 51.5mm (Assumindo que você tenha um campo RG, se não tiver, ficará em branco)

    // Salva o PDF
    doc.save(`carteirinha_${member.name.replace(/\s+/g, '_').toLowerCase()}.pdf`);

  } catch (error) {
    console.error("Erro ao gerar carteirinha:", error);
    alert("Erro ao gerar carteirinha. Verifique se as imagens estão na pasta public.");
  }
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
    // Borda Padrão
    doc.setDrawColor(37, 99, 235); // Blue Border
    doc.setLineWidth(2);
    doc.rect(10, 10, width - 20, height - 20);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(15, 15, width - 30, height - 30);
    
    // 1. CARREGA O LOGO DA IGREJA (Cabeçalho)
    try {
      const logoImg = await loadImage('/logo_adbetel.png');
      // Ajuste as dimensões e posição do logo conforme necessário
      // Exemplo: Centralizado no topo, 40mm de largura, 40mm de altura
      const logoW = 40;
      const logoH = 40;
      doc.addImage(logoImg, 'PNG', (width / 2) - (logoW / 2), 20, logoW, logoH);
    } catch (e) {
      console.warn("Logo da igreja não encontrado para o certificado.");
    }

    // Linhas Assinatura
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(40, 180, 110, 180);
    doc.line(186, 180, 256, 180);

    // Texto
    doc.setFont("times", "bold");
    doc.setFontSize(40);
    doc.setTextColor(50, 50, 50);
    // Movemos o título "CERTIFICADO" um pouco mais para baixo para dar espaço ao logo
    doc.text("CERTIFICADO", width / 2, 75, { align: "center" });

    doc.setFont("times", "bold");
    doc.setFontSize(24);
    doc.setTextColor(37, 99, 235); // Blue
    doc.text(type.toUpperCase(), width / 2, 90, { align: "center" });

    doc.setFont("times", "normal");
    doc.setFontSize(16);
    doc.setTextColor(80, 80, 80);
    const text = `Certificamos que, para os devidos fins,`;
    doc.text(text, width / 2, 105, { align: "center" });

    doc.setFont("times", "bolditalic");
    doc.setFontSize(32);
    doc.setTextColor(0, 0, 0);
    doc.text(member.name, width / 2, 125, { align: "center" });
    
    if(member.code) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`Matrícula: ${member.code}`, width / 2, 135, { align: "center" });
    }

    doc.setFont("times", "normal");
    doc.setFontSize(16);
    doc.setTextColor(80, 80, 80);
    const descSplit = doc.splitTextToSize(description, 200);
    doc.text(descSplit, width / 2, 150, { align: "center" });

    const dateStr = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFontSize(14);
    doc.text(`Cristalina - GO, ${dateStr}`, width / 2, 165, { align: "center" });

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
