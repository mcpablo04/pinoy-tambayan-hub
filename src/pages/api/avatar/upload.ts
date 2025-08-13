// src/pages/api/avatar/upload.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export const config = { api: { bodyParser: { sizeLimit: "6mb" } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const body = req.body as HandleUploadBody;

    const json = await handleUpload({
      body,
      request: req as any,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({}),
      }),
      onUploadCompleted: async ({ blob }) => {
        // optional: write to Firestore logs/audit if you want
      },
    });

    res.status(200).json(json);
  } catch (e: any) {
    res.status(400).json({ error: e?.message ?? "Upload failed" });
  }
}
