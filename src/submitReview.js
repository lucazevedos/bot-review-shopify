// src/submitReviews.js
import axios from 'axios';
import fs from 'fs';
import { config } from 'dotenv';

config({ path: '.env' });

const {
  JUDGEME_API_TOKEN, // Seu api_token do Judge.me
  SHOP_DOMAIN        // Ex: 'site-pneudrive.myshopify.com'
} = process.env;

const ERROR_LOG_PATH = 'error_reviews.json';

/**
 * Envia a review para Judge.me:
 * - Query params: api_token e shop_domain
 * - Body JSON: { url, id, name, email, rating, title, body }
 */
export async function submitReview(productId, review) {
  const body = {
    url: SHOP_DOMAIN,         // Campo "url" obrigatório
    id: productId.toString(), // O "id" que a Judge.me reconhece (Shopify Product ID)
    name: review.name,
    email: review.email,
    rating: review.rating,    // 1 a 5
    title: review.title,
    body: review.content      // Texto principal do review
  };

  try {
    const response = await axios.post(
      'https://judge.me/api/v1/reviews',
      body,
      {
        params: {
          api_token: JUDGEME_API_TOKEN,
          shop_domain: SHOP_DOMAIN
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`Review criada para o produto ${productId}:`, response.data);
  } catch (error) {
    console.error(`Erro ao criar review para produto ${productId}:`,
      error.response ? error.response.data : error.message
    );

    const errorDetails = {
      productId,
      review,
      error: error.response ? error.response.data : error.message
    };
    saveErrorLog(errorDetails);
  }
}

function saveErrorLog(errorDetails) {
  let errorLog = [];

  if (fs.existsSync(ERROR_LOG_PATH) && fs.statSync(ERROR_LOG_PATH).size > 0) {
    const existingErrors = fs.readFileSync(ERROR_LOG_PATH, 'utf-8');
    errorLog = JSON.parse(existingErrors); 
  }

  errorLog.push(errorDetails);

  fs.writeFileSync(ERROR_LOG_PATH, JSON.stringify(errorLog, null, 2), 'utf-8');
}
