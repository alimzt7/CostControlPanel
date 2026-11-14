import type { CSSProperties } from "react";

export type IconName =
  | "down-arrow"
  | "up-arrow"
  | "increase"
  | "back"
  | "forward"
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
  | "sales"
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
  | "history"
  | "payroll"
  | "paid"
  | "welcome"
  | "choose";

const iconAssets: Partial<Record<IconName, string>> = {
  "down-arrow": "down-arrow.svg",
  "up-arrow": "up-arrow.svg",
  increase: "increase.svg",
  back: "left-arrow.svg",
  forward: "right-arrow.svg",
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
  sales: "sales.svg",
  supply: "supply.svg",
  rent: "rent.svg",
  more: "more.svg",
  add: "add.svg",
  close: "close.svg",
  calendar: "calendar.svg",
  history: "history.svg",
  payroll: "payroll.svg",
  paid: "paid.svg",
  choose: "paid.svg",
};

const iconGlyphs: Record<Exclude<IconName, "down-arrow">, string> = {
  "up-arrow": "↑",
  increase: "↗",
  back: "←",
  forward: "→",
  previous: "‹",
  next: "›",
  dashboard: "▦",
  products: "◉",
  ingredients: "◈",
  orders: "▤",
  expenses: "◈",
  staff: "♙",
  reports: "▥",
  settings: "⚙",
  help: "؟",
  notifications: "♧",
  revenue: "↗",
  profit: "◈",
  cost: "◉",
  sales: "▤",
  sandwich: "🥪",
  burger: "🍔",
  salad: "🥗",
  pasta: "🍝",
  supply: "▧",
  rent: "⌂",
  more: "•••",
  add: "＋",
  close: "×",
  calendar: "▦",
  history: "▤",
  payroll: "▤",
  paid: "✓",
  welcome: "👋",
  choose: "←",
};

export default function Icons({
  name = "down-arrow",
  className,
}: {
  name?: IconName;
  className?: string;
}) {
  const asset = iconAssets[name];
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

  if (name === "down-arrow") {
    return (
      <svg
        aria-hidden="true"
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <use href="/down-arrow.svg#down-arrow" />
      </svg>
    );
  }

  return (
    <span aria-hidden="true" className={className}>
      {iconGlyphs[name]}
    </span>
  );
}
