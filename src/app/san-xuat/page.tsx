"use client";

import {
  Factory,
  Package,
  Warehouse,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  Download,
  Settings,
  Phone,
  MapPin,
  User,
  FileText,
} from "lucide-react";
import { useState } from "react";
import Portal from "@/components/Portal";

// Dữ liệu sản phẩm sản xuất
const initialProductionItems = [
  {
    id: 1,
    code: "SX001",
    name: "Áo thun cotton",
    plannedQty: 500,
    cuttingQty: 480,
    receivedQty: 450,
    status: "in_progress",
    costPrice: 85000,
  },
  {
    id: 2,
    code: "SX002",
    name: "Quần jean nam",
    plannedQty: 300,
    cuttingQty: 300,
    receivedQty: 280,
    status: "completed",
    costPrice: 150000,
  },
  {
    id: 3,
    code: "SX003",
    name: "Áo sơ mi nữ",
    plannedQty: 400,
    cuttingQty: 0,
    receivedQty: 0,
    status: "pending",
    costPrice: 95000,
  },
  {
    id: 4,
    code: "SX004",
    name: "Váy maxi",
    plannedQty: 200,
    cuttingQty: 180,
    receivedQty: 0,
    status: "cutting",
    costPrice: 180000,
  },
];

// Dữ liệu nguyên phụ liệu
const initialMaterials = [
  { id: 1, code: "VAI.001", name: "Vải Thô Muji trắng OW 97", supplier: "Hòa Ký", info: "K1m50", unit: "m", priceBeforeTax: 0, taxRate: 0, priceWithTax: 0, image: "", note: "" },
  { id: 2, code: "VAI.002", name: "Chỉ may L19L2-DL 500m", supplier: "Linh Thương", info: "Màu trắng", unit: "Cuộn", priceBeforeTax: 5545, taxRate: 10, priceWithTax: 6100, image: "", note: "" },
  { id: 3, code: "VAI.003", name: "Vải thô hoa TKT 004 Retro", supplier: "Toản Nhung", info: "K1m50", unit: "m", priceBeforeTax: 0, taxRate: 0, priceWithTax: 0, image: "", note: "" },
  { id: 4, code: "VAI.004", name: "Vải cotton 2 chiều xanh lam", supplier: "Phương Tiên", info: "K1m50", unit: "m", priceBeforeTax: 65000, taxRate: 10, priceWithTax: 71500, image: "", note: "" },
  { id: 5, code: "VAI.005", name: "Vải thô kẻ caro xanh navy", supplier: "Loan Thảo", info: "K1m45", unit: "m", priceBeforeTax: 48000, taxRate: 10, priceWithTax: 52800, image: "", note: "" },
  { id: 6, code: "VAI.006", name: "Vải jean xanh đậm", supplier: "Công ty Jean Nhật ý", info: "K1m50, 12oz", unit: "m", priceBeforeTax: 85000, taxRate: 10, priceWithTax: 93500, image: "", note: "" },
  { id: 7, code: "VAI.007", name: "Vải ren trắng hoa nhỏ", supplier: "An Giang", info: "K1m30", unit: "m", priceBeforeTax: 55000, taxRate: 10, priceWithTax: 60500, image: "", note: "" },
  { id: 8, code: "VAI.008", name: "Vải lót polyester đen", supplier: "Long Hiền", info: "K1m50", unit: "m", priceBeforeTax: 15000, taxRate: 10, priceWithTax: 16500, image: "", note: "" },
  { id: 9, code: "VAI.009", name: "Vải tơ nhật hồng pastel", supplier: "Nga Tú", info: "K1m40", unit: "m", priceBeforeTax: 75000, taxRate: 10, priceWithTax: 82500, image: "", note: "" },
  { id: 10, code: "VAI.010", name: "Vải nỉ bông xám", supplier: "Taisum (Mr Kin)", info: "K1m60", unit: "m", priceBeforeTax: 95000, taxRate: 10, priceWithTax: 104500, image: "", note: "" },
  { id: 11, code: "PL.001", name: "Khóa kéo HKK 20cm trắng", supplier: "Công ty TNHH Phụ Liệu may Tùng Phong", info: "Số 5", unit: "Cái", priceBeforeTax: 5000, taxRate: 10, priceWithTax: 5500, image: "", note: "" },
  { id: 12, code: "PL.002", name: "Nút áo 4 lỗ trắng 15mm", supplier: "Cường Cận", info: "Nhựa", unit: "Cái", priceBeforeTax: 200, taxRate: 10, priceWithTax: 220, image: "", note: "" },
  { id: 13, code: "PL.003", name: "Chun quần 3cm trắng", supplier: "Công ty TNHH SX TM và DV An Quân", info: "Co giãn tốt", unit: "m", priceBeforeTax: 3000, taxRate: 10, priceWithTax: 3300, image: "", note: "" },
  { id: 14, code: "PL.004", name: "Bo cổ áo thun trắng", supplier: "Công ty LT", info: "1x1", unit: "Cái", priceBeforeTax: 8000, taxRate: 10, priceWithTax: 8800, image: "", note: "" },
  { id: 15, code: "PL.005", name: "Mác dệt logo RIOMIO", supplier: "Công ty TNHH in và TM An Bảo", info: "3x1cm", unit: "Cái", priceBeforeTax: 500, taxRate: 10, priceWithTax: 550, image: "", note: "" },
  { id: 16, code: "PL.006", name: "Thẻ bài RIOMIO", supplier: "Cty in sức sống mới", info: "Bìa cứng 300gsm", unit: "Cái", priceBeforeTax: 1500, taxRate: 10, priceWithTax: 1650, image: "", note: "" },
  { id: 17, code: "PL.007", name: "Túi gói hàng 25x35", supplier: "Công ty TNHH Bao Bì HVT", info: "PE trắng", unit: "Cái", priceBeforeTax: 1200, taxRate: 10, priceWithTax: 1320, image: "", note: "" },
  { id: 18, code: "PL.008", name: "Hạt chống ẩm 1g", supplier: "Công ty TNHH SANDIA", info: "Silica gel", unit: "Gói", priceBeforeTax: 150, taxRate: 10, priceWithTax: 165, image: "", note: "" },
  { id: 19, code: "PL.009", name: "Decal in nhiệt size S", supplier: "Thanh Hoa", info: "DTF", unit: "Cái", priceBeforeTax: 2000, taxRate: 10, priceWithTax: 2200, image: "", note: "" },
  { id: 20, code: "PL.010", name: "Bông lót áo jacket", supplier: "Tiến Chúc", info: "100g/m2", unit: "m", priceBeforeTax: 25000, taxRate: 10, priceWithTax: 27500, image: "", note: "" },
];

