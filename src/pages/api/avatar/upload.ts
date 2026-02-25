import type { NextApiRequest, NextApiResponse } from "next";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

// Increase limit to 6mb to handle high-res phone photos
export const config = { 
  api: { 
    bodyParser: { 
      sizeLimit: "6mb" 
    } 
  } 
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body as HandleUploadBody;

    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // Here you could check req for a session cookie if you wanted 
        // to restrict uploads to logged-in users only.
        
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          tokenPayload: JSON.stringify({
            // You can pass user info here to track who uploaded what
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This runs on Vercel's servers after the file is stored.
        console.log("Upload completed:", blob.url);
        
        try {
          // Logic to update user's Firestore document with blob.url could go here
        } catch (error) {
          console.error("Failed to sync with Firestore:", error);
        }
      },
    });

    return res.status(200).json(json);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return res.status(400).json({ error: message });
  }
}