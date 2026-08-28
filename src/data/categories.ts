import { Category } from "@/lib/types";

export const categories: Category[] = [
  {
    key: "decoracao",
    label: "Decoração",
    description: "Peças escultóricas, vasos e objetos para dar caráter a qualquer espaço.",
  },
  {
    key: "utilidades",
    label: "Utilidades",
    description: "Organização e funcionalidade para a casa e o escritório, com bom design.",
  },
  {
    key: "gadgets",
    label: "Gadgets",
    description: "Acessórios práticos para o dia a dia digital — suportes, grips e organizadores.",
  },
  {
    key: "personalizados",
    label: "Personalizados",
    description: "Peças únicas, feitas à tua medida: nomes, datas e mensagens especiais.",
  },
];

export function getCategory(key: string) {
  return categories.find((c) => c.key === key);
}
