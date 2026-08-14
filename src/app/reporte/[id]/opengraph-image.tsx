import { ImageResponse } from "next/og";
import { getReportById } from "@/lib/reports";
import { reportPhotoAbsoluteUrl } from "@/lib/photoDisplay";
import { reportTypeLabel } from "@/lib/reportCopy";

export const alt = "Ubica tu Peludo";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

type Props = {
  params: Promise<{ id: string }>;
};

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) return null;
    const bytes = await res.arrayBuffer();
    const b64 = Buffer.from(bytes).toString("base64");
    return `data:${contentType};base64,${b64}`;
  } catch {
    return null;
  }
}

export default async function Image({ params }: Props) {
  const { id } = await params;
  const report = await getReportById(id);

  const title = report
    ? `${report.pet_type === "perro" ? "Perro" : "Gato"} ${reportTypeLabel(report.report_type).toLowerCase()}`
    : "Ubica tu Peludo";
  const place = report ? `${report.neighborhood} · ${report.city}` : "Colombia";
  const badge = report ? reportTypeLabel(report.report_type) : "Reporte";
  const badgeColor =
    report?.report_type === "perdido"
      ? "#c2410c"
      : report?.report_type === "encontrado"
        ? "#0f766e"
        : "#1d4ed8";

  const photoUrl = reportPhotoAbsoluteUrl(report ?? { id: id, photo_url: null });
  const photo =
    photoUrl && /^https?:\/\//i.test(photoUrl)
      ? await toDataUrl(photoUrl)
      : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          background: "linear-gradient(135deg, #e8f4ef 0%, #f7fbf8 45%, #f3ebe3 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Foto con márgenes: Meta recorta al centro y aún se ve el peludo */}
        <div
          style={{
            width: 700,
            height: 630,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 36,
          }}
        >
          <div
            style={{
              width: 628,
              height: 558,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 28,
              background: "#ffffff",
              boxShadow: "0 18px 40px rgba(26,46,40,0.12)",
              overflow: "hidden",
            }}
          >
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt=""
                width={600}
                height={530}
                style={{
                  width: 600,
                  height: 530,
                  objectFit: "contain",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  fontSize: 42,
                  color: "#5f746c",
                  fontWeight: 600,
                }}
              >
                Sin foto
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "48px 48px 48px 12px",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              background: badgeColor,
              color: "#ffffff",
              fontSize: 26,
              fontWeight: 700,
              padding: "10px 18px",
              borderRadius: 14,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {badge}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 52,
              fontWeight: 700,
              color: "#1a2e28",
              lineHeight: 1.15,
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "#5f746c",
              lineHeight: 1.3,
            }}
          >
            {place}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 18,
              fontSize: 24,
              fontWeight: 600,
              color: "#0f766e",
            }}
          >
            Ubica tu Peludo
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
