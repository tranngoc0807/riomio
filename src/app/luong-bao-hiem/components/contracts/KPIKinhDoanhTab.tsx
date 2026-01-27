"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import DocumentEditor from "./DocumentEditor";

const getInitialContent = () => {
  return `
    <p style="text-align: center;"><strong>CÔNG TY CỔ PHẦN RIOMIO</strong></p>

    <h1 style="text-align: center;">PHIẾU ĐÁNH GIÁ HIỆU QUẢ CÔNG VIỆC (KPI) –<br/>KHỐI KINH DOANH</h1>
    <p style="text-align: center;">Tháng: … Năm: 2026</p>
    <p style="text-align: center;">---o0o---</p>

    <p style="margin-top: 24px;">Họ tên nhân viên: <strong>......................................................</strong></p>
    <p>Vị trí: Nhân viên Kinh doanh</p>
    <p>Căn cứ: Quy chế lương thưởng số 01-2026/QC-RIOMIO.</p>

    <table style="margin-top: 16px;">
      <thead>
        <tr>
          <th style="width: 50px;">STT</th>
          <th>Tiêu chí đánh giá</th>
          <th style="width: 80px;">Trọng số (%)</th>
          <th style="width: 140px;">Chỉ tiêu cam kết (Target)</th>
          <th style="width: 140px;">Kết quả thực đạt</th>
          <th style="width: 100px;">Tỷ lệ hoàn thành (%)</th>
          <th style="width: 100px;">Ghi chú</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center;">1</td>
          <td>Doanh số bán hàng</td>
          <td style="text-align: center;">70%</td>
          <td style="text-align: right;">500.000.000 đ</td>
          <td style="text-align: right;">600.000.000 đ</td>
          <td style="text-align: center;">120%</td>
          <td>Đạt mức thưởng vượt</td>
        </tr>
        <tr>
          <td style="text-align: center;">2</td>
          <td>Thu hồi công nợ</td>
          <td style="text-align: center;">20%</td>
          <td style="text-align: center;">100% đúng hạn</td>
          <td style="text-align: center;">95%</td>
          <td style="text-align: center;">95%</td>
          <td></td>
        </tr>
        <tr>
          <td style="text-align: center;">3</td>
          <td>Phát triển khách mới</td>
          <td style="text-align: center;">10%</td>
          <td style="text-align: center;">05 Đại lý/Sỉ</td>
          <td style="text-align: center;">05 Đại lý</td>
          <td style="text-align: center;">100%</td>
          <td></td>
        </tr>
        <tr>
          <td style="text-align: center;"><strong>TỔNG</strong></td>
          <td style="text-align: center;"><strong>ĐÁNH GIÁ CHUNG</strong></td>
          <td style="text-align: center;"><strong>100%</strong></td>
          <td></td>
          <td></td>
          <td style="text-align: center;"><strong></strong></td>
          <td></td>
        </tr>
      </tbody>
    </table>

    <p style="margin-top: 24px;"><strong>XẾP LOẠI:</strong> ĐẠT LOẠI A</p>

    <p style="margin-top: 16px;"><strong>TÍNH TOÁN THU NHẬP HIỆU QUẢ (Không đóng BHXH)</strong></p>
    <ul>
      <li>Hoa hồng doanh số (2% x Doanh số thực đạt): <strong>12.000.000 đ</strong></li>
      <li>Thưởng đạt/vượt chỉ tiêu (Target): <strong>2.000.000 đ</strong></li>
      <li>Giảm trừ thưởng (Nếu có): <strong>0 đ</strong></li>
    </ul>
    <p><strong>→ TỔNG LƯƠNG HIỆU QUẢ: 14.000.000 VNĐ</strong></p>

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
          <p><strong>Trưởng bộ phận</strong></p>
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

export default function KPIKinhDoanhTab() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (html: string) => {
    try {
      setIsSaving(true);
      const supabase = createClient();

      const data = {
        contract_type: "kpi_kinh_doanh",
        employee_name: "KPI Kinh doanh",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        extra_data: {
          html_content: html,
        },
        status: "draft",
      };

      const { error } = await supabase.from("contracts").insert(data);
      if (error) throw error;
      toast.success("Đã lưu phiếu KPI");
    } catch (error: any) {
      toast.error("Lỗi: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Phiếu đánh giá KPI - Khối Kinh doanh</h3>
      </div>
      <DocumentEditor
        initialContent={getInitialContent()}
        title="KPI Kinh doanh"
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
