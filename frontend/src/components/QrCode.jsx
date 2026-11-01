import { useMemo } from "react";
import qrcode from "qrcode-generator";

// Desenha um QR Code em SVG (nítido em qualquer tamanho e na impressão)
export default function QrCode({ texto, tamanho = 148, rotulo = "QR Code do ingresso" }) {
  const { modulos, caminho } = useMemo(() => {
    const qr = qrcode(0, "M"); // 0 = tamanho automático; "M" = corrige até ~15% de dano
    qr.addData(texto);
    qr.make();
    const n = qr.getModuleCount();
    let d = "";
    for (let linha = 0; linha < n; linha++) {
      for (let coluna = 0; coluna < n; coluna++) {
        if (qr.isDark(linha, coluna)) d += `M${coluna} ${linha}h1v1h-1z`;
      }
    }
    return { modulos: n, caminho: d };
  }, [texto]);

  const margem = 4; // margem branca exigida pelo padrão QR
  const lado = modulos + margem * 2;
  return (
    <svg
      className="qr-code"
      width={tamanho}
      height={tamanho}
      viewBox={`${-margem} ${-margem} ${lado} ${lado}`}
      role="img"
      aria-label={rotulo}
      shapeRendering="crispEdges"
    >
      <rect x={-margem} y={-margem} width={lado} height={lado} fill="#fff" />
      <path d={caminho} fill="#111a2e" />
    </svg>
  );
}
