"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import DocumentEditor from "./DocumentEditor";

const getInitialContent = () => {
  return `
    <p style="text-align: center;"><strong>CÔNG TY CỔ PHẦN RIOMIO</strong></p>

    <h1 style="text-align: center;">PHIẾU NGHIỆM THU CÔNG VIỆC & TÍNH LƯƠNG SẢN PHẨM</h1>
    <p style="text-align: center;">Tháng: … Năm: 2026</p>
    <p style="text-align: center;">---o0o---</p>

    <p style="margin-top: 24px;">Họ tên nhân viên: <strong>......................................................</strong></p>
    <p>Vị trí: Thiết kế Rập / Thiết kế Hình ảnh</p>

    <table style="margin-top: 16px;">
      <thead>
        <tr>
          <th style="width: 50px;">STT</th>
          <th>Nội dung công việc</th>
          <th style="width: 80px;">Đơn vị tính</th>
          <th style="width: 120px;">Đơn giá nội bộ (VNĐ)</th>
          <th style="width: 100px;">Số lượng hoàn thành</th>
          <th style="width: 120px;">Thành tiền (VNĐ)</th>
          <th style="width: 120px;">Đánh giá chất lượng (Đạt/Sửa)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center;">1</td>
          <td>Thiết kế rập bộ sưu tập Hè</td>
          <td style="text-align: center;">Mã</td>
          <td style="text-align: right;">200.000</td>
          <td style="text-align: center;">30</td>
          <td style="text-align: right;">6.000.000</td>
          <td style="text-align: center;">Tốt</td>
        </tr>
        <tr>
          <td style="text-align: center;">2</td>
          <td>Nhảy size (Grading)</td>
          <td style="text-align: center;">Mã</td>
          <td style="text-align: right;">50.000</td>
          <td style="text-align: center;">30</td>
          <td style="text-align: right;">1.500.000</td>
          <td style="text-align: center;">Đạt</td>
        </tr>
        <tr>
          <td style="text-align: center;">3</td>
          <td>Chỉnh sửa rập theo mẫu may</td>
          <td style="text-align: center;">Lần</td>
          <td style="text-align: right;">0</td>
          <td style="text-align: center;">5</td>
          <td style="text-align: right;">0</td>
          <td style="text-align: center;">Trách nhiệm</td>
        </tr>
        <tr>
          <td style="text-align: center;">4</td>
          <td>Thưởng mẫu Best Seller (*)</td>
          <td style="text-align: center;">Mã</td>
          <td style="text-align: right;">500.000</td>
          <td style="text-align: center;">2</td>
          <td style="text-align: right;">1.000.000</td>
          <td style="text-align: center;">Mã bộ Áo dài Tết</td>
        </tr>
        <tr>
          <td style="text-align: center;"><strong>TC</strong></td>
          <td><strong>TỔNG LƯƠNG HIỆU QUẢ</strong></td>
          <td></td>
          <td></td>
          <td></td>
          <td style="text-align: right;"><strong>8.500.000</strong></td>
          <td></td>
        </tr>
      </tbody>
    </table>

    <p style="margin-top: 16px; font-style: italic;">(Chưa gồm lương cứng)</p>
    <p style="font-size: 11pt;">(*) Thưởng mẫu Best Seller: Áp dụng cho các mẫu thiết kế bán vượt 1.000 sản phẩm.</p>
    <p style="font-size: 11pt;">Lương sản phẩm là khoản thưởng năng suất vượt trội.</p>

    <p style="text-align: right; margin-top: 24px;"><em>Ngày … tháng … năm 2026</em></p>

    <table style="width: 100%; border: none; margin-top: 24px;">
      <tr>
        <td style="text-align: center; width: 33%; border: none; vertical-align: top;">
          <p><strong>Nhân viên</strong></p>
          <p style="font-size: 11pt; color: #666;">(Ký, ghi rõ họ tên)</p>
          <br/><br/><br/><br/>
          <p>................................</p>
        </td>
        <td style="text-align: center; width: 33%; border: none; vertical-align: top;">
          <p><strong>KHSX xác nhận</strong></p>
          <p style="font-size: 11pt; color: #666;">(Ký, ghi rõ họ tên)</p>
          <br/><br/><br/><br/>
          <p>................................</p>
        </td>
        <td style="text-align: center; width: 33%; border: none; vertical-align: top;">
          <p><strong>Giám đốc duyệt</strong></p>
          <p style="font-size: 11pt; color: #666;">(Ký, ghi rõ họ tên)</p>
          <br/><br/><br/><br/>
          <p>................................</p>
        </td>
      </tr>
    </table>
  `;
};

export default function KPIKyThuatTab() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (html: string) => {
    try {
      setIsSaving(true);
      const supabase = createClient();

      const data = {
        contract_type: "kpi_ky_thuat",
        employee_name: "KPI Kỹ thuật",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        extra_data: {
          html_content: html,
        },
        status: "draft",
      };

      const { error } = await supabase.from("contracts").insert(data);
      if (error) throw error;
      toast.success("Đã lưu phiếu nghiệm thu");
    } catch (error: any) {
      toast.error("Lỗi: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Phiếu nghiệm thu công việc - Khối Kỹ thuật (Thiết kế)</h3>
      </div>
      <DocumentEditor
        initialContent={getInitialContent()}
        title="Phiếu nghiệm thu Kỹ thuật"
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
