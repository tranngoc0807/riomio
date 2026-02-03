import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create Supabase admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface RolePermission {
  id: string;
  role: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/role-permissions
 * Get all role permissions or permissions for a specific role
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    let query = supabaseAdmin
      .from("role_permissions")
      .select("*");

    if (role) {
      query = query.eq("role", role);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching role permissions:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: role ? data?.[0] : data,
    });
  } catch (error: any) {
    console.error("Error in GET /api/role-permissions:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/role-permissions
 * Update permissions for a role (upsert)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, permissions } = body;

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Role is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, error: "Permissions must be an array" },
        { status: 400 }
      );
    }

    // Upsert the role permissions
    const { data, error } = await supabaseAdmin
      .from("role_permissions")
      .upsert(
        {
          role,
          permissions,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "role",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error updating role permissions:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: `Permissions for role "${role}" updated successfully`,
    });
  } catch (error: any) {
    console.error("Error in POST /api/role-permissions:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
