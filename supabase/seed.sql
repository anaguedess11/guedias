-- Gu3Dias: categorias da loja. Os produtos criam-se em /admin/produtos.
-- Corre depois de schema.sql, no SQL Editor do Supabase.

insert into categories (key, label, description) values
  ('decoracao', 'Decoração', 'Peças escultóricas, vasos e objetos para dar caráter a qualquer espaço.'),
  ('utilidades', 'Utilidades', 'Organização e funcionalidade para a casa e o escritório, com bom design.'),
  ('gadgets', 'Gadgets', 'Acessórios práticos para o dia a dia digital — suportes, grips e organizadores.'),
  ('personalizados', 'Personalizados', 'Peças únicas, feitas à tua medida: nomes, datas e mensagens especiais.')
on conflict (key) do update set label = excluded.label, description = excluded.description;
