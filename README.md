# 🛢️ Petróleo em Angola — Painel de Dados Públicos

Painel educativo, estático e sem dependências, com dados públicos sobre produção, exportação e peso económico do setor petrolífero angolano. Feito para estudantes e jornalistas explorarem os números diretamente — com as fontes sempre visíveis ao lado de cada gráfico.

## Como correr

O painel usa `fetch()` para carregar `data/petroleo.json`, por isso precisa de ser servido por HTTP — não funciona a abrir `index.html` diretamente com duplo-clique (`file://`).

```bash
cd dashboard_petroleo
python3 -m http.server 8000
# depois abre http://localhost:8000
```

Qualquer servidor estático serve (`npx serve`, `php -S localhost:8000`, GitHub Pages, Netlify, etc.) — não há build step, nem `npm install`.

## Estrutura

```
dashboard_petroleo/
├── index.html          # estrutura + estilos do painel (tema claro/escuro automático)
├── app.js               # desenha os gráficos em SVG puro e liga os dados
├── data/
│   └── petroleo.json    # todos os números do painel, com a fonte de cada bloco
└── README.md
```

Separar `data/petroleo.json` do resto foi propositado: para atualizar um número (ex.: produção do mês seguinte), basta editar o JSON — não é preciso mexer no HTML nem no JS.

## Como atualizar os dados

1. Abre o boletim mensal da ANPG em [anpg.co.ao/producao](https://anpg.co.ao/producao/) e regista a produção total do mês e a média diária.
2. Adiciona uma entrada ao array `monthly2025` em `data/petroleo.json` (ou cria `monthly2026` e ajusta `app.js`/`index.html` quando o ano virar).
3. Os KPIs "Produção diária" e "Produção acumulada" são calculados automaticamente a partir de `monthly2025` — não precisam de edição manual.
4. Os restantes indicadores (receita de exportação, reservas, quota de mercado por operadora, etc.) não têm uma fonte mensal — atualiza-os manualmente quando saírem relatórios novos (FMI Article IV, Fact Sheet do BAD, boletins da EIA), e atualiza também a lista de fontes no rodapé do `index.html`.
5. Depois de editar o JSON, corre `python3 -m json.tool data/petroleo.json > /dev/null` para confirmar que continua válido.

## Fontes usadas nesta versão

| Indicador | Fonte primária |
|---|---|
| Produção mensal e por bloco (2025) | [ANPG](https://anpg.co.ao/producao/) — boletins oficiais |
| Histórico de produção, exportações por volume, refino, reservas | [EIA](https://www.eia.gov/international/content/analysis/countries_long/Angola/index.htm) |
| Peso fiscal e no PIB | FMI (Article IV Consultation) |
| Peso no PIB e nas exportações (visão alternativa) | Banco Africano de Desenvolvimento — Angola Fact Sheet 2025 |
| Exportações por destino, em valor (2024) | OEC / UN Comtrade |
| Quota de mercado por operadora | Mordor Intelligence (estimativa de mercado, não oficial) |

Onde as fontes divergem — nomeadamente o peso do petróleo no PIB, que varia entre 13,9% e 28,9% consoante quem publica — o painel mostra as várias estimativas lado a lado em vez de escolher uma só. Ver o separador "Peso económico" no painel para o porquê.

## Aviso

Este é um projeto educativo independente. Não tem qualquer afiliação com a ANPG, a Sonangol, a OPEP ou qualquer operadora citada. Os dados de produção mensal de 2025 vêm diretamente das fontes oficiais da ANPG; os restantes indicadores combinam fontes públicas que por vezes divergem entre si — isso está sinalizado no próprio painel. Confirma sempre junto da fonte primária antes de citar um número.
