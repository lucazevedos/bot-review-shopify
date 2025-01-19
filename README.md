# Review Bot for Product Reviews

This project automates the generation and submission of product reviews using OpenAI's GPT-3.5 model and integration with Stamped.io. It's designed to streamline the process of creating engaging reviews for various products sold online.

## Features

- **Dynamic Product Information:** Utilizes JSON files (`productIds.json`, `context.json`) to fetch varying product titles, descriptions, and store information.
  
- **Prompt-based Review Generation:** Fixed prompts are used to structure and generate reviews based on the fetched product information.
  
- **Integration with Stamped.io:** Reviews generated are submitted to Stamped.io via API for seamless integration with the online store.

## Setup

### Environment Variables

Store sensitive information like API keys and store URL in a `.env` file.

```plaintext
OPENAI_API_KEY=your_openai_api_key
STAMPED_API_KEY=your_stamped_api_key
STORE_HASH=your_store_hash
STORE_URL=your_store_url
ACCESS_TOKEN=your_shopify_access_token
```

### JSON Files

- **productIds.json:** Contains a list of product IDs to fetch product information.
- **context.json:** Stores contextual information about the store, such as name and detail

### Dependencies

Install dependencies using npm:

```plaintext
npm install
```

### Usage

- Modify the productIds.json and context.json files with your specific product IDs and store information.

- Run the script to generate and optionally submit reviews:

```plaintext
node bot.js
```

Uncomment the line in bot.js to automatically submit reviews to Stamped.io after generation.
```// await submitReview(productId, review);```

