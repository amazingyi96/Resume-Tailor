import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["jspdf", "docx", "pdfjs-dist", "mammoth"],
};

export default nextConfig;
