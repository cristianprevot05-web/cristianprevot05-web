<!-- Os SVGs de assets/ são gerados por tools/gerar.mjs (npm run assets) -->
<a href="https://cristianprevot05-web.github.io"><img width="100%" src="assets/topo.svg" alt="Cristian Prevot. Antes da ligação do cliente. Monitoro a rede de um provedor e escrevo as ferramentas que faltam. Rio de Janeiro." /></a>

Trabalho com **monitoramento de redes num provedor de internet**. Passo o dia de olho em OLT, CTO, link e servidor,
e gosto de transformar esse mar de alertas num painel que qualquer pessoa do NOC entende de primeira.

Quando a ferramenta certa não existe, eu escrevo. Três delas estão abertas aqui embaixo.
No site, o globo do topo gira com o mouse: **[cristianprevot05-web.github.io](https://cristianprevot05-web.github.io)**

## Central de Comunicados

<a href="https://github.com/cristianprevot05-web/central-de-comunicados"><img width="100%" src="assets/central-de-comunicados.jpg" alt="Tela inicial da Central de Comunicados: 118 clientes sem internet, status da rede nos últimos 30 dias e o resumo das quedas." /></a>

Monta o aviso de rompimento, instabilidade ou manutenção no modelo oficial, passa por aprovação e publica
no Instagram do provedor, na hora ou agendado. Quando a rede volta, um botão monta o “Normalizado” com as mesmas regiões.

[Ler o código](https://github.com/cristianprevot05-web/central-de-comunicados)

<details>
<summary>O que mais ela faz</summary>
<br>

- Story com link: na hora marcada chega um aviso no celular, com o link já copiado para a figurinha.
- Cada pessoa tem o próprio login, e o administrador escolhe quais ferramentas cada uma usa.
- Toda ação fica num registro com nome, hora, aparelho e IP que ninguém apaga, nem o administrador.
- Roda nos planos gratuitos do Supabase, com a API em PHP na hospedagem.

</details>

## Monitoramento de Redes

<a href="https://github.com/cristianprevot05-web/Monitoramento-de-Redes"><img width="100%" src="assets/monitoramento-de-redes.png" alt="Dois painéis no Grafana: à esquerda, três eventos de OLT abertos, todos de PON perto do limite de ONUs; à direita, a fila de reparo de CTO vinda do IXC, sem OS no momento." /></a>

Dois painéis no Grafana. O da esquerda junta os eventos das OLTs que chegam do Zabbix e separa o que ainda
não foi reconhecido. O da direita puxa do IXC as ordens de serviço de reparo de CTO e avisa quando a mesma caixa ganha uma OS duplicada.

[Ler o código](https://github.com/cristianprevot05-web/Monitoramento-de-Redes)

## Sofia, agente de IA do suporte

<a href="https://github.com/cristianprevot05-web/agente-de-ia"><img width="100%" src="assets/sofia.png" alt="Tela da Sofia, o Agente FlexNet, com a mensagem de boas-vindas e o campo para a consulta técnica." /></a>

Faz a triagem das ordens de serviço do IXC e acha a resposta nos manuais da empresa. Roda local no LM Studio
com temperatura 0, e as senhas de equipamento vêm de uma tabela fixa, para o modelo nunca inventar uma.

[Ler o código](https://github.com/cristianprevot05-web/agente-de-ia)

## Ferramentas

<img width="100%" src="assets/ferramentas.svg" alt="Ferramentas: Python, JavaScript, TypeScript, React, Next.js, Tailwind, Three.js, Node.js, Supabase, PostgreSQL, Zabbix, Grafana, PHP, Streamlit, Vercel e Git." />

## Atividade

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/cristianprevot05-web/cristianprevot05-web/output/snake-dark.svg" />
  <img width="100%" alt="Cobrinha comendo o gráfico de contribuições" src="https://raw.githubusercontent.com/cristianprevot05-web/cristianprevot05-web/output/snake-light.svg" />
</picture>
