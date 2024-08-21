const fs = require('fs');

// Carregue o conteúdo do JSON
const ocrData = JSON.parse(fs.readFileSync('./ocr_read.json', 'utf8'));

const extractFullText = (blocks) => {
    let fullText = '';

    blocks.forEach((block) => {
        const text = block.Text || '';
        fullText += text + '\n';  // Adiciona o texto e uma nova linha
    });

    return fullText.trim();  // Remove espaços em branco do início e do final
};

// Extraia os blocos do resultado OCR
const blocks = ocrData.res.Blocks;

// Extraia o texto completo
const fullText = extractFullText(blocks);

console.log(fullText);
