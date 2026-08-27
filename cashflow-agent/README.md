# Fluxo de Caixa

Fluxo de caixa pessoal por estabelecimento e categoria, com histórico
comparativo mês a mês, mapa dos gastos e lista de compras online — a partir
de extratos e faturas que você importa (CSV ou OFX).

## Por que importação manual, e não conexão direta com o banco?

Conectar diretamente ao seu banco exige um agregador de Open Finance
(Pluggy, Belvo, Quanto) — tem custo mensal por conta conectada e passa por
aprovação. Para validar o produto primeiro, este MVP começa com importação
de arquivo (o mesmo extrato/fatura que você já baixa no site do banco).

A camada de dados foi desenhada para isso não ser um beco sem saída: veja
`src/lib/datasources/types.ts`. Qualquer origem de transações — a
importação manual de hoje, ou um agregador amanhã — implementa a mesma
interface `DataSource`. Trocar ou adicionar uma fonte não exige tocar em
categorização, geocodificação ou nos dashboards.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind
- **Prisma + SQLite** (fácil trocar para Postgres depois — só mudar a
  `DATABASE_URL` e o `provider` em `prisma/schema.prisma`)
- **Recharts** para os gráficos, **React Leaflet** para o mapa
- **Nominatim (OpenStreetMap)** para geocodificação, gratuito

## Como rodar

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run db:seed   # categorias padrão + regras de palavra-chave
npm run dev
```

Abra `http://localhost:3000`.

## Fluxo

1. **Importar** (`/upload`) — envie o CSV ou OFX do extrato/fatura. O
   parser detecta colunas de data/descrição/valor automaticamente (aceita
   cabeçalhos em português e inglês, formato brasileiro de número e data).
2. Cada transação é **categorizada automaticamente** por palavra-chave no
   nome do estabelecimento (`src/lib/categorize.ts`) e o nome do
   estabelecimento é normalizado e deduplicado em `Merchant`.
3. Estabelecimentos físicos são **geocodificados em segundo plano**
   (`src/lib/geocode.ts`) via Nominatim, respeitando o limite de 1
   requisição/segundo do serviço gratuito — pode levar alguns minutos para
   faturas grandes.
4. **Fluxo de Caixa** (`/dashboard`) — gasto por categoria, comparativo
   mensal, principais estabelecimentos.
5. **Mapa** (`/mapa`) — localização aproximada (cidade/nome do
   estabelecimento, não o ponto exato da compra — bancos não enviam GPS).
6. **Compras Online** (`/compras-online`) — lojas de internet identificadas
   (sem local físico, por isso separadas do mapa).
7. **Transações** (`/transacoes`) — lista completa com opção de corrigir a
   categoria manualmente.

## Modelo de dados

- `Account` — conta corrente ou cartão de crédito
- `ImportBatch` — um upload de arquivo
- `Transaction` — cada lançamento, ligado a `Account`, `Merchant` e
  `Category`
- `Merchant` — estabelecimento normalizado/deduplicado, com
  `latitude`/`longitude` quando geocodificado e `isOnline` para lojas de
  internet
- `Category` / `CategoryRule` — taxonomia e regras de palavra-chave para
  auto-categorização

Contas correntes marcam gasto como valor negativo; faturas de cartão
geralmente marcam compra como positivo (pagamento/estorno como negativo).
`src/lib/money.ts` normaliza isso por tipo de conta antes de agregar.

## Limitações conhecidas do MVP

- **Geocodificação é melhor esforço**: baseada no nome/cidade do
  extrato, não em coordenadas reais da compra. Estabelecimentos sem cidade
  identificável no texto (comum) não aparecem no mapa.
- **Categorização por palavra-chave**: cobre os casos mais comuns
  (mercado, transporte, assinaturas, etc.), mas sempre dá pra ajustar
  manualmente em `/transacoes`. Adicionar palavras-chave é só editar
  `prisma/seed.ts` e rodar `npm run db:seed` de novo.
- **Sem autenticação**: pensado para uso pessoal single-user. Adicionar
  login antes de expor publicamente.
- **CSV genérico**: reconhece cabeçalhos comuns de bancos brasileiros, mas
  um extrato com formato muito fora do padrão pode precisar de ajuste no
  parser (`src/lib/parsers/csv.ts`).

## Evoluindo para Open Finance

Quando fizer sentido conectar direto ao banco: implemente `DataSource` em
`src/lib/datasources/` (ex: `pluggy.ts`) chamando a API do agregador
escolhido e devolvendo `RawTransaction[]` no mesmo formato que o parser de
CSV/OFX já produz. Nada mais no app precisa mudar.
