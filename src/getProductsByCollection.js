import axios from 'axios';
import { config } from 'dotenv';
config({ path: '.env' });

const {
  SHOP_DOMAIN,
  SHOPIFY_ACCESS_TOKEN,
  COLLECTION_ID
} = process.env;

export async function getProductIdsFromCollection() {
  try {
    
    const url = `https://${SHOP_DOMAIN}/admin/api/2023-01/collections/${COLLECTION_ID}/products.json?fields=id`;
    
    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    const products = response.data.products || [];
    
    return products.map(product => product.id);
  } catch (error) {
    console.error('Erro ao buscar produtos da collection:', error);
    return [];
  }
}