// Dữ liệu xưởng sản xuất
const initialWorkshops = [
  { id: 1, name: "Anh Duẩn", phone: "0914680992", address: "Đội 3, xã Thanh Mai, Thanh Oai, HN", manager: "MR. Duẩn", note: "" },
  { id: 2, name: "Sky - Chương Mỹ", phone: "0336766292 / 0862232228", address: "210 Yên Sơn, Chúc Sơn, Chương Mỹ, HN", manager: "Ms. Trang / Ms Hằng", note: "" },
  { id: 3, name: "Giặt Việt Trung", phone: "0917501055", address: "T1-12 Belhomes Vsip Phù Chẩn, Từ Sơn, Bắc Ninh", manager: "Ms. Laying", note: "" },
  { id: 4, name: "Phòng mẫu Pario", phone: "", address: "", manager: "", note: "" },
  { id: 5, name: "Xưởng in Mr Anh", phone: "0983816633", address: "Km27 Quốc lộ 6 Phú Nghĩa, Chương Mỹ, HN. Đối diện cây xăng Phú Nghĩa", manager: "Mr. Đức Anh", note: "" },
  { id: 6, name: "Xưởng in Mr Vạn", phone: "", address: "", manager: "", note: "" },
  { id: 7, name: "Thiên Hoàng BNV Bắc Giang", phone: "", address: "", manager: "", note: "" },
  { id: 8, name: "Xưởng in Mr Hoàng (Hà Đông)", phone: "0938824686", address: "Số 22 ngách 26/23 Ỷ La, Dương Nội, Hà Đông", manager: "Mr. Hoàng", note: "" },
  { id: 9, name: "Xưởng thêu Mr Lee", phone: "0838896899", address: "Lê Đình Thứ, Thôn Đống Xung, Xã Thắng Lợi, Thường Tín, HN", manager: "", note: "19035381681016 Techcombank - Chủ TK: Lê Đình Thứ" },
  { id: 10, name: "Xưởng giặt Mr Sĩ Quyết", phone: "", address: "", manager: "", note: "" },
  { id: 11, name: "Xưởng in Mr Hồng Hải Dương", phone: "0963818181", address: "Yết Kiêu, Gia Lộc, Hải Dương", manager: "Mr. Hồng", note: "" },
  { id: 12, name: "Anh Tú rập ly", phone: "0906086346", address: "Số 982 Bạch Đằng, Phường Thanh Lương, Quận Hai Bà Trưng, HN", manager: "Mr. Tú", note: "" },
  { id: 13, name: "Xưởng Ms. Chang", phone: "0368821689", address: "Đối diện cấp 1 Gia Xuyên, TP Hải Dương", manager: "Ms. Chang", note: "" },
  { id: 14, name: "Ms Xuyến", phone: "", address: "", manager: "", note: "" },
  { id: 15, name: "Xưởng in Mr Tuấn", phone: "", address: "Hoàng Mai", manager: "", note: "" },
  { id: 16, name: "Xưởng in Mr. Đảo", phone: "0966736222", address: "Đội 3- Cõi Hưng Sơn, Xã An Sơn, Nam Sách, HD", manager: "Mr. Đảo", note: "" },
  { id: 17, name: "Xưởng may Thiên Hoàng Bắc Giang", phone: "0397510899", address: "Biển Động, Lục Ngạn, Bắc Giang", manager: "Mr Sơn", note: "" },
  { id: 18, name: "Xưởng in Đăng Quang", phone: "0333141488", address: "Lô 09 05 KCN Ninh Hiệp, Huyện Gia Lâm, TP. Hà Nội", manager: "", note: "Đinh Quang Vũ - 19036620916019 - TCB" },
  { id: 19, name: "Xưởng in Mr Vũ", phone: "", address: "", manager: "", note: "" },
  { id: 20, name: "Chị Quý (Phòng mẫu)", phone: "", address: "", manager: "", note: "" },
  { id: 21, name: "Xưởng Mr.Dũng", phone: "0338981992 / 0934601104", address: "Ngõ 303 Tổ 9 Phúc Lợi, Long Biên, HN", manager: "Mr.Dũng", note: "" },
  { id: 22, name: "Xưởng may Chị Hà - Định Công", phone: "0965517815", address: "Ngõ 193 số nhà 21 Định Công Hạ, Hoàng Mai", manager: "Ms Hà", note: "" },
  { id: 23, name: "Xưởng may Mr Bình - Thanh Mai", phone: "", address: "Thanh Mai", manager: "", note: "" },
  { id: 24, name: "Xưởng wash Vina", phone: "0984366536", address: "Như Quỳnh, Hưng Yên", manager: "MR. Chuyển", note: "" },
  { id: 25, name: "Wash Tiến Khôi", phone: "0905508050", address: "", manager: "Ms.Mận", note: "" },
  { id: 26, name: "Xưởng may Tây Hà", phone: "", address: "Công ty TNHH May Tây Hà, Thôn 9, Ba Trại, Ba Vì, HN", manager: "Chị Châu / Anh Dũng", note: "" },
  { id: 27, name: "Xưởng may Chị Thu", phone: "0359803807", address: "Số 4, ngõ 17, Trần Nhật Duật, Hà Đông", manager: "Chị Thu", note: "" },
  { id: 28, name: "Giặt - Xử lý vải thời trang Phúc Anh", phone: "0989329019", address: "Số 74/48/72 Trịnh Đình Cửu, Định Công, Hoàng Mai, HN", manager: "Anh Cao Anh", note: "" },
  { id: 29, name: "Xưởng chị Hoa - Gia Lâm", phone: "0961259216", address: "Số 59 ngách 142/2, Thôn Cam, Cổ Bi, Gia Lâm, HN", manager: "Chị Hoa", note: "" },
  { id: 30, name: "Xưởng may chị Thùy - Vĩnh Phúc", phone: "0933821825", address: "Thôn Quang Khải, Xã Thiện Kế, Huyện Bình Xuyên, Tỉnh Vĩnh Phúc", manager: "Chị Thùy", note: "" },
  { id: 31, name: "Xưởng anh Kiên - Tam Hiệp", phone: "0968722195", address: "Thôn 5, Tam Hiệp, Phúc Thọ, HN", manager: "Anh Kiên", note: "" },
  { id: 32, name: "Xưởng Chị Ly làm bờm nhún - Thạch Thất", phone: "0975522533", address: "Số nhà 7, ngõ 42, Kim Quan, Thạch Thất, HN", manager: "Hoàng Khánh Ly", note: "" },
  { id: 33, name: "Xưởng An Vy", phone: "0904631205", address: "Số 26A ngõ 122 Do Nha, Miêu Nha, Tây Mỗ", manager: "Chị Hà", note: "" },
  { id: 34, name: "Xưởng may 365", phone: "0989639229", address: "Số 6, BT4, Tổng Cục 5, Bộ Công An Tân Triều, Thanh Trì, HN", manager: "Chị Thùy", note: "" },
  { id: 35, name: "Xưởng Quyết - BG", phone: "0362042162", address: "Nguyễn Thị Thắng, KĐT Đình Trám Sen Hồ, Phường Hồng Thái, TX Việt Yên", manager: "Anh Quyết", note: "" },
  { id: 36, name: "Xưởng Mai - La Phù", phone: "0901726310", address: "Số nhà 6, ngách 332/30 La Phù, Hoài Đức, HN", manager: "Chị Mai", note: "" },
  { id: 37, name: "Xưởng may Bình Sơn - Thái Nguyên", phone: "", address: "", manager: "", note: "" },
  { id: 38, name: "Xưởng anh Hữu - Quốc Oai", phone: "0867765001", address: "Xưởng: Xóm 6, Đỗ Tráng, Đại Thành, Quốc Oai. VP: Số 9, ngõ 8, phố Bế Văn Đàn, Hà Đông, HN", manager: "Anh Hữu", note: "" },
  { id: 39, name: "Xưởng Thắng - BG", phone: "0362042162", address: "KĐT Đình Trám Sen Hồ, Phường Hồng Thái, TX Việt Yên", manager: "Chị Thắng", note: "" },
  { id: 40, name: "Kaiwin thể thao", phone: "", address: "", manager: "", note: "" },
  { id: 41, name: "Xưởng Liễu - Chương Mỹ", phone: "0984664488", address: "Xóm Hoa Sơn, Chúc Đồng 1, Thụy Hương, Chương Mỹ", manager: "Chị Liễu", note: "" },
  { id: 42, name: "Xưởng Ánh Tuyết - Đan Phượng", phone: "0869055281", address: "Số 02, ngõ 213, ngách 27, Hồng Hà, Đan Phượng", manager: "Chị Tuyết", note: "" },
  { id: 43, name: "Xưởng Mr Nam tất - Ninh Bình", phone: "", address: "Số nhà 12, ngõ 391 Phạm Thận Duật, P. Nam Hoa Lư, Ninh Bình", manager: "Mr Nam", note: "" },
  { id: 44, name: "Xưởng chú Tuyển", phone: "0862972191", address: "Số nhà 15/40/173 Ngõ 192 Lê Trọng Tấn, Định Công, Hoàng Mai, HN", manager: "Chú Tuyển", note: "" },
  { id: 45, name: "Ms Liễu TQ", phone: "", address: "", manager: "", note: "" },
];

