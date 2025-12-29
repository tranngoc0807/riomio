"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

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
  updateConfig: (newConfig: CompanyConfig) => Promise<void>;
  loading: boolean;
}

const CompanyConfigContext = createContext<CompanyConfigContextType | undefined>(undefined);

export function CompanyConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<CompanyConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Load config from Supabase on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data, error } = await supabase
          .from("company_config")
          .select("*")
          .limit(1)
          .single();

        if (error) {
          console.error("Error loading company config:", error);
          // If no config exists, create default one
          if (error.code === "PGRST116") {
            await createDefaultConfig();
          }
        } else if (data) {
          // Map database fields (snake_case) to camelCase
          const loadedConfig: CompanyConfig = {
            name: data.name,
            taxCode: data.tax_code,
            address: data.address,
            phone: data.phone,
            email: data.email,
            website: data.website,
            foundedDate: data.founded_date,
            employees: data.employees,
            capital: data.capital,
            industry: data.industry,
            representative: data.representative,
            position: data.position,
            logo: data.logo,
            heroTitle1: data.hero_title1,
            heroTitle2: data.hero_title2,
            heroDescription: data.hero_description,
            aboutUs: data.about_us,
            vision: data.vision,
            mission: data.mission,
            businessAreas: data.business_areas || defaultConfig.businessAreas,
            quickLinks: data.quick_links || defaultConfig.quickLinks,
            announcements: data.announcements || defaultConfig.announcements,
          };
          setConfig(loadedConfig);
        }
      } catch (err) {
        console.error("Exception loading config:", err);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createDefaultConfig = async () => {
    try {
      const { error } = await supabase.from("company_config").insert({
        name: defaultConfig.name,
        tax_code: defaultConfig.taxCode,
        address: defaultConfig.address,
        phone: defaultConfig.phone,
        email: defaultConfig.email,
        website: defaultConfig.website,
        founded_date: defaultConfig.foundedDate,
        employees: defaultConfig.employees,
        capital: defaultConfig.capital,
        industry: defaultConfig.industry,
        representative: defaultConfig.representative,
        position: defaultConfig.position,
        logo: defaultConfig.logo,
        hero_title1: defaultConfig.heroTitle1,
        hero_title2: defaultConfig.heroTitle2,
        hero_description: defaultConfig.heroDescription,
        about_us: defaultConfig.aboutUs,
        vision: defaultConfig.vision,
        mission: defaultConfig.mission,
        business_areas: defaultConfig.businessAreas,
        quick_links: defaultConfig.quickLinks,
        announcements: defaultConfig.announcements,
      });

      if (error) {
        console.error("Error creating default config:", error);
      }
    } catch (err) {
      console.error("Exception creating default config:", err);
    }
  };

  const updateConfig = async (newConfig: CompanyConfig) => {
    try {
      const { error } = await supabase
        .from("company_config")
        .update({
          name: newConfig.name,
          tax_code: newConfig.taxCode,
          address: newConfig.address,
          phone: newConfig.phone,
          email: newConfig.email,
          website: newConfig.website,
          founded_date: newConfig.foundedDate,
          employees: newConfig.employees,
          capital: newConfig.capital,
          industry: newConfig.industry,
          representative: newConfig.representative,
          position: newConfig.position,
          logo: newConfig.logo,
          hero_title1: newConfig.heroTitle1,
          hero_title2: newConfig.heroTitle2,
          hero_description: newConfig.heroDescription,
          about_us: newConfig.aboutUs,
          vision: newConfig.vision,
          mission: newConfig.mission,
          business_areas: newConfig.businessAreas,
          quick_links: newConfig.quickLinks,
          announcements: newConfig.announcements,
        })
        .eq("id", 1); // Assuming single row with id=1

      if (error) {
        console.error("Error updating config:", error);
        throw error;
      }

      setConfig(newConfig);
    } catch (err) {
      console.error("Exception updating config:", err);
      throw err;
    }
  };

  return (
    <CompanyConfigContext.Provider value={{ config, updateConfig, loading }}>
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
