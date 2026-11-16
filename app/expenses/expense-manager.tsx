"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import Icons from "../components/icons";
import DashboardShortcut from "../components/dashboard-shortcut";
import ShamsiDatePicker from "../components/shamsi-dare-picker";
import { formatMoney, makeId, numberFormat } from "../lib/costing";

const EXPENSES_KEY = "hesabchi.expenses.v1";
const groups = [
  "هزینه ثابت",
  "هزینه جاری",
  "هزینه سربار",
  "حقوق و دستمزد",
] as const;
type ExpenseGroup = (typeof groups)[number];
type Expense = {
  id: string;
  title: string;
  amount: number;
  group: ExpenseGroup;
  category: string;
  date: string;
  recurring: boolean;
  note: string;
};

const categories: Record<ExpenseGroup, string[]> = {
  "هزینه ثابت": ["اجاره", "بیمه", "اشتراک نرم‌افزار", "سایر هزینه ثابت"],
  "هزینه جاری": [
    "مواد مصرفی",
    "قبوض و اینترنت",
    "حمل‌ونقل",
    "بسته‌بندی",
    "سایر هزینه جاری",
  ],
  "هزینه سربار": [
    "تعمیر و نگهداری",
    "بازاریابی",
    "استهلاک تجهیزات",
    "سایر سربار",
  ],
  "حقوق و دستمزد": [
    "حقوق",
    "بیمه پرسنل",
    "پاداش و اضافه‌کاری",
    "سایر هزینه پرسنل",
  ],
};

const persianCalendar = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  calendar: "persian",
  timeZone: "UTC",
  year: "numeric",
  month: "long",
  day: "numeric",
});
const persianMonth = new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", {
  calendar: "persian",
  timeZone: "UTC",
  year: "numeric",
  month: "2-digit",
});

function localIsoDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateLabel(value: string) {
  return value ? persianCalendar.format(new Date(`${value}T12:00:00Z`)) : "—";
}

function jalaliMonthKey(value: string) {
  if (!value) return "";
  return persianMonth.format(new Date(`${value}T12:00:00Z`));
}

function toEnglishDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[٬,\s]/g, "");
}