// Dữ liệu nhà cung cấp
const initialSuppliers = [
  { id: 1, name: "Toản Nhung", material: "Thô hoa, boi, kẻ", address: "Kiot F1 Chợ Baza Ninh Hiệp", contact: "Nhung", phone: "0986318021", note: "" },
  { id: 2, name: "Hòa Ký", material: "Thô, muji", address: "A16 Khu Vạn Lợi, Ninh Hiệp", contact: "Ký", phone: "0982587006 / 0984050685 / 0966392286", note: "" },
  { id: 3, name: "Phương Tiên", material: "Cotton, da cá", address: "59-61 ngõ 670 Nguyễn Khoái, Hoàng Mai", contact: "", phone: "0906018718 / 0963018718 / 0968062260", note: "" },
  { id: 4, name: "Trường Hồng", material: "Thô", address: "Ki ốt 15 dãy bưu điện, Ninh Hiệp", contact: "Trường", phone: "0986968390", note: "" },
  { id: 5, name: "Lộc Thế", material: "Thô, đũi", address: "E3-Baza, Ninh Hiệp", contact: "Lộc / Thế", phone: "0976122404 / 0968328868", note: "" },
  { id: 6, name: "An Giang", material: "Ren", address: "A28-A39, Dãy phụ kiện chợ Baza", contact: "Bình", phone: "0985522186", note: "" },
  { id: 7, name: "Thanh Mai", material: "", address: "Kiot A25 chợ Baza Ninh Hiệp", contact: "Mai / Thanh", phone: "0978225110 / 0978233055", note: "" },
  { id: 8, name: "Ngân Ngà", material: "", address: "KTM Baza, Ninh Hiệp", contact: "Ngân", phone: "0377780845", note: "" },
  { id: 9, name: "Long Hiền", material: "Vải lót", address: "B26 chợ Baza", contact: "", phone: "0979020232", note: "" },
  { id: 10, name: "Minh Chính", material: "Vải lưới", address: "Kiot C2, chợ Baza", contact: "Quỳnh / Minh", phone: "0985472235 / 0343184608", note: "" },
  { id: 11, name: "In dệt Miền Bắc", material: "", address: "", contact: "", phone: "", note: "" },
  { id: 12, name: "Milan", material: "", address: "", contact: "", phone: "", note: "" },
  { id: 13, name: "Hoa Lâm", material: "Vải cotton", address: "", contact: "", phone: "", note: "" },
  { id: 14, name: "Ba Nhàn", material: "Túi bóng đóng hàng", address: "", contact: "", phone: "", note: "" },
  { id: 15, name: "Công ty LT", material: "Bo cổ, bo tay", address: "Hồ Chí Minh", contact: "Tô Quang Duy", phone: "344879999", note: "" },
  { id: 16, name: "Cty in sức sống mới", material: "Thẻ bài", address: "42 phúc xá ba đình hà nội", contact: "Mr Khuê", phone: "0987199939", note: "" },
  { id: 17, name: "Tictextile", material: "", address: "32BT6 KĐT Văn Phú, Hà Đông, HN", contact: "", phone: "0932374169", note: "" },
  { id: 18, name: "An Hương", material: "", address: "Chợ Ninh Hiệp", contact: "Ms Hương", phone: "0978308432", note: "" },
  { id: 19, name: "Khác", material: "", address: "Sàn, khác,...", contact: "", phone: "", note: "" },
  { id: 20, name: "Thanh Hoa", material: "Decal", address: "Tân Triều", contact: "", phone: "", note: "" },
  { id: 21, name: "Công ty TNHH Bao Bì HVT", material: "Túi gói hàng", address: "35A Nguyễn Văn Trỗi, Thanh Xuân, Hà Nội", contact: "", phone: "", note: "" },
  { id: 22, name: "Minh Tuyến", material: "Vải tơ, text", address: "Chợ Ninh Hiệp", contact: "Ms Tuyến", phone: "0362500403", note: "" },
  { id: 23, name: "Vinh Quyết", material: "Vải thời trang ren", address: "C21 - HTX Vạn Lợi - Chợ Vải Ninh Hiệp, Gia Lâm, Hà Nội", contact: "Vinh", phone: "0977099882", note: "" },
  { id: 24, name: "Công ty TNHH SANDIA", material: "Hạt chống ẩm", address: "Cầu Lác - Giai Phạm - Yên Mỹ - Hưng Yên", contact: "Ms Hòa", phone: "0981345003", note: "" },
  { id: 25, name: "Hà Khắc", material: "Bìa lưng", address: "", contact: "", phone: "", note: "" },
  { id: 26, name: "Nhãn mác Chung Đạt", material: "Mác tem nhiệt", address: "", contact: "", phone: "", note: "" },
  { id: 27, name: "Linh Thương", material: "Chỉ may", address: "Số 59 ngõ 12 Khuất Duy Tiến, TX, Hà Nội", contact: "", phone: "0352250101", note: "" },
  { id: 28, name: "Công ty CP Dệt May Song King", material: "Vải thun", address: "21 Ca Văn Thỉnh, P.11, Q. Tân Bình, HCM", contact: "", phone: "0938331268", note: "" },
  { id: 29, name: "Công ty CP sản xuất bao bì S-Pack", material: "", address: "Phường Dĩnh Kế, TP. Bắc Giang", contact: "", phone: "", note: "" },
  { id: 30, name: "Công ty TNHH in và TM An Bảo", material: "Mác dệt C Hưng", address: "Thôn Công Đình, Đình Xuyên, Gia Lâm, HN", contact: "C Hưng", phone: "", note: "" },
  { id: 31, name: "Anh Cảnh Thái Bình", material: "Bìa lưng", address: "", contact: "", phone: "", note: "" },
  { id: 32, name: "Công ty CP ĐT TM in và QC T&T", material: "Thẻ bài kép", address: "Số 211/192 Lê Trọng Tấn - Hoàng Mai - Hà Nội", contact: "", phone: "0963396866", note: "" },
  { id: 33, name: "Công ty TNHH SX TM và DV An Quân", material: "Chun", address: "Lô S3-4 cụm sản xuất Làng Nghề - Tân Triều - TT - Hn", contact: "", phone: "", note: "" },
  { id: 34, name: "Công ty Jean Nhật ý", material: "Vải jean", address: "", contact: "", phone: "", note: "" },
  { id: 35, name: "Nga Tú", material: "Vải tơ", address: "A1 khu Nam Hồng đối diện cổng phụ chợ Baza", contact: "Tú / Nga", phone: "0332484806 / 0976981024", note: "" },
  { id: 36, name: "Thơm Toản", material: "Vải thô kẻ", address: "", contact: "", phone: "", note: "" },
  { id: 37, name: "Hương Hợp", material: "Cổ boi, ren", address: "", contact: "", phone: "", note: "" },
  { id: 38, name: "Loan Thảo", material: "Vải thô kẻ caro", address: "", contact: "", phone: "", note: "" },
  { id: 39, name: "Lan Hòa", material: "Vải trắng hoa đen", address: "", contact: "", phone: "", note: "" },
  { id: 40, name: "Việt Kim", material: "", address: "", contact: "", phone: "", note: "" },
  { id: 41, name: "Công ty CP SX TM TNT VN", material: "Bo cổ", address: "Mr Quyết Long Biên", contact: "", phone: "", note: "" },
  { id: 42, name: "Duyên Hải", material: "", address: "", contact: "", phone: "", note: "" },
  { id: 43, name: "Hòa Công", material: "", address: "", contact: "", phone: "", note: "" },
  { id: 44, name: "Trường Thủy", material: "", address: "C8 chợ Baza, Ninh Hiệp", contact: "Thủy", phone: "0978198931 / 0967010068", note: "" },
  { id: 45, name: "Loan Liễu", material: "", address: "", contact: "", phone: "", note: "" },
  { id: 46, name: "Hà Hoa (Hoa Mạnh)", material: "", address: "", contact: "", phone: "", note: "" },
  { id: 47, name: "Nhãn mác Ngọc Thủy", material: "", address: "", contact: "", phone: "", note: "" },
  { id: 48, name: "Long Tú", material: "Vải lót jean làm túi", address: "", contact: "", phone: "", note: "" },
  { id: 49, name: "Công ty TNHH ĐT &PT Bao Bì Trịnh Gia", material: "", address: "", contact: "", phone: "", note: "" },
  { id: 50, name: "Hòa An", material: "Dạ tếch", address: "", contact: "", phone: "", note: "" },
  { id: 51, name: "Hà Cường", material: "", address: "", contact: "", phone: "", note: "" },
  { id: 52, name: "Cường Diện", material: "", address: "", contact: "", phone: "", note: "" },
  { id: 53, name: "Mai Lợi", material: "", address: "", contact: "", phone: "", note: "" },
  { id: 54, name: "Taisum (Mr Kin)", material: "Nỉ bông", address: "", contact: "", phone: "", note: "" },
  { id: 55, name: "Mạnh Dũng", material: "", address: "", contact: "", phone: "", note: "" },
  { id: 56, name: "Công ty TNHH Trường Duy Textile", material: "Cotton 2 chiều", address: "Môn Quảng, Lãng Ngâm, Gia Bình, Bắc Ninh", contact: "0985651216", phone: "0978223400 Tùng", note: "" },
  { id: 57, name: "Công ty Timo", material: "Vải chống nắng", address: "", contact: "", phone: "", note: "" },
  { id: 58, name: "Thảo Thư", material: "", address: "", contact: "", phone: "", note: "" },
  { id: 59, name: "Ngọc Linh", material: "", address: "Khu sinh thái Minh Thu xóm 8 Ninh Hiệp", contact: "Mr Dũng", phone: "0822666111", note: "" },
  { id: 60, name: "Thanh Thùy", material: "Tơ Thêu chùm hồng", address: "B21 Vạn Lợi - Ninh Hiệp - Gia Lâm - Hà Nội", contact: "Ms Thùy", phone: "0983545088", note: "" },
  { id: 61, name: "Dây kéo túi", material: "Dây kéo túi 17cm", address: "93 Ni Sư Huỳnh Liên F10 Quận Tân Bình", contact: "", phone: "0978821782", note: "" },
  { id: 62, name: "Công ty TNHH Phụ Liệu may Tùng Phong", material: "Chỉ, khóa kéo HKK", address: "65B Hàng Bồ", contact: "Linh - Hạnh", phone: "0768279199 / 0912474277", note: "" },
  { id: 63, name: "Tiến Chúc", material: "Bông, mút hóa học", address: "24 Lương Văn Can", contact: "", phone: "0396881958 / 0987758888 / 02438285483", note: "" },
  { id: 64, name: "Công ty TNHH TM và SX NPL An Tiến", material: "Chun may quần chíp áo lá", address: "Số 34E1, Ngách 218/34 đường Lạc Long Quân, Phường Bưởi, Quận Tây Hồ, TP Hà Nội", contact: "", phone: "", note: "" },
  { id: 65, name: "Thanh Cùng", material: "Khóa, đá là, pha lê, ngọc trai, oze", address: "E2 Chợ Baza Ninh Hiệp - Gia Lâm - Hà Nội", contact: "", phone: "0965199858 / 0969326799", note: "" },
  { id: 66, name: "Cường Cận", material: "Phụ liệu may mặc, khóa các loại", address: "2 Hàng Bồ - Hà Nội", contact: "", phone: "0986543746 / 0766201986", note: "" },
  { id: 67, name: "Thắng Thùa", material: "Phụ liệu may, máu may", address: "", contact: "Mr Thắng", phone: "0989090420 / 0942863327", note: "" },
  { id: 68, name: "May Venture Diệu Mỹ", material: "Vải thô", address: "", contact: "Diệu Mỹ", phone: "0936456266", note: "" },
  { id: 69, name: "Tám Hiền", material: "Hoa ép", address: "Kiot B6 - Chợ đầu mối baza - Ninh Hiệp - Gia Lâm - Hà Nội", contact: "", phone: "0974805161 / 0968143848", note: "" },
  { id: 70, name: "Huệ Linh", material: "Vải thêu", address: "Chợ đầu mối baza - Ninh Hiệp - Gia Lâm - Hà Nội", contact: "", phone: "0967170741 / 0988948648", note: "" },
  { id: 71, name: "Anh Bảo", material: "Chun may quần chíp áo lá", address: "11A Hàng Bồ - Hà Nội", contact: "", phone: "0912641090", note: "" },
  { id: 72, name: "Duy Nhất", material: "Vải gấm", address: "Km25 QL 1A Thắng Lợi - Thường Tín - Hà Nội", contact: "", phone: "0343008198 / 0966075098 / 0968903299", note: "" },
  { id: 73, name: "Dệt may thời trang Sapodill", material: "Kaki 2 da", address: "A12 Chợ Thể thao - Ninh Hiệp - Gia Lâm", contact: "Mrs Siêm", phone: "0986111666", note: "" },
  { id: 74, name: "Công ty TNHH TM Quốc tế Xuân Vũ", material: "Vải gấm", address: "", contact: "", phone: "", note: "" },
  { id: 75, name: "Công ty TNHH thương mại Nghĩa Hiệp", material: "Vải dệt kim", address: "An Quang - Lãng Ngâm - Gia Bình - Bắc Ninh", contact: "Mr Nghĩa - Hiệp", phone: "0966483888 / 0966438999", note: "" },
  { id: 76, name: "Thưởng Hằng", material: "Vải kaki", address: "B26 đối diện cổng chính chợ baza", contact: "Hằng", phone: "0338945722", note: "" },
  { id: 77, name: "Cửa hàng phụ liệu may mặc Phạm Mạnh", material: "", address: "", contact: "Mr Mạnh", phone: "0966661982 / 0924656666", note: "" },
  { id: 78, name: "Chiến Môn", material: "Vải thô Muji", address: "2A10- Chợ Baza - Ninh Hiệp - Gia Lâm - Hà Nội", contact: "Ms Chiến", phone: "0982142280", note: "" },
  { id: 79, name: "Mr Mạnh Thanh Mai", material: "", address: "", contact: "", phone: "", note: "" },
  { id: 80, name: "Lương Sơn", material: "", address: "", contact: "", phone: "0868427712", note: "" },
  { id: 81, name: "Jean Thảo Vi", material: "Jean, kaki", address: "A30,31,32 Baza, Ninh Hiệp, Gia Lâm, Hà Nội", contact: "Ms Thảo", phone: "0965427516", note: "" },
  { id: 82, name: "Trang Trung", material: "Vải kaki", address: "", contact: "", phone: "", note: "" },
  { id: 83, name: "Kho vải LUONG", material: "Vải gió nhăn", address: "Số 133 Cổng phủ, Thanh Cao, Thanh Oai, Hà Nội", contact: "", phone: "0961775689 / 0813204113", note: "" },
  { id: 84, name: "Cường Diện - Tú Anh", material: "Phụ kiện may mặc", address: "Đối diện sân chơi Nam Hồng - Chợ Baza", contact: "Diện", phone: "0379466689", note: "" },
  { id: 85, name: "Ngọc Sơn", material: "", address: "", contact: "", phone: "", note: "" },
  { id: 86, name: "Công ty cổ phần XNK Quốc tế Sơn Hồng", material: "Gấm, lụa", address: "Số 86-88 Trần Tử Bình - Nghĩa Tân - Cầu Giấy - Hà Nội", contact: "", phone: "", note: "" },
  { id: 87, name: "Công ty TNHH SX và KD phụ liệu ngành may Vietlabel", material: "Tem mác", address: "", contact: "", phone: "", note: "" },
  { id: 88, name: "Thắng Thu", material: "Vải tơ nhăn, tơ nến", address: "B3 Chợ đầu mối baza, Ninh Hiệp, GL, Hà Nội", contact: "Ms Thu, Mr Thắng", phone: "0968008900 / 0978008900", note: "" },
  { id: 89, name: "Minh Anh", material: "Tơ nhật, tơ ép", address: "B25 Vạn Lợi - Ninh Hiệp, Gia Lâm, Hà Nội", contact: "Nguyễn Minh Anh", phone: "0363693223", note: "" },
  { id: 90, name: "Hà Sơn", material: "Tơ hoa in", address: "276 Lò ông Phước, Ninh Hiệp, Gia Lâm, HN", contact: "Ms Hằng", phone: "0522017666", note: "" },
  { id: 91, name: "Tuyết Luân", material: "Vải tơ", address: "A2 Khu HTX Vạn Lợi, Ninh Hiệp, GL, HN", contact: "Ms Tuyết", phone: "0987458286 / 0988842268", note: "" },
  { id: 92, name: "Xuân Hiền", material: "Vải tơ, ovanza", address: "A10 Baza - Ninh Hiệp - Gia Lâm - Hà Nội", contact: "Ms Hiền", phone: "0986362627 / 0975622332", note: "" },
  { id: 93, name: "Linh Nhi", material: "Phụ kiện", address: "G14 - Chợ Baza - Ninh Hiệp - GL - Hà Nội", contact: "Ms Thảo", phone: "0979070268 / 0988846971", note: "" },
  { id: 94, name: "Mác tất Mr Huỳnh", material: "Mác", address: "", contact: "Mr Huỳnh", phone: "", note: "" },
  { id: 95, name: "Thắng Lợi", material: "Vải nỉ 100% poly", address: "", contact: "", phone: "", note: "" },
  { id: 96, name: "Tâm Anh", material: "Vải cá sấu poly", address: "", contact: "", phone: "", note: "" },
  { id: 97, name: "Công ty TNHH MTV SX TM DV Nguyễn Anh Khôi", material: "Chun", address: "", contact: "", phone: "", note: "" },
  { id: 98, name: "Cửa hàng vải thun Phúc Long Thịnh", material: "Vải thể thao", address: "192/4 Phú Thọ Hòa, P. Phú Thọ Hòa, Quận Tân Phú, TP HCM", contact: "", phone: "", note: "" },
];

