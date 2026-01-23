import { jsPDF } from "jspdf";
import { Member, Transaction } from "../types";

// ============================================================================
// ÁREA DE CONFIGURAÇÃO DE MODELOS (TEMPLATES)
// ============================================================================
// Para usar seu modelo, converta sua imagem para Base64 ou use uma URL pública.
// Se deixar vazio "", o sistema usará o desenho padrão automático.

const MEMBERSHIP_CARD_BG = ""; // Ex: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
const CERTIFICATE_BG = "";     // Ex: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."

// ============================================================================

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

  try {
    // 1. TENTA CARREGAR O MODELO DE FUNDO DO USUÁRIO
    if (MEMBERSHIP_CARD_BG) {
      const bg = await loadImage(MEMBERSHIP_CARD_BG);
      doc.addImage(bg, 'PNG', 0, 0, 85.6, 54);
    } else {
      // 2. SE NÃO TIVER IMAGEM, DESENHA O PADRÃO (FALLBACK)
      // Fundo / Design
      doc.setFillColor(37, 99, 235); // Blue 600
      doc.rect(0, 0, 85.6, 12, 'F'); // Header azul
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("ADBetel Conectada", 5, 8);

      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.5);
      doc.line(5, 45, 80, 45); // Linha rodapé
      
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text("Válido em todo território nacional - ADBetel", 25, 49);
    }

    // 3. PREENCHIMENTO DOS DADOS (Funciona em cima da imagem ou do desenho)
    
    // Área da Foto (Desenhamos um box se não houver foto real, apenas para marcar)
    // Se você tiver um template com espaço vazado, ajuste as coordenadas X e Y abaixo
    doc.setDrawColor(200, 200, 200);
    if (!MEMBERSHIP_CARD_BG) { 
        // Só desenha o box cinza se não tiver template, para não estragar o design do usuário
        doc.setFillColor(240, 240, 240);
        doc.rect(5, 16, 20, 25, 'FD');
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(6);
        doc.text("FOTO", 12, 29);
    } else {
        // Se tiver template, tenta carregar a foto do perfil do usuário
        if(member.photoUrl && !member.photoUrl.includes('ui-avatars')) {
             try {
                const profilePic = await loadImage(member.photoUrl);
                doc.addImage(profilePic, 'JPEG', 5, 16, 20, 25); // Ajuste posição da foto aqui
             } catch(e) {
                // Falha ao carregar foto perfil
             }
        }
    }

    // Dados Textuais
    // Coordenadas: X (Horizontal), Y (Vertical)
    
    // Nome
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(member.name.substring(0, 25), 28, 20); 

    // Cargo
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("CARGO / FUNÇÃO", 28, 24);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text(member.role.toUpperCase(), 28, 28);

    // Data de Membresia
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("MEMBRO DESDE", 28, 33);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text(new Date(member.joinedAt).toLocaleDateString('pt-BR'), 28, 37);

    // ID
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("ID DE MEMBRO", 60, 33);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text(`#${member.id.padStart(6, '0')}`, 60, 37);

    doc.save(`carteirinha_${member.name.replace(/\s+/g, '_').toLowerCase()}.pdf`);

  } catch (error) {
    console.error("Erro ao gerar carteirinha:", error);
    alert("Erro ao gerar PDF. Verifique se a imagem de fundo é válida (CORS/Base64).");
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
    if (CERTIFICATE_BG) {
        const bg = await loadImage(CERTIFICATE_BG);
        doc.addImage(bg, 'PNG', 0, 0, width, height);
    } else {
        doc.setDrawColor(37, 99, 235); // Blue Border
        doc.setLineWidth(2);
        doc.rect(10, 10, width - 20, height - 20);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.rect(15, 15, width - 30, height - 30);
        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0);
        doc.line(40, 180, 110, 180);
        doc.line(186, 180, 256, 180);
    }

    if (!CERTIFICATE_BG) {
        doc.setFont("times", "bold");
        doc.setFontSize(40);
        doc.setTextColor(50, 50, 50);
        doc.text("CERTIFICADO", width / 2, 50, { align: "center" });
    }

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

    doc.setFont("times", "normal");
    doc.setFontSize(16);
    doc.setTextColor(80, 80, 80);
    const descSplit = doc.splitTextToSize(description, 200);
    doc.text(descSplit, width / 2, 130, { align: "center" });

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
    alert("Erro ao gerar PDF. Verifique se a imagem de fundo é válida.");
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