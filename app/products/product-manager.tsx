"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  baseUnit,
  baseUnitLabel,
  formatMoney,
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

  useEffect(() => {
    try {
      const savedIngredients = localStorage.getItem(INGREDIENTS_KEY);
      const savedProducts = localStorage.getItem(PRODUCTS_KEY);
      const migrated = migrateDemoTomato(
        savedIngredients ? JSON.parse(savedIngredients) as Ingredient[] : initialIngredients,
        savedProducts ? JSON.parse(savedProducts) as Product[] : initialProducts,
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
    function refreshIngredients() {
      const saved = localStorage.getItem(INGREDIENTS_KEY);
      if (saved) setIngredients(JSON.parse(saved) as Ingredient[]);
    }
    window.addEventListener("hesabchi:ingredients-updated", refreshIngredients);
    return () => window.removeEventListener("hesabchi:ingredients-updated", refreshIngredients);
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

  function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanRecipe = recipe.filter(
      (line) => ingredientById.has(line.ingredientId) && line.quantity > 0,
    );
    if (!productName.trim() || priceValue <= 0 || cleanRecipe.length === 0)
      return;
    setProducts((current) => [
      {
        id: makeId(),
        name: productName.trim(),
        sellingPrice: priceValue,
        recipe: cleanRecipe,
      },
      ...current,
    ]);
    setProductName("");
    setSellingPrice("");
    setRecipe([{ ingredientId: ingredients[0]?.id ?? "", quantity: 0 }]);
    setNotice("محصول ذخیره شد و بهای مواد اولیه آن محاسبه شد.");
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
            ← برگشت به داشبورد
          </Link>
          <p className="eyebrow">مدیریت منو و دستور پخت</p>
          <h1>محصولات و قیمت تمام‌شده</h1>
          <p className="page-description">
            از فهرست مواد اولیه انتخاب کن و هزینه‌ی هر پرس را ببین.
          </p>
        </div>
        <Link className="primary-button" href="#new-product">
          ＋ محصول جدید
        </Link>
      </div>

      {notice && (
        <div className="products-notice" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="بستن پیام">
            ×
          </button>
        </div>
      )}

      <section className="product-summary" aria-label="خلاصه محصولات">
        <article>
          <span className="summary-icon">▤</span>
          <div>
            <small>محصولات ثبت‌شده</small>
            <strong>{numberFormat.format(products.length)}</strong>
          </div>
        </article>
        <article>
          <span className="summary-icon">◈</span>
          <div>
            <small>میانگین حاشیه سود مواد اولیه</small>
            <strong>{numberFormat.format(averageMargin * 100) + "٪"}</strong>
          </div>
        </article>
        <article>
          <span className="summary-icon">◉</span>
          <div>
            <small>مواد اولیه فعال</small>
            <strong>{numberFormat.format(ingredients.length)}</strong>
          </div>
        </article>
      </section>

      <div className="product-workspace">
        <section className="panel product-form-panel" id="new-product">
          <div className="panel-heading product-panel-heading">
            <div>
              <h2>تعریف محصول و دستور پخت</h2>
              <p>مقدار هر ماده برای تهیه‌ی یک پرس را وارد کن؛ قیمت روز مواد از بخش مواد اولیه محاسبه می‌شود.</p>
            </div>
            <div className="panel-heading-actions"><Link className="text-button" href="/materials">مدیریت مواد اولیه ←</Link><span className="panel-step">۱</span></div>
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
                ＋ افزودن ماده
              </button>
            </div>
            {ingredients.length === 0 ? (
              <p className="empty-inline">اول از <Link href="/materials">بخش مواد اولیه</Link>، یک ماده ثبت کن.</p>
            ) : (
              <div className="recipe-lines">
                {recipe.map((line, index) => {
                  const selected = ingredientById.get(line.ingredientId);
                  return (
                    <div
                      className="recipe-line"
                      key={`${index}-${line.ingredientId}`}
                    >
                      <select
                        aria-label="انتخاب ماده اولیه"
                        value={line.ingredientId}
                        onChange={(event) =>
                          updateRecipeLine(index, {
                            ingredientId: event.target.value,
                          })
                        }
                      >
                        {ingredients.map((ingredient) => (
                          <option value={ingredient.id} key={ingredient.id}>
                            {ingredient.name}
                          </option>
                        ))}
                      </select>
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
                        ×
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
            <button
              className="primary-button save-product"
              type="submit"
              disabled={!ingredients.length}
            >
              ذخیره محصول
            </button>
          </form>
        </section>

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
          {products.length === 0 ? (
            <div className="empty-products">
              <span>◈</span>
              <strong>هنوز محصولی ثبت نکردی</strong>
              <p>از فرم کنار صفحه اولین محصولت را بساز.</p>
            </div>
          ) : (
            <div className="managed-product-list">
              {products.map((product) => {
                const cost = recipeCost(product.recipe, ingredients);
                const margin = product.sellingPrice
                  ? (product.sellingPrice - cost) / product.sellingPrice
                  : 0;
                return (
                  <article className="managed-product" key={product.id}>
                    <div className="managed-product-title">
                      <span className="product-emoji">🥪</span>
                      <div>
                        <h3>{product.name}</h3>
                        <p>{product.recipe.length} قلم مواد اولیه</p>
                      </div>
                      <button
                        className="remove-line delete-product"
                        onClick={() => removeProduct(product.id)}
                        aria-label={`حذف ${product.name}`}
                      >
                        ×
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
                        const ingredient = ingredientById.get(
                          line.ingredientId,
                        );
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
      </div>

      <p className="local-storage-note">
        اطلاعات این نمونه روی همین مرورگر ذخیره می‌شود و هنوز به پنل کاربری یا
        پایگاه داده متصل نیست.
      </p>
    </main>
  );
}
