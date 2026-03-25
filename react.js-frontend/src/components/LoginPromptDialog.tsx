import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface LoginPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginPromptDialog = ({ isOpen, onClose }: LoginPromptDialogProps) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNavigateToLogin = () => {
    navigate("/login");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="rounded-xl border bg-card p-8 shadow-lg max-w-md">
        <div className="text-center space-y-4">
          <h2 className="font-display text-xl font-bold">Yêu cầu xác thực</h2>
          <p className="text-muted-foreground">
            Bạn cần đăng nhập trước khi đặt hàng. Vui lòng đăng nhập hoặc đăng ký tài khoản mới.
          </p>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Trở về
            </Button>
            <Button
              onClick={handleNavigateToLogin}
              className="flex-1"
            >
              Đăng nhập
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPromptDialog;
