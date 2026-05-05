import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Will need to add this to .env.local
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, role, roles } = await request.json();

    // Verify the request is from an authenticated admin
    // Get the session from the request headers
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Chuẩn hoá roles: ưu tiên `roles[]`, fallback `role`
    const rolesArray: string[] =
      Array.isArray(roles) && roles.length > 0
        ? roles
        : role
          ? [role]
          : ["tong_hop"];
    const primaryRole = rolesArray[0];

    // Create user using admin client (won't auto-login)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        role: primaryRole,
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Sau khi trigger tạo profile (sync), update thêm roles[] để hỗ trợ multi-role
    if (authData.user) {
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ roles: rolesArray, role: primaryRole })
        .eq("id", authData.user.id);
      if (updateError) {
        console.error("Error setting roles[] for new user:", updateError);
      }
    }

    return NextResponse.json({ success: true, user: authData.user });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
