import { Link } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product, formatPrice } from "@/data/products";
import { useCartStore } from "@/store/cartStore";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const ImageWithFallback = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setCurrentSrc(src);
    setIsLoading(true);
  }, [src]);

  const handleError = () => {
    console.error(`❌ Failed to load image: ${src}`);
    setCurrentSrc("https://via.placeholder.com/300x300?text=No+Image");
    setIsLoading(false);
  };

  const handleLoad = () => {
    console.log(`✅ Image loaded: ${src}`);
    setIsLoading(false);
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      style={{ opacity: isLoading ? 0.5 : 1, transition: "opacity 0.3s" }}
    />
  );
};

const ProductCard = ({ product, index = 0 }: { product: Product; index?: number }) => {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <Link to={`/product/${product.id}`}>
        <div className="aspect-square overflow-hidden bg-muted">
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
      </Link>
      <div className="p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-display text-sm font-semibold leading-tight hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <div className="mt-1 flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-warm-gold text-warm-gold" />
          <span className="text-xs text-muted-foreground">{product.rating} ({product.reviews})</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-base font-bold text-primary">{formatPrice(product.price)}</span>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1"
            onClick={(e) => { e.preventDefault(); addItem(product); }}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">Thêm</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
