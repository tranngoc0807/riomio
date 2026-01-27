"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import DocumentEditor from "./DocumentEditor";

const getInitialContent = () => {
  return `
    <p style="text-align: center;"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
    <p style="text-align: center;"><strong><u>Độc lập – Tự do – Hạnh phúc</u></strong></p>
    <p style="text-align: center;">---o0o---</p>

    <h1 style="text-align: center;">HỢP ĐỒNG LAO ĐỘNG</h1>
    <p style="text-align: center;">Số: …/2026/HĐLĐ-RIOMIO</p>

    <p style="margin-top: 24px;">Hôm nay, ngày … tháng … năm 2026, tại Văn phòng Công ty Cổ phần Riomio.</p>
    <p>Chúng tôi gồm:</p>

    <p style="margin-top: 16px;"><strong>BÊN A: NGƯỜI SỬ DỤNG LAO ĐỘNG (Công ty)</strong></p>
    <p>Tên doanh nghiệp: <strong>CÔNG TY CỔ PHẦN RIOMIO</strong></p>
    <p>Đại diện bởi: Ông <strong>HOÀNG VĂN VIỆT</strong></p>
    <p>Chức vụ: Giám đốc</p>
    <p>Địa chỉ: Số nhà B12 -TT7 đường Nguyễn Sơn Hà, KĐT Văn Quán, Phường Hà Đông, Hà Nội</p>
    <p>Mã số thuế: 0109531866</p>

    <p style="margin-top: 16px;"><strong>BÊN B: NGƯỜI LAO ĐỘNG (Nhân viên)</strong></p>
    <p>Ông/Bà: <strong>................................</strong></p>
    <p>Sinh ngày: ................................</p>
    <p>CMND/CCCD số: ................................ Cấp ngày: ................................ Tại: ................................</p>
    <p>Quê quán: ................................</p>
    <p>Chỗ ở hiện tại: ................................</p>

    <p style="margin-top: 16px;">Thỏa thuận ký kết hợp đồng lao động với các điều khoản sau đây:</p>

    <p style="margin-top: 16px;"><strong>ĐIỀU 1: CÔNG VIỆC, ĐỊA ĐIỂM VÀ THỜI HẠN HỢP ĐỒNG</strong></p>
    <p><strong>Vị trí chuyên môn:</strong> ................................</p>
    <p><strong>Mô tả công việc:</strong> Thực hiện công việc theo sự sắp xếp của lãnh đạo Công ty và các trưởng, phó bộ phận.</p>
    <p>Người lao động đồng ý rằng Người sử dụng lao động có thể quyết định một cách hợp lý chức vụ của Người lao động và việc thuyên chuyển Người lao động trong các phòng ban của Công ty phù hợp với chuyên môn và năng lực của Người lao động.</p>
    <p>Hoàn thành tốt công việc được giao theo định mức sản lượng, thời gian công nghệ và đạt chất lượng theo quy định – chấp hành tốt nội quy kỷ luật, chấp hành nghiêm chỉnh quy trình vận hành, quy trình thao tác công nghệ, bảo quản thiết bị, quy trình an toàn lao động.</p>
    <p><strong>Địa điểm làm việc:</strong> Tại văn phòng Công ty Riomio và các địa điểm khác theo yêu cầu công việc.</p>
    <p><strong>Loại hợp đồng:</strong> Xác định thời hạn 24 tháng</p>
    <p>Từ ngày 02/01/2026 đến hết ngày 31/12/2027</p>

    <p style="margin-top: 16px;"><strong>ĐIỀU 2: THỜI GIỜ LÀM VIỆC VÀ NGHỈ NGƠI</strong></p>
    <p><strong>Thời gian làm việc:</strong> Từ 8h00 đến 17h30, từ Thứ 2 đến Thứ 7 (nghỉ trưa 1h30p).</p>
    <p><strong>Nghỉ hàng tuần/Lễ tết:</strong> Theo quy định của Luật Lao động và Quy chế công ty.</p>
    <p>Do tính chất công việc, yêu cầu của tổ chức/bộ phận hoặc yêu cầu của khách hàng, Công ty có thể cho áp dụng thời gian làm việc linh hoạt. Những nhân viên được áp dụng thời gian làm việc linh hoạt có thể không tuân thủ lịch làm việc cố định bình thường mà làm theo thời gian cụ thể của công việc, nhưng vẫn phải đảm bảo đủ số giờ làm việc theo quy định.</p>
    <p>Thiết bị và công cụ làm việc có thể được Công ty cấp phát (nếu cần thiết) tùy theo nhu cầu của công việc.</p>
    <p>Điều kiện an toàn và vệ sinh lao động tại nơi làm việc theo quy định của pháp luật hiện hành.</p>

    <p style="margin-top: 16px;"><strong>ĐIỀU 3: TIỀN LƯƠNG, PHỤ CẤP VÀ CÁC KHOẢN BỔ SUNG KHÁC</strong></p>
    <p><strong>Mức lương chính (Lương cơ bản đóng BHXH):</strong> ………… VNĐ/tháng</p>
    <p><strong>Các khoản phụ cấp:</strong> Theo quy định của Công ty</p>
    <p><strong>Chế độ nâng lương:</strong> Theo quy định của pháp luật và Quy chế tiền lương của Công ty</p>
    <p><strong>Thưởng:</strong> Do Công ty quyết định tùy theo hiệu quả công việc và tình hình kinh doanh của Công ty</p>
    <p><strong>Chế độ nghỉ ngơi (nghỉ hàng tuần, phép năm, lễ tết...):</strong> Theo Nội quy lao động của Công ty và quy định của pháp luật hiện hành</p>
    <p><strong>Chế độ Bảo hiểm:</strong> Theo quy định của pháp luật hiện hành</p>
    <p><strong>Chế độ đào tạo:</strong> Theo quy định của Công ty</p>
    <p><strong>Tiền lương làm thêm giờ:</strong> Được tính theo quy định của Công ty hoặc theo quy định chung của Nhà nước</p>
    <p><strong>Được trang bị bảo hộ lao động:</strong> Theo quy định của Công ty (nếu có)</p>

    <p style="margin-top: 12px;"><strong>Lương hiệu quả công việc & Thưởng:</strong></p>
    <p style="margin-left: 16px;">Bên cạnh lương cứng, Bên B được hưởng thêm khoản "Thưởng hiệu quả công việc" (KPI) hoặc Lương theo doanh số (đối với Sale). Mức hưởng: Không cố định.</p>
    <p style="margin-left: 16px;"><strong>Điều kiện hưởng:</strong> Căn cứ vào kết quả kinh doanh của Công ty và kết quả đánh giá thực hiện công việc (KPI) hàng tháng của Bên B theo Quy chế Lương thưởng của công ty.</p>
    <p><strong>Hình thức trả lương:</strong> Chuyển khoản qua tài khoản ngân hàng của công ty vào ngày 10 hàng tháng.</p>

    <p style="margin-top: 16px;"><strong>ĐIỀU 4: NGHĨA VỤ VÀ QUYỀN LỢI CỦA NGƯỜI LAO ĐỘNG</strong></p>
    <p><strong>4.1. Quyền lợi:</strong></p>
    <ul>
      <li>Được cung cấp trang thiết bị làm việc (Máy tính, phần mềm, máy may...).</li>
      <li>Được tham gia BHXH, BHYT, BHTN theo quy định (trên mức lương chính).</li>
      <li>Được hưởng các chế độ phúc lợi: Hiếu, hỉ, sinh nhật, du lịch theo Quy chế tài chính của Công ty.</li>
      <li>Được xét tăng lương định kỳ hàng năm dựa trên năng lực.</li>
    </ul>
    <p><strong>4.2. Nghĩa vụ:</strong></p>
    <ul>
      <li>Hoàn thành tốt công việc được giao.</li>
      <li>Chấp hành nghiêm chỉnh Nội quy lao động và an toàn lao động.</li>
    </ul>

    <p style="margin-top: 16px;"><strong>ĐIỀU 5: BẢO MẬT THÔNG TIN & SỞ HỮU TRÍ TUỆ</strong></p>
    <p>Do đặc thù ngành thời trang, Bên B cam kết:</p>
    <p><strong>Bảo mật thông tin:</strong> Không tiết lộ danh sách khách hàng, nhà cung cấp, bí mật giá thành, chiến lược kinh doanh cho bên thứ ba.</p>
    <p><strong>Sở hữu trí tuệ:</strong> Toàn bộ các thiết kế, bản vẽ, rập, hình ảnh, video, mẫu mã sản phẩm do Bên B tạo ra trong quá trình làm việc đều thuộc quyền sở hữu duy nhất của Công ty Cổ phần Riomio.</p>
    <p><strong>Không sao chép:</strong> Bên B không được phép sao chép, mang các mẫu thiết kế/rập của công ty ra ngoài hoặc sử dụng cho mục đích cá nhân/bán cho đối thủ cạnh tranh.</p>
    <p>Mọi vi phạm sẽ phải bồi thường thiệt hại theo quy định của pháp luật và Công ty.</p>

    <p style="margin-top: 16px;"><strong>ĐIỀU 6: ĐIỀU KHOẢN THI HÀNH</strong></p>
    <p>Hợp đồng này được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản.</p>
    <p>Hợp đồng có hiệu lực kể từ ngày ký.</p>

    <table style="width: 100%; border: none; margin-top: 48px;">
      <tr>
        <td style="text-align: center; width: 50%; border: none; vertical-align: top;">
          <p><strong>ĐẠI DIỆN BÊN A (CÔNG TY)</strong></p>
          <p>Giám đốc</p>
          <p style="font-size: 11pt; color: #666;">(Ký, đóng dấu)</p>
          <br/><br/><br/><br/>
          <p><strong>HOÀNG VĂN VIỆT</strong></p>
        </td>
        <td style="text-align: center; width: 50%; border: none; vertical-align: top;">
          <p><strong>ĐẠI DIỆN BÊN B (NLĐ)</strong></p>
          <p style="font-size: 11pt; color: #666;">(Ký, ghi rõ họ tên)</p>
          <br/><br/><br/><br/>
          <p><strong>................................</strong></p>
        </td>
      </tr>
    </table>
  `;
};