export default function ExpenseManager() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [group, setGroup] = useState<ExpenseGroup>("هزینه جاری");
  const [category, setCategory] = useState(categories["هزینه جاری"][0]);
  const [date, setDate] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState<"همه" | ExpenseGroup>("همه");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(EXPENSES_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) setExpenses(parsed as Expense[]);
      }
    } catch {
      setNotice("اطلاعات هزینه‌ها خوانده نشد.");
    }
    setDate(localIsoDate());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  }, [expenses, ready]);

  useEffect(() => {
    if (!formOpen && !deleteTarget) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFormOpen(false);
        setDeleteTarget(null);
        setEditingId(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [formOpen, deleteTarget]);

  const monthKey = jalaliMonthKey(localIsoDate());
  const monthExpenses = expenses.filter(
    (expense) => jalaliMonthKey(expense.date) === monthKey,
  );
  const monthTotal = monthExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  const fixedTotal = monthExpenses
    .filter((expense) => expense.group === "هزینه ثابت")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const peopleTotal = monthExpenses
    .filter((expense) => expense.group === "حقوق و دستمزد")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const visibleExpenses = useMemo(
    () =>
      expenses
        .filter((expense) => filter === "همه" || expense.group === filter)
        .filter((expense) =>
          `${expense.title} ${expense.category} ${expense.note}`.includes(
            search.trim(),
          ),
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, filter, search],
  );

  function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericAmount = Number(toEnglishDigits(amount));
    if (
      !title.trim() ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      !date
    )
      return;
    const nextExpense: Expense = {
      id: editingId ?? makeId(),
      title: title.trim(),
      amount: numericAmount,
      group,
      category,
      date,
      recurring,
      note: note.trim(),
    };
    setExpenses((current) =>
      editingId
        ? current.map((expense) =>
            expense.id === editingId ? nextExpense : expense,
          )
        : [nextExpense, ...current],
    );
    setTitle("");
    setAmount("");
    setNote("");
    setRecurring(false);
    setEditingId(null);
    setFormOpen(false);
    setNotice(
      editingId ? "تغییرات هزینه ذخیره شد." : "هزینه با موفقیت ثبت شد.",
    );
  }

  function changeGroup(value: ExpenseGroup) {
    setGroup(value);
    setCategory(categories[value][0]);
  }

  function openNewExpense() {
    setEditingId(null);
    setTitle("");
    setAmount("");
    setGroup("هزینه جاری");
    setCategory(categories["هزینه جاری"][0]);
    setDate(localIsoDate());
    setRecurring(false);
    setNote("");
    setFormOpen(true);
  }

  function openEditExpense(expense: Expense) {
    setEditingId(expense.id);
    setTitle(expense.title);
    setAmount(String(expense.amount));
    setGroup(expense.group);
    setCategory(expense.category);
    setDate(expense.date);
    setRecurring(expense.recurring);
    setNote(expense.note);
    setFormOpen(true);
  }

  return (
    <main className="main-area products-page expenses-page">
      <header className="products-topbar">
        <div>
          <Link href="/" className="back-link">
            <Icons name="back" className="inline-icon" /> برگشت به داشبورد
          </Link>
          <p className="eyebrow">مدیریت مالی کسب‌وکار</p>
          <h1>هزینه‌ها</h1>
          <p className="page-description">
            هزینه‌های ثابت، جاری، سربار و حقوق پرسنل را یک‌جا ثبت و پیگیری کن.
          </p>
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={openNewExpense}
        >
          <Icons name="add" className="inline-icon" /> ثبت هزینه
        </button>
      </header>

      {notice && (
        <div className="products-notice" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="بستن">
            <Icons name="close" />
          </button>
        </div>
      )}

      <section
        className="expense-stats"
        aria-label="خلاصه هزینه‌ها در ماه جاری"
      >
        <article className="expense-stat">
          <Icons name="revenue" className="expense-stat-icon" />
          <div>
            <small>جمع هزینه‌های این ماه</small>
            <strong>{formatMoney(monthTotal)}</strong>
            <span>
              {numberFormat.format(monthExpenses.length)} ثبت در ماه جاری
            </span>
          </div>
        </article>
        <article className="expense-stat">
          <div>
            <small>هزینه‌های ثابت</small>
            <strong>{formatMoney(fixedTotal)}</strong>
            <span>اجاره، بیمه و هزینه‌های تکرارشونده</span>
          </div>
        </article>
        <article className="expense-stat">
          <Icons name="staff" className="expense-stat-icon payroll" />
          <div>
            <small>حقوق و دستمزد</small>
            <strong>{formatMoney(peopleTotal)}</strong>
            <span>حقوق، بیمه و مزایای پرسنل</span>
          </div>
        </article>
      </section>

      {formOpen && (
        <div
          className="material-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setFormOpen(false);
              setEditingId(null);
            }
          }}
        >
          <section
            className="panel material-modal expense-entry-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-form-title"
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => {
                setFormOpen(false);
                setEditingId(null);
              }}
              aria-label="بستن فرم"
            >
              <Icons name="close" />
            </button>
            <div className="panel-heading product-panel-heading">
              <div>
                <p className="eyebrow">مدیریت هزینه‌های کسب‌وکار</p>
                <h2 id="expense-form-title">
                  {editingId ? "ویرایش هزینه" : "ثبت هزینه جدید"}
                </h2>
                <p>مبلغ را به تومان وارد کن و تاریخ شمسی هزینه را انتخاب کن.</p>
              </div>
            </div>
            <form className="expense-form" onSubmit={submitExpense}>
              <label className="product-field">
                <span>عنوان هزینه</span>
                <input
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="مثلاً اجاره آبان"
                />
              </label>
              <label className="product-field">
                <span>مبلغ (تومان)</span>
                <input
                  required
                  inputMode="numeric"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="مثلاً ۲۵,۰۰۰,۰۰۰"
                />
              </label>
              <label className="product-field">
                <span>نوع هزینه</span>
                <select
                  value={group}
                  onChange={(event) =>
                    changeGroup(event.target.value as ExpenseGroup)
                  }
                >
                  {groups.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="product-field">
                <span>دسته‌بندی</span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {categories[group].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="product-field">
                <span>تاریخ ثبت</span>
                <ShamsiDatePicker value={date} onChange={setDate} />
              </label>
              <label className="product-field expense-note-field">
                <span>توضیحات (اختیاری)</span>
                <input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="یادداشت کوتاه درباره این هزینه"
                />
              </label>
              <label className="recurring-check">
                <input
                  type="checkbox"
                  checked={recurring}
                  onChange={(event) => setRecurring(event.target.checked)}
                />
                <span>
                  <strong>هزینه تکرارشونده</strong>
                  <small>مثل اجاره یا حقوق ماهانه</small>
                </span>
              </label>
              <button className="primary-button expense-submit" type="submit">
                {editingId ? "ذخیره تغییرات" : "ثبت هزینه"}
              </button>
            </form>
          </section>
        </div>
      )}

      <section className="panel expense-list-panel">
        <div className="panel-heading product-panel-heading expense-list-heading">
          <div>
            <h2>فهرست هزینه‌ها</h2>
            <p>{numberFormat.format(visibleExpenses.length)} مورد</p>
          </div>
          <div className="expense-filters">
            <label className="expense-search">
              <span className="sr-only">جست‌وجو در هزینه‌ها</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جست‌وجوی هزینه..."
              />
            </label>
            <label className="expense-group-filter">
              <span className="sr-only">فیلتر نوع هزینه</span>
              <select
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value as "همه" | ExpenseGroup)
                }
              >
                <option>همه</option>
                {groups.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {visibleExpenses.length ? (
          <div className="table-wrap expense-table-wrap">
            <table className="products-table expense-table">
              <thead>
                <tr>
                  <th>عنوان</th>
                  <th>دسته</th>
                  <th>نوع</th>
                  <th>تاریخ</th>
                  <th>مبلغ</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {visibleExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>
                      <div className="expense-title-cell">
                        <strong>{expense.title}</strong>
                        {expense.recurring && <span>تکرارشونده</span>}
                        {expense.note && <small>{expense.note}</small>}
                      </div>
                    </td>
                    <td>{expense.category}</td>
                    <td>
                      <span
                        className={`expense-type ${expense.group === "حقوق و دستمزد" ? "payroll" : expense.group === "هزینه ثابت" ? "fixed" : ""}`}
                      >
                        {expense.group}
                      </span>
                    </td>
                    <td>{dateLabel(expense.date)}</td>
                    <td className="expense-amount">
                      {formatMoney(expense.amount)}
                    </td>
                    <td>
                      <div className="expense-row-actions">
                        <button
                          className="secondary-button expense-edit"
                          type="button"
                          onClick={() => openEditExpense(expense)}
                        >
                          ویرایش
                        </button>
                        <button
                          className="remove-line expense-delete"
                          type="button"
                          onClick={() => setDeleteTarget(expense)}
                          aria-label={`حذف ${expense.title}`}
                          title="حذف هزینه"
                        >
                          <Icons name="close" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="expense-empty">
            <Icons name="orders" />
            <strong>
              {expenses.length
                ? "هزینه‌ای با این جست‌وجو پیدا نشد"
                : "هنوز هزینه‌ای ثبت نشده"}
            </strong>
            <p>
              {expenses.length
                ? "عبارت جست‌وجو یا فیلتر نوع هزینه را تغییر بده."
                : "اولین هزینه‌ی کسب‌وکارت را ثبت کن تا جمع هزینه‌های ماهانه نمایش داده شود."}
            </p>
            {!expenses.length && (
              <button
                className="primary-button"
                type="button"
                onClick={openNewExpense}
              >
                <Icons name="add" className="inline-icon" /> ثبت اولین هزینه
              </button>
            )}
          </div>
        )}
      </section>
      {deleteTarget && (
        <div
          className="material-modal-backdrop confirm-delete-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDeleteTarget(null);
          }}
        >
          <section
            className="material-modal confirm-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="expense-delete-title"
          >
            <h2 id="expense-delete-title">حذف این هزینه؟</h2>
            <p>
              هزینهٔ «{deleteTarget.title}» از فهرست حذف می‌شود. این کار قابل
              بازگشت نیست.
            </p>
            <div className="confirm-delete-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setDeleteTarget(null)}
              >
                انصراف
              </button>
              <button
                className="danger-button"
                type="button"
                onClick={() => {
                  setExpenses((current) =>
                    current.filter((item) => item.id !== deleteTarget.id),
                  );
                  setDeleteTarget(null);
                  setNotice("هزینه حذف شد.");
                }}
              >
                حذف هزینه
              </button>
            </div>
          </section>
        </div>
      )}
      <DashboardShortcut />
    </main>
  );
}
