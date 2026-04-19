import copo300 from "@/assets/copo-300.jpg";
import copo400 from "@/assets/copo-400.jpg";
import copo500 from "@/assets/copo-500.jpg";
import copo700 from "@/assets/copo-700.jpg";
import copo1kg from "@/assets/copo-1kg.jpg";
import milkshake from "@/assets/milkshake.jpg";

export type AddOn = {
  id: string;
  name: string;
  price: number;
};

export type AddOnGroup = {
  id: string;
  title: string;
  description?: string;
  required?: boolean;
  min?: number;
  max: number;
  items: AddOn[];
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  badge?: string;
  groups: AddOnGroup[];
};

export type Category = {
  id: string;
  title: string;
  emoji: string;
  items: MenuItem[];
};

const frutasGroup = (max: number, included: number): AddOnGroup => ({
  id: "frutas",
  title: `Frutas (até ${max})`,
  description: included > 0 ? `${included} frutas inclusas. Adicionais R$ 2,00 cada.` : `R$ 2,00 cada.`,
  max,
  items: [
    { id: "banana", name: "Banana", price: 0 },
    { id: "morango", name: "Morango", price: 0 },
    { id: "kiwi", name: "Kiwi", price: 0 },
    { id: "uva", name: "Uva", price: 0 },
    { id: "manga", name: "Manga", price: 0 },
    { id: "abacaxi", name: "Abacaxi", price: 0 },
  ],
});

const complementosGroup = (max: number): AddOnGroup => ({
  id: "complementos",
  title: `Complementos (até ${max})`,
  description: "Escolha seus favoritos, grátis.",
  max,
  items: [
    { id: "granola", name: "Granola", price: 0 },
    { id: "leite-po", name: "Leite em pó", price: 0 },
    { id: "leite-cond", name: "Leite condensado", price: 0 },
    { id: "ovomaltine", name: "Ovomaltine", price: 0 },
    { id: "paco", name: "Paçoca", price: 0 },
    { id: "amendoim", name: "Amendoim", price: 0 },
    { id: "coco", name: "Coco ralado", price: 0 },
    { id: "ms", name: "Confete M&M", price: 0 },
  ],
});

const premiumGroup: AddOnGroup = {
  id: "premium",
  title: "Adicionais premium",
  description: "Turbine seu açaí (opcional).",
  max: 5,
  items: [
    { id: "nutella", name: "Nutella", price: 4.0 },
    { id: "morango-extra", name: "Morango extra", price: 3.0 },
    { id: "oreo", name: "Oreo triturado", price: 3.5 },
    { id: "kitkat", name: "KitKat", price: 4.0 },
    { id: "chantilly", name: "Chantilly", price: 2.5 },
    { id: "sorvete", name: "Bola de sorvete", price: 5.0 },
  ],
};

const caldasGroup: AddOnGroup = {
  id: "caldas",
  title: "Caldas (até 2)",
  description: "Grátis. Escolha até 2.",
  max: 2,
  items: [
    { id: "caramelo", name: "Caramelo", price: 0 },
    { id: "chocolate", name: "Chocolate", price: 0 },
    { id: "morango-c", name: "Morango", price: 0 },
    { id: "maracuja", name: "Maracujá", price: 0 },
  ],
};

export const categories: Category[] = [
  {
    id: "copos",
    title: "Escolha seu copo",
    emoji: "💜",
    items: [
      {
        id: "copo-300",
        name: "Copo 300ml",
        description: "Açaí cremoso + 2 complementos + 1 fruta + 1 calda.",
        price: 14.0,
        image: copo300,
        groups: [frutasGroup(2, 1), complementosGroup(2), caldasGroup, premiumGroup],
      },
      {
        id: "copo-400",
        name: "Copo 400ml",
        description: "Açaí cremoso + 3 complementos + 2 frutas + 2 caldas.",
        price: 16.0,
        image: copo400,
        badge: "Mais pedido",
        groups: [frutasGroup(3, 2), complementosGroup(3), caldasGroup, premiumGroup],
      },
      {
        id: "copo-500",
        name: "Copo 500ml",
        description: "Açaí cremoso + 4 complementos + 2 frutas + 2 caldas.",
        price: 18.0,
        image: copo500,
        groups: [frutasGroup(3, 2), complementosGroup(4), caldasGroup, premiumGroup],
      },
      {
        id: "copo-700",
        name: "Copo 700ml",
        description: "Pra dividir? Açaí + 5 complementos + 3 frutas + 2 caldas.",
        price: 22.0,
        image: copo700,
        groups: [frutasGroup(4, 3), complementosGroup(5), caldasGroup, premiumGroup],
      },
      {
        id: "copo-1kg",
        name: "Copo 1KG",
        description: "Pra família! Açaí + 6 complementos + 4 frutas + 2 caldas.",
        price: 39.99,
        image: copo1kg,
        badge: "Família",
        groups: [frutasGroup(5, 4), complementosGroup(6), caldasGroup, premiumGroup],
      },
    ],
  },
  {
    id: "milkshakes",
    title: "Milkshakes",
    emoji: "🥤",
    items: [
      {
        id: "milk-acai",
        name: "Milkshake de Açaí 500ml",
        description: "Cremoso, com chantilly e calda à escolha.",
        price: 19.9,
        image: milkshake,
        groups: [
          {
            id: "calda-milk",
            title: "Calda (1)",
            required: true,
            min: 1,
            max: 1,
            items: [
              { id: "choc", name: "Chocolate", price: 0 },
              { id: "mor", name: "Morango", price: 0 },
              { id: "car", name: "Caramelo", price: 0 },
            ],
          },
          {
            id: "extra-milk",
            title: "Extras",
            max: 3,
            items: [
              { id: "nut", name: "Nutella", price: 4 },
              { id: "ore", name: "Oreo", price: 3.5 },
              { id: "ch", name: "Chantilly extra", price: 2.5 },
            ],
          },
        ],
      },
    ],
  },
];

export const STORE = {
  name: "Império do Açaí",
  tagline: "O melhor açaí da cidade",
  whatsapp: "5551992027214",
  hours: "14:00 - 01:30",
  rating: 5.0,
  minOrder: 14,
  deliveryFee: 5,
};
