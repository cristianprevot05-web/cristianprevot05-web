<!-- Os SVGs de assets/ são gerados por tools/gerar.mjs (npm run assets) -->
<img width="100%" src="assets/topo.svg" alt="Cristian Prevot. Antes da ligação do cliente. Monitoro a rede de um provedor e escrevo as ferramentas que faltam. Rio de Janeiro." />

Trabalho com **monitoramento de redes num provedor de internet**. Passo o dia de olho em OLT, CTO, link e servidor,
e gosto de transformar esse mar de alertas num painel que qualquer pessoa do NOC entende de primeira.

Quando a ferramenta certa não existe, eu escrevo. Três delas estão abertas aqui embaixo, e uma você pode usar agora mesmo.

## Central NOC

<a href="https://cristianprevot05-web.github.io/central-noc/Monitoramento.Netflex/"><img width="100%" src="assets/central-noc.jpg" alt="Central NOC na demonstração: 10 clientes sem internet em 2 lugares, com a CTO-07 fora do ar e a CTO-12 em alerta." /></a>

Incidentes agrupados por causa e por clientes afetados, com dados do Zabbix, NetBox, LibreNMS e IXC.
Roda até na TV da sala do NOC, e 58 testes conferem cada mudança.

**[Abrir a demo](https://cristianprevot05-web.github.io/central-noc/Monitoramento.Netflex/)** com dados fictícios, ou [ler o código](https://github.com/cristianprevot05-web/central-noc).

<details>
<summary>Como funciona por dentro</summary>
<br>

- Uma API em Node, sem dependências, fala com o Zabbix e com o IXC. Os tokens ficam só no servidor, nunca no navegador.
- No Zabbix ela só lê e reconhece alarme; no IXC só lista, e só as tabelas que o painel usa.
- Os logins do IXC viram clientes on-line, sem internet ou bloqueados por atraso, e as quedas são agrupadas por CTO ou por OLT.
- A topologia vem do NetBox e os vizinhos LLDP, do LibreNMS.

</details>

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

## Sofia, agente de IA do suporte

Faz a triagem das ordens de serviço do IXC e acha a resposta nos manuais da empresa. Roda local no LM Studio
com temperatura 0, e as senhas de equipamento vêm de uma tabela fixa, para o modelo nunca inventar uma.

[Ler o código](https://github.com/cristianprevot05-web/agente-de-ia)

## Monitoramento de OLTs

Painel no Grafana com os dados do Zabbix para as OLTs do provedor, mais um alerta de OS duplicada de reparo de CTO vinda do IXC.

[Ler o código](https://github.com/cristianprevot05-web/Monitoramento-de-Redes)

## Ferramentas

<img width="100%" src="assets/ferramentas.svg" alt="Ferramentas: Python, JavaScript, TypeScript, React, Next.js, Tailwind, Three.js, Node.js, Supabase, PostgreSQL, Zabbix, Grafana, PHP, Streamlit, Vercel e Git." />

## Atividade

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/cristianprevot05-web/cristianprevot05-web/output/snake-dark.svg" />
  <img width="100%" alt="Cobrinha comendo o gráfico de contribuições" src="https://raw.githubusercontent.com/cristianprevot05-web/cristianprevot05-web/output/snake-light.svg" />
</picture>
