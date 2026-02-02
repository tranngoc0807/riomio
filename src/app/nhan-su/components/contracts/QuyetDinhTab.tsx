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
          <p><strong>CÔNG TY CP RIOMIO</strong></p>
          <p>Số: 01/2026/QĐ-RIOMIO</p>
        </td>
        <td style="width: 55%; border: none; text-align: center; vertical-align: top;">
          <p><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
          <p><strong>Độc lập – Tự do – Hạnh phúc</strong></p>
          <p>---o0o---</p>
          <p><em>Hà Nội, ngày 02 tháng 01 năm 2026</em></p>
        </td>
      </tr>
    </table>

    <h1 style="text-align: center;">QUYẾT ĐỊNH</h1>
    <p style="text-align: center;"><strong>V/v: Ban hành Quy chế Tiền lương, Tiền thưởng và Phụ cấp</strong></p>

    <p style="text-align: center; margin-top: 24px;"><strong>GIÁM ĐỐC CÔNG TY CỔ PHẦN RIOMIO</strong></p>

    <p style="margin-top: 16px;">Căn cứ Bộ luật Lao động số 45/2019/QH14 ngày 20/11/2019 của Quốc hội nước CHXHCN Việt Nam;</p>
    <p>Căn cứ Luật Doanh nghiệp số 59/2020/QH14 ngày 17/06/2020;</p>
    <p>Căn cứ Điều lệ tổ chức và hoạt động của Công ty Cổ phần Riomio;</p>
    <p>Căn cứ chức năng, quyền hạn của Giám đốc Công ty;</p>
    <p>Căn cứ Biên bản họp lấy ý kiến tập thể người lao động số 01/2026/BB-RIOMIO ngày 02/01/2026;</p>
    <p>Xét tình hình thực tế và nhu cầu quản trị của Công ty.</p>

    <p style="text-align: center; margin-top: 24px;"><strong>QUYẾT ĐỊNH:</strong></p>

    <p><strong>Điều 1.</strong> Ban hành kèm theo Quyết định này là "Quy chế Tiền lương, Tiền thưởng và Phụ cấp" áp dụng cho toàn thể cán bộ nhân viên Công ty Cổ phần Riomio.</p>

    <p><strong>Điều 2.</strong> Quyết định này có hiệu lực thi hành kể từ ngày ký và thay thế cho tất cả các văn bản, quy định về lương thưởng trước đây của Công ty.</p>

    <p><strong>Điều 3.</strong> Phòng Kế toán, Bộ phận Hành chính Nhân sự, các Trưởng bộ phận và toàn thể cán bộ nhân viên Công ty Cổ phần Riomio chịu trách nhiệm thi hành Quyết định này.</p>

    <p>Phòng Kế toán có trách nhiệm tính toán, chi trả lương và các chế độ theo đúng quy định tại Quy chế này kể từ kỳ lương tháng 01 năm 2026.</p>

    <table style="width: 100%; border: none; margin-top: 24px;">
      <tr>
        <td style="width: 50%; border: none; vertical-align: top;">
          <p><strong>Nơi nhận:</strong></p>
          <ul style="list-style-type: disc; margin-left: 16px;">
            <li>Như Điều 3 (để thực hiện);</li>
            <li>Lưu: VP, HS Lương.</li>
          </ul>
        </td>
        <td style="text-align: center; width: 50%; border: none; vertical-align: top;">
          <p><strong>GIÁM ĐỐC</strong></p>
          <p style="font-size: 11pt; color: #666;">(Ký, đóng dấu)</p>
          <br/><br/><br/><br/>
          <p><strong>HOÀNG VĂN VIỆT</strong></p>
        </td>
      </tr>
    </table>
  `;
};

export default function QuyetDinhTab() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (html: string) => {
    try {
      setIsSaving(true);
      const supabase = createClient();

      const data = {
        contract_type: "quyet_dinh",
        employee_name: "Quyết định",
        year: new Date().getFullYear(),
        extra_data: {
          html_content: html,
        },
        status: "draft",
      };

      const { error } = await supabase.from("contracts").insert(data);
      if (error) throw error;
      toast.success("Đã lưu quyết định");
    } catch (error: any) {
      toast.error("Lỗi: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Quyết định quy chế lương thưởng</h3>
      </div>
      <DocumentEditor
        initialContent={getInitialContent()}
        title="Quyết định quy chế lương thưởng"
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
