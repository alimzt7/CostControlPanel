"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import Icons from "../components/icons";
import DashboardShortcut from "../components/dashboard-shortcut";
import ShamsiDatePicker from "../components/shamsi-dare-picker";
import {
  baseUnit,
  baseUnitLabel,
  formatMoney,
  historicalUnitPrice,
  INGREDIENTS_KEY,
  initialIngredients,
  initialProducts,
  Ingredient,
  IngredientCategory,
  IngredientPrice,
  ingredientCategories,
  makeId,
  migrateDemoTomato,
  numberFormat,
  Product,
  PRODUCTS_KEY,
  purchaseUnits,
  PurchaseUnit,
  toBaseQuantity,
  unitPrice,
} from "../lib/costing";

const persianCalendar = new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", {
  calendar: "persian",
  timeZone: "UTC",
  year: "numeric",
  month: "long",
  day: "numeric",
});

function localIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function jalaliDateLabel(isoDate: string) {
  if (!isoDate) return "تاریخ ثبت نشده";
  return persianCalendar.format(new Date(`${isoDate}T12:00:00Z`));
}

function latestPrice(history: IngredientPrice[]) {
  return [...history]
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.date)
    .sort(
      (left, right) =>
        left.entry.date.localeCompare(right.entry.date) ||
        left.index - right.index,
    )
    .at(-1)?.entry;
}

function normalizeCategory(ingredient: Ingredient): IngredientCategory {
  if (
    ingredientCategories.includes(ingredient.category as IngredientCategory)
  ) {
    return ingredient.category as IngredientCategory;
  }
  if (["chicken", "beef"].includes(ingredient.id)) return "گوشت و پروتئین";
  if (["bread"].includes(ingredient.id)) return "نان و غلات";
  if (["cheese"].includes(ingredient.id)) return "لبنیات و پنیر";
  if (["sauce"].includes(ingredient.id)) return "سس و چاشنی";
  if (["lettuce", "tomato"].includes(ingredient.id))
    return "سبزیجات و صیفی‌جات";
  return "سایر";
}

function normalizeIngredients(
  items: Ingredient[],
  seedDate?: string,
): Ingredient[] {
  return items.map((ingredient) => {
    const history = Array.isArray(ingredient.priceHistory)
      ? ingredient.priceHistory
      : seedDate || ingredient.id === "tomato"
        ? [
            {
              date: seedDate ?? localIsoDate(),
              purchaseQuantity: ingredient.purchaseQuantity,
              purchaseUnit: ingredient.purchaseUnit,
              purchasePrice: ingredient.purchasePrice,
            },
          ]
        : [];
    const latest = latestPrice(history);
    return {
      ...ingredient,
      ...(latest
        ? {
            purchasePrice: latest.purchasePrice,
            purchaseQuantity: latest.purchaseQuantity,
            purchaseUnit: latest.purchaseUnit,
          }
        : {}),
      category: normalizeCategory(ingredient),
      priceHistory: [...history].sort((left, right) =>
        left.date.localeCompare(right.date),
      ),
    };
  });
}

