import type { CSSProperties } from "react";

export type IconName =
  | "down-arrow"
  | "up-arrow"
  | "increase"
  | "back"
  | "previous"
  | "next"
  | "dashboard"
  | "products"
  | "ingredients"
  | "orders"
  | "expenses"
  | "staff"
  | "reports"
  | "settings"
  | "help"
  | "notifications"
  | "revenue"
  | "profit"
  | "cost"
  | "sandwich"
  | "burger"
  | "salad"
  | "pasta"
  | "supply"
  | "rent"
  | "more"
  | "add"
  | "close"
  | "calendar"
  | "payroll"
  | "paid"
  | "welcome"
  | "choose";

const iconAssets = {
  "down-arrow": "down-arrow.svg",
  "up-arrow": "up-arrow.svg",
  increase: "increase.svg",
  back: "left-arrow.svg",
  previous: "left-chevron.svg",
  next: "right-chevron.svg",
  dashboard: "dashboard.svg",
  products: "products.svg",
  ingredients: "ingredients.svg",
  orders: "orders.svg",
  expenses: "expenses.svg",
  staff: "staff.svg",
  reports: "reports.svg",
  settings: "settings.svg",
  help: "help.svg",
  notifications: "notifications.svg",
  revenue: "sales.svg",
  profit: "increase.svg",
  cost: "cost.svg",
  supply: "supply.svg",
  rent: "rent.svg",
  more: "more.svg",
  add: "add.svg",
  close: "close.svg",
  calendar: "calendar.svg",
  payroll: "payroll.svg",
  paid: "paid.svg",
  choose: "paid.svg",
} satisfies Partial<Record<IconName, string>>;

type GlyphIconName = Exclude<IconName, keyof typeof iconAssets>;

const iconGlyphs: Record<GlyphIconName, string> = {
  sandwich: "🥪",
  burger: "🍔",
  salad: "🥗",
  pasta: "🍝",
  welcome: "👋",
};

export default function Icons({
  name = "down-arrow",
  className,
}: {
  name?: IconName;
  className?: string;
}) {
  const asset = iconAssets[name as keyof typeof iconAssets];
  if (asset) {
    return (
      <span aria-hidden="true" className={className}>
        <span
          className="icon-mask"
          style={{ "--icon-mask": `url("/icons/${asset}")` } as CSSProperties}
        />
      </span>
    );
  }

  return (
    <span aria-hidden="true" className={className}>
      {iconGlyphs[name as GlyphIconName]}
    </span>
  );
}
