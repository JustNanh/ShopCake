import { useEffect, useState } from "react";
import { getProducts } from "@/lib/api";
import { Product, formatPrice } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ImageWithFallback = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => setCurrentSrc("https://via.placeholder.com/120x120?text=No+Image")}
    />
  );
};

const AdminProducts = () => {
  const [productList, setProductList] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", category: "birthday" as Product["category"], description: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getProducts();
        setProductList(data);
        setError(null);
      } catch (ex: any) {
        setError(ex.message || "Không thể tải sản phẩm");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = productList.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditProduct(null);
    setForm({ name: "", price: "", category: "birthday", description: "" });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({ name: p.name, price: p.price.toString(), category: p.category, description: p.description });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.price) return;
    if (editProduct) {
      setProductList((prev) =>
        prev.map((p) =>
          p.id === editProduct.id
            ? { ...p, name: form.name, price: Number(form.price), category: form.category, description: form.description }
            : p
        )
      );
      toast({ title: "Đã cập nhật sản phẩm" });
    } else {
      const newProduct: Product = {
        id: Date.now(),
        name: form.name,
        price: Number(form.price),
        image: "https://via.placeholder.com/300x300?text=No+Image",
        category: form.category,
        flavor: "cream",
        rating: 0,
        reviews: 0,
        description: form.description,
        ingredients: "",
        storage: "",
      };
      setProductList((prev) => [...prev, newProduct]);
      toast({ title: "Đã thêm sản phẩm mới" });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    setProductList((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Đã xóa sản phẩm", variant: "destructive" });
  };

  const categoryLabel: Record<string, string> = {
    birthday: "Bánh sinh nhật",
    bread: "Bánh mì",
    pastry: "Pastry",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-foreground">Quản lý sản phẩm</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4 mr-2" /> Thêm sản phẩm
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Tên sản phẩm</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Giá (VNĐ)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Product["category"] })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="birthday">Bánh sinh nhật</option>
                  <option value="bread">Bánh mì</option>
                  <option value="pastry">Pastry</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <Button onClick={handleSave} className="w-full">
                {editProduct ? "Cập nhật" : "Thêm"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="p-8 text-center text-primary">Đang tải danh sách sản phẩm...</div>
        ) : error ? (
          <div className="p-8 text-center text-destructive">{error}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hình ảnh</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Đánh giá</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <ImageWithFallback
                      src={p.image || "https://via.placeholder.com/120x120?text=No+Image"}
                      alt={p.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{categoryLabel[p.category]}</TableCell>
                  <TableCell>{formatPrice(p.price)}</TableCell>
                  <TableCell>⭐ {p.rating}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
