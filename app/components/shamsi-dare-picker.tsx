"use client";

import { useEffect, useRef, useState } from "react";
import { numberFormat } from "../lib/costing";
import Icons from "./icons";

const yearFormat = new Intl.NumberFormat("fa-IR-u-nu-arabext", {
  useGrouping: false,
});

const jalaliMonths = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const persianCalendar = new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", {
  calendar: "persian",
  timeZone: "UTC",
  year: "numeric",
  month: "long",
  day: "numeric",
});

function localIsoDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function jalaliParts(date: Date) {
  const parts = persianCalendar.formatToParts(date);
  return {
    year: Number(parts.find((part) => part.type === "year")?.value ?? 0),
    month: parts.find((part) => part.type === "month")?.value ?? "",
    day: Number(parts.find((part) => part.type === "day")?.value ?? 0),
  };
}

function calendarFor(isoDate: string) {
  const anchor = new Date(`${isoDate}T12:00:00Z`);
  const selected = jalaliParts(anchor);
  const start = new Date(
    Date.UTC(
      anchor.getUTCFullYear(),
      anchor.getUTCMonth(),
      anchor.getUTCDate() - selected.day + 1,
    ),
  );
  const monthLabel = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    calendar: "persian",
    timeZone: "UTC",
    year: "numeric",
    month: "long",
  }).format(start);
  const offset = (start.getUTCDay() + 1) % 7;
  const days: { date: string; day: number }[] = [];
  for (let step = 0; step < 42; step += 1) {
    const date = new Date(start.getTime() + step * 86400000);
    const parts = jalaliParts(date);
    if (parts.year !== selected.year || parts.month !== selected.month) break;
    days.push({ date: date.toISOString().slice(0, 10), day: parts.day });
  }
  return {
    start,
    monthLabel,
    offset,
    days,
    year: selected.year,
    month: selected.month,
    selectedDay: selected.day,
  };
}

function jalaliDateInMonth(year: number, month: string, day: number) {
  const start = new Date(Date.UTC(year + 621, 2, 15));
  let lastMatch = "";
  for (let offset = 0; offset < 380; offset += 1) {
    const date = new Date(start.getTime() + offset * 86400000);
    const parts = jalaliParts(date);
    if (parts.year === year && parts.month === month) {
      lastMatch = date.toISOString().slice(0, 10);
      if (parts.day === day) return lastMatch;
    } else if (lastMatch) {
      return lastMatch;
    }
  }
  return lastMatch;
}

export default function ShamsiDatePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ شمسی",
}: {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [openPicker, setOpenPicker] = useState<"month" | "year" | null>(null);
  const [viewDate, setViewDate] = useState(value || localIsoDate());
  const pickerRef = useRef<HTMLDivElement>(null);
  const calendar = calendarFor(viewDate);
  const today = localIsoDate();

  useEffect(() => {
    if (!open) return;

    function closeWhenClickedOutside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !pickerRef.current?.contains(event.target)
      ) {
        setOpen(false);
        setOpenPicker(null);
      }
    }

    document.addEventListener("pointerdown", closeWhenClickedOutside);
    return () =>
      document.removeEventListener("pointerdown", closeWhenClickedOutside);
  }, [open]);

  function moveMonth(amount: number) {
    const shifted = new Date(
      calendar.start.getTime() + (amount < 0 ? -1 : 35) * 86400000,
    );
    setViewDate(shifted.toISOString().slice(0, 10));
    setOpenPicker(null);
  }

  return (
    <div className="jalali-picker" ref={pickerRef}>
      <button
        type="button"
        className="date-picker-trigger"
        onClick={() => {
          if (open) {
            setOpen(false);
            setOpenPicker(null);
          } else {
            setViewDate(value || today);
            setOpen(true);
          }
        }}
        aria-expanded={open}
      >
        <Icons name="calendar" />
        {value
          ? persianCalendar.format(new Date(`${value}T12:00:00Z`))
          : placeholder}
        <Icons className="date-chevron" />
      </button>
      {open && (
        <div
          className="jalali-calendar"
          role="dialog"
          aria-label="انتخاب تاریخ شمسی"
        >
          <div className="calendar-heading">
            <button
              className="flex items-center justify-center"
              type="button"
              onClick={() => moveMonth(-1)}
              aria-label="ماه قبل"
            >
              <Icons name="previous" />
            </button>
            <div className="calendar-heading-selection">
              <button
                type="button"
                className="calendar-selector"
                aria-haspopup="listbox"
                aria-expanded={openPicker === "month"}
                onClick={() =>
                  setOpenPicker(openPicker === "month" ? null : "month")
                }
              >
                {calendar.month}
              </button>
              <button
                type="button"
                className="calendar-selector"
                aria-haspopup="listbox"
                aria-expanded={openPicker === "year"}
                onClick={() =>
                  setOpenPicker(openPicker === "year" ? null : "year")
                }
              >
                {calendar.year}
              </button>
            </div>
            <button
              className="flex items-center justify-center"
              type="button"
              onClick={() => moveMonth(1)}
              aria-label="ماه بعد"
            >
              <Icons name="next" />
            </button>
          </div>
          {openPicker === "month" && (
            <div
              className="calendar-pick-menu calendar-month-options"
              role="listbox"
              aria-label="انتخاب ماه"
            >
              {jalaliMonths.map((month) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={month === calendar.month}
                  className={`calendar-pick-option${month === calendar.month ? " selected" : ""}`}
                  key={month}
                  onClick={() => {
                    setViewDate(
                      jalaliDateInMonth(calendar.year, month, 1) || viewDate,
                    );
                    setOpenPicker(null);
                  }}
                >
                  {month}
                </button>
              ))}
            </div>
          )}
          {openPicker === "year" && (
            <div
              className="calendar-pick-menu calendar-year-options"
              role="listbox"
              aria-label="انتخاب سال"
            >
              {Array.from(
                { length: 81 },
                (_, index) => calendar.year - index,
              ).map((year) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={year === calendar.year}
                  className={`calendar-pick-option${year === calendar.year ? " selected" : ""}`}
                  key={year}
                  onClick={() => {
                    setViewDate(
                      jalaliDateInMonth(
                        year,
                        calendar.month,
                        calendar.selectedDay,
                      ) || viewDate,
                    );
                    setOpenPicker(null);
                  }}
                >
                  {yearFormat.format(year)}
                </button>
              ))}
            </div>
          )}
          <div className="calendar-grid calendar-weekdays">
            {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {Array.from({ length: calendar.offset }, (_, index) => (
              <span className="calendar-empty" key={`blank-${index}`} />
            ))}
            {calendar.days.map((day) => (
              <button
                type="button"
                key={day.date}
                className={`calendar-day${day.date === value ? " selected" : ""}`}
                disabled={day.date > today}
                onClick={() => {
                  onChange(day.date);
                  setOpenPicker(null);
                  setOpen(false);
                }}
              >
                {numberFormat.format(day.day)}
              </button>
            ))}
          </div>
          <button
            className="calendar-today-button"
            type="button"
            onClick={() => {
              onChange(today);
              setViewDate(today);
              setOpenPicker(null);
              setOpen(false);
            }}
          >
            برو به امروز
          </button>
        </div>
      )}
    </div>
  );
}
