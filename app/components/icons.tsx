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
