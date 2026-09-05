"use client";

import { useEffect, useMemo, useState } from "react";

type Brand = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  name: string;
};

type PackSize = {
  id: string;
  label: string;
  grams: number;
};

type VariantRow = {
  id?: string;
  packSizeId: string;
  sku: string;
  mrp: string;
  price: string;
  specialPrice: string;
  stock: string;
};

type ProductVariant = {
  id: string;
  sku: string;
  price: string | number;
  mrp: string | number | null;
  specialPrice: string | number | null;
  packSize: {
    id: string;
    label: string;
    grams: number;
  };
  inventory: {
    quantity: number;
    status: string;
  } | null;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  brand: Brand;
  category: Category;
  variants: ProductVariant[];
};

export default function AdminProductsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] =
    useState<Category[]>([]);
  const [packSizes, setPackSizes] =
    useState<PackSize[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [productLoading, setProductLoading] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [showInactive, setShowInactive] =
    useState(true);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [name, setName] =
    useState("");

  const [brandId, setBrandId] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [imageUrl, setImageUrl] =
    useState("");

  const [variants, setVariants] =
    useState<VariantRow[]>([
      {
        packSizeId: "",
        sku: "",
        mrp: "",
        price: "",
        specialPrice: "",
        stock: "",
      },
    ]);

  async function loadMasterData() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/admin/products",
        {
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        window.location.href =
          "/admin/login?next=/admin/products";
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to load data."
        );
      }

      setBrands(data.brands || []);
      setCategories(
        data.categories || []
      );
      setPackSizes(
        data.packSizes || []
      );
      setProducts(
        data.products || []
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to load product data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function refreshProducts() {
    try {
      setProductLoading(true);
      setMessage("");

      const response = await fetch(
        "/api/admin/products",
        {
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        window.location.href =
          "/admin/login?next=/admin/products";
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to refresh products."
        );
      }

      setProducts(
        data.products || []
      );

      setBrands(
        data.brands || []
      );

      setCategories(
        data.categories || []
      );

      setPackSizes(
        data.packSizes || []
      );

      setMessage(
        "Products refreshed successfully."
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to refresh products."
      );
    } finally {
      setProductLoading(false);
    }
  }

  useEffect(() => {
    loadMasterData();
  }, []);

  function updateVariant(
    index: number,
    field: keyof VariantRow,
    value: string
  ) {
    setVariants((current) =>
      current.map((variant, i) =>
        i === index
          ? {
              ...variant,
              [field]: value,
            }
          : variant
      )
    );
  }

  function addVariant() {
    setVariants((current) => [
      ...current,
      {
        packSizeId: "",
        sku: "",
        mrp: "",
        price: "",
        specialPrice: "",
        stock: "",
      },
    ]);
  }

  function removeVariant(
    index: number
  ) {
    if (variants.length === 1) {
      return;
    }

    setVariants((current) =>
      current.filter(
        (_, i) => i !== index
      )
    );
  }

  async function saveProduct(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      if (!name.trim()) {
        setMessage(
          "Enter product name."
        );
        return;
      }

      if (!brandId) {
        setMessage(
          "Select a brand."
        );
        return;
      }

      if (!categoryId) {
        setMessage(
          "Select a category."
        );
        return;
      }

      if (!variants.length) {
        setMessage(
          "Add at least one pack size."
        );
        return;
      }

      const response = await fetch(
        "/api/admin/products",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name,
            brandId,
            categoryId,
            description,
            imageUrl,
            variants,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Unable to save product."
        );
        return;
      }

      setMessage(
        `Product "${data.product.name}" saved successfully.`
      );

      setName("");
      setBrandId("");
      setCategoryId("");
      setDescription("");
      setImageUrl("");

      setVariants([
        {
          packSizeId: "",
          sku: "",
          mrp: "",
          price: "",
          specialPrice: "",
          stock: "",
        },
      ]);

      await refreshProducts();
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to save product."
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditing(
    product: Product
  ) {
    setEditingProduct(product);

    setName(product.name);

    setBrandId(
      product.brand.id
    );

    setCategoryId(
      product.category.id
    );

    setDescription(
      product.description || ""
    );

    setImageUrl(
      product.imageUrl || ""
    );

    setVariants(
      product.variants.map((variant) => ({
        id: variant.id,
        packSizeId: variant.packSize.id,
        sku: variant.sku,
        mrp:
          variant.mrp !== null &&
          variant.mrp !== undefined
            ? String(variant.mrp)
            : "",
        price: String(variant.price),
        specialPrice:
          variant.specialPrice !== null &&
          variant.specialPrice !== undefined
            ? String(variant.specialPrice)
            : "",
        stock:
          variant.inventory?.quantity?.toString() || "0",
      }))
    );

    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEditing() {
    setEditingProduct(null);

    setName("");
    setBrandId("");
    setCategoryId("");
    setDescription("");
    setImageUrl("");

    setVariants([
      {
        packSizeId: "",
        sku: "",
        mrp: "",
        price: "",
        specialPrice: "",
        stock: "",
      },
    ]);

    setMessage("");
  }

  async function updateProduct() {
    if (!editingProduct) {
      return;
    }

    if (!name.trim()) {
      setMessage(
        "Enter product name."
      );
      return;
    }

    if (!brandId) {
      setMessage(
        "Select a brand."
      );
      return;
    }

    if (!categoryId) {
      setMessage(
        "Select a category."
      );
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(
        "/api/admin/products",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: editingProduct.id,
            name,
            brandId,
            categoryId,
            description,
            imageUrl,
            variants: variants.map((variant) => ({
              id: variant.id,
              packSizeId: variant.packSizeId,
              sku: variant.sku,
              mrp: variant.mrp,
              price: variant.price,
              specialPrice: variant.specialPrice,
              stock: variant.stock,
            })),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Unable to update product."
        );
        return;
      }

      setMessage(
        `Product "${data.product.name}" updated successfully.`
      );

      setEditingProduct(null);

      setName("");
      setBrandId("");
      setCategoryId("");
      setDescription("");
      setImageUrl("");

      setVariants([
        {
          packSizeId: "",
          sku: "",
          mrp: "",
          price: "",
          specialPrice: "",
          stock: "",
        },
      ]);

      await refreshProducts();
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to update product."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(
    product: Product
  ) {
    try {
      setProductLoading(true);
      setMessage("");

      const response = await fetch(
        "/api/admin/products",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: product.id,
            isActive:
              !product.isActive,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Unable to change product status."
        );
        return;
      }

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                isActive:
                  !item.isActive,
              }
            : item
        )
      );

      setMessage(
        product.isActive
          ? "Product deactivated."
          : "Product activated."
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to change product status."
      );
    } finally {
      setProductLoading(false);
    }
  }

  async function deleteProduct(
    product: Product
  ) {
    const confirmed =
      window.confirm(
        `Delete "${product.name}" permanently?\n\nThis cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setProductLoading(true);
      setMessage("");

      const response = await fetch(
        "/api/admin/products",
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: product.id,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Unable to delete product."
        );
        return;
      }

      setProducts((current) =>
        current.filter(
          (item) =>
            item.id !== product.id
        )
      );

      if (
        editingProduct?.id ===
        product.id
      ) {
        cancelEditing();
      }

      setMessage(
        "Product deleted successfully."
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to delete product."
      );
    } finally {
      setProductLoading(false);
    }
  }

  async function uploadImage(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setMessage(
        "Image must be smaller than 5MB."
      );

      event.target.value = "";

      return;
    }

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    setMessage(
      "Uploading image..."
    );

    try {
      const response =
        await fetch(
          "/api/admin/upload",
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Image upload failed."
        );
        return;
      }

      setImageUrl(
        data.imageUrl
      );

      setMessage(
        "Image uploaded successfully."
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Image upload failed."
      );
    }
  }

  const visibleProducts =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          if (
            !showInactive &&
            !product.isActive
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          return [
            product.name,
            product.brand?.name,
            product.category?.name,
            ...product.variants.map(
              (variant) =>
                variant.sku
            ),
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(query)
            );
        }
      );
    }, [
      products,
      search,
      showInactive,
    ]);

  const activeCount =
    products.filter(
      (product) =>
        product.isActive
    ).length;

  const inactiveCount =
    products.filter(
      (product) =>
        !product.isActive
    ).length;

  const outOfStockCount =
    products.filter(
      (product) =>
        product.variants.length > 0 &&
        product.variants.every(
          (variant) =>
            !variant.inventory ||
            variant.inventory.quantity <=
              0
        )
    ).length;

  if (loading) {
    return (
      <main
        className="container"
        style={{
          padding:
            "35px 0",
        }}
      >
        <h1>
          Product Management
        </h1>

        <p>
          Loading...
        </p>
      </main>
    );
  }

  return (
    <main
      className="container"
      style={{
        padding:
          "35px 0 70px",
      }}
    >
      {/* HEADER */}

      <div
        className="section-row"
        style={{
          alignItems:
            "flex-start",
          gap: 15,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              color: "#07823f",
              fontSize: 9,
              fontWeight: 900,
              letterSpacing:
                ".6px",
            }}
          >
            BYADGI CHILLI HUB
          </p>

          <h1
            style={{
              margin:
                "4px 0",
            }}
          >
            Product Management
          </h1>

          <p
            style={{
              margin: 0,
              color: "#777",
              fontSize: 11,
            }}
          >
            Add and manage your
            chilli catalogue.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <a
            href="/admin"
            className="btn"
          >
            DASHBOARD
          </a>

          <a
            href="/admin/orders"
            className="btn"
          >
            ORDERS
          </a>

          <button
            className="btn green"
            onClick={
              refreshProducts
            }
            disabled={
              productLoading
            }
          >
            {productLoading
              ? "REFRESHING..."
              : "REFRESH"}
          </button>

          <button
            className="btn"
            onClick={async () => {
              await fetch(
                "/api/admin/logout",
                {
                  method:
                    "POST",
                }
              );

              window.location.href =
                "/admin/login";
            }}
          >
            LOG OUT
          </button>
        </div>
      </div>

      {/* STATISTICS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          gap: 10,
          marginTop: 20,
        }}
      >
        <StatCard
          icon="ðŸŒ¶ï¸"
          value={
            products.length
          }
          label="TOTAL PRODUCTS"
        />

        <StatCard
          icon="âœ…"
          value={
            activeCount
          }
          label="ACTIVE PRODUCTS"
        />

        <StatCard
          icon="â¸ï¸"
          value={
            inactiveCount
          }
          label="INACTIVE PRODUCTS"
        />

        <StatCard
          icon="ðŸ“¦"
          value={
            outOfStockCount
          }
          label="OUT OF STOCK"
        />
      </div>

      {/* MESSAGE */}

      {message && (
        <div
          style={{
            marginTop: 15,
            padding: 12,
            borderRadius: 8,
            background:
              message.includes(
                "successfully"
              ) ||
              message.includes(
                "activated"
              )
                ? "#e9f8ee"
                : "#fff5e6",
            color:
              message.includes(
                "successfully"
              ) ||
              message.includes(
                "activated"
              )
                ? "#087f23"
                : "#9a5b00",
            fontWeight: 700,
            fontSize: 11,
          }}
        >
          {message}
        </div>
      )}

      {/* ADD / EDIT PRODUCT */}

      <div
        className="detail-card"
        style={{
          display: "block",
          marginTop: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap: 10,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
              }}
            >
              {editingProduct
                ? "Edit Product"
                : "Add Product"}
            </h2>

            {editingProduct && (
              <small
                style={{
                  color: "#777",
                }}
              >
                Editing:{" "}
                <b>
                  {
                    editingProduct.name
                  }
                </b>
              </small>
            )}
          </div>

          {editingProduct && (
            <button
              type="button"
              className="btn"
              onClick={
                cancelEditing
              }
            >
              CANCEL EDIT
            </button>
          )}
        </div>

        <form
          onSubmit={
            editingProduct
              ? (event) => {
                  event.preventDefault();
                  updateProduct();
                }
              : saveProduct
          }
        >
          <div
            className="form-grid"
            style={{
              marginTop: 15,
            }}
          >
            <input
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              placeholder="Product name"
              required
            />

            <select
              value={brandId}
              onChange={(e) =>
                setBrandId(
                  e.target.value
                )
              }
              required
            >
              <option value="">
                Select Brand
              </option>

              {brands.map(
                (brand) => (
                  <option
                    key={
                      brand.id
                    }
                    value={
                      brand.id
                    }
                  >
                    {brand.name}
                  </option>
                )
              )}
            </select>

            <select
              value={
                categoryId
              }
              onChange={(e) =>
                setCategoryId(
                  e.target.value
                )
              }
              required
            >
              <option value="">
                Select Category
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={
                      category.id
                    }
                    value={
                      category.id
                    }
                  >
                    {
                      category.name
                    }
                  </option>
                )
              )}
            </select>
          </div>

          {/* IMAGE */}

          <div
            style={{
              marginTop: 15,
            }}
          >
            <label
              style={{
                display:
                  "block",
                fontWeight: 700,
                marginBottom:
                  8,
              }}
            >
              Product Image
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={
                uploadImage
              }
            />

            {imageUrl && (
              <div
                style={{
                  marginTop: 10,
                }}
              >
                <img
                  src={imageUrl}
                  alt="Product preview"
                  style={{
                    width: 120,
                    height: 120,
                    objectFit:
                      "contain",
                    border:
                      "1px solid #ddd",
                    borderRadius: 8,
                  }}
                />
              </div>
            )}
          </div>

          {/* DESCRIPTION */}

          <textarea
            value={
              description
            }
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
            placeholder="Product description (optional)"
            style={{
              width: "100%",
              minHeight: 90,
              marginTop: 15,
            }}
          />

          {/* PACK SIZES ONLY FOR NEW PRODUCTS */}

          {!editingProduct && (
            <>
              <h3
                style={{
                  marginTop: 25,
                }}
              >
                Pack Sizes / Price /
                Stock
              </h3>

              {variants.map(
                (
                  variant,
                  index
                ) => (
                  <div
                    key={index}
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "1.1fr 1.1fr .8fr .9fr .9fr .8fr auto",
                      gap: 8,
                      marginBottom:
                        8,
                      alignItems:
                        "center",
                    }}
                  >
                    <select
                      value={
                        variant.packSizeId
                      }
                      onChange={(
                        e
                      ) =>
                        updateVariant(
                          index,
                          "packSizeId",
                          e.target
                            .value
                        )
                      }
                      required
                    >
                      <option value="">
                        Pack Size
                      </option>

                      {packSizes.map(
                        (
                          pack
                        ) => (
                          <option
                            key={
                              pack.id
                            }
                            value={
                              pack.id
                            }
                          >
                            {
                              pack.label
                            }
                          </option>
                        )
                      )}
                    </select>

                    <input
                      value={
                        variant.sku
                      }
                      onChange={(
                        e
                      ) =>
                        updateVariant(
                          index,
                          "sku",
                          e.target
                            .value
                        )
                      }
                      placeholder="SKU"
                      required
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        variant.mrp
                      }
                      onChange={(
                        e
                      ) =>
                        updateVariant(
                          index,
                          "mrp",
                          e.target
                            .value
                        )
                      }
                      placeholder="MRP"
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        variant.price
                      }
                      onChange={(
                        e
                      ) =>
                        updateVariant(
                          index,
                          "price",
                          e.target
                            .value
                        )
                      }
                      placeholder="Selling Price"
                      required
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        variant.specialPrice
                      }
                      onChange={(
                        e
                      ) =>
                        updateVariant(
                          index,
                          "specialPrice",
                          e.target
                            .value
                        )
                      }
                      placeholder="Special Price"
                    />

                    <input
                      type="number"
                      min="0"
                      value={
                        variant.stock
                      }
                      onChange={(
                        e
                      ) =>
                        updateVariant(
                          index,
                          "stock",
                          e.target
                            .value
                        )
                      }
                      placeholder="Stock"
                    />

                    <button
                      type="button"
                      className="btn"
                      onClick={() =>
                        removeVariant(
                          index
                        )
                      }
                      disabled={
                        variants.length ===
                        1
                      }
                    >
                      Ã—
                    </button>
                  </div>
                )
              )}

              <div
                style={{
                  display:
                    "flex",
                  gap: 10,
                  marginTop: 15,
                }}
              >
                <button
                  type="button"
                  className="btn green"
                  onClick={
                    addVariant
                  }
                >
                  + ADD PACK SIZE
                </button>
              </div>
            </>
          )}

          {editingProduct && (
            <div
              style={{
                marginTop: 15,
                padding: 12,
                borderRadius: 8,
                background:
                  "#fff8e8",
                border:
                  "1px solid #ead9a4",
                fontSize: 10,
                color: "#775900",
              }}
            >
              <b>Pack sizes, prices and
              stock are preserved.</b>
              <br />
              Variant editing will be
              added separately so existing
              SKU and inventory data is
              not accidentally changed.
            </div>
          )}

          {editingProduct && (
            <>
              <h3
                style={{
                  marginTop: 25,
                }}
              >
                Edit Pack Sizes / Price / Stock
              </h3>

              {variants.map((variant, index) => (
                <div
                  key={variant.id || index}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1.1fr 1.1fr .8fr .9fr .9fr .8fr",
                    gap: 8,
                    marginBottom: 10,
                    alignItems: "center",
                  }}
                >
                  <select
                    value={variant.packSizeId}
                    onChange={(e) =>
                      updateVariant(index, "packSizeId", e.target.value)
                    }
                    required
                  >
                    <option value="">Pack Size</option>
                    {packSizes.map((pack) => (
                      <option key={pack.id} value={pack.id}>
                        {pack.label}
                      </option>
                    ))}
                  </select>

                  <input
                    value={variant.sku}
                    onChange={(e) =>
                      updateVariant(index, "sku", e.target.value)
                    }
                    placeholder="SKU"
                    required
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={variant.mrp}
                    onChange={(e) =>
                      updateVariant(index, "mrp", e.target.value)
                    }
                    placeholder="MRP"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={variant.price}
                    onChange={(e) =>
                      updateVariant(index, "price", e.target.value)
                    }
                    placeholder="Selling Price"
                    required
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={variant.specialPrice}
                    onChange={(e) =>
                      updateVariant(index, "specialPrice", e.target.value)
                    }
                    placeholder="Special Price"
                  />

                  <input
                    type="number"
                    min="0"
                    value={variant.stock}
                    onChange={(e) =>
                      updateVariant(index, "stock", e.target.value)
                    }
                    placeholder="Stock"
                  />
                </div>
              ))}
            </>
          )}

          {/* FORM BUTTON */}

          <button
            className="btn red"
            style={{
              marginTop: 15,
            }}
            disabled={saving}
          >
            {saving
              ? "SAVING..."
              : editingProduct
                ? "UPDATE PRODUCT"
                : "SAVE PRODUCT"}
          </button>
        </form>
      </div>

      {/* PRODUCT CATALOGUE */}

      <div
        style={{
          marginTop: 30,
        }}
      >
        <div
          className="section-row"
          style={{
            marginBottom: 12,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
              }}
            >
              Product Catalogue
            </h2>

            <small
              style={{
                color: "#888",
              }}
            >
              {visibleProducts.length}{" "}
              products shown
            </small>
          </div>
        </div>

        {/* SEARCH */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr auto",
            gap: 8,
            marginBottom: 15,
          }}
        >
          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search product, brand, category or SKU..."
          />

          <button
            type="button"
            className="btn"
            onClick={() =>
              setSearch("")
            }
          >
            CLEAR
          </button>
        </div>

        {/* FILTER */}

        <div
          style={{
            display:
              "flex",
            gap: 8,
            flexWrap:
              "wrap",
            marginBottom:
              15,
          }}
        >
          <button
            type="button"
            className="btn"
            onClick={() =>
              setShowInactive(
                true
              )
            }
            style={{
              borderColor:
                showInactive
                  ? "#b32020"
                  : "#ddd",
            }}
          >
            ALL ({products.length})
          </button>

          <button
            type="button"
            className="btn green"
            onClick={() =>
              setShowInactive(
                false
              )
            }
          >
            ACTIVE ({activeCount})
          </button>

          <button
            type="button"
            className="btn"
            onClick={() =>
              setShowInactive(
                true
              )
            }
          >
            INACTIVE ({inactiveCount})
          </button>
        </div>

        {/* PRODUCTS */}

        {!visibleProducts.length ? (
          <div
            className="detail-card"
            style={{
              display:
                "block",
              textAlign:
                "center",
              padding: 30,
            }}
          >
            <div
              style={{
                fontSize: 35,
              }}
            >
              ðŸŒ¶ï¸
            </div>

            <h3>
              No products found
            </h3>

            <p
              style={{
                color: "#888",
              }}
            >
              Try another search
              or add a product.
            </p>
          </div>
        ) : (
          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
              gap: 14,
            }}
          >
            {visibleProducts.map(
              (product) => (
                <ProductCard
                  key={
                    product.id
                  }
                  product={
                    product
                  }
                  busy={
                    productLoading
                  }
                  onEdit={() =>
                    startEditing(
                      product
                    )
                  }
                  onToggle={() =>
                    toggleActive(
                      product
                    )
                  }
                  onDelete={() =>
                    deleteProduct(
                      product
                    )
                  }
                />
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: string;
  value: number;
  label: string;
}) {
  return (
    <div
      style={{
        padding: 15,
        border:
          "1px solid #e5dfd7",
        borderRadius: 10,
        background:
          "#fff",
        boxShadow:
          "0 2px 8px rgba(0,0,0,.025)",
      }}
    >
      <div
        style={{
          fontSize: 20,
          marginBottom: 6,
        }}
      >
        {icon}
      </div>

      <b
        style={{
          display:
            "block",
          fontSize: 20,
          fontWeight: 950,
        }}
      >
        {value}
      </b>

      <small
        style={{
          color: "#777",
          fontSize: 8,
          fontWeight: 800,
        }}
      >
        {label}
      </small>
    </div>
  );
}

function ProductCard({
  product,
  busy,
  onEdit,
  onToggle,
  onDelete,
}: {
  product: Product;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const totalStock =
    product.variants.reduce(
      (total, variant) =>
        total +
        (variant.inventory
          ?.quantity || 0),
      0
    );

  const outOfStock =
    product.variants.length > 0 &&
    totalStock <= 0;

  const lowStock =
    totalStock > 0 &&
    totalStock <= 5;

  return (
    <div
      style={{
        border:
          "1px solid #e5dfd7",
        borderRadius: 12,
        background:
          "#fff",
        overflow:
          "hidden",
        boxShadow:
          "0 2px 8px rgba(0,0,0,.025)",
      }}
    >
      {/* IMAGE */}

      <div
        style={{
          height: 180,
          position:
            "relative",
          display:
            "grid",
          placeItems:
            "center",
          background:
            "linear-gradient(145deg,#fffaf4,#eee8df)",
        }}
      >
        {product.imageUrl ? (
          <img
            src={
              product.imageUrl
            }
            alt={
              product.name
            }
            style={{
              width:
                "100%",
              height:
                "100%",
              objectFit:
                "contain",
            }}
          />
        ) : (
          <div
            style={{
              fontSize: 50,
            }}
          >
            ðŸŒ¶ï¸
          </div>
        )}

        <span
          style={{
            position:
              "absolute",
            top: 10,
            left: 10,
            padding:
              "5px 8px",
            borderRadius:
              20,
            background:
              product.isActive
                ? "#e9f8ee"
                : "#eee",
            color:
              product.isActive
                ? "#087f23"
                : "#666",
            fontSize: 8,
            fontWeight: 900,
          }}
        >
          {product.isActive
            ? "ACTIVE"
            : "INACTIVE"}
        </span>
      </div>

      {/* BODY */}

      <div
        style={{
          padding: 14,
        }}
      >
        <div
          style={{
            color:
              "#07823f",
            fontSize: 8,
            fontWeight: 900,
            letterSpacing:
              ".4px",
          }}
        >
          {product.brand?.name ||
            "NO BRAND"}
        </div>

        <h3
          style={{
            margin:
              "5px 0",
            fontSize: 14,
          }}
        >
          {product.name}
        </h3>

        <small
          style={{
            display:
              "block",
            color: "#777",
          }}
        >
          {product.category?.name ||
            "No category"}
        </small>

        {/* PACKS */}

        <div
          style={{
            marginTop: 10,
            display:
              "flex",
            gap: 5,
            flexWrap:
              "wrap",
          }}
        >
          {product.variants.map(
            (variant) => (
              <span
                key={
                  variant.id
                }
                style={{
                  padding:
                    "4px 6px",
                  border:
                    "1px solid #ddd",
                  borderRadius:
                    5,
                  fontSize: 8,
                  background:
                    "#fafafa",
                }}
              >
                {
                  variant
                    .packSize
                    .label
                }
              </span>
            )
          )}
        </div>

        {/* STOCK */}

        <div
          style={{
            marginTop: 12,
            display:
              "flex",
            justifyContent:
              "space-between",
            gap: 8,
            fontSize: 9,
          }}
        >
          <span>
            <b>
              {product
                .variants
                .length}
            </b>{" "}
            pack sizes
          </span>

          <span
            style={{
              color:
                outOfStock
                  ? "#b00020"
                  : lowStock
                    ? "#9a5b00"
                    : "#07823f",
              fontWeight: 900,
            }}
          >
            {outOfStock
              ? "OUT OF STOCK"
              : lowStock
                ? `LOW STOCK — ${totalStock} IN STOCK`
                : `${totalStock} IN STOCK`}
          </span>
        </div>

        {/* PRICES */}

        {product.variants
          .slice(0, 3)
          .map((variant) => (
            <div
              key={
                variant.id
              }
              style={{
                marginTop: 5,
                fontSize: 9,
                display:
                  "flex",
                justifyContent:
                  "space-between",
              }}
            >
              <span>
                {
                  variant
                    .packSize
                    .label
                }
              </span>

              <b>
                â‚¹
                {
                  variant.price
                }
              </b>
            </div>
          ))}

        {product.variants
          .length > 3 && (
          <small
            style={{
              display:
                "block",
              marginTop: 4,
              color:
                "#999",
            }}
          >
            +
            {product.variants.length -
              3}{" "}
            more pack sizes
          </small>
        )}

        {/* ACTIONS */}

        <div
          style={{
            display:
              "flex",
            gap: 6,
            flexWrap:
              "wrap",
            marginTop: 14,
          }}
        >
          <button
            type="button"
            className="btn"
            onClick={
              onEdit
            }
            disabled={
              busy
            }
          >
            âœï¸ EDIT
          </button>

          <button
            type="button"
            className={
              product.isActive
                ? "btn"
                : "btn green"
            }
            onClick={
              onToggle
            }
            disabled={
              busy
            }
          >
            {product.isActive
              ? "â¸ DEACTIVATE"
              : "âœ“ ACTIVATE"}
          </button>

          <button
            type="button"
            className="btn red"
            onClick={
              onDelete
            }
            disabled={
              busy
            }
          >
            ðŸ—‘ DELETE
          </button>
        </div>
      </div>
    </div>
  );
}