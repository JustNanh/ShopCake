import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMyOrders } from "@/lib/api";
import { formatPrice } from "@/data/products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Star, ArrowLeft } from "lucide-react";

interface OrderDetail {
  orderDetailId: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Order {
  orderId: number;
  customerId: number;
  orderDate: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  orderDetails: OrderDetail[];
}

const ReviewPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [reviews, setReviews] = useState<Record<number, {
    productId: number;
    productName: string;
    rating: number;
    comment: string;
    submitted?: boolean;
  }>>({});
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orders = await getMyOrders();
        const foundOrder = orders.find(o => o.orderId === parseInt(orderId || "0"));
        
        if (!foundOrder) {
          setError("Không tìm thấy đơn hàng");
          return;
        }
        
        if (foundOrder.status !== "Delivered") {
          setError("Chỉ có thể đánh giá sản phẩm từ đơn hàng đã giao");
          return;
        }
        
        setOrder(foundOrder);
        
        // Khởi tạo state reviews cho từng sản phẩm
        const initialReviews: Record<number, any> = {};
        foundOrder.orderDetails.forEach(detail => {
          initialReviews[detail.productId] = {
            productId: detail.productId,
            productName: detail.productName,
            rating: 5,
            comment: "",
            submitted: false,
          };
        });
        setReviews(initialReviews);
      } catch (err) {
        console.error("Failed to fetch order:", err);
        setError("Lỗi khi tải dữ liệu đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleRatingChange = (productId: number, rating: number) => {
    setReviews(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        rating,
      },
    }));
  };

  const handleCommentChange = (productId: number, comment: string) => {
    setReviews(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        comment,
      },
    }));
  };

  const handleSubmitReview = async (productId: number) => {
    const review = reviews[productId];
    
    if (!review.comment.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập nhận xét",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            productId,
            rating: review.rating,
            comment: review.comment,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Không thể gửi đánh giá");
      }

      setReviews(prev => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          submitted: true,
        },
      }));

      toast({
        title: "Thành công",
        description: `Đánh giá cho "${review.productName}" đã được gửi`,
        variant: "default",
      });
    } catch (err) {
      console.error("Failed to submit review:", err);
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Lỗi khi gửi đánh giá",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-40">
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/orders")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700 font-medium">❌ {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">Không tìm thấy đơn hàng</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Nút quay lại */}
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/orders")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại danh sách đơn hàng
      </Button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Đánh giá sản phẩm</h1>
        <p className="text-gray-600">
          Đơn hàng #{order.orderId} - {new Date(order.orderDate).toLocaleDateString("vi-VN")}
        </p>
      </div>

      {/* Danh sách sản phẩm để đánh giá */}
      <div className="space-y-6">
        {order.orderDetails.map(detail => {
          const review = reviews[detail.productId];
          const isSubmitted = review?.submitted;

          return (
            <Card key={detail.productId} className={isSubmitted ? "border-green-200 bg-green-50" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{detail.productName}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Số lượng: {detail.quantity} - Giá: {formatPrice(detail.price)}
                    </p>
                  </div>
                  {isSubmitted && (
                    <div className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium">
                      ✓ Đã đánh giá
                    </div>
                  )}
                </div>
              </CardHeader>

              {!isSubmitted && (
                <CardContent className="space-y-6">
                  {/* Xếp hạng sao */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Xếp hạng <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => handleRatingChange(detail.productId, star)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              star <= (review?.rating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {review?.rating}/5 sao
                    </p>
                  </div>

                  {/* Nhận xét */}
                  <div>
                    <Label htmlFor={`comment-${detail.productId}`} className="text-base font-semibold mb-2 block">
                      Nhận xét <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                      id={`comment-${detail.productId}`}
                      value={review?.comment || ""}
                      onChange={e => handleCommentChange(detail.productId, e.target.value)}
                      placeholder="Chia sẻ trải nghiệm của bạn với sản phẩm này..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24 resize-none"
                    />
                  </div>

                  {/* Nút gửi */}
                  <Button
                    onClick={() => handleSubmitReview(detail.productId)}
                    disabled={submitting}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                  </Button>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Thông báo khi tất cả sản phẩm đã được đánh giá */}
      {order.orderDetails.every(detail => reviews[detail.productId]?.submitted) && (
        <Card className="mt-8 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-green-700 font-medium text-center">
              ✅ Cảm ơn bạn đã đánh giá tất cả sản phẩm!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReviewPage;
