import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { getProducts } from "@/lib/api";
import { Product, categories, flavors } from "@/data/products";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { formatPrice } from "@/data/products";

const MenuPage = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const categoryParam = searchParams.get("category") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryParam ? [categoryParam] : []
  );
  const [priceRange, setPriceRange] = useState([0, 600000]);
  const [selectedFlavor, setSelectedFlavor] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      if (selectedFlavor && p.flavor !== selectedFlavor) return false;
      return true;
    });
  }, [searchQuery, selectedCategories, priceRange, selectedFlavor]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getProducts();
        setProducts(data);
        setError(null);
      } catch (ex: any) {
        setError(ex.message || "Không thể tải sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 600000]);
    setSelectedFlavor("");
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-sm font-semibold mb-3">Loại bánh</h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2">
              <Checkbox
                id={cat.id}
                checked={selectedCategories.includes(cat.id)}
                onCheckedChange={() => toggleCategory(cat.id)}
              />
              <Label htmlFor={cat.id} className="text-sm cursor-pointer">{cat.name}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display text-sm font-semibold mb-3">Khoảng giá</h3>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          min={0}
          max={600000}
          step={10000}
          className="mb-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatPrice(priceRange[0])}</span>
          <span>{formatPrice(priceRange[1])}</span>
        </div>
      </div>

      <div>
        <h3 className="font-display text-sm font-semibold mb-3">Hương vị</h3>
        <RadioGroup value={selectedFlavor} onValueChange={setSelectedFlavor}>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="" id="all-flavor" />
            <Label htmlFor="all-flavor" className="text-sm cursor-pointer">Tất cả</Label>
          </div>
          {flavors.map((f) => (
            <div key={f.id} className="flex items-center gap-2">
              <RadioGroupItem value={f.id} id={f.id} />
              <Label htmlFor={f.id} className="text-sm cursor-pointer">{f.name}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
        <X className="h-3 w-3 mr-1" /> Xóa bộ lọc
      </Button>
    </div>
  );

  return (
    <div className="container py-8">
      <h1 className="font-display text-3xl font-bold mb-2">Thực đơn</h1>
      {searchQuery && (
        <p className="text-muted-foreground mb-4">Kết quả cho: "{searchQuery}"</p>
      )}
      {loading ? (
        <div className="py-16 text-center text-primary">Đang tải sản phẩm...</div>
      ) : error ? (
        <div className="py-16 text-center text-destructive">{error}</div>
      ) : null}

      <div className="flex gap-8 mt-6">
        {/* Sidebar Desktop */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-24 rounded-xl border bg-card p-5">
            <FilterPanel />
          </div>
        </aside>

        {/* Mobile filter toggle */}
        <div className="flex-1">
          <div className="md:hidden mb-4">
            <Button variant="outline" onClick={() => setFilterOpen(!filterOpen)} className="gap-2">
              <Filter className="h-4 w-4" /> Bộ lọc
            </Button>
            {filterOpen && (
              <div className="mt-4 rounded-xl border bg-card p-5">
                <FilterPanel />
              </div>
            )}
          </div>

          {!loading && !error && (
            filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <p className="text-lg">Không tìm thấy sản phẩm nào</p>
                <Button variant="link" onClick={clearFilters}>Xóa bộ lọc</Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filtered.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
