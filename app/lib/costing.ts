export type PurchaseUnit = "kg" | "g" | "l" | "ml" | "count";
export type BaseUnit = "g" | "ml" | "count";
export const ingredientCategories = [
  "سبزیجات و صیفی‌جات",
  "گوشت و پروتئین",
  "لبنیات و پنیر",
  "نان و غلات",
  "سس و چاشنی",
  "نوشیدنی",
  "سایر",
] as const;
export type IngredientCategory = (typeof ingredientCategories)[number];

export type IngredientPrice = {
  date: string;
  purchaseQuantity: number;
  purchaseUnit: PurchaseUnit;
  purchasePrice: number;
};

export type Ingredient = {
  id: string;
  name: string;
  purchaseQuantity: number;
  purchaseUnit: PurchaseUnit;
  purchasePrice: number;
  category?: IngredientCategory;
  priceHistory?: IngredientPrice[];
};

export type RecipeLine = { ingredientId: string; quantity: number };

export type Product = {
  id: string;
  name: string;
  sellingPrice: number;
  recipe: RecipeLine[];
};

export const INGREDIENTS_KEY = "hesabchi.ingredients.v1";
export const PRODUCTS_KEY = "hesabchi.products.v1";

export const purchaseUnits: { value: PurchaseUnit; label: string }[] = [
  { value: "kg", label: "کیلوگرم" },
  { value: "g", label: "گرم" },
  { value: "l", label: "لیتر" },
  { value: "ml", label: "میلی‌لیتر" },
  { value: "count", label: "عدد" },
];

export const initialIngredients: Ingredient[] = [
  { id: "chicken", name: "فیله مرغ", category: "گوشت و پروتئین", purchaseQuantity: 1, purchaseUnit: "kg", purchasePrice: 520000 },
  { id: "bread", name: "نان ساندویچی", category: "نان و غلات", purchaseQuantity: 10, purchaseUnit: "count", purchasePrice: 240000 },
  { id: "cheese", name: "پنیر ورقه‌ای", category: "لبنیات و پنیر", purchaseQuantity: 1, purchaseUnit: "kg", purchasePrice: 420000 },
  { id: "sauce", name: "سس مخصوص", category: "سس و چاشنی", purchaseQuantity: 1, purchaseUnit: "kg", purchasePrice: 180000 },
  { id: "lettuce", name: "کاهو", category: "سبزیجات و صیفی‌جات", purchaseQuantity: 1, purchaseUnit: "kg", purchasePrice: 120000 },
  { id: "tomato", name: "گوجه‌فرنگی", category: "سبزیجات و صیفی‌جات", purchaseQuantity: 1, purchaseUnit: "kg", purchasePrice: 50000 },
];

export const initialProducts: Product[] = [
  {
    id: "grilled-chicken-sandwich",
    name: "ساندویچ مرغ گریل",
    sellingPrice: 320000,
    recipe: [
      { ingredientId: "chicken", quantity: 160 },
      { ingredientId: "bread", quantity: 1 },
      { ingredientId: "cheese", quantity: 30 },
      { ingredientId: "sauce", quantity: 25 },
      { ingredientId: "tomato", quantity: 100 },
    ],
  },
];

export function migrateDemoTomato(ingredients: Ingredient[], products: Product[]) {
  const tomato = ingredients.find(
    (ingredient) => ingredient.id === "tomato" || ingredient.name.includes("گوجه"),
  );
  if (tomato) return { ingredients, products };

  const isExistingDemo =
    ["chicken", "bread", "cheese", "sauce"].every((id) =>
      ingredients.some((ingredient) => ingredient.id === id),
    ) && products.some((product) => product.id === "grilled-chicken-sandwich");
  if (!isExistingDemo) return { ingredients, products };

  const seedTomato = initialIngredients.find((ingredient) => ingredient.id === "tomato");
  if (!seedTomato) return { ingredients, products };
  return {
    ingredients: [...ingredients, seedTomato],
    products: products.map((product) =>
      product.id === "grilled-chicken-sandwich"
        ? { ...product, recipe: [...product.recipe, { ingredientId: seedTomato.id, quantity: 100 }] }
        : product,
    ),
  };
}

export const numberFormat = new Intl.NumberFormat("fa-IR");
export const formatMoney = (value: number) =>
  `${numberFormat.format(Math.round(value))} تومان`;

export const baseUnit = (unit: PurchaseUnit): BaseUnit => {
  if (unit === "kg" || unit === "g") return "g";
  if (unit === "l" || unit === "ml") return "ml";
  return "count";
};

export const toBaseQuantity = (quantity: number, unit: PurchaseUnit) =>
  unit === "kg" || unit === "l" ? quantity * 1000 : quantity;

export const baseUnitLabel = (unit: BaseUnit) =>
  unit === "g" ? "گرم" : unit === "ml" ? "میلی‌لیتر" : "عدد";

export const unitPrice = (ingredient: Ingredient) =>
  ingredient.purchasePrice /
  toBaseQuantity(ingredient.purchaseQuantity, ingredient.purchaseUnit);

export const historicalUnitPrice = (entry: IngredientPrice) =>
  entry.purchasePrice / toBaseQuantity(entry.purchaseQuantity, entry.purchaseUnit);

export function recipeCost(recipe: RecipeLine[], ingredients: Ingredient[]) {
  const byId = new Map<string, Ingredient>(
    ingredients.map((ingredient) => [ingredient.id, ingredient]),
  );
  return recipe.reduce((total, line) => {
    const ingredient = byId.get(line.ingredientId);
    return ingredient ? total + line.quantity * unitPrice(ingredient) : total;
  }, 0);
}

export function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
