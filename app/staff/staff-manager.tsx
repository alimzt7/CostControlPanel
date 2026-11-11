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
  maritalStatus?: "single" | "married";
  childrenCount?: number;
  insured?: boolean;
  monthlyBenefits?: number;
  monthlyDeductions?: number;
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
  const [maritalStatus, setMaritalStatus] = useState<"single" | "married">("single");
  const [childrenCount, setChildrenCount] = useState(0);
  const [insured, setInsured] = useState(false);
  const [monthlyBenefits, setMonthlyBenefits] = useState(0);
  const [monthlyDeductions, setMonthlyDeductions] = useState(0);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState("");
  const [payStatus, setPayStatus] = useState<"paid" | "pending">("paid");
  const [payNote, setPayNote] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [section, setSection] = useState<"team" | "payroll">("team");
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [modalStaffId, setModalStaffId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"details" | "edit">("details");
  const [editDraft, setEditDraft] = useState<Staff | null>(null);
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
    if (person) {
      setPayAmount(String(Math.max(0, person.salary + (person.monthlyBenefits ?? 0) - (person.monthlyDeductions ?? 0))));
    }
    else if (!selectedStaff) setPayAmount("");
  }, [selectedStaff, staff]);

  const monthKey = jalaliMonthKey(localIsoDate());
  const monthlyPayroll = payroll.filter(
    (item) => jalaliMonthKey(item.date) === monthKey,
  );
  const estimated = activeStaff.reduce(
    (sum, person) => sum + Math.max(0, person.salary + (person.monthlyBenefits ?? 0) - (person.monthlyDeductions ?? 0)),
    0,
  );
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
  const modalStaff = staff.find((person) => person.id === modalStaffId) ?? null;

  useEffect(() => {
    if (!modalStaffId && !showStaffForm) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModalStaffId(null);
        setShowStaffForm(false);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [modalStaffId, showStaffForm]);

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
      maritalStatus,
      childrenCount,
      insured,
      monthlyBenefits,
      monthlyDeductions,
    };
    setStaff((items) => [person, ...items]);
    if (!selectedStaff) setSelectedStaff(person.id);
    setName("");
    setRole("");
    setSalary("");
    setMaritalStatus("single");
    setChildrenCount(0);
    setInsured(false);
    setMonthlyBenefits(0);
    setMonthlyDeductions(0);
    setShowStaffForm(false);
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
  function openStaffDetails(person: Staff, mode: "details" | "edit") {
    setModalStaffId(person.id);
    setModalMode(mode);
    setEditDraft({
      ...person,
      maritalStatus: person.maritalStatus ?? "single",
      childrenCount: person.childrenCount ?? 0,
      insured: person.insured ?? false,
      monthlyBenefits: person.monthlyBenefits ?? 0,
      monthlyDeductions: person.monthlyDeductions ?? 0,
    });
  }
  function saveStaffChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editDraft?.name.trim() || !editDraft.role.trim() || editDraft.salary <= 0) return;
    setStaff((items) => items.map((person) => person.id === editDraft.id ? {
      ...editDraft,
      name: editDraft.name.trim(),
      role: editDraft.role.trim(),
      childrenCount: Math.max(0, Math.floor(editDraft.childrenCount ?? 0)),
      monthlyBenefits: Math.max(0, editDraft.monthlyBenefits ?? 0),
      monthlyDeductions: Math.max(0, editDraft.monthlyDeductions ?? 0),
    } : person));
    setNotice("اطلاعات پرسنل ویرایش شد.");
    setModalStaffId(null);
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
        <button
          className="primary-button"
          type="button"
          onClick={() => {
            if (section === "payroll") {
              setSection("team");
              setShowStaffForm(true);
              return;
            }
            setShowStaffForm((visible) => !visible);
          }}
        >
          <Icons
            name={section === "team" && showStaffForm ? "close" : "add"}
            className="inline-icon"
          />
          {section === "team"
            ? showStaffForm
              ? "بستن فرم"
              : "افزودن پرسنل"
            : "افزودن پرسنل"}
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
            <span>بر اساس حقوق پایه، مزایا و کسورات</span>
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

      <nav className="staff-section-tabs" aria-label="بخش‌های پرسنل و حقوق">
        <button
          type="button"
          className={section === "team" ? "active" : ""}
          aria-current={section === "team" ? "page" : undefined}
          onClick={() => setSection("team")}
        >
          <Icons name="staff" className="inline-icon" /> فهرست پرسنل
          <span>{numberFormat.format(activeStaff.length)}</span>
        </button>
        <button
          type="button"
          className={section === "payroll" ? "active" : ""}
          aria-current={section === "payroll" ? "page" : undefined}
          onClick={() => setSection("payroll")}
        >
          <Icons name="payroll" className="inline-icon" /> پرداخت حقوق
          <span>{numberFormat.format(recentPayroll.length)}</span>
        </button>
      </nav>

      {section === "team" && (
        <>
          {showStaffForm && (
            <div className="staff-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowStaffForm(false); }}>
            <section className="staff-modal staff-add-modal" id="staff-form" role="dialog" aria-modal="true" aria-labelledby="staff-add-title" dir="rtl">
              <header className="staff-modal-header">
                <div>
                  <p className="eyebrow">مدیریت تیم</p>
                  <h2 id="staff-add-title">افزودن پرسنل</h2>
                  <span>اطلاعات همکاری و حقوق ماهانه را وارد کن.</span>
                </div>
                <button type="button" className="modal-close" aria-label="بستن پنجره" onClick={() => setShowStaffForm(false)}><Icons name="close" /></button>
              </header>
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
                <div className="staff-form-subheading">
                  <strong>اطلاعات تکمیلی و حقوقی</strong>
                  <span>برای برآورد بهتر حقوق ماهانه</span>
                </div>
                <label className="product-field">
                  <span>وضعیت تأهل</span>
                  <select value={maritalStatus} onChange={(event) => setMaritalStatus(event.target.value as "single" | "married")}>
                    <option value="single">مجرد</option>
                    <option value="married">متأهل</option>
                  </select>
                </label>
                <label className="product-field">
                  <span>تعداد فرزند</span>
                  <input type="number" min="0" step="1" value={childrenCount} onChange={(event) => setChildrenCount(Math.max(0, Math.floor(Number(event.target.value) || 0)))} />
                </label>
                <label className="product-field">
                  <span>مزایای ثابت ماهانه (تومان)</span>
                  <input type="number" min="0" value={monthlyBenefits} onChange={(event) => setMonthlyBenefits(Math.max(0, Number(event.target.value) || 0))} />
                </label>
                <label className="product-field">
                  <span>کسورات ماهانه (تومان)</span>
                  <input type="number" min="0" value={monthlyDeductions} onChange={(event) => setMonthlyDeductions(Math.max(0, Number(event.target.value) || 0))} />
                </label>
                <label className="staff-insurance-toggle">
                  <input type="checkbox" checked={insured} onChange={(event) => setInsured(event.target.checked)} />
                  <span>این پرسنل بیمه است</span>
                </label>
                <footer className="staff-modal-footer staff-add-footer">
                  <button type="button" className="secondary-button" onClick={() => setShowStaffForm(false)}>انصراف</button>
                  <button className="primary-button staff-submit" type="submit">ثبت پرسنل</button>
                </footer>
              </form>
            </section>
            </div>
          )}

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
                      <th>اطلاعات تکمیلی</th>
                      <th>ویرایش</th>
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
                          <button className="staff-row-action" type="button" onClick={() => openStaffDetails(person, "details")}>مشاهده اطلاعات</button>
                        </td>
                        <td>
                          <button className="edit-material staff-edit-action" type="button" onClick={() => openStaffDetails(person, "edit")}>ویرایش</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="staff-inline-empty">
                {staff.length ? (
                  "موردی با این عبارت پیدا نشد."
                ) : (
                  <>
                    <strong>هنوز عضوی به تیم اضافه نشده</strong>
                    <span>برای شروع، نام، سمت و حقوق پایه را ثبت کن.</span>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => setShowStaffForm(true)}
                    >
                      <Icons name="add" className="inline-icon" /> افزودن اولین
                      پرسنل
                    </button>
                  </>
                )}
              </div>
            )}
          </section>
        </>
      )}

      {section === "payroll" && (
        <>
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
                    value={payDate}
                    onChange={setPayDate}
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
                <strong>برای ثبت حقوق، اول باید پرسنل داشته باشی</strong>
                <span>
                  اطلاعات همکار را ثبت کن تا بتوانی پرداخت‌هایش را پیگیری کنی.
                </span>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    setSection("team");
                    setShowStaffForm(true);
                  }}
                >
                  <Icons name="add" className="inline-icon" /> افزودن پرسنل
                </button>
              </div>
            )}
          </section>
          <section className="panel payroll-list-panel">
            <div className="panel-heading product-panel-heading">
              <div>
                <h2>سوابق پرداخت حقوق</h2>
                <p>
                  {numberFormat.format(recentPayroll.length)} پرداخت ثبت‌شده
                </p>
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
                            {item.status === "paid"
                              ? "پرداخت شده"
                              : "در انتظار"}
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
              <div className="staff-inline-empty">
                هنوز پرداختی ثبت نشده است.
              </div>
            )}
          </section>
        </>
      )}
      {modalStaff && editDraft && (
        <div className="staff-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalStaffId(null); }}>
          <section className="staff-modal" role="dialog" aria-modal="true" aria-labelledby="staff-modal-title" dir="rtl">
            <header className="staff-modal-header">
              <div>
                <p className="eyebrow">پرونده پرسنل</p>
                <h2 id="staff-modal-title">{modalStaff.name}</h2>
                <span>{modalStaff.role}</span>
              </div>
              <button type="button" className="modal-close" aria-label="بستن پنجره" onClick={() => setModalStaffId(null)}><Icons name="close" /></button>
            </header>
            {modalMode === "details" ? (
              <>
                <div className="staff-detail-grid">
                  <div><span>وضعیت تأهل</span><strong>{(modalStaff.maritalStatus ?? "single") === "married" ? "متأهل" : "مجرد"}</strong></div>
                  <div><span>تعداد فرزند</span><strong>{numberFormat.format(modalStaff.childrenCount ?? 0)} نفر</strong></div>
                  <div><span>بیمه</span><strong>{modalStaff.insured ? "دارای بیمه" : "بدون بیمه"}</strong></div>
                  <div><span>حقوق پایه ماهانه</span><strong>{formatMoney(modalStaff.salary)}</strong></div>
                  <div><span>مزایای ثابت ماهانه</span><strong>{formatMoney(modalStaff.monthlyBenefits ?? 0)}</strong></div>
                  <div><span>کسورات ماهانه</span><strong>{formatMoney(modalStaff.monthlyDeductions ?? 0)}</strong></div>
                  <div className="staff-detail-total"><span>مبنای برآورد ماهانه</span><strong>{formatMoney(Math.max(0, modalStaff.salary + (modalStaff.monthlyBenefits ?? 0) - (modalStaff.monthlyDeductions ?? 0)))}</strong></div>
                </div>
                <footer className="staff-modal-footer">
                  <button type="button" className="secondary-button" onClick={() => setModalStaffId(null)}>بستن</button>
                  <button type="button" className="primary-button" onClick={() => setModalMode("edit")}>ویرایش اطلاعات</button>
                </footer>
              </>
            ) : (
              <form className="staff-edit-form" onSubmit={saveStaffChanges}>
                <label className="product-field"><span>نام و نام خانوادگی</span><input required value={editDraft.name} onChange={(event) => setEditDraft({ ...editDraft, name: event.target.value })} /></label>
                <label className="product-field"><span>سمت</span><input required value={editDraft.role} onChange={(event) => setEditDraft({ ...editDraft, role: event.target.value })} /></label>
                <label className="product-field"><span>حقوق پایه ماهانه (تومان)</span><input required min="1" type="number" value={editDraft.salary} onChange={(event) => setEditDraft({ ...editDraft, salary: Number(event.target.value) })} /></label>
                <label className="product-field"><span>تاریخ شروع همکاری</span><ShamsiDatePicker value={editDraft.startDate} onChange={(value) => setEditDraft({ ...editDraft, startDate: value })} placeholder="انتخاب تاریخ شمسی" /></label>
                <label className="product-field"><span>وضعیت تأهل</span><select value={editDraft.maritalStatus ?? "single"} onChange={(event) => setEditDraft({ ...editDraft, maritalStatus: event.target.value as "single" | "married" })}><option value="single">مجرد</option><option value="married">متأهل</option></select></label>
                <label className="product-field"><span>تعداد فرزند</span><input min="0" type="number" value={editDraft.childrenCount ?? 0} onChange={(event) => setEditDraft({ ...editDraft, childrenCount: Number(event.target.value) })} /></label>
                <label className="product-field"><span>مزایای ثابت ماهانه (تومان)</span><input min="0" type="number" value={editDraft.monthlyBenefits ?? 0} onChange={(event) => setEditDraft({ ...editDraft, monthlyBenefits: Number(event.target.value) })} /></label>
                <label className="product-field"><span>کسورات ماهانه (تومان)</span><input min="0" type="number" value={editDraft.monthlyDeductions ?? 0} onChange={(event) => setEditDraft({ ...editDraft, monthlyDeductions: Number(event.target.value) })} /></label>
                <label className="staff-insurance-toggle"><input type="checkbox" checked={editDraft.insured ?? false} onChange={(event) => setEditDraft({ ...editDraft, insured: event.target.checked })} /><span>این پرسنل بیمه است</span></label>
                <label className="staff-insurance-toggle"><input type="checkbox" checked={editDraft.active} onChange={(event) => setEditDraft({ ...editDraft, active: event.target.checked })} /><span>پرسنل فعال است</span></label>
                <footer className="staff-modal-footer staff-edit-footer">
                  <button type="button" className="secondary-button" onClick={() => setModalMode("details")}>انصراف</button>
                  <button type="submit" className="primary-button">ذخیره تغییرات</button>
                </footer>
              </form>
            )}
          </section>
        </div>
      )}
      <p className="local-storage-note">
        اطلاعات این نسخه روی همین مرورگر ذخیره می‌شود. سوابق پرداخت با تغییر
        وضعیت اشتغال پرسنل حذف نمی‌شوند.
      </p>
    </main>
  );
}
