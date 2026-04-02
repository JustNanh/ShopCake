import { motion } from "framer-motion";
import hero2 from "@/assets/hero-2.jpg";

const AboutPage = () => (
  <div>
    <section className="relative h-[40vh] min-h-[300px] overflow-hidden">
      <img src={hero2} alt="Bakery" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-foreground/50" />
      <div className="relative z-10 container flex h-full items-center justify-center">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground text-center">Về chúng tôi</h1>
      </div>
    </section>

    <section className="container py-16 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 text-muted-foreground leading-relaxed">
        <p>
          <strong className="text-foreground font-display text-lg">Sweet Bakery</strong> được thành lập từ niềm đam mê với nghệ thuật làm bánh.
          Chúng tôi tin rằng mỗi chiếc bánh không chỉ là món ăn, mà còn là một tác phẩm nghệ thuật mang lại niềm vui.
        </p>
        <p>
          Với nguyên liệu nhập khẩu cao cấp từ Pháp, Bỉ, Nhật Bản và đội ngũ thợ bánh tay nghề cao, 
          chúng tôi cam kết mang đến những sản phẩm chất lượng nhất cho khách hàng.
        </p>
        <p>
          Từ những chiếc bánh sinh nhật rực rỡ đến những ổ bánh mì thủ công nướng tươi mỗi sáng,
          Sweet Bakery luôn đặt tâm huyết vào từng sản phẩm.
        </p>
      </motion.div>
    </section>
  </div>
);

export default AboutPage;