// Format currency
const formatCurrency = (amount: number) => {
  if (amount === 0) return "-";
  return new Intl.NumberFormat("vi-VN").format(amount);
};

// Workshop type
interface Workshop {
  id: number;
  name: string;
  phone: string;
  address: string;
  manager: string;
  note: string;
}

// Supplier type
interface Supplier {
  id: number;
  name: string;
  material: string;
  address: string;
  contact: string;
  phone: string;
  note: string;
}

// Material type
interface Material {
  id: number;
  code: string;
  name: string;
  supplier: string;
  info: string;
  unit: string;
  priceBeforeTax: number;
  taxRate: number;
  priceWithTax: number;
  image: string;
  note: string;
}

export default function SanXuat() {
  const [activeTab, setActiveTab] = useState<
    "production" | "materials" | "workshops" | "suppliers"
  >("production");
  const [productionItems, setProductionItems] = useState(
    initialProductionItems
  );
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [workshops, setWorkshops] = useState<Workshop[]>(initialWorkshops);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Workshop modal states
  const [showAddWorkshopModal, setShowAddWorkshopModal] = useState(false);
  const [showViewWorkshopModal, setShowViewWorkshopModal] = useState(false);
  const [showEditWorkshopModal, setShowEditWorkshopModal] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [newWorkshop, setNewWorkshop] = useState<Omit<Workshop, 'id'>>({
    name: "", phone: "", address: "", manager: "", note: ""
  });
  const [editWorkshop, setEditWorkshop] = useState<Workshop>({
    id: 0, name: "", phone: "", address: "", manager: "", note: ""
  });

  // Supplier state
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);

  // Supplier modal states
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showViewSupplierModal, setShowViewSupplierModal] = useState(false);
  const [showEditSupplierModal, setShowEditSupplierModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [newSupplier, setNewSupplier] = useState<Omit<Supplier, 'id'>>({
    name: "", material: "", address: "", contact: "", phone: "", note: ""
  });
  const [editSupplier, setEditSupplier] = useState<Supplier>({
    id: 0, name: "", material: "", address: "", contact: "", phone: "", note: ""
  });

  // Material modal states
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [showViewMaterialModal, setShowViewMaterialModal] = useState(false);
  const [showEditMaterialModal, setShowEditMaterialModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [newMaterial, setNewMaterial] = useState<Omit<Material, 'id'>>({
    code: "", name: "", supplier: "", info: "", unit: "", priceBeforeTax: 0, taxRate: 0, priceWithTax: 0, image: "", note: ""
  });
  const [editMaterial, setEditMaterial] = useState<Material>({
    id: 0, code: "", name: "", supplier: "", info: "", unit: "", priceBeforeTax: 0, taxRate: 0, priceWithTax: 0, image: "", note: ""
  });

  // Filtered data
  const filteredProduction = productionItems.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMaterials = materials.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers
  const handleViewItem = (item: any) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleDeleteItem = (id: number, type: string) => {
    if (confirm("Bạn có chắc muốn xóa?")) {
      if (type === "production") {
        setProductionItems(productionItems.filter((p) => p.id !== id));
      } else if (type === "material") {
        setMaterials(materials.filter((m) => m.id !== id));
      }
    }
  };

  // Workshop handlers
  const handleViewWorkshop = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setShowViewWorkshopModal(true);
  };

  const handleEditWorkshop = (workshop: Workshop) => {
    setEditWorkshop({ ...workshop });
    setShowEditWorkshopModal(true);
  };

  const handleSaveEditWorkshop = () => {
    if (editWorkshop.name) {
      setWorkshops(workshops.map(w => w.id === editWorkshop.id ? editWorkshop : w));
      setShowEditWorkshopModal(false);
      setEditWorkshop({ id: 0, name: "", phone: "", address: "", manager: "", note: "" });
    }
  };

  const handleAddWorkshop = () => {
    if (newWorkshop.name) {
      const maxId = Math.max(...workshops.map(w => w.id), 0);
      setWorkshops([...workshops, { id: maxId + 1, ...newWorkshop }]);
      setNewWorkshop({ name: "", phone: "", address: "", manager: "", note: "" });
      setShowAddWorkshopModal(false);
    }
  };

  const handleDeleteWorkshop = (id: number) => {
    if (confirm("Bạn có chắc muốn xóa xưởng này?")) {
      setWorkshops(workshops.filter(w => w.id !== id));
    }
  };

  // Supplier handlers
  const handleViewSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowViewSupplierModal(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditSupplier({ ...supplier });
    setShowEditSupplierModal(true);
  };

  const handleSaveEditSupplier = () => {
    if (editSupplier.name) {
      setSuppliers(suppliers.map(s => s.id === editSupplier.id ? editSupplier : s));
      setShowEditSupplierModal(false);
      setEditSupplier({ id: 0, name: "", material: "", address: "", contact: "", phone: "", note: "" });
    }
  };

  const handleAddSupplier = () => {
    if (newSupplier.name) {
      const maxId = Math.max(...suppliers.map(s => s.id), 0);
      setSuppliers([...suppliers, { id: maxId + 1, ...newSupplier }]);
      setNewSupplier({ name: "", material: "", address: "", contact: "", phone: "", note: "" });
      setShowAddSupplierModal(false);
    }
  };

  const handleDeleteSupplier = (id: number) => {
    if (confirm("Bạn có chắc muốn xóa nhà cung cấp này?")) {
      setSuppliers(suppliers.filter(s => s.id !== id));
    }
  };

  // Material handlers
  const handleViewMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setShowViewMaterialModal(true);
  };

  const handleEditMaterial = (material: Material) => {
    setEditMaterial({ ...material });
    setShowEditMaterialModal(true);
  };

  const handleSaveEditMaterial = () => {
    if (editMaterial.code && editMaterial.name) {
      setMaterials(materials.map(m => m.id === editMaterial.id ? editMaterial : m));
      setShowEditMaterialModal(false);
      setEditMaterial({ id: 0, code: "", name: "", supplier: "", info: "", unit: "", priceBeforeTax: 0, taxRate: 0, priceWithTax: 0, image: "", note: "" });
    }
  };

  const handleAddMaterial = () => {
    if (newMaterial.code && newMaterial.name) {
      const maxId = Math.max(...materials.map(m => m.id), 0);
      setMaterials([...materials, { id: maxId + 1, ...newMaterial }]);
      setNewMaterial({ code: "", name: "", supplier: "", info: "", unit: "", priceBeforeTax: 0, taxRate: 0, priceWithTax: 0, image: "", note: "" });
      setShowAddMaterialModal(false);
    }
  };

  const handleDeleteMaterial = (id: number) => {
    if (confirm("Bạn có chắc muốn xóa nguyên phụ liệu này?")) {
      setMaterials(materials.filter(m => m.id !== id));
    }
  };

  // Stats
  const totalProduction = productionItems.length;
  const inProgressCount = productionItems.filter(
    (p) => p.status === "in_progress" || p.status === "cutting"
  ).length;
  const totalMaterials = materials.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Factory className="w-7 h-7 text-blue-600" />
            Sản xuất
          </h1>
          <p className="text-gray-500 mt-1">
            Quản lý sản xuất, nguyên phụ liệu và xưởng sản xuất
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors">
          <Download size={20} />
          <span>Xuất báo cáo</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Factory className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Đơn sản xuất</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalProduction}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Settings className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Đang sản xuất</p>
              <p className="text-2xl font-bold text-orange-600">
                {inProgressCount}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Package className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Nguyên phụ liệu</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalMaterials}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex">
            <button
              onClick={() => setActiveTab("production")}
              className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === "production"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Factory size={20} />
                Kế hoạch sản xuất
              </div>
            </button>
            <button
              onClick={() => setActiveTab("materials")}
              className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === "materials"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Package size={20} />
                Nguyên phụ liệu
              </div>
            </button>
            <button
              onClick={() => setActiveTab("workshops")}
              className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === "workshops"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings size={20} />
                Xưởng sản xuất
              </div>
            </button>
            <button
              onClick={() => setActiveTab("suppliers")}
              className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === "suppliers"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Warehouse size={20} />
                Nhà cung cấp
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Tab: Kế hoạch sản xuất */}
          {activeTab === "production" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1 max-w-md relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <Plus size={20} />
                  Thêm lệnh SX
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Mã SX
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Tên sản phẩm
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        SL Kế hoạch
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        SL Cắt
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        SL Nhập kho
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                        Giá thành
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProduction.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm font-medium text-blue-600">
                          {item.code}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-4 py-4 text-sm text-center text-gray-900">
                          {item.plannedQty}
                        </td>
                        <td className="px-4 py-4 text-sm text-center">
                          <span
                            className={
                              item.cuttingQty < item.plannedQty
                                ? "text-orange-600"
                                : "text-green-600"
                            }
                          >
                            {item.cuttingQty}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-center">
                          <span
                            className={
                              item.receivedQty < item.cuttingQty
                                ? "text-orange-600"
                                : "text-green-600"
                            }
                          >
                            {item.receivedQty}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-right text-gray-900">
                          {item.costPrice.toLocaleString("vi-VN")}đ
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : item.status === "in_progress"
                                ? "bg-blue-100 text-blue-700"
                                : item.status === "cutting"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {item.status === "completed"
                              ? "Hoàn thành"
                              : item.status === "in_progress"
                              ? "Đang SX"
                              : item.status === "cutting"
                              ? "Đang cắt"
                              : "Chờ SX"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewItem(item)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Xem"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                              title="Sửa"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteItem(item.id, "production")
                              }
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Xóa"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Tab: Nguyên phụ liệu */}
          {activeTab === "materials" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  Danh sách nguyên phụ liệu ({materials.length})
                </h3>
                <button
                  onClick={() => setShowAddMaterialModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={20} />
                  Thêm NPL
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 w-12">
                        STT
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Mã NPL
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Tên NPL
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Nhà cung cấp
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Thông tin
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        ĐVT
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                        Đơn giá (có thuế)
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredMaterials.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-blue-600">
                          {item.code}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.supplier || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.info || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {item.unit}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {item.priceWithTax > 0 ? `${item.priceWithTax.toLocaleString("vi-VN")}đ` : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewMaterial(item)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Xem"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleEditMaterial(item)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                              title="Sửa"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteMaterial(item.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Xóa"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Tab: Xưởng sản xuất */}
          {activeTab === "workshops" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Danh sách xưởng sản xuất ({workshops.length})</h3>
                <button
                  onClick={() => setShowAddWorkshopModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={20} />
                  Thêm xưởng
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 w-12">
                        STT
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Mã xưởng
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Điện thoại
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Địa chỉ
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Người phụ trách
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Ghi chú
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {workshops.map((workshop, index) => (
                      <tr key={workshop.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {workshop.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {workshop.phone || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                          <span className="line-clamp-2">{workshop.address || "-"}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {workshop.manager || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                          <span className="line-clamp-2">{workshop.note || "-"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewWorkshop(workshop)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Xem"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleEditWorkshop(workshop)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                              title="Sửa"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteWorkshop(workshop.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Xóa"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Tab: Nhà cung cấp */}
          {activeTab === "suppliers" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  Danh sách nhà cung cấp ({suppliers.length})
                </h3>
                <button
                  onClick={() => setShowAddSupplierModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={20} />
                  Thêm NCC
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 w-12">
                        STT
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Tên NCC
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Chất liệu
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Địa chỉ
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Liên hệ
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Điện thoại
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {suppliers.map((supplier, index) => (
                      <tr key={supplier.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {supplier.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                          <span className="line-clamp-2">{supplier.material || "-"}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                          <span className="line-clamp-2">{supplier.address || "-"}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {supplier.contact || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {supplier.phone || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewSupplier(supplier)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Xem"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleEditSupplier(supplier)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                              title="Sửa"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteSupplier(supplier.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Xóa"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal xem chi tiết */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Chi tiết</h3>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedItem(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-3">
              {Object.entries(selectedItem).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between py-2 border-b border-gray-100"
                >
                  <span className="text-gray-500 capitalize">{key}</span>
                  <span className="text-gray-900 font-medium">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setShowViewModal(false);
                setSelectedItem(null);
              }}
              className="w-full mt-6 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Modal thêm xưởng */}
      {showAddWorkshopModal && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => {
              setShowAddWorkshopModal(false);
              setNewWorkshop({ name: "", phone: "", address: "", manager: "", note: "" });
            }}
          />
          <div className="fixed top-0 right-0 w-full max-w-lg h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Thêm xưởng mới</h3>
                <p className="text-sm text-gray-500">Nhập thông tin xưởng sản xuất</p>
              </div>
              <button
                onClick={() => {
                  setShowAddWorkshopModal(false);
                  setNewWorkshop({ name: "", phone: "", address: "", manager: "", note: "" });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên xưởng *</label>
                  <input
                    type="text"
                    value={newWorkshop.name}
                    onChange={(e) => setNewWorkshop({ ...newWorkshop, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên xưởng"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={newWorkshop.phone}
                    onChange={(e) => setNewWorkshop({ ...newWorkshop, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                  <textarea
                    value={newWorkshop.address}
                    onChange={(e) => setNewWorkshop({ ...newWorkshop, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập địa chỉ"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Người phụ trách</label>
                  <input
                    type="text"
                    value={newWorkshop.manager}
                    onChange={(e) => setNewWorkshop({ ...newWorkshop, manager: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập người phụ trách"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    value={newWorkshop.note}
                    onChange={(e) => setNewWorkshop({ ...newWorkshop, note: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ghi chú (thông tin TK ngân hàng, ...)"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddWorkshopModal(false);
                    setNewWorkshop({ name: "", phone: "", address: "", manager: "", note: "" });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddWorkshop}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Thêm xưởng
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal xem xưởng */}
      {showViewWorkshopModal && selectedWorkshop && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => {
              setShowViewWorkshopModal(false);
              setSelectedWorkshop(null);
            }}
          />
          <div className="fixed top-0 right-0 w-full max-w-lg h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Thông tin xưởng</h3>
                <p className="text-sm text-gray-500">Chi tiết xưởng sản xuất</p>
              </div>
              <button
                onClick={() => {
                  setShowViewWorkshopModal(false);
                  setSelectedWorkshop(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Header với tên xưởng */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Factory className="text-white" size={28} />
                  </div>
                  <div>
                    <p className="text-sm text-blue-100">Tên xưởng</p>
                    <p className="font-semibold text-white text-xl">{selectedWorkshop.name}</p>
                  </div>
                </div>

                {/* Thông tin chi tiết */}
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Phone className="text-green-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Số điện thoại</p>
                      <p className="font-semibold text-gray-900">{selectedWorkshop.phone || "Chưa cập nhật"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <MapPin className="text-orange-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Địa chỉ</p>
                      <p className="font-semibold text-gray-900">{selectedWorkshop.address || "Chưa cập nhật"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <User className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Người phụ trách</p>
                      <p className="font-semibold text-gray-900">{selectedWorkshop.manager || "Chưa cập nhật"}</p>
                    </div>
                  </div>

                  {selectedWorkshop.note && (
                    <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-xl">
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <FileText className="text-yellow-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Ghi chú</p>
                        <p className="font-semibold text-gray-900">{selectedWorkshop.note}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowViewWorkshopModal(false);
                    setSelectedWorkshop(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setShowViewWorkshopModal(false);
                    handleEditWorkshop(selectedWorkshop);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Sửa thông tin
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal sửa xưởng */}
      {showEditWorkshopModal && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => {
              setShowEditWorkshopModal(false);
              setEditWorkshop({ id: 0, name: "", phone: "", address: "", manager: "", note: "" });
            }}
          />
          <div className="fixed top-0 right-0 w-full max-w-lg h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-green-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sửa thông tin xưởng</h3>
                <p className="text-sm text-gray-500">Cập nhật thông tin xưởng sản xuất</p>
              </div>
              <button
                onClick={() => {
                  setShowEditWorkshopModal(false);
                  setEditWorkshop({ id: 0, name: "", phone: "", address: "", manager: "", note: "" });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên xưởng *</label>
                  <input
                    type="text"
                    value={editWorkshop.name}
                    onChange={(e) => setEditWorkshop({ ...editWorkshop, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên xưởng"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={editWorkshop.phone}
                    onChange={(e) => setEditWorkshop({ ...editWorkshop, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                  <textarea
                    value={editWorkshop.address}
                    onChange={(e) => setEditWorkshop({ ...editWorkshop, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập địa chỉ"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Người phụ trách</label>
                  <input
                    type="text"
                    value={editWorkshop.manager}
                    onChange={(e) => setEditWorkshop({ ...editWorkshop, manager: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập người phụ trách"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    value={editWorkshop.note}
                    onChange={(e) => setEditWorkshop({ ...editWorkshop, note: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ghi chú (thông tin TK ngân hàng, ...)"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditWorkshopModal(false);
                    setEditWorkshop({ id: 0, name: "", phone: "", address: "", manager: "", note: "" });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEditWorkshop}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal thêm NCC */}
      {showAddSupplierModal && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => {
              setShowAddSupplierModal(false);
              setNewSupplier({ name: "", material: "", address: "", contact: "", phone: "", note: "" });
            }}
          />
          <div className="fixed top-0 right-0 w-full max-w-lg h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-orange-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Thêm nhà cung cấp mới</h3>
                <p className="text-sm text-gray-500">Nhập thông tin nhà cung cấp</p>
              </div>
              <button
                onClick={() => {
                  setShowAddSupplierModal(false);
                  setNewSupplier({ name: "", material: "", address: "", contact: "", phone: "", note: "" });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên NCC *</label>
                  <input
                    type="text"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên nhà cung cấp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chất liệu</label>
                  <input
                    type="text"
                    value={newSupplier.material}
                    onChange={(e) => setNewSupplier({ ...newSupplier, material: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: Vải thô, cotton, ren..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                  <textarea
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập địa chỉ"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Người liên hệ</label>
                  <input
                    type="text"
                    value={newSupplier.contact}
                    onChange={(e) => setNewSupplier({ ...newSupplier, contact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên người liên hệ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    value={newSupplier.note}
                    onChange={(e) => setNewSupplier({ ...newSupplier, note: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ghi chú thêm..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddSupplierModal(false);
                    setNewSupplier({ name: "", material: "", address: "", contact: "", phone: "", note: "" });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddSupplier}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Thêm NCC
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal xem NCC */}
      {showViewSupplierModal && selectedSupplier && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => {
              setShowViewSupplierModal(false);
              setSelectedSupplier(null);
            }}
          />
          <div className="fixed top-0 right-0 w-full max-w-lg h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-orange-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Thông tin NCC</h3>
                <p className="text-sm text-gray-500">Chi tiết nhà cung cấp</p>
              </div>
              <button
                onClick={() => {
                  setShowViewSupplierModal(false);
                  setSelectedSupplier(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Header với tên NCC */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Package className="text-white" size={28} />
                  </div>
                  <div>
                    <p className="text-sm text-orange-100">Tên NCC</p>
                    <p className="font-semibold text-white text-xl">{selectedSupplier.name}</p>
                  </div>
                </div>

                {/* Thông tin chi tiết */}
                <div className="space-y-3">
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Settings className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Chất liệu</p>
                      <p className="font-semibold text-gray-900">{selectedSupplier.material || "Chưa cập nhật"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <MapPin className="text-orange-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Địa chỉ</p>
                      <p className="font-semibold text-gray-900">{selectedSupplier.address || "Chưa cập nhật"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <User className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Người liên hệ</p>
                      <p className="font-semibold text-gray-900">{selectedSupplier.contact || "Chưa cập nhật"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Phone className="text-green-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Số điện thoại</p>
                      <p className="font-semibold text-gray-900">{selectedSupplier.phone || "Chưa cập nhật"}</p>
                    </div>
                  </div>

                  {selectedSupplier.note && (
                    <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-xl">
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <FileText className="text-yellow-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Ghi chú</p>
                        <p className="font-semibold text-gray-900">{selectedSupplier.note}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowViewSupplierModal(false);
                    setSelectedSupplier(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setShowViewSupplierModal(false);
                    handleEditSupplier(selectedSupplier);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Sửa thông tin
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal sửa NCC */}
      {showEditSupplierModal && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => {
              setShowEditSupplierModal(false);
              setEditSupplier({ id: 0, name: "", material: "", address: "", contact: "", phone: "", note: "" });
            }}
          />
          <div className="fixed top-0 right-0 w-full max-w-lg h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-green-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sửa thông tin NCC</h3>
                <p className="text-sm text-gray-500">Cập nhật thông tin nhà cung cấp</p>
              </div>
              <button
                onClick={() => {
                  setShowEditSupplierModal(false);
                  setEditSupplier({ id: 0, name: "", material: "", address: "", contact: "", phone: "", note: "" });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên NCC *</label>
                  <input
                    type="text"
                    value={editSupplier.name}
                    onChange={(e) => setEditSupplier({ ...editSupplier, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên nhà cung cấp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chất liệu</label>
                  <input
                    type="text"
                    value={editSupplier.material}
                    onChange={(e) => setEditSupplier({ ...editSupplier, material: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: Vải thô, cotton, ren..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                  <textarea
                    value={editSupplier.address}
                    onChange={(e) => setEditSupplier({ ...editSupplier, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập địa chỉ"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Người liên hệ</label>
                  <input
                    type="text"
                    value={editSupplier.contact}
                    onChange={(e) => setEditSupplier({ ...editSupplier, contact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên người liên hệ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={editSupplier.phone}
                    onChange={(e) => setEditSupplier({ ...editSupplier, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    value={editSupplier.note}
                    onChange={(e) => setEditSupplier({ ...editSupplier, note: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ghi chú thêm..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditSupplierModal(false);
                    setEditSupplier({ id: 0, name: "", material: "", address: "", contact: "", phone: "", note: "" });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEditSupplier}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal thêm NPL */}
      {showAddMaterialModal && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => {
              setShowAddMaterialModal(false);
              setNewMaterial({ code: "", name: "", supplier: "", info: "", unit: "", priceBeforeTax: 0, taxRate: 0, priceWithTax: 0, image: "", note: "" });
            }}
          />
          <div className="fixed top-0 right-0 w-full max-w-lg h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-green-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Thêm nguyên phụ liệu mới</h3>
                <p className="text-sm text-gray-500">Nhập thông tin nguyên phụ liệu</p>
              </div>
              <button
                onClick={() => {
                  setShowAddMaterialModal(false);
                  setNewMaterial({ code: "", name: "", supplier: "", info: "", unit: "", priceBeforeTax: 0, taxRate: 0, priceWithTax: 0, image: "", note: "" });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã NPL *</label>
                  <input
                    type="text"
                    value={newMaterial.code}
                    onChange={(e) => setNewMaterial({ ...newMaterial, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: VAI.001, PL.001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên NPL *</label>
                  <input
                    type="text"
                    value={newMaterial.name}
                    onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên nguyên phụ liệu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
                  <input
                    type="text"
                    value={newMaterial.supplier}
                    onChange={(e) => setNewMaterial({ ...newMaterial, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên nhà cung cấp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thông tin NPL</label>
                  <input
                    type="text"
                    value={newMaterial.info}
                    onChange={(e) => setNewMaterial({ ...newMaterial, info: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: K1m50, màu trắng..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị tính</label>
                  <input
                    type="text"
                    value={newMaterial.unit}
                    onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: m, Cuộn, Cái, Gói"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá (chưa thuế)</label>
                    <input
                      type="number"
                      value={newMaterial.priceBeforeTax || ""}
                      onChange={(e) => setNewMaterial({ ...newMaterial, priceBeforeTax: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thuế suất (%)</label>
                    <input
                      type="number"
                      value={newMaterial.taxRate || ""}
                      onChange={(e) => setNewMaterial({ ...newMaterial, taxRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá (có thuế)</label>
                  <input
                    type="number"
                    value={newMaterial.priceWithTax || ""}
                    onChange={(e) => setNewMaterial({ ...newMaterial, priceWithTax: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    value={newMaterial.note}
                    onChange={(e) => setNewMaterial({ ...newMaterial, note: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ghi chú thêm..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddMaterialModal(false);
                    setNewMaterial({ code: "", name: "", supplier: "", info: "", unit: "", priceBeforeTax: 0, taxRate: 0, priceWithTax: 0, image: "", note: "" });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddMaterial}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Thêm NPL
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal xem NPL */}
      {showViewMaterialModal && selectedMaterial && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => {
              setShowViewMaterialModal(false);
              setSelectedMaterial(null);
            }}
          />
          <div className="fixed top-0 right-0 w-full max-w-lg h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-green-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Thông tin NPL</h3>
                <p className="text-sm text-gray-500">Chi tiết nguyên phụ liệu</p>
              </div>
              <button
                onClick={() => {
                  setShowViewMaterialModal(false);
                  setSelectedMaterial(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Header với tên NPL */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Package className="text-white" size={28} />
                  </div>
                  <div>
                    <p className="text-sm text-green-100">{selectedMaterial.code}</p>
                    <p className="font-semibold text-white text-xl">{selectedMaterial.name}</p>
                  </div>
                </div>

                {/* Thông tin chi tiết */}
                <div className="space-y-3">
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Warehouse className="text-orange-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nhà cung cấp</p>
                      <p className="font-semibold text-gray-900">{selectedMaterial.supplier || "Chưa cập nhật"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FileText className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Thông tin NPL</p>
                      <p className="font-semibold text-gray-900">{selectedMaterial.info || "Chưa cập nhật"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Settings className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Đơn vị tính</p>
                      <p className="font-semibold text-gray-900">{selectedMaterial.unit || "Chưa cập nhật"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500">Đơn giá (chưa thuế)</p>
                      <p className="font-semibold text-gray-900 text-lg">
                        {selectedMaterial.priceBeforeTax > 0 ? `${selectedMaterial.priceBeforeTax.toLocaleString("vi-VN")}đ` : "-"}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500">Thuế suất</p>
                      <p className="font-semibold text-gray-900 text-lg">{selectedMaterial.taxRate}%</p>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-sm text-gray-500">Đơn giá (có thuế)</p>
                    <p className="font-bold text-green-600 text-2xl">
                      {selectedMaterial.priceWithTax > 0 ? `${selectedMaterial.priceWithTax.toLocaleString("vi-VN")}đ` : "-"}
                    </p>
                  </div>

                  {selectedMaterial.note && (
                    <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-xl">
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <FileText className="text-yellow-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Ghi chú</p>
                        <p className="font-semibold text-gray-900">{selectedMaterial.note}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowViewMaterialModal(false);
                    setSelectedMaterial(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setShowViewMaterialModal(false);
                    handleEditMaterial(selectedMaterial);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Sửa thông tin
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal sửa NPL */}
      {showEditMaterialModal && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => {
              setShowEditMaterialModal(false);
              setEditMaterial({ id: 0, code: "", name: "", supplier: "", info: "", unit: "", priceBeforeTax: 0, taxRate: 0, priceWithTax: 0, image: "", note: "" });
            }}
          />
          <div className="fixed top-0 right-0 w-full max-w-lg h-screen bg-white shadow-2xl z-60 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-green-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sửa thông tin NPL</h3>
                <p className="text-sm text-gray-500">Cập nhật thông tin nguyên phụ liệu</p>
              </div>
              <button
                onClick={() => {
                  setShowEditMaterialModal(false);
                  setEditMaterial({ id: 0, code: "", name: "", supplier: "", info: "", unit: "", priceBeforeTax: 0, taxRate: 0, priceWithTax: 0, image: "", note: "" });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã NPL *</label>
                  <input
                    type="text"
                    value={editMaterial.code}
                    onChange={(e) => setEditMaterial({ ...editMaterial, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: VAI.001, PL.001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên NPL *</label>
                  <input
                    type="text"
                    value={editMaterial.name}
                    onChange={(e) => setEditMaterial({ ...editMaterial, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên nguyên phụ liệu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
                  <input
                    type="text"
                    value={editMaterial.supplier}
                    onChange={(e) => setEditMaterial({ ...editMaterial, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên nhà cung cấp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thông tin NPL</label>
                  <input
                    type="text"
                    value={editMaterial.info}
                    onChange={(e) => setEditMaterial({ ...editMaterial, info: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: K1m50, màu trắng..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị tính</label>
                  <input
                    type="text"
                    value={editMaterial.unit}
                    onChange={(e) => setEditMaterial({ ...editMaterial, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: m, Cuộn, Cái, Gói"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá (chưa thuế)</label>
                    <input
                      type="number"
                      value={editMaterial.priceBeforeTax || ""}
                      onChange={(e) => setEditMaterial({ ...editMaterial, priceBeforeTax: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thuế suất (%)</label>
                    <input
                      type="number"
                      value={editMaterial.taxRate || ""}
                      onChange={(e) => setEditMaterial({ ...editMaterial, taxRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá (có thuế)</label>
                  <input
                    type="number"
                    value={editMaterial.priceWithTax || ""}
                    onChange={(e) => setEditMaterial({ ...editMaterial, priceWithTax: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    value={editMaterial.note}
                    onChange={(e) => setEditMaterial({ ...editMaterial, note: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ghi chú thêm..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditMaterialModal(false);
                    setEditMaterial({ id: 0, code: "", name: "", supplier: "", info: "", unit: "", priceBeforeTax: 0, taxRate: 0, priceWithTax: 0, image: "", note: "" });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEditMaterial}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
