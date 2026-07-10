import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Smartphone } from "lucide-react";
import { fetchLanInfo } from "../lib/api";

/**
 * Shows a QR (and the URL) that a phone/tablet on the same WiFi can scan to
 * open the app. The server already listens on all interfaces; this is just
 * discovery. Only rendered when the local server is reachable.
 */
const OpenOnPhoneDialog = () => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const { port, ips } = await fetchLanInfo();
        if (cancelled) return;
        if (!ips.length) {
          setError(true);
          return;
        }
        const u = `http://${ips[0]}:${port}`;
        setUrl(u);
        setQr(await QRCode.toDataURL(u, { width: 220, margin: 1 }));
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Abrir en tu teléfono">
          <Smartphone className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[340px]">
        <DialogHeader>
          <DialogTitle>Abrir en tu teléfono</DialogTitle>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-muted-foreground">
            No encontré una dirección de red local. Verifica que la Mac esté
            conectada al WiFi.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2">
            {qr ? (
              <img
                src={qr}
                alt="QR para abrir la app"
                className="rounded-md border bg-white p-1"
              />
            ) : (
              <div className="h-[220px] w-[220px] animate-pulse rounded-md bg-muted" />
            )}
            {url && (
              <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
                {url}
              </code>
            )}
            <p className="text-center text-xs text-muted-foreground">
              Escanea el QR con la cámara del teléfono (misma red WiFi). La Mac
              debe estar encendida con la app abierta.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OpenOnPhoneDialog;
