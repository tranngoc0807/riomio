"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import DocumentEditor from "./DocumentEditor";

const getInitialContent = () => {
  return `
    <p style="text-align: center;"><strong>CÔNG TY CỔ PHẦN RIOMIO</strong></p>

    <h1 style="text-align: center;">BẢNG ĐÁNH GIÁ KẾT QUẢ CÔNG VIỆC (KPI) - KHỐI HỖ TRỢ</h1>
    <p style="text-align: center;">Tháng: … Năm: 2026</p>
    <p style="text-align: center;">---o0o---</p>

    <p style="margin-top: 24px;">Họ tên nhân viên: <strong>......................................................</strong></p>
    <p>Bộ phận: Kế toán / Kho</p>

    <table style="margin-top: 16px;">
      <thead>
        <tr>
          <th style="width: 50px;">STT</th>
          <th>Tiêu chí đánh giá</th>
          <th style="width: 80px;">Điểm tối đa</th>
          <th style="width: 80px;">Điểm tự chấm</th>
          <th style="width: 80px;">Quản lý chấm</th>
          <th style="width: 120px;">Ghi chú</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center;">1</td>
          <td>Khối lượng công việc: Hoàn thành báo cáo/nhập xuất kho đúng hạn</td>
          <td style="text-align: center;">50</td>
          <td style="text-align: center;">50</td>
          <td style="text-align: center;">50</td>
          <td></td>
        </tr>
        <tr>
          <td style="text-align: center;">2</td>
          <td>Chất lượng: Không sai sót số liệu, không mất mát hàng hóa</td>
          <td style="text-align: center;">30</td>
          <td style="text-align: center;">30</td>
          <td style="text-align: center;">25</td>
          <td>Sai lệch kho nhẹ</td>
        </tr>
        <tr>
          <td style="text-align: center;">3</td>
          <td>Kỷ luật: Đi làm đúng giờ, tuân thủ nội quy</td>
          <td style="text-align: center;">20</td>
          <td style="text-align: center;">20</td>
          <td style="text-align: center;">20</td>
          <td></td>
        </tr>
        <tr>
          <td style="text-align: center;"><strong>TC</strong></td>
          <td><strong>TỔNG ĐIỂM</strong></td>
          <td style="text-align: center;"><strong>100</strong></td>
          <td style="text-align: center;"><strong>100</strong></td>
          <td style="text-align: center;"><strong>95</strong></td>
          <td></td>
        </tr>
      </tbody>
    </table>

    <p style="margin-top: 24px;"><strong>XẾP LOẠI:</strong> A</p>

    <p style="margin-top: 16px;"><strong>QUY ĐỔI MỨC THƯỞNG HIỆU QUẢ</strong></p>
    <ul>
      <li>Xếp loại A (90–100đ): Hưởng 100% mức thưởng trần (VD: 3.000.000 đ)</li>
      <li>Xếp loại B (70–89đ): Hưởng 80% mức thưởng trần</li>
      <li>Xếp loại C (&lt;70đ): Hưởng 50% hoặc không thưởng</li>
    </ul>
    <p><strong>→ SỐ TIỀN ĐƯỢC NHẬN KỲ NÀY: 3.000.000 VNĐ</strong></p>

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

export default function KPIVanPhongTab() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (html: string) => {
    try {
      setIsSaving(true);
      const supabase = createClient();

      const data = {
        contract_type: "kpi_van_phong",
        employee_name: "KPI Văn phòng",
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
        <h3 className="text-lg font-semibold">Phiếu đánh giá KPI - Khối Văn phòng (Kế toán/Kho)</h3>
      </div>
      <DocumentEditor
        initialContent={getInitialContent()}
        title="KPI Văn phòng"
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