export default function HopDongLaoDongTab() {
  const [isSaving, setIsSaving] = useState(false);
  const [savedContracts, setSavedContracts] = useState<any[]>([]);

  useEffect(() => {
    fetchSavedContracts();
  }, []);

  const fetchSavedContracts = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("contract_type", "hop_dong_lao_dong")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedContracts(data || []);
    } catch (error) {
      console.error("Error fetching contracts:", error);
    }
  };

  const handleSave = async (html: string) => {
    try {
      setIsSaving(true);
      const supabase = createClient();

      const data = {
        contract_type: "hop_dong_lao_dong",
        employee_name: "Hợp đồng lao động",
        year: new Date().getFullYear(),
        extra_data: {
          html_content: html,
        },
        status: "draft",
      };

      const { error } = await supabase.from("contracts").insert(data);
      if (error) throw error;
      toast.success("Đã lưu hợp đồng");
      fetchSavedContracts();
    } catch (error: any) {
      toast.error("Lỗi: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Hợp đồng lao động</h3>
      </div>
      <DocumentEditor
        initialContent={getInitialContent()}
        title="Hợp đồng lao động"
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* Saved contracts list */}
      {savedContracts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Hợp đồng đã lưu ({savedContracts.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">STT</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Ngày tạo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {savedContracts.map((contract, index) => (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{index + 1}</td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(contract.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        contract.status === "signed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {contract.status === "signed" ? "Đã ký" : "Nháp"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
