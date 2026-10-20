# SRL Canvas — vídeo de apresentação da landing page

**Status:** produzido e publicado na landing (out/2026). Duração: 77 s (render de 96 s acelerado para 1,25× no ffmpeg, com tom preservado). Voz sintética pt-BR (HeyGen, "Ana Carvalho — Friendly"), trilha instrumental discreta sob a voz, legendas pt-BR.

## Arquivos publicados (`apps/web/public/video/`)

| Arquivo                               | Uso                                                                    |
| ------------------------------------- | ---------------------------------------------------------------------- |
| `srl-canvas-apresentacao.mp4`         | Vídeo da LP, sem legenda na imagem (H.264/AAC, 1920×1080, `faststart`) |
| `srl-canvas-apresentacao.pt-BR.vtt`   | Legendas WebVTT carregadas via `<track>`                               |
| `srl-canvas-apresentacao-poster.webp` | Capa exibida antes do play                                             |

A transcrição exibida na página fica em `LANDING_VIDEO_TRANSCRIPT` (`apps/web/src/data/landingContent.ts`) e deve acompanhar o áudio publicado.

## Projeto-fonte

Projeto HyperFrames fora deste repositório: `../videos/srl-canvas-lp/` (`STORYBOARD.md`, `SCRIPT.md`, `compositions/`). Renders completos em `renders/`, incluindo `video-legendado-1.25x.mp4` (legendas na imagem, para redes sociais) e `video-lp-1.25x.mp4`; os arquivos sem sufixo são o render 1× de 96 s.

## Roteiro final (11 cenas)

| #   | Cena                                      | Narração                                                                                                                                                                                           |
| --- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A pergunta                                | Sua startup está realmente pronta... para crescer?                                                                                                                                                 |
| 2   | Ritmos diferentes                         | Talvez o produto esteja avançado. Mas e o caixa? E os clientes? E a governança?                                                                                                                    |
| 3   | Caso fictício 7 × 2                       | Imagine um caso fictício: produto no nível sete; governança no nível dois. O negócio evolui em ritmos diferentes, e o próximo obstáculo pode estar onde você ainda não olhou.                      |
| 4   | Marca                                     | O SRL Canvas ajuda você a enxergar o negócio inteiro.                                                                                                                                              |
| 5   | 12 dimensões (tela real, dados fictícios) | São doze dimensões de maturidade, do problema do cliente à governança, cada uma em nove níveis.                                                                                                    |
| 6   | Critérios e evidências (tela real)        | Em cada uma, você consulta os critérios, escolhe o nível e registra a evidência que sustenta a nota.                                                                                               |
| 7   | Radar e resumo por bloco (tela real)      | O radar revela o formato da sua startup e onde estão as lacunas. E o resumo por bloco orienta o que investigar.                                                                                    |
| 8   | Também no papel (PDFs oficiais)           | Prefere aplicar no papel? Baixe gratuitamente o Canvas, o Radar e o Guia de aplicação em PDF, e aplique manualmente com sua equipe.                                                                |
| 9   | A decisão é sua                           | Com sua equipe ou mentor, vocês discutem prioridades e escolhem os próximos testes. O diagnóstico orienta a conversa; a decisão continua humana.                                                   |
| 10  | Da pesquisa à prática                     | O método nasceu de uma pesquisa de mestrado no PROFNIT, no IFMS, com conteúdo validado por quinze especialistas. Ele não prevê sucesso nem calcula valuation: ele dá clareza para o próximo passo. |
| 11  | CTA                                       | Antes de acelerar, entenda onde você está. Acesse srlcanvas.com e comece seu diagnóstico.                                                                                                          |

## Regras mantidas

- Todos os exemplos rotulados como fictícios; telas gravadas do app em modo local com a startup fictícia "Clínica Ágil".
- Só recursos confirmados da plataforma; nenhuma recomendação automática simulada.
- "Validação de conteúdo" por 15 especialistas (Delphi, 2 rodadas); sem prometer previsão de sucesso ou valuation.
- Sem autoplay; legendas e transcrição disponíveis; contraste WCAG AA verificado em todos os textos do vídeo.
- Ao alterar a narração ou a plataforma gravada, revalidar as afirmações e renderizar de novo.
