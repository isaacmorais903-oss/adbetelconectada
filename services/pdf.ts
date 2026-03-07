
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
  // Layout Lado a Lado: 171.2mm x 54mm
  const width = 171.2;
  const height = 54;
  
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [width, height]
  });

  try {
    // =====================================================================
    // CARTEIRINHA COMPLETA (FRENTE E VERSO LADO A LADO)
    // =====================================================================
    
    // 1. CARREGA O MODELO DE FUNDO
    // O usuário deve fazer upload da imagem "carteirinha_nova.png" na pasta public
    try {
      const template = await loadImage('/carteirinha_nova.png');
      doc.addImage(template, 'PNG', 0, 0, width, height);
    } catch (e) {
      console.warn("Imagem carteirinha_nova.png não encontrada. Usando fundo branco.");
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, width, height, 'F');
      // Desenha linha divisória se não houver imagem
      doc.setDrawColor(200, 200, 200);
      doc.line(85.6, 0, 85.6, height);
    }

    // 2. CONFIGURAÇÕES DE FONTE
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);

    // =====================================================================
    // LADO ESQUERDO (FRENTE)
    // =====================================================================
    
    // NOME
    doc.setFontSize(8); 
    doc.text(member.name.toUpperCase(), 6, 27); 

    // FUNÇÃO
    doc.setFontSize(8); 
    doc.text(member.role.toUpperCase(), 6, 34); 

    // MINISTÉRIO / DEP. (Esquerda)
    doc.setFontSize(7); 
    doc.text((member.ministry || "").toUpperCase(), 6, 41); 

    // CÓDIGO / REGISTRO (Direita)
    const code = member.code || member.id.substring(0, 8).toUpperCase();
    doc.setFontSize(7); 
    doc.text(code, 38, 41); 

    // CONGREGAÇÃO (Esquerda)
    // Exibe apenas o nome da congregação (remove "Congregação" ou código se houver)
    // Ex: "002 - Jardim" -> "JARDIM"
    // Ex: "Congregação Samaria" -> "SAMARIA"
    let congName = (member.congregation || "SEDE").toUpperCase();
    if (congName.includes(' - ')) {
        congName = congName.split(' - ')[1] || congName;
    }
    congName = congName.replace('CONGREGAÇÃO ', '').trim();
    
    doc.setFontSize(7); 
    doc.text(congName, 6, 49); // Y: 48 -> 49 (Abaixar um pouquinho)

    // DATA DE VALIDADE (Direita)
    const validade = new Date();
    validade.setFullYear(validade.getFullYear() + 1);
    const validadeStr = validade.toLocaleDateString('pt-BR');
    doc.setFontSize(7); 
    doc.text(validadeStr, 38, 49); // Y: 48 -> 49

    // FOTO DO MEMBRO
    // Ajuste para preencher o espaço branco (mais para esquerda)
    const photoX = 59; // 60 -> 59
    const photoY = 23; 
    const photoW = 23; // 22 -> 23
    const photoH = 28; 

    if (member.photoUrl && !member.photoUrl.includes('ui-avatars')) {
      try {
        const profilePic = await loadImage(member.photoUrl);
        doc.addImage(profilePic, 'JPEG', photoX, photoY, photoW, photoH);
      } catch (e) {
        console.log("Erro ao carregar foto do membro");
      }
    }

    // =====================================================================
    // LADO DIREITO (VERSO) - Offset X = 85.6mm
    // =====================================================================
    const offsetX = 85.6;

    // Ajuste Geral Verso: Mais para direita e ABAIXAR MAIS
    const versoX = offsetX + 8; // X: +6 -> +8

    // Debug para verificar se os dados estão chegando
    console.log("Dados Verso:", {
        pai: member.fatherName,
        mae: member.motherName,
        nat: member.naturalness,
        cpf: member.cpf,
        rg: member.rg
    });

    // PAI
    doc.setFontSize(7); 
    doc.text((member.fatherName || "").toUpperCase().substring(0, 40), versoX, 17); // Y: 14 -> 17

    // MÃE
    doc.setFontSize(7);
    doc.text((member.motherName || "").toUpperCase().substring(0, 40), versoX, 24); // Y: 21 -> 24

    // NACIONALIDADE (Esquerda)
    doc.setFontSize(7);
    doc.text((member.nationality || "BRASILEIRA").toUpperCase(), versoX, 31); // Y: 28 -> 31

    // NATURALIDADE (Direita)
    const nat = member.naturalness ? `${member.naturalness} - ${member.naturalnessState || ''}` : "";
    doc.text(nat.toUpperCase().substring(0, 25), versoX + 42, 31); // Y: 28 -> 31

    // CPF (Esquerda)
    doc.setFontSize(7);
    doc.text((member.cpf || ""), versoX, 38); // Y: 35 -> 38

    // RG (Direita)
    doc.setFontSize(7);
    doc.text((member.rg || ""), versoX + 42, 38); // Y: 35 -> 38

    // Salva o PDF
    doc.save(`carteirinha_${member.name.replace(/\s+/g, '_').toLowerCase()}.pdf`);

  } catch (error) {
    console.error("Erro ao gerar carteirinha:", error);
    alert("Erro ao gerar carteirinha. Verifique se a imagem 'carteirinha_nova.png' está na pasta public.");
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
    
    // Variável para controlar a posição vertical dinâmica
    let currentY = 20;

    // 1. CARREGA O LOGO DA IGREJA (Cabeçalho)
    try {
      const logoImg = await loadImage('/logo_adbetel.png');
      // Ajuste para imagem 600x200 (Proporção 3:1)
      // Aumentando a largura para ficar bem distribuído e legível no topo
      const logoW = 120; 
      const logoH = 40; // Mantendo proporção 3:1 (120/40)
      
      doc.addImage(logoImg, 'PNG', (width / 2) - (logoW / 2), currentY, logoW, logoH);
      currentY += logoH + 10; // Avança o cursor Y (40 + 10 de margem)
    } catch (e) {
      console.warn("Logo da igreja não encontrado para o certificado.");
      currentY += 40; // Espaço reservado mesmo sem logo
    }

    // TÍTULO: CERTIFICADO
    doc.setFont("times", "bold");
    doc.setFontSize(40);
    doc.setTextColor(50, 50, 50);
    doc.text("CERTIFICADO", width / 2, currentY + 10, { align: "center" });
    currentY += 25;

    // TIPO (BATISMO, APRESENTAÇÃO, ETC)
    doc.setFont("times", "bold");
    doc.setFontSize(24);
    doc.setTextColor(37, 99, 235); // Blue
    doc.text(type.toUpperCase(), width / 2, currentY, { align: "center" });
    currentY += 15;

    // TEXTO INTRODUTÓRIO
    doc.setFont("times", "normal");
    doc.setFontSize(16);
    doc.setTextColor(80, 80, 80);
    const text = `Certificamos que, para os devidos fins,`;
    doc.text(text, width / 2, currentY, { align: "center" });
    currentY += 20;

    // NOME DO MEMBRO
    doc.setFont("times", "bolditalic");
    doc.setFontSize(32);
    doc.setTextColor(0, 0, 0);
    doc.text(member.name, width / 2, currentY, { align: "center" });
    currentY += 10;
    
    // MATRÍCULA
    if(member.code) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`Matrícula: ${member.code}`, width / 2, currentY, { align: "center" });
        currentY += 15;
    } else {
        currentY += 10;
    }

    // DESCRIÇÃO / OBSERVAÇÃO
    doc.setFont("times", "normal");
    doc.setFontSize(16);
    doc.setTextColor(80, 80, 80);
    // Aumentando a largura permitida para o texto (antes 200, agora 240 para aproveitar a folha A4 Landscape)
    const descSplit = doc.splitTextToSize(description, 240);
    doc.text(descSplit, width / 2, currentY, { align: "center" });
    
    // Calcula a altura ocupada pelo texto da descrição para posicionar a data
    const lineHeight = 7; // Altura aproximada da linha para fonte 16
    const textHeight = descSplit.length * lineHeight;
    currentY += textHeight + 10;

    // DATA E LOCAL
    const dateStr = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFontSize(14);
    doc.text(`Cristalina - GO, ${dateStr}`, width / 2, currentY, { align: "center" });

    // ASSINATURAS (RODAPÉ)
    // Mantemos fixo na parte inferior para padrão visual
    const footerY = 180;

    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(40, footerY, 110, footerY);
    doc.line(186, footerY, 256, footerY);

    doc.setFontSize(12);
    doc.setTextColor(0,0,0);
    doc.text("Pr. Presidente Jeziel", 75, footerY + 7, { align: "center" });
    doc.text("Secretaria Geral", 221, footerY + 7, { align: "center" });

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

