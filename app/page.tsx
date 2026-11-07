import Icons, { type IconName } from "./components/icons";

const stats = [
  {
    label: "فروش این ماه",
    value: "۱۲۸,۴۵۰",
    unit: "هزار تومان",
    icon: "revenue",
    color: "#e8f5ee",
    change: "۱۲٪ رشد",
    note: "نسبت به ماه قبل",
  },
  {
    label: "سود خالص",
    value: "۳۶,۸۲۰",
    unit: "هزار تومان",
    icon: "profit",
    color: "#f0edff",
    change: "۸.۴٪ رشد",
    note: "نسبت به ماه قبل",
  },
  {
    label: "هزینه‌ها",
    value: "۹۱,۶۳۰",
    unit: "هزار تومان",
    icon: "cost",
    color: "#fff1e7",
    change: "۵٪ کاهش",
    note: "نسبت به ماه قبل",
  },
  {
    label: "سفارش‌ها",
    value: "۱,۲۸۴",
    unit: "سفارش",
    icon: "orders",
    color: "#eaf2ff",
    change: "۱۸٪ رشد",
    note: "نسبت به ماه قبل",
  },
 ] as const;

const products = [
  {
    name: "ساندویچ مرغ گریل",
    icon: "sandwich",
    cost: "۱۸۵,۰۰۰",
    price: "۳۲۰,۰۰۰",
    profit: "۴۲٪",
    tag: "پرفروش",
  },
  {
    name: "برگر مخصوص",
    icon: "burger",
    cost: "۲۴۰,۰۰۰",
    price: "۴۲۰,۰۰۰",
    profit: "۴۳٪",
    tag: "پرفروش",
  },
  {
    name: "سالاد سزار",
    icon: "salad",
    cost: "۱۲۸,۰۰۰",
    price: "۲۶۰,۰۰۰",
    profit: "۵۱٪",
    tag: "سود بالا",
  },
  {
    name: "پاستا آلفردو",
    icon: "pasta",
    cost: "۱۶۲,۰۰۰",
    price: "۳۱۰,۰۰۰",
    profit: "۴۸٪",
    tag: "سود بالا",
  },
 ] as const;

const nav = [
  { icon: "dashboard", title: "داشبورد", active: true, href: "/" },
  { icon: "products", title: "محصولات و دستور پخت", active: false, href: "/products" },
  { icon: "ingredients", title: "مواد اولیه", active: false, href: "/materials" },
  { icon: "orders", title: "فروش و سفارش‌ها", active: false, href: "#" },
  { icon: "expenses", title: "هزینه‌ها", active: false, href: "/expenses" },
  { icon: "staff", title: "پرسنل و حقوق", active: false, href: "/staff" },
  { icon: "reports", title: "گزارش‌ها", active: false, href: "#" },
] as const;

