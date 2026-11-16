"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import DashboardShortcut from "../components/dashboard-shortcut";
import Icons from "../components/icons";
import {
  Ingredient,
  INGREDIENTS_KEY,
  initialIngredients,
  initialProducts,
  makeId,
  Product,
  PRODUCTS_KEY,
} from "../lib/costing";
import { getSupabaseClient, MenuItem } from "../lib/supabase-client";

function readIngredients(value: MenuItem["ingredients"]): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeName(value: string) {
  return value.normalize("NFKC").replace(/[\s\u200c]+/g, " ").trim().toLocaleLowerCase("fa");
}

export default function MenuManager() {
  const [configured, setConfigured] = useState(true);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [notice, setNotice] = useState("");
  const [importedIds, setImportedIds] = useState<string[]>([]);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setConfigured(false);
      setLoading(false);
      return;
    }
    const supabaseClient = client;
    let active = true;
    async function loadMenu() {
      const { data, error: queryError } = await supabaseClient
        .from("menu_items")
        .select("*")
        .eq("is_available", true)
        .eq("is_archived", false)
        .order("category", { ascending: true })
        .order("name_fa", { ascending: true });
      if (!active) return;
      if (queryError) setError(queryError.message);
      else setItems((data ?? []) as MenuItem[]);
      setLoading(false);
    }
    loadMenu();
    try {
      const savedProducts = JSON.parse(
        localStorage.getItem(PRODUCTS_KEY) ?? JSON.stringify(initialProducts),
      ) as Product[];
      setImportedIds(savedProducts.map((product) => product.id));
    } catch {
      setImportedIds([]);
    }
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter((value): value is string => Boolean(value)))],
    [items],
  );
  const visibleItems = items.filter((item) => {
    const matchesCategory = category === "all" || item.category === category;
    const term = search.trim().toLocaleLowerCase("fa");
    const matchesSearch =
      !term ||
      item.name_fa.toLocaleLowerCase("fa").includes(term) ||
      (item.name_en ?? "").toLocaleLowerCase("en").includes(term) ||
      (item.description ?? "").toLocaleLowerCase("fa").includes(term);
    return matchesCategory && matchesSearch;
  });

  function addMenuItem(item: MenuItem) {
    const productId = `banakar-${item.slug || item.id}`;
    try {
      const products = JSON.parse(
        localStorage.getItem(PRODUCTS_KEY) ?? JSON.stringify(initialProducts),
      ) as Product[];
      if (products.some((product) => product.id === productId)) {
        setNotice("این محصول قبلاً به فهرست محصولات اضافه شده است.");
        setSelectedItem(null);
        return;
      }
      const ingredients = JSON.parse(
        localStorage.getItem(INGREDIENTS_KEY) ?? JSON.stringify(initialIngredients),
      ) as Ingredient[];
      const recipe = readIngredients(item.ingredients).map((ingredientName) => {
        let ingredient = ingredients.find(
          (candidate) => normalizeName(candidate.name) === normalizeName(ingredientName),
        );
        if (!ingredient) {
          ingredient = {
            id: makeId(),
            name: ingredientName.trim(),
            category: "سایر",
            purchaseQuantity: 1,
            purchaseUnit: "count",
            purchasePrice: 0,
            priceHistory: [],
          };
          ingredients.push(ingredient);
        }
        return { ingredientId: ingredient.id, quantity: 0 };
      });
      const product: Product = {
        id: productId,
        name: item.name_fa,
        sellingPrice: Number(item.price) || 0,
        recipe,
      };
      localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(ingredients));
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify([product, ...products]));
      window.dispatchEvent(new Event("hesabchi:ingredients-updated"));
      window.dispatchEvent(new Event("hesabchi:products-updated"));
      setImportedIds((current) => [...current, productId]);
      setSelectedItem(null);
      setNotice("محصول و نام مواد اولیه اضافه شدند؛ مقدار مصرف و قیمت‌ها را در پنل تکمیل کن.");
    } catch {
      setNotice("افزودن محصول انجام نشد. دوباره تلاش کن.");
    }
  }

  return (
    <main className="main-area products-page menu-page">
      <div className="products-topbar">
        <div>
          <Link href="/" className="back-link"><Icons name="back" className="inline-icon" /> بازگشت به داشبورد</Link>
          <p className="eyebrow">فهرست منوی بناکار</p>
          <h1>منوی رستوران</h1>
          <p className="page-description">محصولات منو را مرور کن و هر مورد را همراه نام مواد تشکیل‌دهنده به فهرست محصولات حسابچی اضافه کن.</p>
        </div>
      </div>

      {!configured ? (
        <section className="panel menu-state menu-error">
          <strong>تنظیم اتصال Supabase</strong>
          <p>در فایل .env.local مقدار Project URL و Publishable key را قرار بده و سرور توسعه را دوباره اجرا کن.</p>
        </section>
      ) : (
        <>
          {notice && <div className="products-notice" role="status">{notice}</div>}
          <section className="panel menu-catalog-panel">
            <div className="menu-toolbar">
              <label className="product-field menu-search"><span>جست‌وجوی منو</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="نام محصول یا توضیحات" /></label>
              <label className="product-field menu-category"><span>دسته‌بندی</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">همهٔ دسته‌ها</option>{categories.map((itemCategory) => <option key={itemCategory}>{itemCategory}</option>)}</select></label>
              <span className="menu-count">{visibleItems.length.toLocaleString("fa-IR")} محصول</span>
            </div>
            {loading ? <div className="menu-state">در حال دریافت منو…</div> : error ? (
              <div className="menu-state menu-error"><strong>منو بارگذاری نشد</strong><p>{error}</p><small>دسترسی خواندن جدول menu_items را در تنظیمات Supabase بررسی کن.</small></div>
            ) : visibleItems.length === 0 ? <div className="menu-state">محصولی در این دسته پیدا نشد.</div> : (
              <div className="menu-grid">
                {visibleItems.map((item) => {
                  const alreadyAdded = importedIds.includes(`banakar-${item.slug || item.id}`);
                  return <article className="menu-item-card" key={item.id}>
                    <div className="menu-item-heading"><div><span className="menu-item-category">{item.category || "بدون دسته"}</span><h2>{item.name_fa}</h2></div>{item.is_featured && <span className="menu-featured">ویژه</span>}</div>
                    {item.description && <p className="menu-item-description">{item.description}</p>}
                    <div className="menu-item-meta"><strong>{(Number(item.price) || 0).toLocaleString("fa-IR")} تومان</strong>{item.preparation_time && <span>{item.preparation_time}</span>}</div>
                    <div className="menu-ingredient-preview"><span>مواد تشکیل‌دهنده</span><p>{readIngredients(item.ingredients).length ? readIngredients(item.ingredients).join("، ") : "برای این محصول ماده‌ای ثبت نشده"}</p></div>
                    <button className={alreadyAdded ? "secondary-button menu-add-button" : "primary-button menu-add-button"} type="button" disabled={alreadyAdded} onClick={() => setSelectedItem(item)}><Icons name={alreadyAdded ? "paid" : "add"} className="inline-icon" />{alreadyAdded ? "اضافه‌شده به محصولات" : "افزودن به محصولات"}</button>
                  </article>;
                })}
              </div>
            )}
          </section>
        </>
      )}

      {selectedItem && (
        <div className="material-modal-backdrop menu-import-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedItem(null); }}>
          <section className="material-modal menu-import-modal" role="alertdialog" aria-modal="true" aria-labelledby="menu-import-title">
            <button className="modal-close" type="button" onClick={() => setSelectedItem(null)} aria-label="بستن"><Icons name="close" /></button>
            <p className="eyebrow">افزودن محصول از منو</p><h2 id="menu-import-title">{selectedItem.name_fa}</h2>
            <p className="modal-description">محصول با قیمت فروش منو اضافه می‌شود. نام مواد اولیه هم اضافه می‌شود، اما CSV مقدار مصرف و قیمت خرید ندارد؛ آن‌ها را بعداً در بخش‌های مربوط تکمیل کن.</p>
            <div className="menu-import-ingredients">{readIngredients(selectedItem.ingredients).length ? readIngredients(selectedItem.ingredients).map((name, index) => <span key={`${name}-${index}`}>{name}</span>) : <span>فهرست مواد اولیه برای این محصول خالی است.</span>}</div>
            <div className="confirm-delete-actions"><button className="secondary-button" type="button" onClick={() => setSelectedItem(null)}>انصراف</button><button className="primary-button" type="button" onClick={() => addMenuItem(selectedItem)}>افزودن محصول و مواد</button></div>
          </section>
        </div>
      )}
      <DashboardShortcut />
    </main>
  );
}
