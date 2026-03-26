import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Star, Minus, Plus, ShoppingCart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Product, formatPrice } from "@/data/products";
import { getProductById, getProductReviews, createReview } from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import { motion } from "framer-motion";
import useAuth from "@/hooks/use-auth";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setCartOpen);
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getProductById(Number(id));
        setProduct(data);
        setError(null);
      } catch (ex: any) {
        setError(ex.message || "Không thể tải thông tin sản phẩm");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="container py-20 text-center text-primary">Đang tải sản phẩm...</div>
    );
  }

  if (error) {
    return (
      <div className="container py-20 text-center text-destructive">{error}</div>
    );
  }

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg text-muted-foreground">Sản phẩm không tồn tại</p>
        <Link to="/menu"><Button variant="link">Quay lại thực đơn</Button></Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, quantity, message || undefined);
    setCartOpen(true);
  };

  return (
    <div className="container py-8">
      <Link to="/menu" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" /> Quay lại thực đơn
      </Link>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden rounded-2xl">
          <img src={product.image} alt={product.name} className="w-full aspect-square object-cover" />
        </motion.div>

        {/* Info */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="font-display text-2xl md:text-3xl font-bold">{product.name}</h1>

          <div className="flex items-center gap-2 mt-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? "fill-warm-gold text-warm-gold" : "text-muted"}`} />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{product.rating} ({product.reviews} đánh giá)</span>
          </div>

          <p className="text-2xl font-bold text-primary mt-4">{formatPrice(product.price)}</p>

          <p className="text-muted-foreground mt-4 leading-relaxed">{product.description}</p>

          <div className="mt-4 text-sm">
            <span className="font-semibold">Thành phần:</span>{" "}
            <span className="text-muted-foreground">{product.ingredients}</span>
          </div>

          {/* Quantity */}
          <div className="mt-6 flex items-center gap-4">
            <span className="text-sm font-medium">Số lượng:</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center font-medium">{quantity}</span>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setQuantity(quantity + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Message */}
          <div className="mt-4">
            <Label className="text-sm font-medium">Lời nhắn ghi trên bánh (nếu có):</Label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="VD: Happy Birthday An!"
              className="mt-2 w-full rounded-lg border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none h-20"
            />
          </div>

          {/* CTA */}
          <div className="mt-6 flex gap-3">
            <Button size="lg" className="flex-1 gap-2" onClick={handleAddToCart}>
              <ShoppingCart className="h-4 w-4" /> Thêm vào giỏ hàng
            </Button>
            <Button size="lg" variant="outline" className="flex-1" onClick={() => { handleAddToCart(); }}>
              Mua ngay
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="description" className="mt-12">
        <TabsList>
          <TabsTrigger value="description">Mô tả chi tiết</TabsTrigger>
          <TabsTrigger value="storage">Hướng dẫn bảo quản</TabsTrigger>
          <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="mt-4 text-muted-foreground leading-relaxed">
          {product.description}
        </TabsContent>
        <TabsContent value="storage" className="mt-4 text-muted-foreground leading-relaxed">
          {product.storage}
        </TabsContent>
        <TabsContent value="reviews" className="mt-4">
          {product && <ReviewsSection productId={product.id} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Label = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <label className={className}>{children}</label>
);

const ReviewsSection = ({ productId }: { productId: number }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await getProductReviews(productId);
      setReviews(data);
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSubmitting(true);
      await createReview({
        productId,
        rating,
        comment: comment.trim() || undefined,
      });

      // Reset form
      setRating(5);
      setComment("");
      setShowForm(false);

      // Reload reviews
      await loadReviews();

      // Show success message (you can add toast here)
      alert("Đánh giá của bạn đã được gửi thành công!");
    } catch (error: any) {
      alert("Có lỗi xảy ra khi gửi đánh giá: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary">{averageRating.toFixed(1)}</div>
          <div className="flex justify-center mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-4 w-4 ${i < Math.floor(averageRating) ? "fill-warm-gold text-warm-gold" : "text-muted"}`} />
            ))}
          </div>
          <div className="text-sm text-muted-foreground mt-1">{reviews.length} đánh giá</div>
        </div>

        {user && (
          <Button
            variant="outline"
            onClick={() => setShowForm(!showForm)}
            className="ml-auto"
          >
            {showForm ? "Hủy" : "Viết đánh giá"}
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showForm && user && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          onSubmit={handleSubmitReview}
          className="p-4 border rounded-lg space-y-4"
        >
          <h3 className="font-semibold">Viết đánh giá của bạn</h3>

          {/* Rating */}
          <div>
            <Label className="text-sm font-medium">Đánh giá:</Label>
            <div className="flex gap-1 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  className="focus:outline-none"
                >
                  <Star className={`h-6 w-6 ${i < rating ? "fill-warm-gold text-warm-gold" : "text-muted hover:text-warm-gold"}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <Label className="text-sm font-medium">Bình luận (tùy chọn):</Label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
              className="mt-2 w-full rounded-lg border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none h-24"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Đang gửi..." : "Gửi đánh giá"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Hủy
            </Button>
          </div>
        </motion.form>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-muted-foreground">Đang tải đánh giá...</p>
        ) : reviews.length === 0 ? (
          <p className="text-muted-foreground">Chưa có đánh giá nào cho sản phẩm này.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.reviewId} className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-warm-gold text-warm-gold" : "text-muted"}`} />
                  ))}
                </div>
                <span className="text-sm font-medium">{review.customer?.fullName || "Ẩn danh"}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(review.reviewDate).toLocaleDateString("vi-VN")}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
