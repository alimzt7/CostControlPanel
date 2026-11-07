"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import Icons from "../components/icons";
import ShamsiDatePicker from "../components/shamsi-dare-picker";
import { formatMoney, makeId, numberFormat } from "../lib/costing";

const STAFF_KEY = "hesabchi.staff.v1";
const PAYROLL_KEY = "hesabchi.payroll.v1";
const EXPENSES_KEY = "hesabchi.expenses.v1";

type Staff = {
  id: string;
  name: string;
  role: string;
  salary: number;
  startDate: string;
  active: boolean;
};
type Payroll = {
  id: string;
  staffId: string;
  staffName: string;
  amount: number;
  date: string;
  status: "paid" | "pending";
  note: string;
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
function jalaliMonthKey(value: string) {
  return value ? persianMonth.format(new Date(`${value}T12:00:00Z`)) : "";
}
function dateLabel(value: string) {
  return value ? persianCalendar.format(new Date(`${value}T12:00:00Z`)) : "—";
}
function toEnglishDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[٬,\s]/g, "");
}

export default function StaffManager() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [salary, setSalary] = useState("");
  const [startDate, setStartDate] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState("");
  const [payStatus, setPayStatus] = useState<"paid" | "pending">("paid");
  const [payNote, setPayNote] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const activeStaff = staff.filter((person) => person.active);

  useEffect(() => {
    try {
      const savedStaff = localStorage.getItem(STAFF_KEY);
      const savedPayroll = localStorage.getItem(PAYROLL_KEY);
      if (savedStaff) {
        const parsed: unknown = JSON.parse(savedStaff);
        if (Array.isArray(parsed)) setStaff(parsed as Staff[]);
      }
      if (savedPayroll) {
        const parsed: unknown = JSON.parse(savedPayroll);
        if (Array.isArray(parsed)) setPayroll(parsed as Payroll[]);
      }
    } catch {
      setNotice("اطلاعات پرسنل یا حقوق خوانده نشد.");
    }
    setStartDate(localIsoDate());
    setPayDate(localIsoDate());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STAFF_KEY, JSON.stringify(staff));
    localStorage.setItem(PAYROLL_KEY, JSON.stringify(payroll));
  }, [staff, payroll, ready]);

  useEffect(() => {
    const person = staff.find((item) => item.id === selectedStaff);
    if (person) setPayAmount(String(person.salary));
    else if (!selectedStaff) setPayAmount("");
  }, [selectedStaff, staff]);

  const monthKey = jalaliMonthKey(localIsoDate());
  const monthlyPayroll = payroll.filter(
    (item) => jalaliMonthKey(item.date) === monthKey,
  );
  const estimated = activeStaff.reduce((sum, person) => sum + person.salary, 0);
  const paid = monthlyPayroll
    .filter((item) => item.status === "paid")
    .reduce((sum, item) => sum + item.amount, 0);
  const pending = Math.max(0, estimated - paid);
  const filteredStaff = useMemo(
    () =>
      staff.filter((person) =>
        `${person.name} ${person.role}`.includes(search.trim()),
      ),
    [staff, search],
  );
  const recentPayroll = [...payroll].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  function addStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericSalary = Number(toEnglishDigits(salary));
    if (
      !name.trim() ||
      !role.trim() ||
      !Number.isFinite(numericSalary) ||
      numericSalary <= 0 ||
      !startDate
    )
      return;
    const person: Staff = {
      id: makeId(),
      name: name.trim(),
      role: role.trim(),
      salary: numericSalary,
      startDate,
      active: true,
    };
    setStaff((items) => [person, ...items]);
    if (!selectedStaff) setSelectedStaff(person.id);
    setName("");
    setRole("");
    setSalary("");
    setNotice("پرسنل جدید ثبت شد.");
  }

  function addPayroll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const person = activeStaff.find((item) => item.id === selectedStaff);
    const numericAmount = Number(toEnglishDigits(payAmount));
    if (
      !person ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      !payDate
    )
      return;
    const payrollId = makeId();
    setPayroll((items) => [
      {
        id: payrollId,
        staffId: person.id,
        staffName: person.name,
        amount: numericAmount,
        date: payDate,
        status: payStatus,
        note: payNote.trim(),
      },
      ...items,
    ]);
    let expenseSynced = true;
    try {
      const existing = JSON.parse(
        localStorage.getItem(EXPENSES_KEY) ?? "[]",
      ) as unknown;
      const expenses = Array.isArray(existing) ? existing : [];
      localStorage.setItem(
        EXPENSES_KEY,
        JSON.stringify([
          {
            id: payrollId,
            title: `حقوق ${person.name}`,
            amount: numericAmount,
            group: "حقوق و دستمزد",
            category: "حقوق",
            date: payDate,
            recurring: false,
            note: payNote.trim() || "ثبت از بخش پرسنل و حقوق",
          },
          ...expenses,
        ]),
      );
    } catch {
      expenseSynced = false;
    }
    setPayNote("");
    setNotice(
      expenseSynced
        ? payStatus === "paid"
          ? "پرداخت حقوق ثبت و به هزینه‌ها اضافه شد."
          : "حقوق در انتظار ثبت و به هزینه‌ها اضافه شد."
        : "پرداخت در سوابق پرسنل ثبت شد، اما به فهرست هزینه‌ها منتقل نشد.",
    );
  }

  function toggleActive(id: string) {
    setStaff((items) =>
      items.map((person) =>
        person.id === id ? { ...person, active: !person.active } : person,
      ),
    );
  }
  function togglePayrollStatus(id: string) {
    setPayroll((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "paid" ? "pending" : "paid" }
          : item,
      ),
    );
  }

  return (
    <main className="main-area products-page staff-page">
      <header className="products-topbar">
        <div>
          <Link href="/" className="back-link">
            <Icons name="back" className="inline-icon" /> برگشت به داشبورد
          </Link>
          <p className="eyebrow">مدیریت تیم کسب‌وکار</p>
          <h1>پرسنل و حقوق</h1>
          <p className="page-description">
            اطلاعات پرسنل، حقوق ماهانه و وضعیت پرداخت‌ها را پیگیری کن.
          </p>
        </div>
        <a className="primary-button" href="#staff-form">
          <Icons name="add" className="inline-icon" /> افزودن پرسنل
        </a>
      </header>

      {notice && (
        <div className="products-notice" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="بستن">
            <Icons name="close" />
          </button>
        </div>
      )}

      <section className="staff-stats" aria-label="خلاصه حقوق و پرسنل">
        <article className="staff-stat">
          <Icons name="staff" className="staff-stat-icon" />
          <div>
            <small>پرسنل فعال</small>
            <strong>{numberFormat.format(activeStaff.length)} نفر</strong>
            <span>از {numberFormat.format(staff.length)} نفر ثبت‌شده</span>
          </div>
        </article>
        <article className="staff-stat">
          <Icons name="payroll" className="staff-stat-icon payroll" />
          <div>
            <small>حقوق برآوردی ماهانه</small>
            <strong>{formatMoney(estimated)}</strong>
            <span>بر اساس حقوق پایه‌ی پرسنل فعال</span>
          </div>
        </article>
        <article className="staff-stat">
          <Icons name="paid" className="staff-stat-icon paid" />
          <div>
            <small>پرداخت‌شده این ماه</small>
            <strong>{formatMoney(paid)}</strong>
            <span>مانده‌ی برآوردی: {formatMoney(pending)}</span>
          </div>
        </article>
      </section>

      <section className="panel staff-form-panel" id="staff-form">
        <div className="panel-heading product-panel-heading">
          <div>
            <h2>افزودن پرسنل</h2>
            <p>حقوق پایه برای برآورد تعهد ماهانه استفاده می‌شود.</p>
          </div>
          <span className="panel-step">۱</span>
        </div>
        <form className="staff-form" onSubmit={addStaff}>
          <label className="product-field">
            <span>نام و نام خانوادگی</span>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="مثلاً سارا احمدی"
            />
          </label>
          <label className="product-field">
            <span>سمت</span>
            <input
              required
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="مثلاً سرآشپز"
            />
          </label>
          <label className="product-field">
            <span>حقوق پایه ماهانه (تومان)</span>
            <input
              required
              inputMode="numeric"
              value={salary}
              onChange={(event) => setSalary(event.target.value)}
              placeholder="مثلاً ۱۸,۰۰۰,۰۰۰"
            />
          </label>
          <label className="product-field">
            <span>تاریخ شروع همکاری</span>
            <ShamsiDatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="انتخاب تاریخ شروع شمسی"
            />
          </label>
          <button className="primary-button staff-submit" type="submit">
            ثبت پرسنل
          </button>
        </form>
      </section>

      <section className="panel staff-pay-panel">
        <div className="panel-heading product-panel-heading">
          <div>
            <h2>ثبت پرداخت حقوق</h2>
            <p>پرداخت کامل، بخشی از حقوق یا مبلغ معوق را ثبت کن.</p>
          </div>
          <span className="panel-step">۲</span>
        </div>
        {activeStaff.length ? (
          <form className="payroll-form" onSubmit={addPayroll}>
            <label className="product-field">
              <span>پرسنل</span>
              <select
                required
                value={selectedStaff}
                onChange={(event) => setSelectedStaff(event.target.value)}
              >
                <option value="">انتخاب پرسنل</option>
                {activeStaff.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name} — {person.role}
                  </option>
                ))}
              </select>
            </label>
            <label className="product-field">
              <span>مبلغ پرداخت (تومان)</span>
              <input
                required
                inputMode="numeric"
                value={payAmount}
                onChange={(event) => setPayAmount(event.target.value)}
                placeholder="مبلغ پرداختی"
              />
            </label>
            <label className="product-field">
              <span>تاریخ پرداخت / ثبت</span>
              <ShamsiDatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="انتخاب تاریخ پرداخت شمسی"
              />
            </label>
            <label className="product-field">
              <span>وضعیت</span>
              <select
                value={payStatus}
                onChange={(event) =>
                  setPayStatus(event.target.value as "paid" | "pending")
                }
              >
                <option value="paid">پرداخت شده</option>
                <option value="pending">در انتظار پرداخت</option>
              </select>
            </label>
            <label className="product-field pay-note">
              <span>یادداشت</span>
              <input
                value={payNote}
                onChange={(event) => setPayNote(event.target.value)}
                placeholder="مثلاً حقوق آبان"
              />
            </label>
            <button className="primary-button payroll-submit" type="submit">
              ثبت پرداخت
            </button>
          </form>
        ) : (
          <div className="staff-inline-empty">
            برای ثبت حقوق، ابتدا یک نفر را در فهرست پرسنل اضافه کن.
          </div>
        )}
      </section>

      <section className="panel staff-list-panel">
        <div className="panel-heading product-panel-heading staff-list-heading">
          <div>
            <h2>فهرست پرسنل</h2>
            <p>{numberFormat.format(filteredStaff.length)} نفر</p>
          </div>
          <label className="staff-search">
            <span className="sr-only">جست‌وجو در پرسنل</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جست‌وجوی نام یا سمت..."
            />
          </label>
        </div>
        {filteredStaff.length ? (
          <div className="table-wrap staff-table-wrap">
            <table className="products-table staff-table">
              <thead>
                <tr>
                  <th>نام</th>
                  <th>سمت</th>
                  <th>حقوق پایه ماهانه</th>
                  <th>شروع همکاری</th>
                  <th>وضعیت</th>
                  <th>اقدام</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((person) => (
                  <tr key={person.id}>
                    <td className="staff-name-cell">{person.name}</td>
                    <td>{person.role}</td>
                    <td className="staff-money-cell">
                      {formatMoney(person.salary)}
                    </td>
                    <td>{dateLabel(person.startDate)}</td>
                    <td>
                      <span
                        className={`staff-status ${person.active ? "active" : "inactive"}`}
                      >
                        {person.active ? "فعال" : "غیرفعال"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="edit-material"
                        type="button"
                        onClick={() => toggleActive(person.id)}
                      >
                        {person.active ? "غیرفعال‌کردن" : "فعال‌کردن"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="staff-inline-empty">
            {staff.length
              ? "موردی با این عبارت پیدا نشد."
              : "هنوز پرسنلی ثبت نشده است. از فرم بالا شروع کن."}
          </div>
        )}
      </section>

      <section className="panel payroll-list-panel">
        <div className="panel-heading product-panel-heading">
          <div>
            <h2>سوابق پرداخت حقوق</h2>
            <p>{numberFormat.format(recentPayroll.length)} پرداخت ثبت‌شده</p>
          </div>
        </div>
        {recentPayroll.length ? (
          <div className="table-wrap staff-table-wrap">
            <table className="products-table staff-table">
              <thead>
                <tr>
                  <th>پرسنل</th>
                  <th>تاریخ</th>
                  <th>مبلغ</th>
                  <th>وضعیت</th>
                  <th>یادداشت</th>
                  <th>اقدام</th>
                </tr>
              </thead>
              <tbody>
                {recentPayroll.map((item) => (
                  <tr key={item.id}>
                    <td className="staff-name-cell">{item.staffName}</td>
                    <td>{dateLabel(item.date)}</td>
                    <td className="staff-money-cell">
                      {formatMoney(item.amount)}
                    </td>
                    <td>
                      <span className={`staff-status ${item.status}`}>
                        {item.status === "paid" ? "پرداخت شده" : "در انتظار"}
                      </span>
                    </td>
                    <td>{item.note || "—"}</td>
                    <td>
                      <button
                        className="edit-material"
                        type="button"
                        onClick={() => togglePayrollStatus(item.id)}
                      >
                        {item.status === "paid"
                          ? "ثبت به‌عنوان معوق"
                          : "تأیید پرداخت"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="staff-inline-empty">هنوز پرداختی ثبت نشده است.</div>
        )}
      </section>
      <p className="local-storage-note">
        اطلاعات این نسخه روی همین مرورگر ذخیره می‌شود. سوابق پرداخت با تغییر
        وضعیت اشتغال پرسنل حذف نمی‌شوند.
      </p>
    </main>
  );
}
