import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { newPassword } = await request.json();

    if (!newPassword) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập mật khẩu mới" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Mật khẩu phải có ít nhất 6 ký tự" },
        { status: 400 }
      );
    }

    // Get Supabase client with user session
    const supabase = await createClient();

    // Check if user is logged in
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Error getting user:", userError);
      return NextResponse.json(
        { success: false, error: "Bạn cần đăng nhập để đổi mật khẩu" },
        { status: 401 }
      );
    }

    // Update password for the logged-in user
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error("Error updating password:", updateError);
      return NextResponse.json(
        { success: false, error: "Không thể đổi mật khẩu: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    console.error("Error in change-password API:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi server khi đổi mật khẩu" },
      { status: 500 }
    );
  }
}
