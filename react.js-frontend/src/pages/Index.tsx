import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { categories, Product } from "@/data/products";
import { getProducts } from "@/lib/api";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import { useState, useEffect } from "react";

const heroSlides = [
  { image: hero1, title: "Bánh kem dâu tây mùa hè", subtitle: "Tươi mát, ngọt ngào, hoàn hảo cho mọi dịp" },
  { image: hero2, title: "Bánh mì thủ công mỗi ngày", subtitle: "Nướng tươi từ nguyên liệu tự nhiên" },
];

const reviews: { name: string; text: string; rating: number }[] = [];

const Index = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bestSellers = products.filter((p) => p.bestSeller ?? p.rating >= 4.5);

  const bestSellersByCategory = categories.map(cat => {
    const categoryProducts = bestSellers.filter(p => p.category === cat.id);
    return { category: cat, products: categoryProducts };
  }).filter(group => group.products.length > 0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide((s) => (s + 1) % heroSlides.length), 5000);
    return () => clearInterval(timer);
  }, []);

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

  const featuredCategories = categories.filter((cat) => cat.id !== "cupcake");

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        {heroSlides.map((slide, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: currentSlide === i ? 1 : 0 }}
          >
            <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 to-transparent" />
          </div>
        ))}
        <div className="relative z-10 container flex h-full items-center">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-lg"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground leading-tight">
              {heroSlides[currentSlide].title}
            </h1>
            <p className="mt-4 text-lg text-primary-foreground/80">
              {heroSlides[currentSlide].subtitle}
            </p>
            <Link to="/menu">
              <Button size="lg" className="mt-6 gap-2">
                Mua ngay <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all ${currentSlide === i ? "w-8 bg-primary-foreground" : "w-2 bg-primary-foreground/50"}`}
            />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container py-16">
        <h2 className="font-display text-3xl font-bold text-center mb-10">Danh mục nổi bật</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {featuredCategories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <Link
                to={`/menu?category=${cat.id}`}
                className="group relative block aspect-[3/2] overflow-hidden rounded-2xl"
              >
                <img src={cat.image} alt={cat.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <h3 className="font-display text-xl font-bold text-primary-foreground">{cat.name}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="bg-secondary/30 py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-display text-3xl font-bold">Sản phẩm bán chạy</h2>
          </div>
          {loading ? (
            <div className="text-center py-10 text-primary">Đang tải sản phẩm...</div>
          ) : error ? (
            <div className="text-center py-10 text-destructive">{error}</div>
          ) : bestSellersByCategory.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">Không có sản phẩm bán chạy.</div>
          ) : (
            <div className="space-y-12">
              {bestSellersByCategory.map((group, groupIndex) => (
                <motion.div
                  key={group.category.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: groupIndex * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-2xl font-bold">{group.category.name}</h3>
                    <Link to={`/menu?category=${group.category.id}`} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                      Xem tất cả <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {group.products.map((product, i) => (
                      <ProductCard key={product.id} product={product} index={i} />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Reviews */}
      <section className="container py-16">
        <h2 className="font-display text-3xl font-bold text-center mb-10">Khách hàng nói gì</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="rounded-xl border bg-card p-6"
            >
              <div className="flex gap-1 mb-3">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-warm-gold text-warm-gold" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground italic mb-4">"{review.text}"</p>
              <p className="text-sm font-semibold">{review.name}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
