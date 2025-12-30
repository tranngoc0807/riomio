import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

/**
 * GET /api/employees/test
 * Test Google Sheets connection and get sheet info
 */
export async function GET(request: NextRequest) {
  try {
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!privateKey || !clientEmail || !spreadsheetId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing environment variables",
          details: {
            hasPrivateKey: !!privateKey,
            hasClientEmail: !!clientEmail,
            hasSpreadsheetId: !!spreadsheetId,
          },
        },
        { status: 500 }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: authClient as any });

    // Get spreadsheet metadata
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const sheetsList = metadata.data.sheets?.map((s) => ({
      title: s.properties?.title,
      sheetId: s.properties?.sheetId,
      index: s.properties?.index,
    }));

    return NextResponse.json({
      success: true,
      spreadsheetId,
      spreadsheetTitle: metadata.data.properties?.title,
      sheets: sheetsList,
      message: "Connection successful! Use one of the sheet titles above for GOOGLE_SHEET_NAME",
    });
  } catch (error: any) {
    console.error("Error testing Google Sheets connection:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to connect to Google Sheets",
        details: error.response?.data || error.toString(),
      },
      { status: 500 }
    );
  }
}
