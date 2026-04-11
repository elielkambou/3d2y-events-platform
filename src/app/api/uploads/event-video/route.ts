import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canManageAgency } from "@/lib/permissions";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getSession();

  if (!canManageAgency(session)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ["video/mp4", "video/webm", "video/ogg"],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            uploadedByUserId: session!.userId,
            pathname,
          }),
        };
      },
      onUploadCompleted: async () => {
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur pendant la génération du token d’upload.",
      },
      { status: 400 },
    );
  }
}