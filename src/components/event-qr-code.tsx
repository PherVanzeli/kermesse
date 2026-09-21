"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

export function EventQrCode({ slug, active }: { slug: string; active: boolean }) {
  const [url, setUrl] = useState("");
  const [image, setImage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const publicUrl = `${window.location.origin}/evento/${slug}`;
    const timer = window.setTimeout(() => setUrl(publicUrl), 0);
    void QRCode.toDataURL(publicUrl, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: "M",
    }).then(setImage);
    return () => window.clearTimeout(timer);
  }, [slug]);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const link = document.createElement("a");
    link.download = `${slug}-qrcode.png`;
    link.href = image;
    link.click();
  };

  return (
    <details className="mt-4 rounded-2xl bg-[#fffaf3] p-4">
      <summary className="cursor-pointer font-bold text-[#2f8f75]">
        QR Code do cardápio
      </summary>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {image ? (
          <img src={image} alt={`QR Code do cardápio de ${slug}`} className="h-40 w-40 rounded-xl bg-white p-2" />
        ) : (
          <div className="h-40 w-40 animate-pulse rounded-xl bg-[#eadbca]" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-[#765f4d]">
            {active
              ? "Imprima ou compartilhe este QR Code para os convidados acessarem o cardápio."
              : "Publique o evento para que este link fique disponível para os convidados."}
          </p>
          <p className="mt-2 break-all rounded-xl bg-white p-3 text-xs text-[#947b68]">{url}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => void copyUrl()}
              disabled={!url}
              className="rounded-xl border border-[#2f8f75] px-3 py-2 text-sm font-bold text-[#2f8f75] disabled:opacity-50"
            >
              {copied ? "Link copiado" : "Copiar link"}
            </button>
            <button
              onClick={download}
              disabled={!image}
              className="rounded-xl bg-[#2f8f75] px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              Baixar QR Code
            </button>
          </div>
        </div>
      </div>
    </details>
  );
}
