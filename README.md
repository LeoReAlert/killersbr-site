# KILLERSBR.BRASIL

Site estático pronto para GitHub Pages, Netlify, Vercel ou hospedagem comum.

## Estrutura

- `index.html`: página principal.
- `assets/css/style.css`: estilos.
- `assets/js/app.js`: navegação, sanfona, ranking, vídeos e carrossel.
- `assets/js/config.js`: chave opcional da API do YouTube.
- `assets/images/`: imagens do layout.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie todo o conteúdo desta pasta para a raiz do repositório.
3. Abra **Settings → Pages**.
4. Em **Build and deployment**, selecione **Deploy from a branch**.
5. Escolha a branch `main` e a pasta `/root`.

## Atualização automática dos vídeos

O site já possui vídeos de reserva e funciona sem configuração. Para puxar automaticamente os vídeos mais recentes:

1. Crie um projeto no Google Cloud.
2. Ative a **YouTube Data API v3**.
3. Crie uma API Key.
4. Restrinja a chave por **HTTP referrers** usando o domínio do GitHub Pages ou do seu site.
5. Abra `assets/js/config.js` e preencha `youtubeApiKey`.

A chave ficará no frontend, portanto a restrição por domínio é importante. Para esconder totalmente a chave seria necessário usar uma função serverless ou backend.

## Ranking manual

Edite o array `rankingPlayers` em `assets/js/app.js`.