export default function MaterialManager() {
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [products, setProducts] = useState(initialProducts);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<PurchaseUnit>("kg");
  const [price, setPrice] = useState("");
  const [priceDate, setPriceDate] = useState("");
  const [category, setCategory] = useState<IngredientCategory | "">("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    IngredientCategory | "all"
  >("all");
  const [listSearch, setListSearch] = useState("");
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    const initializeFromStorage = () => {
      try {
        const savedIngredients = localStorage.getItem(INGREDIENTS_KEY);
        const savedProducts = localStorage.getItem(PRODUCTS_KEY);
        const migrated = migrateDemoTomato(
          savedIngredients
            ? (JSON.parse(savedIngredients) as Ingredient[])
            : initialIngredients,
          savedProducts
            ? (JSON.parse(savedProducts) as Product[])
            : initialProducts,
        );
        const normalized = normalizeIngredients(
          migrated.ingredients,
          savedIngredients ? undefined : localIsoDate(),
        );
        setIngredients(normalized);
        setProducts(migrated.products);
        if (savedProducts)
          localStorage.setItem(PRODUCTS_KEY, JSON.stringify(migrated.products));
      } catch {
        setNotice(
          "اطلاعات ذخیره‌شده خوانده نشد؛ داده‌های نمونه نمایش داده می‌شود.",
        );
      }
      setPriceDate(localIsoDate());
      setReady(true);
    };
    const timer = window.setTimeout(initializeFromStorage, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready)
      localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(ingredients));
  }, [ingredients, ready]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function persistIngredients(next: Ingredient[]) {
    setIngredients(next);
    localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("hesabchi:ingredients-updated"));
  }

  const usageByIngredient = useMemo(() => {
    const usage = new Map<string, number>();
    for (const product of products) {
      for (const ingredientId of new Set(
        product.recipe.map((line) => line.ingredientId),
      )) {
        usage.set(ingredientId, (usage.get(ingredientId) ?? 0) + 1);
      }
    }
    return usage;
  }, [products]);

  const visibleIngredients = ingredients.filter(
    (ingredient) =>
      (categoryFilter === "all" || ingredient.category === categoryFilter) &&
      ingredient.name
        .toLocaleLowerCase("fa")
        .includes(listSearch.trim().toLocaleLowerCase("fa")),
  );
  const historyIngredient = ingredients.find(
    (ingredient) => ingredient.id === historyId,
  );

  function persistForm(next: Ingredient[]) {
    persistIngredients(next);
  }

  function resetForm(keepCategory = false) {
    setName("");
    setQuantity("1");
    setUnit("kg");
    setPrice("");
    setPriceDate(localIsoDate());
    setEditingId(null);
    if (!keepCategory) setCategory("");
  }

  function startEditing(ingredient: Ingredient) {
    setFormOpen(true);
    setEditingId(ingredient.id);
    setName(ingredient.name);
    setQuantity(String(ingredient.purchaseQuantity));
    setUnit(ingredient.purchaseUnit);
    setPrice(String(ingredient.purchasePrice));
    setCategory(ingredient.category ?? "سایر");
    setPriceDate(localIsoDate());
  }

  function prepareNewItem() {
    resetForm(true);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    resetForm();
  }

  function updateHistory(
    current: Ingredient,
    entry: IngredientPrice,
  ): IngredientPrice[] {
    const history = current.priceHistory ?? [];
    // تاریخ به‌تنهایی شناسهٔ رکورد قیمت نیست؛ چند خرید در یک روز مجاز است.
    return [...history, entry].sort((left, right) =>
      left.date.localeCompare(right.date),
    );
  }

  function submitIngredient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(price);
    if (
      !name.trim() ||
      !category ||
      !priceDate ||
      parsedQuantity <= 0 ||
      parsedPrice <= 0
    )
      return;

    if (editingId) {
      const current = ingredients.find(
        (ingredient) => ingredient.id === editingId,
      );
      if (!current) return;
      if (
        usageByIngredient.has(editingId) &&
        baseUnit(current.purchaseUnit) !== baseUnit(unit)
      ) {
        setNotice(
          "چون این ماده در دستور پخت استفاده شده، نوع واحد آن را نمی‌توان از وزن به حجم یا عدد تغییر داد.",
        );
        return;
      }
      const priceChanged =
        current.purchasePrice !== parsedPrice ||
        current.purchaseQuantity !== parsedQuantity ||
        current.purchaseUnit !== unit;
      let nextIngredient: Ingredient = {
        ...current,
        name: name.trim(),
        category,
      };
      if (priceChanged) {
        const entry: IngredientPrice = {
          date: priceDate,
          purchasePrice: parsedPrice,
          purchaseQuantity: parsedQuantity,
          purchaseUnit: unit,
        };
        const history = updateHistory(current, entry);
        const latest = latestPrice(history);
        const shouldSetCurrentPrice = latest === entry;
        nextIngredient = {
          ...nextIngredient,
          priceHistory: history,
          ...(shouldSetCurrentPrice
            ? {
                purchasePrice: parsedPrice,
                purchaseQuantity: parsedQuantity,
                purchaseUnit: unit,
              }
            : {}),
        };
      }
      persistForm(
        ingredients.map((ingredient) =>
          ingredient.id === editingId ? nextIngredient : ingredient,
        ),
      );
      setNotice(
        priceChanged
          ? priceDate < localIsoDate()
            ? "قیمت تاریخی ثبت شد؛ قیمت جاری محصولات برای محاسبه تغییر نکرد."
            : "قیمت ثبت شد و بهای جاری محصولات وابسته به‌روز شد."
          : "اطلاعات ماده اولیه به‌روزرسانی شد.",
      );
    } else {
      const entry: IngredientPrice = {
        date: priceDate,
        purchasePrice: parsedPrice,
        purchaseQuantity: parsedQuantity,
        purchaseUnit: unit,
      };
      const normalizedName = name.trim().toLocaleLowerCase("fa");
      const existing = ingredients.find(
        (ingredient) =>
          ingredient.name.trim().toLocaleLowerCase("fa") === normalizedName,
      );
      if (existing) {
        if (
          usageByIngredient.has(existing.id) &&
          baseUnit(existing.purchaseUnit) !== baseUnit(unit)
        ) {
          setNotice(
            "این ماده در دستور پخت استفاده شده و نوع واحدش را نمی‌توان از وزن به حجم یا عدد تغییر داد.",
          );
          return;
        }
        const history = updateHistory(existing, entry);
        const isLatestPrice = latestPrice(history) === entry;
        const updated: Ingredient = {
          ...existing,
          category,
          priceHistory: history,
          ...(isLatestPrice
            ? {
                purchasePrice: parsedPrice,
                purchaseQuantity: parsedQuantity,
                purchaseUnit: unit,
              }
            : {}),
        };
        persistForm(
          ingredients.map((ingredient) =>
            ingredient.id === existing.id ? updated : ingredient,
          ),
        );
        setNotice(
          isLatestPrice
            ? "قیمت جدید به تاریخچه اضافه شد و قیمت جاری به‌روز شد."
            : "قیمت قدیمی به تاریخچه اضافه شد؛ قیمت جاری بدون تغییر ماند.",
        );
      } else {
        persistForm([
          ...ingredients,
          {
            id: makeId(),
            name: name.trim(),
            category,
            purchaseQuantity: parsedQuantity,
            purchaseUnit: unit,
            purchasePrice: parsedPrice,
            priceHistory: [entry],
          },
        ]);
        setNotice("ماده اولیه جدید اضافه شد.");
      }
    }
    resetForm();
    if (editingId) setFormOpen(false);
  }

  function deleteIngredient(id: string) {
    if (usageByIngredient.has(id)) return;
    persistForm(ingredients.filter((ingredient) => ingredient.id !== id));
    if (editingId === id) resetForm();
    setNotice("ماده اولیه حذف شد.");
  }

  return (
    <main className="main-area products-page materials-page">
      <div className="products-topbar">
        <div>
          <Link href="/" className="back-link">
            <Icons name="back" className="inline-icon" /> برگشت به داشبورد
          </Link>
          <p className="eyebrow">بانک مواد اولیه</p>
          <h1>مواد اولیه و قیمت خرید</h1>
          <p className="page-description">
            مواد را دسته‌بندی کن، قیمت هر واحد را ثبت کن و تغییرات قیمت را به
            تفکیک تاریخ دنبال کن.
          </p>
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={prepareNewItem}
        >
          <Icons name="add" className="inline-icon" /> ثبت ماده اولیه
        </button>
      </div>

      {notice && (
        <div
          className={`products-notice${formOpen ? " material-toast" : ""}`}
          role="status"
        >
          {notice}
          <button onClick={() => setNotice("")} aria-label="بستن پیام">
            <Icons name="close" />
          </button>
        </div>
      )}

      {formOpen && (
        <div
          className="material-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <section
            className="panel material-form-panel material-modal material-entry-modal"
            id="material-form"
            role="dialog"
            aria-modal="true"
            aria-labelledby="material-form-title"
          >
            <button
              className="modal-close"
              type="button"
              onClick={closeForm}
              aria-label="بستن فرم"
            >
              <Icons name="close" />
            </button>
            <div className="panel-heading product-panel-heading">
              <div>
                <h2 id="material-form-title">
                  {editingId ? "ویرایش ماده اولیه" : "ثبت ماده اولیه جدید"}
                </h2>
                <p>
                  دسته، مقدار و قیمت بسته‌ی خرید را وارد کن؛ قیمت واحد پایه
                  محاسبه می‌شود.
                </p>
              </div>
            </div>
            <form className="ingredient-form" onSubmit={submitIngredient}>
              <label className="product-field">
                <span>نام ماده اولیه</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="مثلاً گوجه‌فرنگی"
                  required
                />
              </label>
              <label className="product-field">
                <span>دسته‌بندی</span>
                <select
                  value={category}
                  onChange={(event) => {
                    const next = event.target.value as IngredientCategory;
                    setCategory(next);
                  }}
                  required
                >
                  <option value="" disabled>
                    انتخاب دسته
                  </option>
                  {ingredientCategories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="product-field">
                <span>واحد خرید</span>
                <select
                  value={unit}
                  onChange={(event) =>
                    setUnit(event.target.value as PurchaseUnit)
                  }
                >
                  {purchaseUnits.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="product-field">
                <span>قیمت واحد (تومان)</span>
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="مثلاً ۵۰۰۰۰"
                  required
                />
              </label>
              <label className="product-field price-date-field">
                <span>تاریخ ثبت قیمت (شمسی)</span>
                <ShamsiDatePicker value={priceDate} onChange={setPriceDate} />
              </label>
              <div className="material-form-actions">
                <button className="primary-button add-ingredient" type="submit">
                  {editingId ? (
                    "ذخیره قیمت و تغییرات"
                  ) : (
                    <>
                      <Icons name="add" className="inline-icon" /> افزودن ماده
                    </>
                  )}
                </button>
                {editingId && (
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => resetForm()}
                  >
                    لغو ویرایش
                  </button>
                )}
              </div>
            </form>
            {quantity && price && Number(quantity) > 0 && Number(price) > 0 && (
              <p className="unit-price-preview">
                قیمت هر {baseUnitLabel(baseUnit(unit))}:{" "}
                <strong>
                  {formatMoney(
                    Number(price) / toBaseQuantity(Number(quantity), unit),
                  )}
                </strong>
                <span>
                  {" "}
                  · این قیمت پایه در محاسبه‌ی دستور پخت استفاده می‌شود.
                </span>
              </p>
            )}
          </section>
        </div>
      )}

      <section className="panel ingredient-panel material-list-panel">
        <div className="panel-heading product-panel-heading">
          <div>
            <h2>فهرست مواد اولیه</h2>
            <p>فیلتر بر اساس دسته، جست‌وجو، مشاهده‌ی تاریخچه و ویرایش قیمت.</p>
          </div>
          <span className="panel-step">
            تعداد مواد اولیه ثبت شده: {numberFormat.format(ingredients.length)}
          </span>
        </div>
        <div className="material-filters">
          <label className="product-field">
            <span>دسته‌بندی</span>
            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value as IngredientCategory | "all",
                )
              }
            >
              <option value="all">همه‌ی دسته‌ها</option>
              {ingredientCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="product-field material-search">
            <span>جست‌وجو</span>
            <input
              value={listSearch}
              onChange={(event) => setListSearch(event.target.value)}
              placeholder="جست‌وجوی ماده اولیه"
            />
          </label>
          <small>{numberFormat.format(visibleIngredients.length)} مورد</small>
        </div>
        {visibleIngredients.length === 0 ? (
          <div className="empty-products">
            <Icons name="ingredients" />
            <strong>
              {ingredients.length
                ? "ماده‌ای در این دسته پیدا نشد"
                : "هنوز ماده اولیه‌ای ثبت نشده"}
            </strong>
            <p>دسته یا عبارت جست‌وجو را تغییر بده، یا یک ماده جدید ثبت کن.</p>
          </div>
        ) : (
          <div className="table-wrap ingredient-table-wrap">
            <table className="products-table ingredient-table">
              <thead>
                <tr>
                  <th>ماده اولیه</th>
                  <th>دسته</th>
                  <th>بسته‌ی خرید</th>
                  <th>قیمت جاری</th>
                  <th>قیمت هر واحد</th>
                  <th>تاریخچه</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {visibleIngredients.map((ingredient) => {
                  const purchaseLabel = purchaseUnits.find(
                    (item) => item.value === ingredient.purchaseUnit,
                  )?.label;
                  const usedBy = usageByIngredient.get(ingredient.id) ?? 0;
                  return (
                    <tr
                      key={ingredient.id}
                      className={
                        editingId === ingredient.id
                          ? "editing-material-row"
                          : ""
                      }
                    >
                      <td className="ingredient-name-cell">
                        {ingredient.name}
                      </td>
                      <td>
                        <span className="category-pill">
                          {ingredient.category ?? "سایر"}
                        </span>
                      </td>
                      <td>
                        {numberFormat.format(ingredient.purchaseQuantity)}{" "}
                        {purchaseLabel}
                      </td>
                      <td>{formatMoney(ingredient.purchasePrice)}</td>
                      <td className="positive">
                        {formatMoney(unitPrice(ingredient))} /{" "}
                        {baseUnitLabel(baseUnit(ingredient.purchaseUnit))}
                      </td>
                      <td>
                        <button
                          className="history-button"
                          onClick={() => setHistoryId(ingredient.id)}
                        >
                          مشاهده (
                          {numberFormat.format(
                            ingredient.priceHistory?.length ?? 0,
                          )}
                          )
                        </button>
                      </td>
                      <td>
                        <div className="material-row-actions">
                          <button
                            className="edit-material"
                            onClick={() => startEditing(ingredient)}
                          >
                            ویرایش
                          </button>
                          <button
                            className="remove-line"
                            onClick={() => deleteIngredient(ingredient.id)}
                            disabled={usedBy > 0}
                            title={
                              usedBy
                                ? "این ماده در دستور پخت استفاده شده؛ ابتدا از محصول جداش کن"
                                : "حذف ماده اولیه"
                            }
                            aria-label={`حذف ${ingredient.name}`}
                          >
                            <Icons name="close" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="local-storage-note">
        قیمت ثبت‌شده در تاریخ‌های گذشته فقط در تاریخچه ذخیره می‌شود. قیمت جاری
        ماده مبنای محاسبه‌ی همه‌ی محصولات است. اطلاعات فعلاً در همین مرورگر
        ذخیره می‌شود.
      </p>

      {historyIngredient && (
        <div
          className="material-modal-backdrop"
          role="presentation"
          onMouseDown={() => setHistoryId(null)}
        >
          <section
            className="material-modal history-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setHistoryId(null)}
              aria-label="بستن"
            >
              <Icons name="close" />
            </button>
            <p className="eyebrow">تغییرات قیمت</p>
            <h2 id="history-dialog-title">
              تاریخچه‌ی {historyIngredient.name}
            </h2>
            <p className="modal-description">
              قیمت جاری مبنای دستور پخت است؛ این فهرست تغییرات ثبت‌شده را نشان
              می‌دهد.
            </p>
            {(historyIngredient.priceHistory?.length ?? 0) === 0 ? (
              <div className="category-empty">
                هنوز سابقه‌ای ثبت نشده. با ویرایش قیمت و انتخاب تاریخ، اولین
                رکورد اضافه می‌شود.
              </div>
            ) : (
              <div className="history-list">
                {[...(historyIngredient.priceHistory ?? [])]
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((entry, index, sorted) => {
                    const previous = sorted[index - 1];
                    const currentUnitPrice = historicalUnitPrice(entry);
                    const change = previous
                      ? ((currentUnitPrice - historicalUnitPrice(previous)) /
                          historicalUnitPrice(previous)) *
                        100
                      : null;
                    return (
                      <article
                        className="history-entry"
                        key={`${entry.date}-${index}`}
                      >
                        <div>
                          <strong>{jalaliDateLabel(entry.date)}</strong>
                          <small>
                            {numberFormat.format(entry.purchaseQuantity)}{" "}
                            {
                              purchaseUnits.find(
                                (item) => item.value === entry.purchaseUnit,
                              )?.label
                            }
                          </small>
                        </div>
                        <div>
                          <strong>{formatMoney(entry.purchasePrice)}</strong>
                          <small>
                            {formatMoney(currentUnitPrice)} /{" "}
                            {baseUnitLabel(baseUnit(entry.purchaseUnit))}
                          </small>
                        </div>
                        <span
                          className={
                            change === null
                              ? "history-change neutral"
                              : change > 0
                                ? "history-change increase"
                                : change < 0
                                  ? "history-change decrease"
                                  : "history-change neutral"
                          }
                        >
                          {change === null ? (
                            "مبنای ثبت"
                          ) : (
                            <>
                              {change > 0 ? (
                                <Icons
                                  name="up-arrow"
                                  className="inline-icon"
                                />
                              ) : change < 0 ? (
                                <Icons className="shared-down-arrow history-down-arrow" />
                              ) : null}
                              {numberFormat.format(Math.abs(change))}٪
                            </>
                          )}
                        </span>
                      </article>
                    );
                  })
                  .reverse()}
              </div>
            )}
            <div className="history-current-price">
              <span>قیمت جاری مورد استفاده در دستور پخت</span>
              <strong>
                {formatMoney(historyIngredient.purchasePrice)} /{" "}
                {
                  purchaseUnits.find(
                    (item) => item.value === historyIngredient.purchaseUnit,
                  )?.label
                }
              </strong>
              <button
                className="edit-material"
                onClick={() => {
                  setHistoryId(null);
                  startEditing(historyIngredient);
                }}
              >
                <Icons name="add" className="inline-icon" /> ثبت قیمت جدید
              </button>
            </div>
          </section>
        </div>
      )}
      <DashboardShortcut />
    </main>
  );
}
