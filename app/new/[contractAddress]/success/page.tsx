"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { CopyIcon } from "@radix-ui/react-icons";

export default function SuccessPage() {
  const [pageAddress, setPageAddress] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [copyStatus, setCopyStatus] = useState("Copy");
  const searchParams = useSearchParams();

  useEffect(() => {
    const address = searchParams.get("pageAddress");
    if (address) {
      setPageAddress(address);
      // Here you would typically call an API to create a short URL
      // For this example, we'll just use a placeholder
      setShortUrl(`https://short.url/${address.slice(-6)}`);
    }
  }, [searchParams]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopyStatus("Copied!");
    setTimeout(() => setCopyStatus("Copy"), 2000); // Reset after 2 seconds
  };

  const openInNewTab = () => {
    window.open(pageAddress, "_blank");
  };

  return (
    <div className="container mx-auto p-4 space-y-6 text-black max-w-3xl text-center">
      <p className="text-xl mb-4">Your page is ready</p>

      <div className="flex justify-center">
        <QRCodeSVG value={pageAddress} size={200} />
      </div>

      <div className="flex justify-center space-x-2">
        <Button onClick={copyToClipboard} className="flex items-center">
          <CopyIcon className="mr-2" />
          {copyStatus === "Copied!" ? copyStatus : shortUrl}
        </Button>
      </div>

      <Button onClick={openInNewTab}>Open in new tab</Button>
    </div>
  );
}
