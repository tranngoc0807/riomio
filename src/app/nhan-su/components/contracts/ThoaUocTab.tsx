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
        </td>
        <td style="text-align: center; width: 55%; border: none; vertical-align: top;">
          <p><strong>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
          <p><strong>Độc lập – Tự do – Hạnh phúc</strong></p>
        </td>
      </tr>
    </table>

    <p style="text-align: center; font-style: italic;">TP. Hà Nội, ngày 01 tháng 01 năm 2026</p>

    <h1 style="text-align: center;">THỎA ƯỚC LAO ĐỘNG TẬP THỂ</h1>

    <p>- Căn cứ vào Bộ Luật Lao Động số 45/2019/QH14 ngày 20 tháng 11 năm 2019</p>
    <p>- Căn cứ vào Nghị định 145/2020/NĐ-CP ngày 14 tháng 12 năm 2020 quy định chi tiết và hướng dẫn thi hành một số điều của Bộ luật lao động.</p>
    <p>- Căn vào Thông tư 10/2020/TT-BLĐTBXH ngày 12 tháng 11 năm 2020 hướng dẫn một số nội dung tại Bộ luật Lao động.</p>
    <p style="text-indent: 2em;">Căn cứ sự thoả thuận giữa hai bên người sử dụng lao động và tập thể người lao động sau khi lấy ý kiến của tập thể người lao động trong doanh nghiệp;</p>
    <p style="text-indent: 2em;">Để đảm bảo quyền lợi và nghĩa vụ hợp pháp của mỗi bên trong quan hệ lao động, chúng tôi gồm có:</p>

    <p style="margin-top: 16px;"><strong>1. Đại diện người sử dụng lao động (NSDLĐ):</strong></p>
    <p style="margin-left: 16px;">Ông: <strong>HOÀNG VĂN VIỆT</strong> – Người đại diện pháp luật của công ty</p>
    <p style="margin-left: 16px;">Chức danh: Giám đốc</p>
    <p style="margin-left: 16px;">Địa chỉ: Số nhà B12 -TT7 đường Nguyễn Sơn Hà, KĐT Văn Quán, Phường Hà Đông, Hà Nội</p>
    <p style="margin-left: 16px;">Mã số thuế: 0109531866</p>
    <p style="margin-left: 16px;">ĐTDĐ: 0944531866</p>

    <p style="margin-top: 16px;"><strong>2. Đại diện tập thể lao động:</strong></p>
    <p style="margin-left: 16px;">Họ tên: <strong>Lê Thị Thanh Thủy</strong></p>
    <p style="margin-left: 16px;">Chức danh: Trưởng ban đại diện</p>
    <p style="margin-left: 16px;">Địa chỉ: ................................</p>
    <p style="margin-left: 16px;">CCCD số: ................................</p>
    <p style="margin-left: 16px;">ĐTDĐ: ................................</p>

    <p style="text-indent: 2em; margin-top: 16px;">Hai bên cam kết thực hiện đúng các quy định của pháp luật và cùng nhau thoả thuận ký kết Thỏa ước lao động tập thể tại doanh nghiệp với các điều khoản cụ thể như sau:</p>

    <h2 style="text-align: center;">Chương I<br/>NHỮNG QUY ĐỊNH CHUNG</h2>

    <p><strong>Điều 1. Phạm vi điều chỉnh</strong></p>
    <p style="text-indent: 2em;">Thoả ước lao động tập thể này quy định mối quan hệ lao động giữa tập thể lao động và NSDLĐ về các điều kiện lao động và sử dụng lao động, quyền và nghĩa vụ của mỗi bên trong thời hạn Thỏa ước có hiệu lực. Mọi trường hợp khác trong mối quan hệ lao động không quy định trong bản Thỏa ước lao động tập thể này, sẽ được giải quyết theo Bộ luật Lao động và các văn bản quy phạm pháp luật hiện hành.</p>

    <p><strong>Điều 2. Đối tượng thi hành</strong></p>
    <ol>
      <li>Người sử dụng lao động;</li>
      <li>Người lao động (NLĐ) đang làm việc tại công ty, kể cả NLĐ trong thời gian học nghề, tập nghề, thử việc, NLĐ vào làm việc sau ngày Thỏa ước có hiệu lực đều có trách nhiệm thực hiện những nội dung thoả thuận trong Thỏa ước này;</li>
      <li>Ban chấp hành Công đoàn cơ sở/Ban chấp hành Công đoàn cấp trên trực tiếp cơ sở (nơi không có công đoàn cơ sở).</li>
    </ol>

    <p><strong>Điều 3. Thời hạn của thỏa ước</strong></p>
    <ol>
      <li>Thỏa ước này có hiệu lực 3 năm kể từ ngày ký.</li>
      <li>Sau 6 tháng, các bên có quyền yêu cầu sửa đổi, bổ sung Thỏa ước. Việc sửa đổi, bổ sung phải được tiến hành theo trình tự như khi ký kết.</li>
      <li>Khi thời hạn của Thỏa ước hết hiệu lực hai bên thực hiện theo quy định tại Điều 83 Bộ luật Lao động.</li>
    </ol>

    <p><strong>Điều 4. Cam kết của NSDLĐ bảo đảm quyền hoạt động của công đoàn</strong></p>
    <p style="text-indent: 2em;">NSDLĐ có trách nhiệm thực hiện các quy định của pháp luật về quyền công đoàn, trích nộp kinh phí công đoàn đầy đủ, tạo điều kiện thuận lợi cho công đoàn hoạt động.</p>

    <p><strong>Điều 5. Cam kết của NLĐ về việc chấp hành Nội quy lao động của doanh nghiệp</strong></p>
    <ol>
      <li>NLĐ có trách nhiệm chấp hành đúng các nội dung quy định trong HĐLĐ, Nội quy lao động và Thoả ước lao động tập thể;</li>
      <li>Thực hiện đúng quy trình sản xuất, đặc biệt là các quy trình về an toàn, vệ sinh lao động trong doanh nghiệp.</li>
      <li>Có tinh thần trách nhiệm trong công việc, có ý thức kỷ luật lao động, hạn chế đến mức thấp nhất việc làm hư hỏng máy móc, hàng hoá, sản phẩm của doanh nghiệp.</li>
      <li>Phối hợp cùng doanh nghiệp trong việc thực hiện kế hoạch sản xuất, tiết kiệm nguyên vật liệu, đảm bảo tiến độ công việc.</li>
      <li>Không tham gia đình công, tranh chấp lao động tập thể trái quy định của pháp luật.</li>
    </ol>

    <h2 style="text-align: center;">Chương II<br/>NỘI DUNG THOẢ ƯỚC LAO ĐỘNG TẬP THỂ</h2>

    <p><strong>Điều 7. Việc làm và bảo đảm việc làm</strong></p>
    <ol>
      <li>NSDLĐ phải đảm bảo việc làm cho NLĐ trong suốt thời gian có hiệu lực của hợp đồng.</li>
      <li>Thời gian nghỉ chờ việc do thiếu đơn hàng hay do lý do khách quan khác như điện nước thì NLĐ được trả 100% tiền lương theo hợp đồng lao động, nhưng không được thấp hơn lương tối thiểu vùng do nhà nước qui định.</li>
      <li>NSDLĐ sẽ hỗ trợ 100% học phí khi NLĐ tham gia các khoá học nghề do DN yêu cầu và cam kết làm việc tại doanh nghiệp sau khi học nghề từ 02 năm trở lên.</li>
      <li>NLĐ hoàn thành tốt nhiệm vụ được giao, không bị xử lý kỷ luật lao động sẽ được tái ký HĐLĐ khi hết hạn hợp đồng.</li>
      <li>NLĐ tham gia đình công trái pháp luật sẽ không được tái ký khi hết hạn HĐLĐ.</li>
    </ol>

    <p><strong>Điều 8. Công tác đào tạo</strong></p>
    <ol>
      <li>Công ty coi trọng công tác đào tạo và đào tạo lại để nâng cao trình độ quản lý, chuyên môn nghiệp vụ, trình độ chính trị, văn hóa, ngoại ngữ, tin học cho NLĐ nhằm phục vụ thiết thực có hiệu quả cao cho công ty.</li>
      <li>Trong chiến lược phát triển công ty, từng giai đoạn, vào thời điểm thích hợp, Công ty sẽ đào tạo hoặc cử NLĐ đi đào tạo, đào tạo lại, bồi dưỡng nghiệp vụ tay nghề cho phù hợp với yêu cầu công việc thực tế. Tổ chức cho NLĐ làm công tác quản lý, chuyên môn nghiệp vụ và công nhân kỹ thuật đi học tập kinh nghiệm ở các doanh nghiệp trong nước và nước ngoài.</li>
      <li>Công ty khuyến khích và tạo điều kiện cho NLĐ tự học hỏi nâng cao, bồi dưỡng nghiệp vụ, trình độ chuyên môn để phục vụ công việc tốt hơn.</li>
    </ol>

    <p><strong>Điều 9. Thời giờ làm việc, thời giờ nghỉ ngơi</strong></p>
    <ol>
      <li>Công ty thực hiện thời giờ làm việc, thời giờ nghỉ ngơi theo quy định tại Nội quy lao động đăng ký theo quy định của pháp luật.</li>
      <li>Ngoài những ngày nghỉ lễ tết hưởng nguyên lương theo quy định của pháp luật, người lao động còn được nghỉ việc riêng hưởng nguyên lương và phải thông báo với người sử dụng lao động trong trường hợp sau đây:
        <ul>
          <li>Kết hôn: nghỉ 03 ngày;</li>
          <li>Con đẻ, con nuôi kết hôn: nghỉ 01 ngày;</li>
          <li>Cha đẻ, mẹ đẻ, cha nuôi, mẹ nuôi; cha đẻ, mẹ đẻ, cha nuôi, mẹ nuôi của vợ hoặc chồng; vợ hoặc chồng; con đẻ, con nuôi chết: nghỉ 03 ngày.</li>
        </ul>
      </li>
      <li>Ngoài ra NLĐ còn được nghỉ hưởng nguyên lương trong trường hợp sau: Ngày thành lập Công ty: Công ty phối hợp với công đoàn cơ sở tổ chức các hoạt động kỷ niệm ngày truyền thống trong một buổi và mọi NLĐ phải tham gia; một buổi còn lại NLĐ được nghỉ ngơi và hưởng lương.</li>
    </ol>

    <p><strong>Điều 10. Tiền lương, tiền thưởng, phụ cấp lương, chế độ nâng lương</strong></p>
    <p><strong>1. Tiền lương:</strong></p>
    <ul>
      <li>Tiền lương là số tiền mà người sử dụng lao động trả cho người lao động theo thỏa thuận để thực hiện công việc, bao gồm mức lương theo công việc hoặc chức danh, phụ cấp lương và các khoản bổ sung khác.</li>
      <li>Mức lương theo công việc hoặc chức danh không được thấp hơn mức lương tối thiểu.</li>
      <li>Người sử dụng lao động phải bảo đảm trả lương bình đẳng, không phân biệt giới tính đối với người lao động làm công việc có giá trị như nhau.</li>
      <li>Người sử dụng lao động phải xây dựng thang lương, bảng lương và định mức lao động làm cơ sở để tuyển dụng, sử dụng lao động, thỏa thuận mức lương theo công việc hoặc chức danh ghi trong hợp đồng lao động và trả lương cho người lao động.</li>
      <li>Người sử dụng lao động phải tham khảo ý kiến của tổ chức đại diện người lao động tại cơ sở đối với nơi có tổ chức đại diện người lao động tại cơ sở khi xây dựng thang lương, bảng lương và định mức lao động.</li>
      <li>Thang lương, bảng lương và mức lao động phải được công bố công khai tại nơi làm việc trước khi thực hiện.</li>
      <li>Căn cứ để tính lương: thực hiện theo quy chế lương thưởng. Quy chế trả lương, trả thưởng được tập thể lao động và Ban chấp hành công đoàn cơ sở góp ý và công khai cho NLĐ tại doanh nghiệp biết.</li>
      <li>Hình thức trả lương: Lương được trả bằng tiền mặt hoặc trả qua tài khoản cá nhân của người lao động được mở tại ngân hàng. Trường hợp trả lương qua tài khoản cá nhân của người lao động được mở tại ngân hàng thì người sử dụng lao động phải trả các loại phí liên quan đến việc mở tài khoản và chuyển tiền lương.</li>
      <li>Thời hạn trả lương: Ngày mồng 10 tháng sau. Trường hợp ngày mồng 10 tháng sau rơi vào ngày nghỉ, lễ tết thì được trả vào ngày làm việc trước đó.</li>
      <li>Nguyên tắc trả lương: Người sử dụng lao động phải trả lương trực tiếp, đầy đủ, đúng hạn cho người lao động. Trường hợp người lao động không thể nhận lương trực tiếp thì người sử dụng lao động có thể trả lương cho người được người lao động ủy quyền hợp pháp. Người sử dụng lao động không được hạn chế hoặc can thiệp vào quyền tự quyết chi tiêu lương của người lao động.</li>
    </ul>

    <p><strong>2. Thưởng:</strong></p>
    <p>Thưởng là số tiền hoặc tài sản hoặc bằng các hình thức khác mà người sử dụng lao động thưởng cho người lao động căn cứ vào kết quả sản xuất, kinh doanh, mức độ hoàn thành công việc của người lao động.</p>
    <ul>
      <li><strong>Thưởng đột xuất:</strong> Thưởng đột xuất cho cá nhân, tập thể NLĐ đạt những thành tích: Phát hiện và báo cáo kịp thời các vụ việc tiêu cực như trộm cắp, lãng phí, tham ô tài sản công ty. Thưởng từ 20% đến 50% giá trị hiện vật cho người phát hiện và thu hồi tài sản của công ty bị lấy cắp.</li>
      <li><strong>Thưởng sáng kiến:</strong> Dành cho NLĐ có những sáng kiến, cải tiến về công nghệ, giải pháp quản lý mang lại hiệu quả kinh tế. Trích thưởng từ 5% đến 10% trên giá trị thu được từ các sáng kiến, cải tiến.</li>
      <li><strong>Thưởng lương tháng 13:</strong> Tuỳ theo tình hình sản xuất kinh doanh, Công ty sẽ xét thưởng lương tháng 13 cho NLĐ làm việc đủ 12 tháng với mức thưởng ít nhất 01 tháng lương theo HĐLĐ.</li>
      <li><strong>Thưởng chuyên cần:</strong> Từ 300.000 đồng/tháng đến 3.000.000 đồng/tháng. Dành cho NLĐ đảm bảo ngày công, nghỉ việc riêng, nghỉ ốm, nghỉ phép năm không quá 03 ngày/tháng.</li>
    </ul>

    <p><strong>3. Phụ cấp lương:</strong></p>
    <p>Ngoài mức lương chính thì tùy vào từng vị trí công việc mà NLĐ còn có thể được nhận các khoản phụ cấp khác như sau:</p>
    <table>
      <thead>
        <tr>
          <th>Khoản phụ cấp</th>
          <th>Đối tượng áp dụng</th>
          <th>Mức phụ cấp</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Phụ cấp trách nhiệm</td>
          <td>Giám đốc, Phó giám đốc, Trưởng phòng</td>
          <td>1.000.000 - 3.000.000/tháng</td>
        </tr>
        <tr>
          <td>Phụ cấp thâm niên</td>
          <td>NLĐ gắn bó lâu dài với công ty từ 3 năm trở lên</td>
          <td>500.000 - 3.000.000/tháng</td>
        </tr>
        <tr>
          <td>Hỗ trợ xăng xe</td>
          <td>Tất cả NLĐ</td>
          <td>300.000 - 2.000.000/tháng</td>
        </tr>
        <tr>
          <td>Hỗ trợ điện thoại</td>
          <td>Tất cả NLĐ</td>
          <td>300.000 - 2.000.000/tháng</td>
        </tr>
        <tr>
          <td>Tiền ăn ca/ăn trưa</td>
          <td>Tất cả NLĐ</td>
          <td>910.000/tháng</td>
        </tr>
        <tr>
          <td>Hỗ trợ nhà ở</td>
          <td>Lao động có hợp đồng thuê nhà</td>
          <td>300.000 - 3.000.000/tháng</td>
        </tr>
        <tr>
          <td>Hỗ trợ nuôi con nhỏ</td>
          <td>Lao động có con nhỏ gửi nhà trẻ, mẫu giáo</td>
          <td>300.000 - 3.000.000/tháng</td>
        </tr>
      </tbody>
    </table>
    <p>NSDLĐ có trách nhiệm thỏa thuận mức hưởng cụ thể với từng lao động về những khoản phụ cấp mà NLĐ được nhận về mức hưởng và điều kiện hưởng trong hợp đồng lao động.</p>

    <p><strong>4. Chế độ nâng lương:</strong></p>
    <ul>
      <li>Về chế độ xét nâng lương: Mỗi năm, lãnh đạo Công ty xét nâng lương cho nhân viên một lần vào tháng thứ 02 của năm.</li>
      <li>Niên hạn và đối tượng được trong diện xét nâng lương: Các nhân viên đã có đủ niên hạn hai năm hưởng ở một mức lương với điều kiện hoàn thành tốt nhiệm vụ được giao và không vi phạm Nội qui lao động.</li>
      <li>Mức nâng của mỗi bậc lương: từ 5% - 10% mức lương hiện tại tuỳ theo kết quả kinh doanh của công ty trong năm.</li>
    </ul>

    <p><strong>Điều 11. Các khoản bổ sung, chế độ phúc lợi:</strong></p>
    <ol>
      <li>Tặng quà sinh nhật (đối với NLĐ đã làm việc từ 3 tháng trở lên): 200.000 – 500.000 đồng/người</li>
      <li>Tặng quà cưới (đối với NLĐ đã làm việc từ 1 năm trở lên): 500.000 – 1.000.000 đồng/người</li>
      <li>Quà trung thu (cho con NLĐ dưới 7 tuổi): 100.000 đồng/cháu</li>
      <li>Thưởng tiền tết dương lịch, ngày 30/4, 1/5, 2/9: 200.000 – 500.000 đồng/người</li>
      <li>Lao động nữ nhận quà nhân ngày 8/3 và 20/10: 200.000 – 500.000 đồng/người</li>
      <li>Tham quan nghỉ mát:
        <ul>
          <li>Hỗ trợ 100% kinh phí dành cho các NLĐ đã làm việc từ 1 năm trở lên.</li>
          <li>Hỗ trợ 70% kinh phí cho người lao động đã làm từ 6 tháng trở lên.</li>
          <li>Hỗ trợ 50% kinh phí cho người làm việc dưới 6 tháng.</li>
        </ul>
      </li>
      <li>Bản thân NLĐ bị mắc các bệnh hiểm nghèo, bị tai nạn lao động hoặc ốm đau dài ngày: từ 500.000 đến 1.000.000 đồng/người</li>
      <li>Phúng viếng tang lễ NLĐ: 1.000.000 đồng và 1 vòng hoa</li>
      <li>Phúng viếng tang chế tứ thân phụ mẫu, vợ, chồng, con NLĐ: 500.000 đồng và 1 vòng hoa</li>
    </ol>

    <p><strong>Điều 12. Những quy định đối với lao động nữ</strong></p>
    <ol>
      <li>Người sử dụng lao động có trách nhiệm:
        <ul>
          <li>Bảo đảm thực hiện bình đẳng giới và các biện pháp thúc đẩy bình đẳng giới trong tuyển dụng, bố trí, sắp xếp việc làm, đào tạo, thời giờ làm việc, thời giờ nghỉ ngơi, tiền lương và các chế độ khác.</li>
          <li>Tham khảo ý kiến của lao động nữ hoặc đại diện của họ khi quyết định những vấn đề liên quan đến quyền và lợi ích của phụ nữ.</li>
          <li>Bảo đảm có đủ buồng tắm và buồng vệ sinh phù hợp tại nơi làm việc.</li>
        </ul>
      </li>
      <li>Người sử dụng lao động không được sử dụng người lao động làm việc ban đêm, làm thêm giờ và đi công tác xa trong trường hợp: Mang thai từ tháng thứ 07; Đang nuôi con dưới 12 tháng tuổi, trừ trường hợp được người lao động đồng ý.</li>
      <li>Người sử dụng lao động không được sa thải hoặc đơn phương chấm dứt hợp đồng lao động đối với người lao động vì lý do kết hôn, mang thai, nghỉ thai sản, nuôi con dưới 6 tháng tuổi.</li>
      <li>Trường hợp hợp đồng lao động hết hạn trong thời gian lao động nữ mang thai hoặc nuôi con dưới 6 tháng tuổi thì được ưu tiên giao kết hợp đồng lao động mới.</li>
      <li>Lao động nữ trong thời gian hành kinh được nghỉ mỗi ngày 30 phút, trong thời gian nuôi con dưới 12 tháng tuổi được nghỉ mỗi ngày 60 phút trong thời gian làm việc. Thời gian nghỉ vẫn được hưởng đủ tiền lương theo hợp đồng lao động.</li>
      <li>Lao động nữ được nghỉ thai sản trước và sau khi sinh con là 06 tháng; thời gian nghỉ trước khi sinh không quá 02 tháng. Trường hợp lao động nữ sinh đôi trở lên thì tính từ con thứ 02 trở đi, cứ mỗi con, người mẹ được nghỉ thêm 01 tháng.</li>
      <li>Lao động được bảo đảm việc làm cũ khi trở lại làm việc sau khi nghỉ hết thời gian thai sản mà không bị cắt giảm tiền lương và quyền, lợi ích so với trước khi nghỉ thai sản.</li>
      <li>Lao động/lao động nữ có con nhỏ gửi nhà trẻ, mẫu giáo, công ty hỗ trợ mỗi tháng 500.000 – 2.000.000 đồng/cháu.</li>
    </ol>

    <p><strong>Điều 13. An toàn lao động, vệ sinh lao động</strong></p>
    <ol>
      <li>NSDLĐ có trách nhiệm tập huấn công tác an toàn vệ sinh lao động, thực hiện đầy đủ việc trang cấp phương tiện bảo hộ lao động và hằng năm khám sức khoẻ định kỳ cho NLĐ;</li>
      <li>NLĐ phải chấp hành các quy định về an toàn, vệ sinh lao động; giữ gìn, bảo quản các phương tiện bảo hộ được trang cấp.</li>
      <li>NLĐ làm việc ở bộ phận nặng nhọc, độc hại sẽ được hưởng các chế độ tiền lương, chế độ bồi dưỡng theo qui định của luật an toàn vệ sinh lao động.</li>
    </ol>

    <p><strong>Điều 14. Bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp</strong></p>
    <ol>
      <li>Người sử dụng lao động, người lao động phải tham gia bảo hiểm xã hội bắt buộc, bảo hiểm y tế, bảo hiểm thất nghiệp; người lao động được hưởng các chế độ theo quy định của pháp luật về bảo hiểm xã hội, bảo hiểm y tế và bảo hiểm thất nghiệp.</li>
      <li>Đối với người lao động không thuộc đối tượng tham gia bảo hiểm xã hội bắt buộc, bảo hiểm y tế, bảo hiểm thất nghiệp thì người sử dụng lao động có trách nhiệm chi trả thêm cùng lúc với kỳ trả lương một khoản tiền cho người lao động tương đương với mức người sử dụng lao động đóng bảo hiểm xã hội bắt buộc, bảo hiểm y tế, bảo hiểm thất nghiệp cho người lao động theo quy định của pháp luật.</li>
    </ol>

    <p><strong>Điều 15. Tranh chấp lao động</strong></p>
    <p style="text-indent: 2em;">Hai bên thực hiện theo quy định tại Chương XIV Bộ luật Lao động.</p>

    <h2 style="text-align: center;">Chương III<br/>ĐIỀU KHOẢN THI HÀNH</h2>

    <p><strong>Điều 16. Trách nhiệm thi hành Thỏa ước</strong></p>
    <ol>
      <li>NSDLĐ, Ban chấp hành và NLĐ tại doanh nghiệp có trách nhiệm thực hiện đúng các nội dung đã thoả thuận trong Thỏa ước.</li>
      <li>Sau khi ký kết Thỏa ước, NSDLĐ có trách nhiệm bố trí thời gian để triển khai Thỏa ước đến tập thể lao động tại doanh nghiệp. Các bên có quyền sửa đổi bổ sung đúng thời hạn theo qui định tại Điều 82 Bộ Luật lao động năm 2019. Người SDLĐ và NLĐ có trách nhiệm thực hiện đầy đủ thỏa ước lao động tập thể.</li>
    </ol>

    <p><strong>Điều 17. Áp dụng Thỏa ước lao động tập thể:</strong></p>
    <ol>
      <li>Những vấn đề không được đề cập trong bản thỏa ước lao động tập thể này được thực hiện theo quy định của pháp luật. Trong trường hợp quyền lợi của người lao động được thỏa thuận trong hợp đồng lao động hoặc các quy định trong nội quy, quy định của doanh nghiệp thấp hơn so với bản thỏa ước này thì phải thực hiện những điều khoản tương ứng tại thỏa ước lao động tập thể.</li>
      <li>Trong thời hạn thỏa ước lao động tập thể đang có hiệu lực mà pháp luật lao động có những sửa đổi, bổ sung quy định những quyền lợi cao hơn các thỏa thuận trong thỏa ước lao động tập thể thì áp dụng các quy định của pháp luật và tiến hành sửa đổi bổ sung thỏa ước lao động tập thể.</li>
      <li>Trong trường hợp có những vấn đề phát sinh trong thực tế liên quan đến quyền lợi, nghĩa vụ của các bên mà không có trong nội dung của Thỏa ước lao động tập thể quy định của pháp luật thì BCH Công đoàn và NSDLĐ cùng nhau bàn bạc hoặc tổ chức đối thoại đột xuất để thống nhất thực hiện.</li>
    </ol>

    <p><strong>Điều 18. Hiệu lực của Thỏa ước</strong></p>
    <ol>
      <li>Thỏa ước này có hiệu lực 3 năm, kể từ ngày ký. Các quy định khác của doanh nghiệp trái với nội dung Thỏa ước này đều bị bãi bỏ.</li>
      <li>Trong thời hạn Thỏa ước đang còn hiệu lực mà pháp luật lao động có những sửa đổi, bổ sung quy định những quyền lợi cao hơn các thỏa thuận trong Thỏa ước thì áp dụng các quy định của pháp luật và tiến hành sửa đổi, bổ sung Thỏa ước.</li>
    </ol>

    <p style="text-indent: 2em; margin-top: 16px;">Thỏa ước lao động tập thể này ký tại Công ty cổ phần Riomio, ngày 01 tháng 01 năm 2026 và gửi Thỏa ước theo quy định tại Bộ luật lao động.</p>

    <table style="width: 100%; border: none; margin-top: 48px;">
      <tr>
        <td style="text-align: center; width: 50%; border: none; vertical-align: top;">
          <p><strong>ĐẠI DIỆN TẬP THỂ LAO ĐỘNG</strong></p>
          <p style="font-size: 11pt; color: #666;">(Ký tên và đóng dấu công đoàn)</p>
          <br/><br/><br/><br/>
          <p><strong>Lê Thị Thanh Thủy</strong></p>
          <p>Trưởng ban đại diện</p>
        </td>
        <td style="text-align: center; width: 50%; border: none; vertical-align: top;">
          <p><strong>NGƯỜI SỬ DỤNG LAO ĐỘNG</strong></p>
          <p><strong>GIÁM ĐỐC</strong></p>
          <p style="font-size: 11pt; color: #666;">(Ký tên và đóng dấu công ty)</p>
          <br/><br/><br/>
          <p><strong>HOÀNG VĂN VIỆT</strong></p>
        </td>
      </tr>
    </table>
  `;
};

export default function ThoaUocTab() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (html: string) => {
    try {
      setIsSaving(true);
      const supabase = createClient();

      const data = {
        contract_type: "thoa_uoc_ld",
        employee_name: "Thỏa ước lao động",
        year: new Date().getFullYear(),
        extra_data: {
          html_content: html,
        },
        status: "draft",
      };

      const { error } = await supabase.from("contracts").insert(data);
      if (error) throw error;
      toast.success("Đã lưu thỏa ước lao động tập thể");
    } catch (error: any) {
      toast.error("Lỗi: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Thỏa ước lao động tập thể</h3>
      </div>
      <DocumentEditor
        initialContent={getInitialContent()}
        title="Thỏa ước lao động tập thể"
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
