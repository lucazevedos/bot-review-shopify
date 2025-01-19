# Bot de Reviews para Shopify com OpenAI + Judge.me

Bem-vindo(a) ao **Bot-Reviews-Shopify**, um projeto que cria reviews automáticas para produtos de uma loja Shopify, usando a API da OpenAI (ChatGPT) para gerar textos em português e a API da Judge.me para publicar as avaliações.

## Índice
1. [Visão Geral](#visão-geral)
2. [Funcionalidades](#funcionalidades)
3. [Requisitos e Dependências](#requisitos-e-dependências)
4. [Estrutura de Pastas](#estrutura-de-pastas)
5. [Configuração (.env)](#configuração-env)
6. [Como Executar](#como-executar)
7. [Como Funciona (Fluxo do Bot)](#como-funciona-fluxo-do-bot)
8. [Customizações e Dicas](#customizações-e-dicas)
9. [Logs de Erro](#logs-de-erro)
10. [Contribuição](#contribuição)
11. [Licença](#licença)

---

## Visão Geral
Este bot foi criado para demonstrar:
- Integração entre **Shopify** (busca de produtos via API).
- Geração de reviews automáticas usando **OpenAI** (ChatGPT).
- Publicação das avaliações na **Judge.me**, plataforma de reviews e UGC (User Generated Content).

Ele gera nomes em português, escreve títulos e conteúdos curtos, e posta cada review diretamente no painel do Judge.me associado ao produto.

---

## Funcionalidades
- **Busca de Produtos**: obtém o *ID* dos produtos de uma *Collection* específica no Shopify.
- **Geração de Reviews**: cria títulos e textos de avaliação em português usando a API do ChatGPT.
- **Envio Automático para Judge.me**: posta a avaliação no produto correto (mapeado por ID).
- **Armazenamento de Erros**: salva erros de requisição em um arquivo `error_reviews.json`.

---

## Requisitos e Dependências
- **Node.js** (>= 14.x)
- **npm** ou **yarn** para instalar dependências
- Conta na **OpenAI** com **API Key** válida
- Conta configurada no **Judge.me** com **api_token** ou outro método de autenticação
- **Loja Shopify** com *Access Token* válido para acessar a API de Admin

No arquivo `package.json`, temos as seguintes dependências principais:
- [`axios`](https://www.npmjs.com/package/axios) para requisições HTTP
- [`dotenv`](https://www.npmjs.com/package/dotenv) para gerenciar variáveis de ambiente
- [`openai`](https://www.npmjs.com/package/openai) para acessar a API do ChatGPT
- [`form-data`](https://www.npmjs.com/package/form-data) (opcional caso queira enviar dados multipart/form-data)

---

## Estrutura de Pastas

```
Bot-Reviews-Shopify
├── src
│   ├── bot.js                  # Script principal que controla o fluxo
│   ├── submitReview.js         # Envio das reviews para a Judge.me
│   ├── getProductsByCollection.js  # (Opcional) Para buscar IDs dos produtos via Collection
│   ├── delay.js                # Função utilitária de delay (pausa)
├── brazilianNames.json         # Lista de primeiros nomes e sobrenomes brasileiros
├── productIds.json             # (Opcional) IDs dos produtos caso não busque de uma collection
├── context.json                # Contexto/instruções extras usados na geração do review
├── recentTitles.json           # Títulos recentes gerados (para evitar repetições)
├── .env                        # Variáveis de ambiente (tokens, domain, etc.)
├── error_reviews.json          # Geração automática de logs de erros
└── package.json                # Configurações do projeto Node
```

---

## Configuração (.env)

Crie um arquivo **`.env`** na raiz do projeto, contendo:

```bash
OPENAI_API_KEY=sk-xxxxxxx       # Chave da API OpenAI
JUDGEME_API_TOKEN=xxxxxxxxxxx   # Token da API Judge.me
SHOP_DOMAIN=nomedaloja.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxx
STORE_URL=nomedaloja.myshopify.com
COLLECTION_ID=476921200918
```

**Observações**:
- `OPENAI_API_KEY`: Obtenha em [OpenAI Platform](https://platform.openai.com/).
- `JUDGEME_API_TOKEN`: Token de API fornecido pelo Judge.me ou no painel da sua conta.
- `SHOP_DOMAIN`: Domínio principal da sua loja Shopify (ex.: `deluk-modas.myshopify.com`).
- `SHOPIFY_ACCESS_TOKEN`: Token de acesso para a API Admin do Shopify.
- `STORE_URL`: Mesmo domínio da loja, caso seu script use para montar URLs.
- `COLLECTION_ID`: ID de uma coleção do Shopify da qual queremos os produtos (pode ser *custom collection* ou *smart collection*).

---

## Como Executar

1. **Instale as dependências**:
   ```bash
   npm install
   ```
   ou
   ```bash
   yarn
   ```

2. **Configure o `.env`** conforme explicado acima.

3. **Rode o bot**:
   ```bash
   npm start
   ```
   Isso executará o arquivo `src/bot.js`.

4. **Verifique o console** para acompanhar o status de cada review criado ou possíveis erros.

---

## Como Funciona (Fluxo do Bot)

1. **Leitura de Produtos**:  
   - O `bot.js` pode chamar `getProductsByCollection.js` para obter todos os IDs do Shopify contidos na Collection especificada em `COLLECTION_ID`.  
   - Alternativamente, ele pode ler os IDs de `productIds.json`.

2. **Geração de Nome e E-mail**:  
   - Usa `brazilianNames.json` para formar nomes como "Ana Souza" e insere um sufixo numérico no e-mail, ex. `ana.souza2155@mail.com`.

3. **Chamada à OpenAI**:  
   - Gera um título e conteúdo curtos em **português** usando `gpt-3.5-turbo`.

4. **Envio de Review para Judge.me**:  
   - O script `submitReview.js` recebe o ID do produto, título, conteúdo, nome e e-mail.  
   - Faz a requisição `POST https://judge.me/api/v1/reviews` com os campos obrigatórios (name, email, rating, title, body, id, url).

5. **Delay**:  
   - Após cada review, o bot aguarda alguns segundos (ex.: 10s) para não sobrecarregar as APIs.

6. **Logs de erro**:  
   - Caso ocorra erro (ex.: "Email must be present"), o bot salva detalhes em `error_reviews.json`.

---

## Customizações e Dicas

- **Número de Reviews por Produto**:  
  Atualmente, gera apenas 1 review por produto. Se quiser criar múltiplas, basta colocar um loop interno para chamar o `submitReview` várias vezes para cada produto.
  
- **Reduzir Custos com OpenAI**:  
  - Diminua `max_tokens` e `temperature` nas chamadas do GPT para reduzir consumo.  
  - Use prompts mais curtos e cacheie resultados de testes para não chamar a API repetidamente.

- **Remover Checagem de Palavras Repetidas**:  
  - Se o bot ficar re-gerando título por detecção de “palavras repetidas”, basta remover a parte do código que força a re-geração.

- **Formatação de ID**:  
  - A Judge.me costuma esperar o **ID numérico** do Shopify (sem `gid://shopify/Product/`).

---

## Logs de Erro
- Os logs de erro são gravados em `error_reviews.json`.  
- Se o arquivo não existir ou estiver vazio, ele é criado quando ocorre o primeiro erro.  
- Cada objeto no JSON contém `productId`, `review` e mensagem de erro retornada pela API.

---

## Contribuição
- Pull requests são bem-vindos!
- Sinta-se livre para abrir **issues** reportando bugs ou sugerindo melhorias.

---

## Licença
Este projeto é apenas um **exemplo educativo** e não possui licença específica. Use, modifique e distribua à vontade, mas por favor **mantenha os créditos**.