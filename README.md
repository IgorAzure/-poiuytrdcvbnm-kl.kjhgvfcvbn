# iFood - Painel do Restaurante

Sistema web para gerenciamento de pedidos do restaurante em um sistema de delivery. Desenvolvido com React e integrado ao Firebase Firestore.

## 🚀 Funcionalidades

- ✅ Visualização de pedidos em tempo real
- ✅ Detalhes completos de cada pedido
- ✅ Interface moderna e responsiva
- ✅ Integração com Firebase Firestore

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn
- Conta no Firebase com projeto Firestore configurado

## 🔧 Instalação

1. Clone ou baixe este repositório

2. Instale as dependências:
```bash
npm install
```

3. Configure o Firebase:
   - Abra o arquivo `src/firebase/config.js`
   - Substitua as configurações com as credenciais do seu projeto Firebase:
     ```javascript
     const firebaseConfig = {
       apiKey: "SUA_API_KEY",
       authDomain: "SEU_AUTH_DOMAIN",
       projectId: "SEU_PROJECT_ID",
       storageBucket: "SEU_STORAGE_BUCKET",
       messagingSenderId: "SEU_MESSAGING_SENDER_ID",
       appId: "SEU_APP_ID"
     };
     ```

4. Configure a estrutura do Firestore:
   - Crie uma coleção chamada `pedidos` no seu Firestore
   - Cada documento deve ter a seguinte estrutura (exemplo):
     ```javascript
     {
       cliente: {
         nome: "João Silva",
         telefone: "(11) 99999-9999",
         email: "joao@email.com"
       },
       endereco: {
         rua: "Rua Exemplo",
         numero: "123",
         complemento: "Apto 45",
         bairro: "Centro",
         cidade: "São Paulo",
         estado: "SP",
         cep: "01234-567"
       },
       itens: [
         {
           nome: "Hambúrguer",
           descricao: "Hambúrguer artesanal",
           quantidade: 2,
           preco: 25.90
         }
       ],
       total: 51.80,
       taxaEntrega: 5.00,
       status: "pendente",
       dataCriacao: Timestamp,
       observacoes: "Sem cebola"
     }
     ```

## 🏃 Executando o Projeto

Para iniciar o servidor de desenvolvimento:

```bash
npm start
```

O aplicativo estará disponível em `http://localhost:3000`

## 📦 Build para Produção

Para criar uma build de produção:

```bash
npm run build
```

Os arquivos otimizados estarão na pasta `build/`

## 📁 Estrutura do Projeto

```
ifood3/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── PedidosList.js
│   │   ├── PedidosList.css
│   │   ├── PedidoDetalhes.js
│   │   └── PedidoDetalhes.css
│   ├── firebase/
│   │   └── config.js
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
└── README.md
```

## 🎨 Status dos Pedidos

O sistema suporta os seguintes status (com cores diferentes):
- **pendente** (laranja)
- **preparando** (azul)
- **pronto** (verde)
- **entregue** (cinza)
- **cancelado** (vermelho)

## 📝 Notas

- O sistema atualiza os pedidos em tempo real usando o `onSnapshot` do Firestore
- Certifique-se de que as regras de segurança do Firestore permitem leitura da coleção `pedidos`
- Para produção, configure adequadamente as regras de segurança do Firebase

## 🔒 Segurança

⚠️ **Importante**: Não commite o arquivo `src/firebase/config.js` com credenciais reais em repositórios públicos. Use variáveis de ambiente ou um arquivo de configuração separado que esteja no `.gitignore`.
