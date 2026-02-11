import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
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
