-- Guedias — dados de exemplo (categorias + 18 produtos fictícios)
-- Corre depois de schema.sql, no SQL Editor do Supabase.

insert into categories (key, label, description) values
  ('decoracao', 'Decoração', 'Peças escultóricas, vasos e objetos para dar caráter a qualquer espaço.'),
  ('utilidades', 'Utilidades', 'Organização e funcionalidade para a casa e o escritório, com bom design.'),
  ('gadgets', 'Gadgets', 'Acessórios práticos para o dia a dia digital — suportes, grips e organizadores.'),
  ('personalizados', 'Personalizados', 'Peças únicas, feitas à tua medida: nomes, datas e mensagens especiais.')
on conflict (key) do update set label = excluded.label, description = excluded.description;

insert into products (
  slug, name, category_key, price_cents, short_description, description, details,
  materials, colors, customizable, customization_label, customization_note,
  profile, print_time_hours, dimensions, featured, tags
) values
(
  'vaso-geometrico-facetado', 'Vaso Geométrico "Facetado"', 'decoracao', 2490,
  'Vaso de linhas facetadas, impresso em espiral para um acabamento contínuo.',
  'O vaso "Facetado" nasce de um modelo 3D com faces geométricas que captam a luz de forma diferente ao longo do dia. É impresso em modo vase (parede única contínua), o que lhe dá um acabamento sem emendas visíveis. Ideal para flores secas, ramos ou plantas artificiais — não é à prova de água por dentro, por isso recomendamos usar com vaso interior ou plantas sem rega direta.',
  ARRAY['Impressão em espiral (vase mode), parede de 1.2 mm', 'Altura aprox. 18 cm, base 10 cm', 'Não recomendado para água diretamente — usar copo interior', 'Leve e resistente a impactos ligeiros'],
  ARRAY['PLA Silk', 'PLA Mate'],
  '[{"name":"Terracota","hex":"#C0663E"},{"name":"Verde-sálvia","hex":"#8A9A78"},{"name":"Branco","hex":"#F4F1EA"}]'::jsonb,
  false, null, null,
  ARRAY[0.34,0.48,0.62,0.78,0.88,0.8,0.62,0.46,0.55,0.66]::numeric[],
  6, '18 × 10 × 10 cm', true, ARRAY['vaso','sala','flores']
),
(
  'porta-velas-lua', 'Porta-velas "Lua"', 'decoracao', 1490,
  'Suporte para vela em formato orgânico inspirado nas fases lunares.',
  'Um porta-velas minimalista com uma abertura em crescente que projeta sombras suaves quando a vela está acesa. Encaixa velas de chá ou velas cilíndricas até 6 cm de diâmetro. Cada peça é impressa camada a camada em PLA mate, com um acabamento fosco muito agradável ao toque.',
  ARRAY['Compatível com velas até Ø 6 cm', 'Altura 9 cm', 'Acabamento fosco anti-impressão digital', 'Usar sempre sobre superfície resistente ao calor'],
  ARRAY['PLA Mate'],
  '[{"name":"Branco","hex":"#F4F1EA"},{"name":"Preto","hex":"#232320"},{"name":"Cinza Grafite","hex":"#54534D"}]'::jsonb,
  false, null, null,
  ARRAY[0.5,0.7,0.85,0.7,0.5]::numeric[],
  3, '9 × 9 × 9 cm', false, ARRAY['velas','sala','ambiente']
),
(
  'escultura-abstrata-fluxo', 'Escultura Abstrata "Fluxo"', 'decoracao', 3200,
  'Peça escultórica de curvas contínuas, imprimível apenas em 3D.',
  '"Fluxo" explora formas que seriam impossíveis de moldar por processos tradicionais — curvas contínuas geradas por algoritmo e impressas camada a camada. Funciona como peça de destaque numa estante ou mesa de centro. Uma demonstração de como a impressão 3D permite geometrias verdadeiramente livres.',
  ARRAY['Impressão em PLA Silk de alto brilho', 'Peça sólida a 25% de enchimento para estabilidade', 'Base plana antiderrapante', 'Peça de coleção — tiragem por encomenda'],
  ARRAY['PLA Silk'],
  '[{"name":"Azul-petróleo","hex":"#2C5F63"},{"name":"Terracota","hex":"#C0663E"}]'::jsonb,
  false, null, null,
  ARRAY[0.3,0.5,0.35,0.6,0.4,0.65,0.45]::numeric[],
  8, '22 × 12 × 12 cm', true, ARRAY['escultura','destaque']
),
(
  'relogio-parede-camadas', 'Relógio de Parede "Camadas"', 'decoracao', 3990,
  'Relógio de parede com mostrador em relevo e mecanismo silencioso.',
  'O mostrador deste relógio é construído a partir de anéis concêntricos impressos em camadas de altura crescente, criando um relevo tátil em vez de números impressos. Vem com mecanismo de quartzo silencioso (sem tic-tac) incluído, pronto a pendurar.',
  ARRAY['Mecanismo de quartzo silent sweep incluído', 'Diâmetro 28 cm', 'Funciona com 1 pilha AA (não incluída)', 'Gancho de parede integrado na peça'],
  ARRAY['PLA', 'PLA Madeira'],
  '[{"name":"Natural","hex":"#E3DCCB"},{"name":"Preto","hex":"#232320"}]'::jsonb,
  false, null, null,
  ARRAY[0.9,0.75,0.6,0.75,0.9]::numeric[],
  10, '28 × 28 × 3 cm', false, ARRAY['relógio','parede']
),
(
  'jarra-ondulada-onda', 'Jarra Ondulada "Onda"', 'decoracao', 2750,
  'Jarra de perfil ondulado, impressa em filamento sedoso.',
  'Superfície ondulada que brinca com a luz graças ao acabamento sedoso do filamento PLA Silk. Boa companhia para flores frescas com copo interior de vidro, ou para composições secas diretamente no interior da peça.',
  ARRAY['Impressão em espiral, sem costuras visíveis', 'Recomendado copo de vidro interior para flores frescas', 'Acabamento brilhante sedoso'],
  ARRAY['PLA Silk'],
  '[{"name":"Rosa-pastel","hex":"#E8B4BC"},{"name":"Azul-petróleo","hex":"#2C5F63"},{"name":"Branco","hex":"#F4F1EA"}]'::jsonb,
  false, null, null,
  ARRAY[0.4,0.6,0.45,0.68,0.5,0.72,0.58]::numeric[],
  7, '20 × 11 × 11 cm', false, ARRAY['vaso','flores']
),
(
  'organizador-secretaria-modular', 'Organizador de Secretária Modular', 'utilidades', 1990,
  'Sistema de compartimentos encaixáveis para arrumar a secretária.',
  'Módulos independentes que encaixam entre si para criares a configuração ideal para canetas, clipes, cartões e pequenos acessórios. Compra quantos módulos precisares e reorganiza sempre que quiseres — o sistema de encaixe é universal em toda a coleção Guedias.',
  ARRAY['Módulos com sistema de encaixe universal', 'Base antiderrapante em silicone (incluída)', 'Resistente a uso diário intensivo (PETG)', 'Compatível com outros módulos da coleção'],
  ARRAY['PETG', 'PLA'],
  '[{"name":"Cinza Grafite","hex":"#54534D"},{"name":"Preto","hex":"#232320"},{"name":"Branco","hex":"#F4F1EA"}]'::jsonb,
  false, null, null,
  ARRAY[0.85,0.85,0.85,0.85,0.85]::numeric[],
  5, '16 × 10 × 6 cm', true, ARRAY['escritório','organização']
),
(
  'cesto-arrumacao-hexagonal', 'Cesto de Arrumação Hexagonal', 'utilidades', 1750,
  'Cesto modular hexagonal para arrumação em qualquer divisão da casa.',
  'Forma hexagonal pensada para encaixar lado a lado com outros cestos, criando painéis de arrumação personalizados na parede ou em prateleira. Perfeito para brinquedos, produtos de casa de banho ou plantas.',
  ARRAY['Encaixa em painel com outros cestos hexagonais', 'Perfurações traseiras para montagem em parede', 'Enchimento reforçado a 30% para maior resistência'],
  ARRAY['PLA'],
  '[{"name":"Verde-sálvia","hex":"#8A9A78"},{"name":"Terracota","hex":"#C0663E"},{"name":"Branco","hex":"#F4F1EA"}]'::jsonb,
  false, null, null,
  ARRAY[0.9,0.88,0.86,0.84,0.82]::numeric[],
  5, '15 × 13 × 13 cm', false, ARRAY['arrumação','modular']
),
(
  'porta-chaves-parede-ramo', 'Porta-chaves de Parede "Ramo"', 'utilidades', 1290,
  'Suporte de parede em forma de ramo, com 5 ganchos.',
  'Um pequeno ramo estilizado com cinco ganchos para chaves, trelas ou acessórios de entrada. Vem com parafusos e buchas para montagem direta na parede.',
  ARRAY['5 ganchos, suporta até 300 g por gancho', 'Kit de montagem incluído (parafusos + buchas)', 'Acabamento em PLA Madeira para textura natural'],
  ARRAY['PLA', 'PLA Madeira'],
  '[{"name":"Preto","hex":"#232320"},{"name":"Madeira","hex":"#9C7A54"}]'::jsonb,
  false, null, null,
  ARRAY[0.35,0.25,0.4,0.25,0.45]::numeric[],
  3, '24 × 8 × 3 cm', false, ARRAY['entrada','parede']
),
(
  'suporte-escovas-dentes', 'Suporte para Escovas de Dentes', 'utilidades', 990,
  'Suporte de casa de banho com 4 encaixes individuais e tabuleiro de drenagem.',
  'Quatro encaixes individuais mantêm as escovas separadas e a secar corretamente, com um pequeno tabuleiro na base para recolher pingos de água. Design compacto para bancadas pequenas.',
  ARRAY['4 encaixes individuais + espaço para pasta de dentes', 'Tabuleiro amovível para limpeza fácil', 'Material resistente à humidade (PETG)'],
  ARRAY['PLA', 'PETG'],
  '[{"name":"Branco","hex":"#F4F1EA"},{"name":"Azul-petróleo","hex":"#2C5F63"}]'::jsonb,
  false, null, null,
  ARRAY[0.4,0.3,0.3,0.3,0.4]::numeric[],
  2, '12 × 8 × 10 cm', false, ARRAY['casa de banho']
),
(
  'suporte-talheres-modular', 'Suporte de Talheres Modular', 'utilidades', 1590,
  'Divisórias amovíveis para organizar a gaveta de talheres.',
  'Compartimentos amovíveis que se ajustam ao tamanho da tua gaveta. Cada divisória é impressa separadamente, permitindo comprar apenas as unidades necessárias para preencher o espaço disponível.',
  ARRAY['Divisórias amovíveis e reconfiguráveis', 'Cantos arredondados para fácil limpeza', 'Vendido em conjunto de 4 módulos'],
  ARRAY['PETG'],
  '[{"name":"Cinza Grafite","hex":"#54534D"},{"name":"Branco","hex":"#F4F1EA"}]'::jsonb,
  false, null, null,
  ARRAY[0.9,0.9,0.9,0.9]::numeric[],
  4, '20 × 6 × 5 cm (por módulo)', false, ARRAY['cozinha','organização']
),
(
  'suporte-auscultadores-arco', 'Suporte para Auscultadores "Arco"', 'gadgets', 2190,
  'Suporte de secretária em arco para pendurar auscultadores com estilo.',
  'Estrutura em arco pensada para proteger a almofada dos auscultadores enquanto os mantém à mão. A base alargada garante estabilidade mesmo com auscultadores mais pesados, e o interior integra um pequeno tabuleiro para pen drives ou cabos pequenos.',
  ARRAY['Base com tabuleiro integrado para acessórios', 'Suporta auscultadores até 400 g', 'Impresso em PETG para maior durabilidade'],
  ARRAY['PETG', 'PLA'],
  '[{"name":"Preto","hex":"#232320"},{"name":"Cinza Grafite","hex":"#54534D"}]'::jsonb,
  false, null, null,
  ARRAY[0.9,0.35,0.3,0.3,0.35,0.9]::numeric[],
  6, '22 × 12 × 10 cm', true, ARRAY['secretária','audio']
),
(
  'grip-suporte-telemovel', 'Grip & Suporte para Telemóvel', 'gadgets', 890,
  'Acessório flexível que funciona como grip e suporte dobrável.',
  'Impresso em TPU flexível, este pequeno acessório colapsa quando não está em uso e desdobra-se em segundos para servir de pega ou suporte de mesa em modo retrato ou paisagem. Fixa-se com adesivo 3M reposicionável (incluído).',
  ARRAY['Material flexível TPU, dobra até 180°', 'Adesivo 3M reposicionável incluído', 'Compatível com a maioria das capas finas'],
  ARRAY['TPU', 'PLA'],
  '[{"name":"Preto","hex":"#232320"},{"name":"Branco","hex":"#F4F1EA"},{"name":"Rosa-pastel","hex":"#E8B4BC"}]'::jsonb,
  false, null, null,
  ARRAY[0.3,0.75,0.95]::numeric[],
  1, '4 × 4 × 1 cm', false, ARRAY['telemóvel','acessório']
),
(
  'organizador-cabos-onda', 'Organizador de Cabos "Onda" (pack 4)', 'gadgets', 1190,
  'Clipes flexíveis para organizar cabos na secretária.',
  'Conjunto de 4 clipes em TPU flexível que se prendem ao rebordo da secretária ou mesa, mantendo cabos de carregamento sempre à mão e sem emaranhar. Cada clipe acomoda até 3 cabos finos.',
  ARRAY['Pack com 4 unidades', 'Material flexível resistente à fadiga', 'Fixação sem parafusos, encaixe por pressão'],
  ARRAY['TPU'],
  '[{"name":"Preto","hex":"#232320"},{"name":"Branco","hex":"#F4F1EA"}]'::jsonb,
  false, null, null,
  ARRAY[0.3,0.6,0.3,0.6,0.3]::numeric[],
  2, '6 × 3 × 2 cm (por clipe)', false, ARRAY['cabos','secretária']
),
(
  'stand-ajustavel-portatil', 'Stand Ajustável para Portátil', 'gadgets', 3490,
  'Suporte robusto com 4 alturas ajustáveis para melhorar a ergonomia.',
  'Eleva o teu portátil para uma altura de visualização mais ergonómica, com 4 posições de inclinação. A estrutura vazada favorece a ventilação do equipamento durante uso prolongado. Impresso em PETG de alta resistência para suportar o peso com segurança.',
  ARRAY['4 posições de altura/inclinação', 'Suporta portáteis até 15" e 3 kg', 'Estrutura vazada para ventilação', 'Pés com almofada de silicone antiderrapante'],
  ARRAY['PETG'],
  '[{"name":"Cinza Grafite","hex":"#54534D"},{"name":"Preto","hex":"#232320"}]'::jsonb,
  false, null, null,
  ARRAY[0.9,0.3,0.9,0.3]::numeric[],
  9, '26 × 24 × 15 cm', false, ARRAY['portátil','ergonomia']
),
(
  'chaveiro-personalizado-nome', 'Chaveiro Personalizado com Nome', 'personalizados', 790,
  'Chaveiro gravado com o nome ou palavra à tua escolha.',
  'Cada chaveiro é gerado a partir do texto que nos indicares, com tipografia desenhada especialmente para impressão em relevo. Um presente pequeno mas muito pessoal — perfeito para prendas, lembranças de festas ou identificação de mochilas.',
  ARRAY['Anel metálico incluído', 'Texto em relevo, legível ao toque', 'Produção sob encomenda em 2-3 dias úteis'],
  ARRAY['PLA'],
  '[{"name":"Preto","hex":"#232320"},{"name":"Branco","hex":"#F4F1EA"},{"name":"Terracota","hex":"#C0663E"},{"name":"Azul-petróleo","hex":"#2C5F63"},{"name":"Rosa-pastel","hex":"#E8B4BC"}]'::jsonb,
  true, 'Nome ou texto (máx. 12 caracteres)', 'Indica o nome ou palavra a gravar. Máximo 12 caracteres, sem acentos.',
  ARRAY[0.4,0.6,0.6,0.4]::numeric[],
  1, '8 × 3 × 0.5 cm', true, ARRAY['presente','personalizado']
),
(
  'placa-porta-personalizada', 'Placa de Porta Personalizada', 'personalizados', 1390,
  'Placa com nome à porta, em relevo elegante.',
  'Identifica o quarto ou espaço com uma placa personalizada em relevo minimalista. Vem com fita 3M dupla face para montagem sem furos, ou orifícios opcionais para parafuso.',
  ARRAY['Fita 3M dupla face incluída', 'Orifícios de montagem opcionais (indicar nas notas)', 'Produção sob encomenda em 2-3 dias úteis'],
  ARRAY['PLA Mate'],
  '[{"name":"Branco","hex":"#F4F1EA"},{"name":"Preto","hex":"#232320"},{"name":"Terracota","hex":"#C0663E"}]'::jsonb,
  true, 'Nome a gravar', 'Indica o nome exato a gravar na placa, tal como deve aparecer.',
  ARRAY[0.95,0.95]::numeric[],
  3, '15 × 5 × 0.5 cm', false, ARRAY['presente','casa']
),
(
  'topo-bolo-personalizado', 'Topo de Bolo Personalizado', 'personalizados', 1090,
  'Topo de bolo com nome, idade ou mensagem à tua escolha.',
  'Transforma qualquer bolo numa peça única com um topo personalizado com o texto que quiseres — nome, idade, ou uma mensagem curta. Impresso em filamento sedoso para um brilho festivo.',
  ARRAY['Vareta incluída, altura ajustável', 'Uso decorativo — não deve entrar em contacto direto com alimentos', 'Produção sob encomenda em 2-3 dias úteis'],
  ARRAY['PLA Silk'],
  '[{"name":"Rosa-pastel","hex":"#E8B4BC"},{"name":"Amarelo-mostarda","hex":"#D9A441"},{"name":"Branco","hex":"#F4F1EA"}]'::jsonb,
  true, 'Texto do topo (máx. 15 caracteres)', 'Indica o texto, nome ou idade a incluir no topo de bolo.',
  ARRAY[0.3,0.5,0.7,0.5,0.35,0.6]::numeric[],
  2, '12 × 10 × 0.4 cm', false, ARRAY['festa','presente']
),
(
  'miniatura-personalizada-avatar', 'Miniatura Personalizada "Avatar Mini"', 'personalizados', 2990,
  'Miniatura estilizada inspirada em ti, a partir de uma foto de referência.',
  'Depois da encomenda, enviamos-te um email a pedir uma foto de referência. A nossa equipa modela uma miniatura estilizada (não fotorrealista) inspirada nessa foto, pronta a imprimir em PLA natural. Ótimo presente para aniversários, casamentos ou lembrança de equipa.',
  ARRAY['Foto de referência pedida por email após a compra', 'Estilo estilizado low-poly, altura 10 cm', 'Pintura à mão disponível mediante consulta', 'Produção sob encomenda: 5-7 dias úteis'],
  ARRAY['PLA'],
  '[{"name":"Natural","hex":"#E3DCCB"}]'::jsonb,
  true, 'Notas para a miniatura', 'Descreve brevemente o que queres destacar (roupa, acessório, pose). A foto é pedida depois por email.',
  ARRAY[0.3,0.5,0.7,0.5,0.35,0.6,0.4]::numeric[],
  8, '6 × 6 × 10 cm', false, ARRAY['presente','miniatura']
)
on conflict (slug) do update set
  name = excluded.name,
  category_key = excluded.category_key,
  price_cents = excluded.price_cents,
  short_description = excluded.short_description,
  description = excluded.description,
  details = excluded.details,
  materials = excluded.materials,
  colors = excluded.colors,
  customizable = excluded.customizable,
  customization_label = excluded.customization_label,
  customization_note = excluded.customization_note,
  profile = excluded.profile,
  print_time_hours = excluded.print_time_hours,
  dimensions = excluded.dimensions,
  featured = excluded.featured,
  tags = excluded.tags;
