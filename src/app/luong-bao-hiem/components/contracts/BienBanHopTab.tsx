"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import DocumentEditor from "./DocumentEditor";

const getInitialContent = () => {
  return `
    <table style="width: 100%; border: none; margin-bottom: 16px;">
      <tr>
        <td style="text-align: center; width: 45%; border: none; vertical-align: top;">
          <p><strong>CÔNG TY CỔ PHẦN RIOMIO</strong></p>
          <p>Số: 02/2026/BB-RIOMIO</p>
        </td>
        <td style="text-align: center; width: 55%; border: none; vertical-align: top;">
          <p><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
          <p><strong>Độc lập – Tự do – Hạnh phúc</strong></p>
          <p>---o0o---</p>
          <p><em>Hà Nội, ngày 02 tháng 01 năm 2026</em></p>
        </td>
      </tr>
    </table>

    <h1 style="text-align: center;">BIÊN BẢN HỌP</h1>
    <p style="text-align: center;"><strong>V/v: Lấy ý kiến tập thể người lao động về Thỏa ước lao động tập thể<br/>và Quy chế Lương thưởng năm 2026</strong></p>

    <p style="margin-top: 24px;"><strong>I. THỜI GIAN VÀ ĐỊA ĐIỂM</strong></p>
    <p><strong>Thời gian:</strong> 08 giờ 30 phút, ngày 02 tháng 01 năm 2026.</p>
    <p><strong>Địa điểm:</strong> Phòng họp Công ty Cổ phần Riomio. Tại Văn phòng Số nhà B12-TT7 đường Nguyễn Sơn Hà, KĐT Văn Quán, Phường Hà Đông, Hà Nội.</p>

    <p style="margin-top: 16px;"><strong>II. THÀNH PHẦN THAM DỰ</strong></p>
    <p><strong>Đại diện Người sử dụng lao động (Ban Giám đốc):</strong></p>
    <p style="margin-left: 16px;">Ông: <strong>HOÀNG VĂN VIỆT</strong> – Chức vụ: Giám đốc (Chủ tọa cuộc họp).</p>

    <p><strong>Đại diện Người lao động:</strong></p>
    <p style="margin-left: 16px;">Tổng số cán bộ nhân viên (CBNV) triệu tập: 11 người.</p>
    <p style="margin-left: 16px;">Tổng số CBNV có mặt: 11/11 người (Đạt tỷ lệ 100%).</p>

    <p><strong>Thư ký cuộc họp:</strong></p>
    <p style="margin-left: 16px;">Bà: <strong>Trịnh Thị Hồng</strong> – Chức vụ: Thư ký.</p>

    <p style="margin-top: 16px;"><strong>III. NỘI DUNG CUỘC HỌP</strong></p>

    <p><strong>1. Ông Hoàng Việt – Giám đốc công ty trình bày các nội dung mới:</strong></p>
    <ul>
      <li>Triển khai kế hoạch kinh doanh năm 2026 và mục tiêu tái cơ cấu hệ thống quản trị nhân sự.</li>
      <li>Trình bày Quy chế Lương thưởng & Phụ cấp năm 2026.
        <ul>
          <li>Điểm mới: Tách rõ Lương cơ bản và các khoản Phụ cấp (Ăn trưa, Xăng xe, Điện thoại, Trang phục...).</li>
          <li>Điểm mới: Áp dụng cơ chế thưởng KPI/Doanh số hàng tháng dựa trên hiệu quả làm việc thực tế.</li>
        </ul>
      </li>
      <li>Trình bày dự thảo Thỏa ước Lao động tập thể.
        <ul>
          <li>Quy định về tiền lương, tiền thưởng, phúc lợi</li>
          <li>Các chế độ phúc lợi: Hiếu, hỉ, ốm đau, sinh nhật, nghỉ mát...</li>
          <li>Các cam kết về thời giờ làm việc và nghỉ ngơi.</li>
        </ul>
      </li>
    </ul>

    <p><strong>2. Thảo luận và lấy ý kiến:</strong></p>
    <ul>
      <li>Ông Hoàng Việt giải đáp thắc mắc của CBNV về cách tính KPI cho bộ phận Kinh doanh và Thiết kế.</li>
      <li>Giải thích rõ về việc chuyển lương qua tài khoản ngân hàng:
        <ul>
          <li>Tổng thu nhập thực nhận của người lao động không giảm, có thể tăng thêm tùy theo kết quả thực hiện KPI.</li>
          <li>Công ty thực hiện đóng bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp đầy đủ cho người lao động theo mức lương cơ bản đã thỏa thuận, phù hợp với quy định của pháp luật.</li>
        </ul>
      </li>
    </ul>

    <p><strong>3. Biểu quyết thông qua:</strong></p>
    <p>Sau khi nghe giải thích và thảo luận, toàn thể CBNV đã tiến hành biểu quyết về việc thông qua Quy chế và Thỏa ước nêu trên.</p>
    <p><strong>Kết quả biểu quyết:</strong></p>
    <ul>
      <li>Số phiếu tán thành: 10/10 phiếu (Đạt tỷ lệ 100%).</li>
      <li>Số phiếu không tán thành: 0 phiếu.</li>
      <li>Số phiếu trắng: 0 phiếu.</li>
    </ul>

    <p style="margin-top: 16px;"><strong>IV. KẾT LUẬN</strong></p>
    <ul>
      <li>100% CBNV Công ty Cổ phần Riomio đồng ý với nội dung của Quy chế Lương thưởng và Thỏa ước Lao động tập thể năm 2026.</li>
      <li>Giao cho Phòng Kế toán/Nhân sự hoàn thiện văn bản để Giám đốc và Đại diện NLĐ ký ban hành chính thức.</li>
      <li>Các quy định mới bắt đầu có hiệu lực kể từ ngày ký biên bản này.</li>
    </ul>

    <p style="margin-top: 16px;">Cuộc họp kết thúc vào hồi 10 giờ 30 phút cùng ngày. Biên bản đã được đọc lại cho mọi người cùng nghe và nhất trí thông qua.</p>

    <table style="width: 100%; border: none; margin-top: 48px;">
      <tr>
        <td style="text-align: center; width: 33%; border: none; vertical-align: top;">
          <p><strong>THƯ KÝ CUỘC HỌP</strong></p>
          <p style="font-size: 11pt; color: #666;">(Ký, ghi rõ họ tên)</p>
          <br/><br/><br/><br/>
          <p><strong>Trịnh Thị Hồng</strong></p>
        </td>
        <td style="text-align: center; width: 33%; border: none; vertical-align: top;">
          <p><strong>ĐẠI DIỆN TẬP THỂ NLĐ</strong></p>
          <p style="font-size: 11pt; color: #666;">(Ký, ghi rõ họ tên)</p>
          <br/><br/><br/><br/>
          <p><strong>................................</strong></p>
        </td>
        <td style="text-align: center; width: 33%; border: none; vertical-align: top;">
          <p><strong>CHỦ TỌA (GIÁM ĐỐC)</strong></p>
          <p style="font-size: 11pt; color: #666;">(Ký, đóng dấu)</p>
          <br/><br/><br/><br/>
          <p><strong>HOÀNG VĂN VIỆT</strong></p>
        </td>
      </tr>
    </table>

    <hr style="margin-top: 48px; border: 1px solid #ccc;"/>

    <p style="margin-top: 24px; text-align: center;"><strong>PHỤ LỤC: DANH SÁCH CHỮ KÝ</strong></p>
    <p style="text-align: center;"><strong>DANH SÁCH CÁN BỘ NHÂN VIÊN THAM DỰ HỌP VÀ ĐỒNG Ý THÔNG QUA QUY CHẾ</strong></p>
    <p style="text-align: center; font-style: italic;">(Kèm theo Biên bản họp số 02/2026/BB-RIOMIO ngày 02/01/2026)</p>

    <table style="margin-top: 16px;">
      <thead>
        <tr>
          <th style="width: 50px;">STT</th>
          <th>Họ và tên</th>
          <th>Chức vụ</th>
          <th style="width: 150px;">Chữ ký xác nhận</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center;">1</td>
          <td>Hoàng Văn Việt</td>
          <td>Giám đốc</td>
          <td></td>
        </tr>
        <tr>
          <td style="text-align: center;">2</td>
          <td>Đinh Thị Thu Bình</td>
          <td>Kinh doanh</td>
          <td></td>
        </tr>
        <tr>
          <td style="text-align: center;">3</td>
          <td>Lê Thị Thanh Thủy</td>
          <td>Thiết kế rập</td>
          <td></td>
        </tr>
        <tr>
          <td style="text-align: center;">4</td>
          <td>Nguyễn Thị Thuận</td>
          <td>Thiết kế</td>
          <td></td>
        </tr>
        <tr>
          <td style="text-align: center;">5</td>
          <td>Trần Thị Quý</td>
          <td>Nhân viên may</td>
          <td></td>
        </tr>
        <tr>
          <td style="text-align: center;">6</td>
          <td>Dương Thị Bích</td>
          <td>Quản lý đơn hàng</td>
          <td></td>
        </tr>
        <tr>
          <td style="text-align: center;">7</td>
          <td>Trịnh Thị Hồng</td>
          <td>Kế toán</td>
          <td></td>
        </tr>
        <tr>
          <td style="text-align: center;">8</td>
          <td>Phạm Hoài Phương</td>
          <td>Kinh doanh</td>
          <td></td>
        </tr>
        <tr>
          <td style="text-align: center;">9</td>
          <td>Đỗ Thị Hương Giang</td>
          <td>Kinh doanh</td>
          <td></td>
        </tr>
        <tr>
          <td style="text-align: center;">10</td>
          <td>Nguyễn Văn Toàn</td>
          <td>Nhân viên Kho</td>
          <td></td>
        </tr>
        <tr>
          <td style="text-align: center;">11</td>
          <td>Nguyễn Thị Thu Phương</td>
          <td>Nhân viên kho</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  `;
};

export default function BienBanHopTab() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (html: string) => {
    try {
      setIsSaving(true);
      const supabase = createClient();

      const data = {
        contract_type: "bien_ban_hop",
        employee_name: "Biên bản họp",
        year: new Date().getFullYear(),
        extra_data: {
          html_content: html,
        },
        status: "draft",
      };

      const { error } = await supabase.from("contracts").insert(data);
      if (error) throw error;
      toast.success("Đã lưu biên bản họp");
    } catch (error: any) {
      toast.error("Lỗi: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Biên bản họp lấy ý kiến tập thể NLĐ</h3>
      </div>
      <DocumentEditor
        initialContent={getInitialContent()}
        title="Biên bản họp"
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