function TrendChart() {
  return (
    <div className="chart">
      <div className="chart-y">
        <span>۱۵۰</span>
        <span>۱۰۰</span>
        <span>۵۰</span>
        <span>۰</span>
      </div>
      <svg
        viewBox="0 0 620 190"
        role="img"
        aria-label="نمودار فروش و هزینه ماهانه"
      >
        {[12, 64, 116, 168].map((y) => (
          <line
            key={y}
            x1="0"
            x2="620"
            y1={y}
            y2={y}
            stroke="#f0f2f0"
            strokeDasharray="3 5"
          />
        ))}
        <defs>
          <linearGradient id="salesFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#17845b" stopOpacity=".18" />
            <stop offset="100%" stopColor="#17845b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 139 C36 129 42 102 78 111 S125 120 155 91 S204 99 232 77 S278 91 310 63 S356 81 388 54 S432 70 465 38 S516 56 543 26 S589 44 620 13 L620 178 L0 178Z"
          fill="url(#salesFill)"
        />
        <path
          d="M0 139 C36 129 42 102 78 111 S125 120 155 91 S204 99 232 77 S278 91 310 63 S356 81 388 54 S432 70 465 38 S516 56 543 26 S589 44 620 13"
          fill="none"
          stroke="#17845b"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M0 158 C40 150 52 139 78 145 S120 149 155 130 S199 138 232 118 S278 127 310 109 S354 118 388 98 S430 110 465 85 S511 99 543 73 S585 83 620 62"
          fill="none"
          stroke="#b7e3cf"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle
          cx="543"
          cy="26"
          r="5"
          fill="#17845b"
          stroke="white"
          strokeWidth="3"
        />
      </svg>
      <div className="chart-labels">
        <span>۱ مهر</span>
        <span>۵ مهر</span>
        <span>۱۰ مهر</span>
        <span>۱۵ مهر</span>
        <span>۲۰ مهر</span>
        <span>۲۵ مهر</span>
        <span>۳۰ مهر</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">ح</span>حسابچی
        </div>
        <div className="nav-label">منوی اصلی</div>
        <nav aria-label="منوی اصلی">
          {nav.map(({ icon, title, active, href }) => (
            <a
              className={`nav-link${active ? " active" : ""}`}
              href={href}
              key={title}
            >
              <Icons name={icon} className="nav-icon" />
              <span>{title}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="nav-label">تنظیمات</div>
          <a className="nav-link" href="#">
            <Icons name="settings" className="nav-icon" />
            <span>تنظیمات کسب‌وکار</span>
          </a>
          <a className="nav-link" href="#">
            <Icons name="help" className="nav-icon" />
            <span>راهنما و پشتیبانی</span>
          </a>
          <div className="profile">
            <div className="avatar">م‌ن</div>
            <div className="profile-copy">
              <div className="profile-name">محمد نادری</div>
              <div className="profile-sub">کافه رستوران نارنج</div>
            </div>
            <Icons className="shared-down-arrow profile-chevron" />
          </div>
        </div>
      </aside>
      <main className="main-area min-w-0 flex-1">
        <header className="topbar flex items-center justify-between">
          <div className="welcome">
          <h1>سلام محمد، خوش اومدی <Icons name="welcome" className="welcome-icon" /></h1>
            <p>این گزارش عملکرد کسب‌و‌کارت در آبان ماه ۱۴۰۵ هست.</p>
          </div>
          <div className="top-actions">
            <button className="period-select">
              <Icons name="calendar" /> آبان ۱۴۰۵ <Icons className="shared-down-arrow" />
            </button>
            <button className="icon-button" aria-label="اعلان‌ها">
              <Icons name="notifications" /><i className="notify-dot" />
            </button>
          </div>
        </header>
        <section aria-label="خلاصه عملکرد">
          <div className="section-title">
            <h2>خلاصه عملکرد</h2>
            <a href="#">مشاهده گزارش کامل <Icons name="back" className="inline-icon" /></a>
          </div>
          <div className="stats-grid">
            {stats.map((item) => (
              <article className="stat-card" key={item.label}>
                <div className="stat-top">
                  <span>{item.label}</span>
                  <span
                    className="stat-icon"
                    style={{ background: item.color }}
                  >
                    <Icons name={item.icon} />
                  </span>
                </div>
                <div className="stat-value">
                  {item.value} <small>{item.unit}</small>
                </div>
                <div className="stat-foot">
                  <Icons name="increase" className="trend-icon" /> {item.change} <span>{item.note}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section>
          <div className="section-title">
            <h2>گزارش فروش و هزینه</h2>
            <a href="#">جزئیات بیشتر <Icons name="back" className="inline-icon" /></a>
          </div>
          <div className="content-grid">
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <h3>روند درآمد و هزینه</h3>
                  <p>مقایسه فروش و هزینه‌ها در طول ماه</p>
                </div>
                <div className="chart-legend">
                  <span className="legend-item">
                    <i className="legend-dot" /> فروش
                  </span>
                  <span className="legend-item">
                    <i className="legend-dot light" /> هزینه
                  </span>
                </div>
              </div>
              <TrendChart />
            </article>
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <h3>ترکیب هزینه‌ها</h3>
                  <p>سهم هر بخش از هزینه‌های ماهانه</p>
                </div>
                <Icons name="more" className="more-icon" />
              </div>
              <div className="cost-list">
                {[
                  [
                    "supply",
                    "مواد اولیه",
                    "۴۲٪ از کل هزینه",
                    "۳۸,۴۸۰",
                    "#eaf6f0",
                    "42%",
                    "#17845b",
                  ],
                  [
                    "staff",
                    "حقوق پرسنل",
                    "۲۸٪ از کل هزینه",
                    "۲۵,۶۵۰",
                    "#fff1e7",
                    "28%",
                    "#e99b5c",
                  ],
                  [
                    "rent",
                    "اجاره و قبوض",
                    "۱۸٪ از کل هزینه",
                    "۱۶,۴۹۰",
                    "#f0edff",
                    "18%",
                    "#8f7ee7",
                  ],
                  [
                    "expenses",
                    "سایر هزینه‌ها",
                    "۱۲٪ از کل هزینه",
                    "۱۱,۰۱۰",
                    "#eaf2ff",
                    "12%",
                    "#6496df",
                  ],
                ].map(([icon, name, detail, amount, bg, width, color]) => (
                  <div className="cost-row" key={name}>
                    <span
                      className="cost-symbol"
                      style={{ background: bg, color }}
                    >
                      <Icons name={icon as IconName} />
                    </span>
                    <div>
                      <div className="cost-name">{name}</div>
                      <div className="cost-detail">{detail}</div>
                      <div className="cost-bar">
                        <div
                          className="cost-fill"
                          style={{ width, background: color }}
                        />
                      </div>
                    </div>
                    <span className="cost-amount">{amount}</span>
                  </div>
                ))}
                <div className="cost-total">
                  <span>مجموع هزینه‌ها</span>
                  <strong>۹۱,۶۳۰ هزار تومان</strong>
                </div>
              </div>
            </article>
          </div>
        </section>
        <section>
          <div className="section-title">
            <h2>محصولات پرفروش</h2>
            <a href="/products">مدیریت محصولات <Icons name="back" className="inline-icon" /></a>
          </div>
          <article className="panel table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>نام محصول</th>
                  <th>قیمت تمام‌شده</th>
                  <th>قیمت فروش</th>
                  <th>حاشیه سود</th>
                  <th>وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.name}>
                    <td>
                      <div className="product-cell">
                        <Icons name={product.icon} className="product-emoji" />
                        {product.name}
                      </div>
                    </td>
                    <td>{product.cost} تومان</td>
                    <td>{product.price} تومان</td>
                    <td className="positive">{product.profit}</td>
                    <td>
                      <span className="product-tag">{product.tag}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        </section>
        <section>
          <div className="section-title">
            <h2>دسترسی سریع</h2>
          </div>
          <div className="quick-grid">
            <a
              className="quick-card"
              href="/products#new-product"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <span className="quick-icon"><Icons name="add" /></span>
              <div>
                <strong>افزودن محصول جدید</strong>
                <span>محاسبه قیمت تمام‌شده محصول</span>
              </div>
            </a>
            <a
              className="quick-card"
              href="/materials"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <span
                className="quick-icon"
                style={{ background: "#fff1e7", color: "#d78548" }}
              >
                <Icons name="ingredients" />
              </span>
              <div>
                <strong>مدیریت مواد اولیه</strong>
                <span>ثبت و به‌روزرسانی قیمت مواد</span>
              </div>
            </a>
            <a
              className="quick-card"
              href="#"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <span
                className="quick-icon"
                style={{ background: "#f0edff", color: "#8170d6" }}
              >
                <Icons name="reports" />
              </span>
              <div>
                <strong>گزارش سود و زیان</strong>
                <span>بررسی جزئیات عملکرد مالی</span>
              </div>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
