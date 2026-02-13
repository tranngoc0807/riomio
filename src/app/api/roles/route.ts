import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Fallback roles khi chưa tạo bảng roles trong Supabase
const FALLBACK_ROLES = [
  { id: "admin", display_name: "Admin", color: "bg-red-500", is_system: true, sort_order: 0 },
  { id: "tong_hop", display_name: "Tổng hợp", color: "bg-blue-500", is_system: false, sort_order: 1 },
  { id: "ke_toan", display_name: "Kế toán", color: "bg-green-500", is_system: false, sort_order: 2 },
  { id: "pattern", display_name: "Pattern", color: "bg-purple-500", is_system: false, sort_order: 3 },
  { id: "may_mau", display_name: "May mẫu", color: "bg-pink-500", is_system: false, sort_order: 4 },
  { id: "thiet_ke", display_name: "Thiết kế", color: "bg-indigo-500", is_system: false, sort_order: 5 },
  { id: "quan_ly_don_hang", display_name: "Quản lý đơn hàng", color: "bg-orange-500", is_system: false, sort_order: 6 },
  { id: "sale_si", display_name: "Sale sỉ", color: "bg-yellow-500", is_system: false, sort_order: 7 },
  { id: "sale_san", display_name: "Sale sàn", color: "bg-amber-500", is_system: false, sort_order: 8 },
  { id: "thu_kho", display_name: "Thủ kho", color: "bg-teal-500", is_system: false, sort_order: 9 },
  { id: "hinh_anh", display_name: "Hình ảnh", color: "bg-cyan-500", is_system: false, sort_order: 10 },
];

/**
 * GET /api/roles
 * Lấy danh sách tất cả roles
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("roles")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      // Bảng chưa tồn tại → trả về fallback roles
      if (error.message.includes("roles") || error.code === "PGRST204" || error.code === "42P01") {
        return NextResponse.json({ success: true, data: FALLBACK_ROLES });
      }
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data && data.length > 0 ? data : FALLBACK_ROLES });
  } catch (error: any) {
    return NextResponse.json(
      { success: true, data: FALLBACK_ROLES }
    );
  }
}

function removeVietnameseDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/**
 * POST /api/roles
 * Thêm role mới
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { display_name, color } = body;

    if (!display_name) {
      return NextResponse.json(
        { success: false, error: "Tên vai trò là bắt buộc" },
        { status: 400 }
      );
    }

    // Auto-generate id from display_name
    const id = removeVietnameseDiacritics(display_name)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    // Check if id already exists
    const { data: existing } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Vai trò này đã tồn tại" },
        { status: 400 }
      );
    }

    // Get max sort_order
    const { data: maxRow } = await supabaseAdmin
      .from("roles")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxRow?.sort_order || 0) + 1;

    // Insert role
    const { data, error } = await supabaseAdmin
      .from("roles")
      .insert({
        id,
        display_name,
        color: color || "bg-gray-500",
        is_system: false,
        sort_order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Create empty permissions entry for the new role
    await supabaseAdmin
      .from("role_permissions")
      .upsert({ role: id, permissions: [], updated_at: new Date().toISOString() }, { onConflict: "role" });

    return NextResponse.json({
      success: true,
      data,
      message: "Thêm vai trò thành công",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/roles
 * Xóa role (reassign users to default role)
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id, reassign_to } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID vai trò là bắt buộc" },
        { status: 400 }
      );
    }

    // Check if system role
    const { data: role } = await supabaseAdmin
      .from("roles")
      .select("is_system")
      .eq("id", id)
      .single();

    if (role?.is_system) {
      return NextResponse.json(
        { success: false, error: "Không thể xóa vai trò hệ thống" },
        { status: 400 }
      );
    }

    // Reassign all users with this role
    const targetRole = reassign_to || "tong_hop";
    await supabaseAdmin
      .from("profiles")
      .update({ role: targetRole })
      .eq("role", id);

    // Delete role_permissions for this role
    await supabaseAdmin
      .from("role_permissions")
      .delete()
      .eq("role", id);

    // Delete the role
    const { error } = await supabaseAdmin
      .from("roles")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Xóa vai trò thành công",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
