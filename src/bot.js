import OpenAI from 'openai';
import { config } from 'dotenv';
config({ path: '.env' });
import fs from 'fs';
import axios from 'axios';

import { getProductIdsFromCollection } from './getProductsByCollection.js';
import { submitReview } from './submitReview.js';

console.log('Iniciando bot...', submitReview);
const {
  OPENAI_API_KEY,
  SHOP_DOMAIN,
  SHOPIFY_ACCESS_TOKEN,
  STORE_URL
} = process.env;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const recentTitlesFile = 'recentTitles.json';

const brazilianNames = JSON.parse(fs.readFileSync('./brazilianNames.json', 'utf8'));
const brazilianFirstNames = brazilianNames.firstNames;
const brazilianLastNames = brazilianNames.lastNames;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateBrazilianName() {
  const firstName = brazilianFirstNames[Math.floor(Math.random() * brazilianFirstNames.length)];
  const lastName = brazilianLastNames[Math.floor(Math.random() * brazilianLastNames.length)];
  return `${firstName} ${lastName}`;
}

function getRandomEmail(name) {
  const domains = ["mail.com", "gmail.com", "outlook.com"];
  const normalized = name.toLowerCase().replace(/\s+/g, '.');
  const randomDigits = Math.floor(1000 + Math.random() * 9000);

  return `${normalized}${randomDigits}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

function getRandomRating() {
  return 5;
}

async function fetchProduct(id) {
  try {
    const url = `https://${SHOP_DOMAIN}/admin/api/2023-01/products/${id}.json`;
    const result = await axios({
      url,
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "content-type": "application/json",
      },
    });
    const product = result.data.product;
    
    const description = (product.body_html || "").replace(/(<([^>]+)>)/gi, "");
    const shortDescription = description.length > 800 
      ? description.substring(0, 800) + "..." 
      : description;
    
    return {
      title: product.title,
      description: shortDescription
    };
  } catch (e) {
    console.log("ERRO ao buscar produto:", e?.response?.data || e.message);
    return null;
  }
}

async function generateReview(context, productInfo, recentTitles) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `
Você é um especialista em escrever reviews de produtos em português do Brasil.
Escreva em um tom leve e informal, sem usar repetições. 
Não use a palavra "review" no texto. 
Use apenas letras maiúsculas no início de frases ou para nomes próprios.
        `
        },
        {
          role: "user",
          content: `
Contexto: ${context}
Título do produto: ${productInfo.title}
Descrição do produto: ${productInfo.description}

Instruções:
- Escreva o título (no máximo 30 caracteres) e o conteúdo (entre 7 e 70 palavras).
- O título deve ser curto, em minúsculas se não for um nome próprio.
- Não use a palavra "review" no título.
- O conteúdo deve estar na primeira pessoa (eu, meu, minha) e não deve mencionar "você" ou "seu".
- Evite reutilizar títulos passados: ${recentTitles.join(", ")}
- Seja criativo e natural, sem parecer um texto robótico.
`
        }
      ],
      max_tokens: 200,
      temperature: 0.8 
    });

    let reviewText = response.choices[0].message.content.trim();

    const lines = reviewText.split('\n').map(line => line.trim()).filter(Boolean);
    
    let title = '';
    let content = '';

    if (lines[0].toLowerCase().includes('título:')) {
      title = lines[0].replace(/título:/i, '').trim();

      if (lines[1]?.toLowerCase().includes('conteúdo:')) {
        content = lines[1].replace(/conteúdo:/i, '').trim();
        content += ' ' + lines.slice(2).join(' ');
      } else {
        content = lines.slice(1).join(' ');
      }
    } else {
      title = lines[0];
      content = lines.slice(1).join(' ');
    }

    title = title.replace(/^["']|["']$/g, '');
    content = content.replace(/^["']|["']$/g, '');

    if (title.length > 30) title = title.slice(0, 30);
    if (content.split(' ').length < 7) {
      throw new Error('Review muito curta. Regerando...');
    }
    if (content.split(' ').length > 70) {
      content = content.split(' ').slice(0, 70).join(' ');
    }

    const titleWords = title.toLowerCase().split(/\s+/);
    const recentTitleWords = recentTitles.flatMap(t => t.toLowerCase().split(/\s+/));
    const commonWords = titleWords.filter(word => recentTitleWords.includes(word));

    return { title, content };
  } catch (error) {
    console.error('Erro gerando review com GPT:', error.message);
    return { title: '', content: '' };
  }
}

async function createReview(context, productInfo, recentTitles) {
  let review = {};
  
  const name = generateBrazilianName();
  const email = getRandomEmail(name);
  const rating = getRandomRating();
  
  while (!review.title || !review.content) {
    const tempReview = await generateReview(context, productInfo, recentTitles);
    if (tempReview.title && tempReview.content) {
      review = tempReview;
    }
  }

  recentTitles.push(review.title);
  if (recentTitles.length > 6) {
    recentTitles.shift();
  }

  try {
    fs.writeFileSync(recentTitlesFile, JSON.stringify({ titles: recentTitles }), 'utf8');
  } catch (error) {
    console.error('Erro ao salvar títulos recentes:', error);
  }

  return {
    name,
    email,
    rating,
    title: review.title,
    content: review.content
  };
}

async function main() {
  try {
    const productIds = await getProductIdsFromCollection();
    console.log('Produtos encontrados na collection:', productIds);

    let contextJSON = '';
    try {
      contextJSON = JSON.parse(fs.readFileSync('context.json', 'utf-8')).context || '';
    } catch (error) {
      console.error('Erro lendo context.json:', error);
    }

    let recentTitles = [];
    try {
      const recentTitlesData = fs.readFileSync(recentTitlesFile, 'utf8');
      recentTitles = JSON.parse(recentTitlesData).titles || [];
    } catch (error) {
      console.error('Erro lendo recentTitles.json:', error);
    }

    for (const productId of productIds) {
      const productInfo = await fetchProduct(productId);
      if (!productInfo) {
        console.log(`Não foi possível obter dados do produto ${productId}. Pulando...`);
        continue;
      }
      const review = await createReview(contextJSON, productInfo, recentTitles);
      console.log('Review gerada para produto', productId, review);
      await submitReview(productId, review);
      await delay(10000);
    }

  } catch (error) {
    console.error('Erro no processo principal:', error);
  }
}

main();