export const generateMemberFile = async (member: Member) => {
  const doc = new jsPDF();
  const width = doc.internal.pageSize.getWidth();
  
  try {
    let currentY = 20;

    // 1. CABEÇALHO (LOGO)
    try {
      const logoImg = await loadImage('/logo_adbetel.png');
      // Aumentado e alinhado à esquerda (2x o tamanho anterior)
      const logoW = 140; 
      const logoH = 46; 
      doc.addImage(logoImg, 'PNG', 14, 10, logoW, logoH);
    } catch (e) {
      // Ignora erro
    }

    // TÍTULO
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16); // Diminuído (era 22)
    doc.setTextColor(30, 58, 138); // Blue 900
    // Alinhado à esquerda, abaixo do logo
    doc.text("FICHA CADASTRAL DE MEMBRO", 14, 65, { align: "left" });

    // DATA DE EMISSÃO (Movido para o topo)
    const dateStr = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Emitido em: ${dateStr}`, 14, 72, { align: "left" });
    
    // FOTO DO MEMBRO
    // Mantém no canto superior direito
    if (member.photoUrl && !member.photoUrl.includes('ui-avatars')) {
        try {
            const photoW = 30;
            const photoH = 40;
            const photoX = width - 45; 
            const photoY = 14; 
            
            const profilePic = await loadImage(member.photoUrl);
            doc.addImage(profilePic, 'JPEG', photoX, photoY, photoW, photoH);
            doc.setDrawColor(200, 200, 200);
            doc.rect(photoX, photoY, photoW, photoH); 
        } catch (e) {
            console.log("Erro ao carregar foto para ficha");
        }
    }

    // Ajuste de Y para começar os dados (evitar sobreposição com foto e cabeçalho maior)
    currentY = 85;

    // DADOS PESSOAIS
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.rect(14, currentY - 5, width - 28, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("1. DADOS PESSOAIS", 16, currentY);
    currentY += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Nome Completo:", 16, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(member.name.toUpperCase(), 16, currentY + 5);
    
    doc.setFont("helvetica", "bold");
    doc.text("Data de Nascimento:", 120, currentY);
    doc.setFont("helvetica", "normal");
    const birthDate = member.birthDate ? new Date(member.birthDate).toLocaleDateString('pt-BR') : "--/--/----";
    doc.text(birthDate, 120, currentY + 5);

    currentY += 12;

    doc.setFont("helvetica", "bold");
    doc.text("CPF:", 16, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(member.cpf || "---", 16, currentY + 5);

    doc.setFont("helvetica", "bold");
    doc.text("RG:", 60, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(member.rg || "---", 60, currentY + 5);

    doc.setFont("helvetica", "bold");
    doc.text("Estado Civil:", 120, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(member.maritalStatus || "---", 120, currentY + 5);

    currentY += 12;

    doc.setFont("helvetica", "bold");
    doc.text("Naturalidade:", 16, currentY);
    doc.setFont("helvetica", "normal");
    const naturalness = member.naturalness ? `${member.naturalness} - ${member.naturalnessState || ''}` : "---";
    doc.text(naturalness.toUpperCase(), 16, currentY + 5);

    doc.setFont("helvetica", "bold");
    doc.text("Nacionalidade:", 120, currentY);
    doc.setFont("helvetica", "normal");
    doc.text((member.nationality || "Brasileira").toUpperCase(), 120, currentY + 5);

    currentY += 12;

    doc.setFont("helvetica", "bold");
    doc.text("Nome do Pai:", 16, currentY);
    doc.setFont("helvetica", "normal");
    doc.text((member.fatherName || "---").toUpperCase(), 16, currentY + 5);

    currentY += 12;

    doc.setFont("helvetica", "bold");
    doc.text("Nome da Mãe:", 16, currentY);
    doc.setFont("helvetica", "normal");
    doc.text((member.motherName || "---").toUpperCase(), 16, currentY + 5);

    currentY += 12;

    doc.setFont("helvetica", "bold");
    doc.text("Profissão:", 16, currentY);
    doc.setFont("helvetica", "normal");
    doc.text((member.profession || "---").toUpperCase(), 16, currentY + 5);

    currentY += 15;

    // CONTATO E ENDEREÇO
    doc.setFillColor(241, 245, 249);
    doc.rect(14, currentY - 5, width - 28, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("2. CONTATO E ENDEREÇO", 16, currentY);
    currentY += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Endereço:", 16, currentY);
    doc.setFont("helvetica", "normal");
    doc.text((member.address || "---").toUpperCase(), 16, currentY + 5);

    currentY += 12;

    doc.setFont("helvetica", "bold");
    doc.text("Cidade/UF:", 16, currentY);
    doc.setFont("helvetica", "normal");
    const cityState = member.city ? `${member.city} - ${member.state || ''}` : "---";
    doc.text(cityState.toUpperCase(), 16, currentY + 5);

    doc.setFont("helvetica", "bold");
    doc.text("CEP:", 120, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(member.postalCode || "---", 120, currentY + 5);

    currentY += 12;

    doc.setFont("helvetica", "bold");
    doc.text("Telefone/WhatsApp:", 16, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(member.phone || "---", 16, currentY + 5);

    doc.setFont("helvetica", "bold");
    doc.text("Email:", 120, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(member.email || "---", 120, currentY + 5);

    currentY += 15;

    // DADOS ECLESIÁSTICOS
    doc.setFillColor(241, 245, 249);
    doc.rect(14, currentY - 5, width - 28, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("3. DADOS ECLESIÁSTICOS", 16, currentY);
    currentY += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Congregação:", 16, currentY);
    doc.setFont("helvetica", "normal");
    doc.text((member.congregation || "---").toUpperCase(), 16, currentY + 5);

    doc.setFont("helvetica", "bold");
    doc.text("Cargo/Função:", 120, currentY);
    doc.setFont("helvetica", "normal");
    doc.text((member.role || "Membro").toUpperCase(), 120, currentY + 5);

    currentY += 12;

    doc.setFont("helvetica", "bold");
    doc.text("Ministério/Departamento:", 16, currentY);
    doc.setFont("helvetica", "normal");
    doc.text((member.ministry || "---").toUpperCase(), 16, currentY + 5);

    doc.setFont("helvetica", "bold");
    doc.text("Situação:", 120, currentY);
    doc.setFont("helvetica", "normal");
    doc.text((member.status || "Ativo").toUpperCase(), 120, currentY + 5);

    currentY += 12;

    doc.setFont("helvetica", "bold");
    doc.text("Data de Admissão:", 16, currentY);
    doc.setFont("helvetica", "normal");
    const joinedAt = member.joinedAt ? new Date(member.joinedAt).toLocaleDateString('pt-BR') : "---";
    doc.text(joinedAt, 16, currentY + 5);

    doc.setFont("helvetica", "bold");
    doc.text("Código de Membro:", 120, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(member.code || "---", 120, currentY + 5);

    currentY += 12;

    doc.setFont("helvetica", "bold");
    doc.text("Batismo nas Águas:", 16, currentY);
    doc.setFont("helvetica", "normal");
    const baptism = member.baptismDate ? new Date(member.baptismDate).toLocaleDateString('pt-BR') : "---";
    doc.text(baptism, 16, currentY + 5);

    doc.setFont("helvetica", "bold");
    doc.text("Batismo Espírito Santo:", 120, currentY);
    doc.setFont("helvetica", "normal");
    const holySpirit = member.holySpiritBaptismDate ? new Date(member.holySpiritBaptismDate).toLocaleDateString('pt-BR') : "---";
    doc.text(holySpirit, 120, currentY + 5);

    currentY += 12;
    
    doc.setFont("helvetica", "bold");
    doc.text("Igreja Anterior:", 16, currentY);
    doc.setFont("helvetica", "normal");
    doc.text((member.previousChurch || "---").toUpperCase(), 16, currentY + 5);

    // RODAPÉ COM ASSINATURAS
    // Aumentado para 280 para dar mais espaço e evitar sobreposição
    currentY = 280;
    
    doc.setLineWidth(0.5);
    doc.line(20, currentY, 90, currentY);
    doc.line(120, currentY, 190, currentY);

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text("Assinatura do Membro", 55, currentY + 5, { align: "center" });
    doc.text("Secretaria da Igreja", 155, currentY + 5, { align: "center" });

    doc.save(`Ficha_Membro_${member.name.replace(/\s+/g, '_')}.pdf`);

  } catch (error) {
    console.error("Erro ao gerar ficha:", error);
    alert("Erro ao gerar ficha de membro.");
  }
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
