"use client";

import { createContext, useContext, useState, ReactNode } from "react";

// Types
export interface BusinessArea {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}

export interface QuickLinkSection {
  id: string;
  title: string;
  links: string[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "info" | "success" | "warning" | "celebration";
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export interface CompanyConfig {
  // Basic Info
  name: string;
  taxCode: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  foundedDate: string;
  employees: number;
  capital: string;
  industry: string;
  representative: string;
  position: string;
  logo: string;

  // Content sections
  heroTitle1: string;
  heroTitle2: string;
  heroDescription: string;

  aboutUs: string;

  vision: string;
  mission: string;

  businessAreas: BusinessArea[];
  quickLinks: QuickLinkSection[];
  announcements: Announcement[];
}

const defaultConfig: CompanyConfig = {
  name: "Công ty TNHH Riomio Shop",
  taxCode: "0123456789",
  address: "B12 TT7 đường Nguyễn Sơn Hà, Hà Đông, Hà Nội",
  phone: "028 1234 5678",
  email: "contact@riomio.vn",
  website: "www.riomio.vn",
  foundedDate: "2020-01-15",
  employees: 45,
  capital: "5.000.000.000",
  industry: "Sản xuất và kinh doanh hàng tiêu dùng",
  representative: "Hoàng Việt",
  position: "Giám đốc điều hành",
  logo: "",

  heroTitle1: "GIỚI THIỆU",
  heroTitle2: "CÔNG TY",
  heroDescription: "Chào mừng đến với Công ty TNHH Riomio Shop. Chúng tôi tự hào là đơn vị tiên phong trong lĩnh vực sản xuất và kinh doanh các sản phẩm thời trang chất lượng cao, phục vụ khách hàng trên toàn quốc với đội ngũ nhân viên chuyên nghiệp và tận tâm.",

  aboutUs: "Công ty TNHH Riomio Shop được thành lập với sứ mệnh mang đến những sản phẩm thời trang chất lượng cao, đẹp và phù hợp với thị hiếu người Việt. Trải qua nhiều năm phát triển, chúng tôi đã xây dựng được hệ thống sản xuất hiện đại, đội ngũ nhân viên chuyên nghiệp và mạng lưới phân phối rộng khắp cả nước. Chúng tôi cam kết mang đến cho khách hàng những trải nghiệm mua sắm tốt nhất.",

  vision: "Trở thành thương hiệu thời trang hàng đầu Việt Nam, được khách hàng tin yêu và lựa chọn. Mở rộng thị trường ra khu vực Đông Nam Á trong vòng 5 năm tới, đồng thời xây dựng hệ sinh thái thời trang bền vững và có trách nhiệm với cộng đồng.",

  mission: "Cung cấp các sản phẩm thời trang chất lượng cao với giá cả hợp lý. Tạo ra giá trị cho khách hàng, đối tác và cộng đồng thông qua việc phát triển bền vững, có trách nhiệm với môi trường và xã hội, đồng hành cùng sự phát triển của đất nước.",

  businessAreas: [
    { id: "1", icon: "Factory", title: "Sản xuất", description: "Sản xuất các sản phẩm thời trang chất lượng cao", color: "from-orange-400 to-orange-500" },
    { id: "2", icon: "ShoppingBag", title: "Bán lẻ", description: "Phân phối qua hệ thống cửa hàng và TMĐT", color: "from-orange-400 to-orange-500" },
    { id: "3", icon: "Truck", title: "Phân phối", description: "Cung cấp dịch vụ phân phối sỉ toàn quốc", color: "from-orange-400 to-orange-500" },
    { id: "4", icon: "Palette", title: "Thiết kế", description: "Đội ngũ thiết kế sáng tạo, cập nhật xu hướng", color: "from-orange-400 to-orange-500" },
  ],

  quickLinks: [
    { id: "1", title: "Về Riomio Shop", links: ["Giới thiệu chung", "Liên kết - Thành viên", "Khách hàng - Đối tác", "Tuyển dụng"] },
    { id: "2", title: "Hỗ trợ khách hàng", links: ["Hướng dẫn sử dụng", "Thanh toán hóa đơn", "Góp ý khách hàng", "Chính sách bảo hành"] },
    { id: "3", title: "Sản phẩm dịch vụ", links: ["Thời trang nam", "Thời trang nữ", "Phụ kiện", "Khuyến mãi"] },
  ],

  announcements: [],
};

interface CompanyConfigContextType {
  config: CompanyConfig;
  updateConfig: (newConfig: CompanyConfig) => void;
}

const CompanyConfigContext = createContext<CompanyConfigContextType | undefined>(undefined);

export function CompanyConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<CompanyConfig>(defaultConfig);

  const updateConfig = (newConfig: CompanyConfig) => {
    setConfig(newConfig);
  };

  return (
    <CompanyConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </CompanyConfigContext.Provider>
  );
}

export function useCompanyConfig() {
  const context = useContext(CompanyConfigContext);
  if (context === undefined) {
    throw new Error("useCompanyConfig must be used within a CompanyConfigProvider");
  }
  return context;
}

export { defaultConfig };
