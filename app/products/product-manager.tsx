"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import Icons from "../components/icons";
import DashboardShortcut from "../components/dashboard-shortcut";
import {
  baseUnit,
  baseUnitLabel,
  formatMoney,
  ingredientCategories,
  IngredientCategory,
  INGREDIENTS_KEY,
  initialIngredients,
  initialProducts,
  makeId,
  migrateDemoTomato,
  numberFormat,
  Product,
  PRODUCTS_KEY,
  RecipeLine,
  recipeCost,
  Ingredient,
  unitPrice,
} from "../lib/costing";

export default function ProductManager() {
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [products, setProducts] = useState(initialProducts);
  const [ready, setReady] = useState(false);
  const [productName, setProductName] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [recipe, setRecipe] = useState<RecipeLine[]>([
    { ingredientId: "chicken", quantity: 0 },
  ]);
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [listSearch, setListSearch] = useState("");
  const [recipePickerIndex, setRecipePickerIndex] = useState<number | null>(null);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [ingredientCategory, setIngredientCategory] = useState<
    IngredientCategory | "all"
  >("all");

  useEffect(() => {
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
      setIngredients(migrated.ingredients);
      setProducts(migrated.products);
    } catch {
      setNotice(
        "اطلاعات ذخیره‌شده خوانده نشد؛ داده‌های نمونه نمایش داده می‌شود.",
      );
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(ingredients));
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }, [ingredients, products, ready]);

  useEffect(() => {
    if (!ready || !ingredients.length) return;
    setRecipe((current) =>
      current.map((line) =>
        ingredients.some((ingredient) => ingredient.id === line.ingredientId)
          ? line
          : { ...line, ingredientId: ingredients[0].id },
      ),
    );
  }, [ready, ingredients]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    function refreshIngredients() {
      const saved = localStorage.getItem(INGREDIENTS_KEY);
      if (saved) setIngredients(JSON.parse(saved) as Ingredient[]);
    }
    window.addEventListener("hesabchi:ingredients-updated", refreshIngredients);
    return () =>
      window.removeEventListener(
        "hesabchi:ingredients-updated",
        refreshIngredients,
      );
  }, []);

  const ingredientById = useMemo(
    () =>
      new Map<string, Ingredient>(
        ingredients.map((ingredient) => [ingredient.id, ingredient]),
      ),
    [ingredients],
  );
  const draftCost = recipeCost(recipe, ingredients);
  const priceValue = Number(sellingPrice) || 0;
  const draftMargin =
    priceValue > 0 ? ((priceValue - draftCost) / priceValue) * 100 : 0;
  const averageMargin = products.length
    ? products.reduce((sum, product) => {
        const cost = recipeCost(product.recipe, ingredients);
        return (
          sum +
          (product.sellingPrice > 0
            ? (product.sellingPrice - cost) / product.sellingPrice
            : 0)
        );
      }, 0) / products.length
    : 0;
  const visibleProducts = products.filter((product) =>
    product.name
      .toLocaleLowerCase("fa")
      .includes(listSearch.trim().toLocaleLowerCase("fa")),
  );
  const pickerIngredients = ingredients.filter((ingredient) => {
    const matchesCategory =
      ingredientCategory === "all" ||
      (ingredient.category ?? "سایر") === ingredientCategory;
    const matchesSearch = ingredient.name
      .toLocaleLowerCase("fa")
      .includes(ingredientSearch.trim().toLocaleLowerCase("fa"));
    return matchesCategory && matchesSearch;
  });

  function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanRecipe = recipe.filter(
      (line) => ingredientById.has(line.ingredientId) && line.quantity > 0,
    );
    if (!productName.trim() || priceValue <= 0 || cleanRecipe.length === 0)
      return;
    const product: Product = {
      id: editingProductId ?? makeId(),
      name: productName.trim(),
      sellingPrice: priceValue,
      recipe: cleanRecipe,
    };
    setProducts((current) =>
      editingProductId
        ? current.map((item) => (item.id === editingProductId ? product : item))
        : [product, ...current],
    );
    setProductName("");
    setSellingPrice("");
    setRecipe([{ ingredientId: ingredients[0]?.id ?? "", quantity: 0 }]);
    if (editingProductId) {
      setEditingProductId(null);
      setFormOpen(false);
      setNotice("تغییرات محصول ذخیره شد.");
    } else {
      setNotice("محصول جدید اضافه شد.");
    }
  }

  function prepareNewProduct() {
    setEditingProductId(null);
    setProductName("");
    setSellingPrice("");
    setRecipe([{ ingredientId: ingredients[0]?.id ?? "", quantity: 0 }]);
    setFormOpen(true);
  }

  function startEditingProduct(product: Product) {
    setEditingProductId(product.id);
    setProductName(product.name);
    setSellingPrice(String(product.sellingPrice));
    setRecipe(product.recipe.map((line) => ({ ...line })));
    setFormOpen(true);
  }

  function closeProductForm() {
    setFormOpen(false);
    setEditingProductId(null);
    setProductName("");
    setSellingPrice("");
    setRecipe([{ ingredientId: ingredients[0]?.id ?? "", quantity: 0 }]);
  }

  function openIngredientPicker(index: number) {
    setRecipePickerIndex(index);
    setIngredientSearch("");
    setIngredientCategory("all");
  }

  function closeIngredientPicker() {
    setRecipePickerIndex(null);
    setIngredientSearch("");
    setIngredientCategory("all");
  }

  function selectRecipeIngredient(ingredientId: string) {
    if (recipePickerIndex === null) return;
    updateRecipeLine(recipePickerIndex, { ingredientId });
    closeIngredientPicker();
  }

  function removeProduct(id: string) {
    setProducts((current) => current.filter((product) => product.id !== id));
  }

  function updateRecipeLine(index: number, patch: Partial<RecipeLine>) {
    setRecipe((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line,
      ),
    );
  }

  return (
    <main className="main-area products-page">
      <div className="products-topbar">
        <div>
          <Link href="/" className="back-link">
            <Icons name="back" className="inline-icon" /> برگشت به داشبورد
          </Link>
          <p className="eyebrow">مدیریت منو و دستور پخت</p>
          <h1>محصولات و قیمت تمام‌شده</h1>
          <p className="page-description">
            از فهرست مواد اولیه انتخاب کن و هزینه‌ی هر پرس را ببین.
          </p>
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={prepareNewProduct}
        >
          <Icons name="add" className="inline-icon" /> محصول جدید
        </button>
      </div>

      {notice && (
        <div
          className={`products-notice${formOpen ? " product-toast" : ""}`}
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
            if (event.target === event.currentTarget) closeProductForm();
          }}
        >
          <section
            className="panel product-form-panel material-modal product-entry-modal"
            id="new-product"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
          >
            <button
              className="modal-close"
              type="button"
              onClick={closeProductForm}
              aria-label="بستن فرم"
            >
              <Icons name="close" />
            </button>
            <div className="panel-heading product-panel-heading">
              <div>
                <h2 id="product-form-title">
                  {editingProductId
                    ? "ویرایش محصول و دستور پخت"
                    : "تعریف محصول و دستور پخت"}
                </h2>
                <p>
                  مقدار هر ماده برای تهیه‌ی یک پرس را وارد کن؛ قیمت روز مواد از
                  بخش مواد اولیه محاسبه می‌شود.
                </p>
              </div>
              <div className="panel-heading-actions">
                <Link className="text-button" href="/materials">
                  مدیریت مواد اولیه{" "}
                  <Icons name="back" className="inline-icon" />
                </Link>
              </div>
            </div>
            <form onSubmit={submitProduct}>
              <label className="product-field">
                <span>نام محصول</span>
                <input
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                  placeholder="مثلاً ساندویچ مرغ گریل"
                  required
                />
              </label>
              <label className="product-field">
                <span>قیمت فروش (تومان)</span>
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={sellingPrice}
                  onChange={(event) => setSellingPrice(event.target.value)}
                  placeholder="مثلاً ۳۲۰۰۰۰"
                  required
                />
              </label>

              <div className="recipe-heading">
                <span>مواد لازم برای هر پرس</span>
                <button
                  type="button"
                  className="text-button"
                  onClick={() =>
                    setRecipe((current) => [
                      ...current,
                      { ingredientId: ingredients[0]?.id ?? "", quantity: 0 },
                    ])
                  }
                  disabled={!ingredients.length}
                >
                  <Icons name="add" className="inline-icon" /> افزودن ماده
                </button>
              </div>
              {ingredients.length === 0 ? (
                <p className="empty-inline">
                  اول از <Link href="/materials">بخش مواد اولیه</Link>، یک ماده
                  ثبت کن.
                </p>
              ) : (
                <div className="recipe-lines">
                  {recipe.map((line, index) => {
                    const selected = ingredientById.get(line.ingredientId);
                    return (
                      <div
                        className="recipe-line"
                        key={`${index}-${line.ingredientId}`}
                      >
                      <button
                        className="recipe-ingredient-trigger"
                        type="button"
                        onClick={() => openIngredientPicker(index)}
                        aria-label={`انتخاب ماده اولیه برای ردیف ${numberFormat.format(index + 1)}`}
                      >
                        <span>{selected?.name ?? "انتخاب ماده اولیه"}</span>
                        <Icons name="down-arrow" />
                      </button>
                        <input
                          aria-label="مقدار مصرف"
                          type="number"
                          min="0"
                          step="any"
                          value={line.quantity || ""}
                          onChange={(event) =>
                            updateRecipeLine(index, {
                              quantity: Number(event.target.value),
                            })
                          }
                          placeholder="مقدار"
                        />
                        <span className="recipe-unit">
                          {selected
                            ? baseUnitLabel(baseUnit(selected.purchaseUnit))
                            : ""}
                        </span>
                        <button
                          type="button"
                          className="remove-line"
                          onClick={() =>
                            setRecipe((current) =>
                              current.filter(
                                (_, lineIndex) => lineIndex !== index,
                              ),
                            )
                          }
                          aria-label="حذف ماده"
                        >
                          <Icons name="close" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="cost-preview">
                <div>
                  <small>بهای مواد اولیه هر پرس</small>
                  <strong>{formatMoney(draftCost)}</strong>
                </div>
                <div>
                  <small>سود پس از کسر مواد اولیه</small>
                  <strong
                    className={draftMargin < 0 ? "loss-value" : "profit-value"}
                  >
                    {priceValue ? formatMoney(priceValue - draftCost) : "—"}
                  </strong>
                </div>
                <div>
                  <small>حاشیه سود</small>
                  <strong
                    className={draftMargin < 0 ? "loss-value" : "profit-value"}
                  >
                    {priceValue ? `${numberFormat.format(draftMargin)}٪` : "—"}
                  </strong>
                </div>
              </div>
              <p className="calculation-note">
                فعلاً هزینه‌ی مواد اولیه محاسبه شده؛ هزینه‌های سربار و حقوق در
                محاسبه‌ی کامل محصول اضافه می‌شوند.
              </p>
              <div className="material-form-actions product-form-actions">
                <button
                  className="primary-button save-product"
                  type="submit"
                  disabled={!ingredients.length}
                >
                  {editingProductId ? "ذخیره تغییرات" : "ذخیره محصول"}
                </button>
                {editingProductId && (
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={closeProductForm}
                  >
                    لغو ویرایش
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      )}

      {recipePickerIndex !== null && (
        <div
          className="material-modal-backdrop ingredient-picker-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeIngredientPicker();
          }}
        >
          <section
            className="material-modal ingredient-picker-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ingredient-picker-title"
          >
            <button
              className="modal-close"
              type="button"
              onClick={closeIngredientPicker}
              aria-label="بستن فهرست مواد اولیه"
            >
              <Icons name="close" />
            </button>
            <p className="eyebrow">دستور پخت محصول</p>
            <h2 id="ingredient-picker-title">انتخاب ماده اولیه</h2>
            <p className="modal-description">
              نام ماده را جست‌وجو کن یا دسته‌بندی را برای دیدن مواد آن انتخاب کن.
            </p>
            <label className="product-field modal-search">
              <span>جست‌وجوی ماده</span>
              <input
                autoFocus
                value={ingredientSearch}
                onChange={(event) => setIngredientSearch(event.target.value)}
                placeholder="مثلاً گوجه‌فرنگی"
              />
            </label>
            <label className="product-field ingredient-category-select">
              <span>دسته‌بندی</span>
              <select
                value={ingredientCategory}
                onChange={(event) =>
                  setIngredientCategory(
                    event.target.value as IngredientCategory | "all",
                  )
                }
              >
                <option value="all">همه‌ی دسته‌ها</option>
                {ingredientCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <div className="category-item-list ingredient-choice-list">
              {pickerIngredients.length ? (
                pickerIngredients.map((ingredient) => (
                  <button
                    className="category-item-option"
                    type="button"
                    key={ingredient.id}
                    onClick={() => selectRecipeIngredient(ingredient.id)}
                  >
                    <span>
                      <strong>{ingredient.name}</strong>
                      <small>
                        {ingredient.category ?? "سایر"} · هر{" "}
                        {baseUnitLabel(baseUnit(ingredient.purchaseUnit))}: {" "}
                        {formatMoney(unitPrice(ingredient))}
                      </small>
                    </span>
                    <Icons name="choose" className="inline-icon" />
                  </button>
                ))
              ) : (
                <p className="category-empty">
                  ماده‌ای با این نام یا دسته پیدا نشد.
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      <section className="panel product-list-panel">
        <div className="panel-heading product-panel-heading">
          <div>
            <h2>فهرست محصولات</h2>
            <p>محاسبه بر اساس آخرین قیمت مواد اولیه</p>
          </div>
          <span className="panel-step">
            {numberFormat.format(products.length)}
          </span>
        </div>
        <div className="product-list-toolbar">
          <label className="product-field product-search">
            <span>جست‌وجوی محصول</span>
            <input
              value={listSearch}
              onChange={(event) => setListSearch(event.target.value)}
              placeholder="نام محصول را بنویس"
            />
          </label>
          <small>{numberFormat.format(visibleProducts.length)} مورد</small>
        </div>
        {visibleProducts.length === 0 ? (
          <div className="empty-products">
            <Icons name="ingredients" />
            <strong>
              {products.length
                ? "محصولی با این نام پیدا نشد"
                : "هنوز محصولی ثبت نکردی"}
            </strong>
            <p>
              {products.length
                ? "عبارت جست‌وجو را تغییر بده."
                : "با دکمهٔ «محصول جدید» اولین محصولت را بساز."}
            </p>
          </div>
        ) : (
          <div className="managed-product-list">
            {visibleProducts.map((product) => {
              const cost = recipeCost(product.recipe, ingredients);
              const margin = product.sellingPrice
                ? (product.sellingPrice - cost) / product.sellingPrice
                : 0;
              return (
                <article className="managed-product" key={product.id}>
                  <div className="managed-product-title">
                    <Icons name="sandwich" className="product-emoji" />
                    <div>
                      <h3>{product.name}</h3>
                      <p>{product.recipe.length} قلم مواد اولیه</p>
                    </div>
                    <button
                      className="edit-material"
                      type="button"
                      onClick={() => startEditingProduct(product)}
                    >
                      ویرایش
                    </button>
                    <button
                      className="remove-line delete-product"
                      onClick={() => removeProduct(product.id)}
                      aria-label={`حذف ${product.name}`}
                    >
                      <Icons name="close" />
                    </button>
                  </div>
                  <div className="managed-product-stats">
                    <div>
                      <small>بهای مواد</small>
                      <strong>{formatMoney(cost)}</strong>
                    </div>
                    <div>
                      <small>قیمت فروش</small>
                      <strong>{formatMoney(product.sellingPrice)}</strong>
                    </div>
                    <div>
                      <small>حاشیه سود</small>
                      <strong
                        className={margin < 0 ? "loss-value" : "profit-value"}
                      >
                        {numberFormat.format(margin * 100)}٪
                      </strong>
                    </div>
                  </div>
                  <div className="ingredient-chips">
                    {product.recipe.map((line) => {
                      const ingredient = ingredientById.get(line.ingredientId);
                      return ingredient ? (
                        <span key={line.ingredientId}>
                          {ingredient.name} ·{" "}
                          {numberFormat.format(line.quantity)}{" "}
                          {baseUnitLabel(baseUnit(ingredient.purchaseUnit))}
                        </span>
                      ) : null;
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <DashboardShortcut />
    </main>
  );
}
