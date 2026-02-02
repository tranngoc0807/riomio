"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import DocumentEditor from "./DocumentEditor";

const getInitialContent = () => {
  return `
    <table style="width: 100%; border: none; margin-bottom: 16px;">
      <tr>
        <td style="width: 45%; border: none; vertical-align: top;">
          <p><strong>CÔNG TY CỔ PHẦN RIOMIO</strong></p>
          <p>Số: 01-2026/QC-RIOMIO</p>
        </td>
        <td style="width: 55%; border: none; text-align: center; vertical-align: top;">
          <p><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
          <p><strong>Độc lập – Tự do – Hạnh phúc</strong></p>
          <p>---o0o---</p>
        </td>
      </tr>
    </table>

    <h1 style="text-align: center;">QUY CHẾ TIỀN LƯƠNG, TIỀN THƯỞNG VÀ CÁC KHOẢN TRỢ CẤP</h1>
    <p style="text-align: center;"><em>Hà Nội, ngày 01 tháng 01 năm 2026</em></p>

    <h2>CHƯƠNG I: QUY ĐỊNH CHUNG</h2>

    <p><strong>Điều 1. Phạm vi và đối tượng áp dụng</strong></p>
    <p>Quy chế này quy định về nguyên tắc trả lương, thưởng và các chế độ phụ cấp đối với người lao động làm việc tại Công ty Cổ phần Riomio.</p>
    <p><strong>Đối tượng áp dụng:</strong> Toàn bộ cán bộ nhân viên (CBNV) chính thức ký Hợp đồng lao động (HĐLĐ) với công ty.</p>

    <p><strong>Điều 2. Nguyên tắc chung</strong></p>
    <ul>
      <li>Tiền lương gắn liền với vị trí công việc, năng lực và hiệu quả đóng góp.</li>
      <li>Đảm bảo tuân thủ quy định của pháp luật về BHXH và Thuế.</li>
      <li><strong>Tổng thu nhập thực nhận = Lương cơ bản + Phụ cấp + Lương hiệu quả (KPI/Doanh số).</strong></li>
    </ul>

    <h2>CHƯƠNG II: KẾT CẤU TIỀN LƯƠNG</h2>

    <p><strong>Điều 3. Lương cơ bản (Lương đóng BHXH)</strong></p>
    <ul>
      <li>Là mức lương ghi trong HĐLĐ để làm căn cứ đóng BHXH, BHYT, BHTN.</li>
      <li>Mức lương này được xây dựng dựa trên thang bảng lương của Công ty, đảm bảo không thấp hơn mức lương tối thiểu vùng và cộng thêm ít nhất 7% đối với lao động đã qua đào tạo.</li>
      <li><strong>Mức áp dụng chung dự kiến:</strong> 5.200.000đ - 7.000.000đ tùy vị trí.</li>
    </ul>

    <p><strong>Điều 4. Lương hiệu quả công việc (Khoản "Lương mềm")</strong></p>
    <p>Đây là khoản thu nhập không cố định, phụ thuộc vào kết quả kinh doanh và mức độ hoàn thành công việc của từng cá nhân.</p>
    <p><strong>Cách tính:</strong></p>
    <ul>
      <li><strong>Khối Kinh doanh:</strong> Lương hiệu quả = % Doanh thu bán hàng (Shopee, Đại lý...) + Thưởng đạt mốc.</li>
      <li><strong>Khối Sản xuất (Thiết kế rập, May mẫu, KHSX):</strong> Lương hiệu quả = Đơn giá sản phẩm × Số lượng hoàn thành + Điểm chất lượng.</li>
      <li><strong>Khối Văn phòng (Kế toán, Content, Hình ảnh):</strong> Lương hiệu quả = Mức KPI trần × Tỷ lệ hoàn thành công việc (A/B/C).</li>
    </ul>
    <p style="font-style: italic;">Khoản này không thuộc đối tượng đóng BHXH nhưng chịu thuế TNCN (nếu tổng thu nhập đạt mức phải nộp).</p>

    <h2>CHƯƠNG III: CÁC KHOẢN PHỤ CẤP VÀ TRỢ CẤP</h2>

    <p><strong>Điều 5. Phụ cấp ăn trưa</strong></p>
    <ul>
      <li>Mức chi: <strong>910.000 VNĐ/người/tháng</strong>.</li>
      <li>Điều kiện: Hưởng theo ngày công đi làm.</li>
      <li>Miễn thuế TNCN, không đóng BHXH.</li>
    </ul>

    <p><strong>Điều 6. Phụ cấp xăng xe, đi lại</strong></p>
    <ul>
      <li>Giám đốc/Kinh doanh: <strong>1.000.000 – 2.000.000 VNĐ/tháng</strong>.</li>
      <li>Thu mua/Thủ kho/KHSX: <strong>500.000 – 1.000.000 VNĐ/tháng</strong>.</li>
      <li>Văn phòng/Thiết kế: <strong>300.000 – 700.000 VNĐ/tháng</strong>.</li>
    </ul>

    <p><strong>Điều 7. Phụ cấp điện thoại</strong></p>
    <ul>
      <li>Giám đốc/Kinh doanh: <strong>500.000 – 2.000.000 VNĐ/tháng</strong>.</li>
      <li>Bộ phận khác: <strong>300.000 – 1.000.000 VNĐ/tháng</strong>.</li>
      <li style="font-style: italic;">Khoản khoán chi này miễn thuế TNCN, không đóng BHXH.</li>
    </ul>

    <p><strong>Điều 8. Phụ cấp trang phục (Đồng phục Riomio)</strong></p>
    <ul>
      <li>Công ty cấp phát đồng phục hoặc chi tiền mặt cho nhân viên.</li>
      <li>Mức chi: <strong>Tối đa 5.000.000 VNĐ/người/năm</strong>.</li>
    </ul>

    <p><strong>Điều 9. Phụ cấp Độc hại/nặng nhọc</strong></p>
    <ul>
      <li>Độc hại/nặng nhọc: <strong>300.000 – 1.000.000đ/tháng</strong> (Thủ kho, May mẫu, Thiết kế rập).</li>
    </ul>

    <p><strong>Điều 10. Phụ cấp nhà ở</strong></p>
    <ul>
      <li>Phụ cấp nhà ở (có hợp đồng thuê nhà): <strong>Từ 300.000 - 3.000.000đ/tháng</strong></li>
    </ul>

    <h2>CHƯƠNG IV: CHẾ ĐỘ THƯỞNG</h2>

    <p><strong>Điều 10. Thưởng tháng / quý (KPI)</strong></p>
    <ul>
      <li>Căn cứ vào lợi nhuận sau thuế của công ty.</li>
      <li>Loại A: Hưởng 100% mức thưởng hiệu quả.</li>
      <li>Loại B: Hưởng 80%.</li>
      <li>Loại C: Hưởng 50%.</li>
    </ul>

    <p><strong>Điều 11. Thưởng sáng kiến</strong></p>
    <ul>
      <li>Áp dụng cho nhân viên có mẫu thiết kế "Best Seller" hoặc cải tiến tiết kiệm chi phí.</li>
      <li>Mức thưởng: <strong>500.000 – 5.000.000 VNĐ/lần</strong>.</li>
    </ul>

    <p><strong>Điều 12. Thưởng Lễ, Tết, Lương tháng 13</strong></p>
    <p>* <strong>Thưởng lương tháng 13 vào dịp tết:</strong> Tuỳ theo tình hình sản xuất kinh doanh, Công ty sẽ xét thưởng lương tháng 13 cho NLĐ làm việc đủ 12 tháng với mức thưởng ít nhất 01 tháng lương theo HĐLĐ.</p>
    <ul>
      <li>NLĐ làm việc dưới 12 tháng được hưởng ½ tháng lương 13.</li>
      <li>NLĐ làm dưới 6 tháng được 1/3 tháng lương 13.</li>
      <li>NLĐ làm dưới 3 tháng được ¼ tháng lương 13.</li>
      <li>Thử việc thưởng 500.000đ - 1.000.000đ.</li>
    </ul>
    <p style="font-style: italic;">Các khoản này được tính là chi phí hợp lý của doanh nghiệp.</p>

    <h2>CHƯƠNG V: ĐIỀU KHOẢN THI HÀNH</h2>

    <p><strong>Điều 13. Thời gian trả lương</strong></p>
    <ul>
      <li>Trả 01 lần/tháng vào ngày 10 qua tài khoản ngân hàng.</li>
      <li>Nếu trùng ngày nghỉ lễ/cuối tuần thì chuyển sang ngày làm việc kế tiếp.</li>
    </ul>

    <p><strong>Điều 14. Hiệu lực</strong></p>
    <ul>
      <li>Quy chế có hiệu lực từ ngày 01/01/2026.</li>
      <li>Mọi sửa đổi, bổ sung phải được Giám đốc phê duyệt bằng văn bản.</li>
    </ul>

    <p><strong>Nơi nhận:</strong> Toàn thể CBNV.</p>

    <table style="width: 100%; border: none; margin-top: 24px;">
      <tr>
        <td style="width: 50%; border: none;"></td>
        <td style="text-align: center; width: 50%; border: none; vertical-align: top;">
          <p><strong>TM. CÔNG TY CỔ PHẦN RIOMIO</strong></p>
          <p><strong>GIÁM ĐỐC</strong></p>
          <p style="font-size: 11pt; color: #666;">(Ký & đóng dấu)</p>
          <br/><br/><br/><br/>
          <p><strong>HOÀNG VĂN VIỆT</strong></p>
        </td>
      </tr>
    </table>

    <hr style="margin-top: 48px; border: 1px solid #ccc;"/>

    <h2 style="text-align: center; margin-top: 24px;">PHỤ LỤC: BẢNG TỔNG HỢP MỨC PHỤ CẤP, TRỢ CẤP ÁP DỤNG NĂM 2026</h2>

    <table style="margin-top: 16px;">
      <thead>
        <tr>
          <th style="width: 50px;">STT</th>
          <th>Khoản phụ cấp / trợ cấp</th>
          <th style="width: 200px;">Mức chi (VNĐ)</th>
          <th style="width: 200px;">Ghi chú</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center;">1</td>
          <td>Ăn trưa</td>
          <td>910.000 / tháng</td>
          <td>Miễn BHXH, miễn TNCN</td>
        </tr>
        <tr>
          <td style="text-align: center;">2</td>
          <td>Xăng xe / Đi lại</td>
          <td>300.000 – 2.000.000 / tháng</td>
          <td>Theo chức danh</td>
        </tr>
        <tr>
          <td style="text-align: center;">3</td>
          <td>Điện thoại</td>
          <td>300.000 – 2.000.000 / tháng</td>
          <td>Theo vị trí</td>
        </tr>
        <tr>
          <td style="text-align: center;">4</td>
          <td>Trang phục (Đồng phục Riomio)</td>
          <td>≤ 5.000.000 / năm</td>
          <td>Tiền hoặc hiện vật</td>
        </tr>
        <tr>
          <td style="text-align: center;">5</td>
          <td>Trách nhiệm</td>
          <td>500.000 – 1.000.000 / tháng</td>
          <td>Trưởng bộ phận, kế toán trưởng</td>
        </tr>
        <tr>
          <td style="text-align: center;">6</td>
          <td>Độc hại / Nặng nhọc</td>
          <td>300.000 – 1.000.000 / tháng</td>
          <td>May mẫu, thủ kho</td>
        </tr>
        <tr>
          <td style="text-align: center;">7</td>
          <td>Hỗ trợ nhà ở (có hợp đồng thuê nhà)</td>
          <td>300.000 - 3.000.000 / tháng</td>
          <td>Theo vị trí</td>
        </tr>
        <tr>
          <td style="text-align: center;">8</td>
          <td>Thưởng sáng kiến</td>
          <td>500.000 – 5.000.000 / lần</td>
          <td>Theo giá trị làm lợi</td>
        </tr>
        <tr>
          <td style="text-align: center;">9</td>
          <td>Thưởng tháng / quý (KPI)</td>
          <td>Theo kết quả xếp loại</td>
          <td>Loại A: 100%, B: 80%, C: 50%</td>
        </tr>
      </tbody>
    </table>
  `;
};

export default function QuyCheTab() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (html: string) => {
    try {
      setIsSaving(true);
      const supabase = createClient();

      const data = {
        contract_type: "quy_che_luong",
        employee_name: "Công ty",
        year: new Date().getFullYear(),
        extra_data: {
          html_content: html,
        },
        status: "draft",
      };

      const { error } = await supabase.from("contracts").insert(data);
      if (error) throw error;
      toast.success("Đã lưu quy chế");
    } catch (error: any) {
      toast.error("Lỗi: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Quy chế tiền lương, tiền thưởng và các khoản trợ cấp</h3>
      </div>
      <DocumentEditor
        initialContent={getInitialContent()}
        title="Quy chế tiền lương, tiền thưởng"
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
