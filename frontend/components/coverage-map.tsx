"use client";

import { useEffect, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import { getCoverageCountries, type CoverageCountry } from "@/lib/api";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/* ISO 3166-1 alpha-2 → numeric (used as `id` in world-atlas TopoJSON) */
const ISO2_TO_NUMERIC: Record<string, string> = {
  AD: "020", AE: "784", AF: "004", AG: "028", AL: "008", AM: "051",
  AO: "024", AR: "032", AT: "040", AU: "036", AZ: "031",
  BA: "070", BB: "052", BD: "050", BE: "056", BF: "854", BG: "100",
  BH: "048", BI: "108", BJ: "204", BN: "096", BO: "068", BR: "076",
  BT: "064", BW: "072", BY: "112",
  CA: "124", CD: "180", CF: "140", CG: "178", CH: "756", CI: "384",
  CL: "152", CM: "120", CN: "156", CO: "170", CR: "188", CU: "192",
  CV: "132", CY: "196", CZ: "203",
  DE: "276", DJ: "262", DK: "208", DO: "214", DZ: "012",
  EC: "218", EE: "233", EG: "818", ER: "232", ES: "724", ET: "231",
  FI: "246", FJ: "242", FR: "250",
  GA: "266", GB: "826", GE: "268", GH: "288", GM: "270", GN: "324",
  GQ: "226", GR: "300", GT: "320", GW: "624", GY: "328",
  HK: "344", HN: "340", HR: "191", HT: "332", HU: "348",
  ID: "360", IE: "372", IL: "376", IN: "356", IQ: "368", IR: "364",
  IS: "352", IT: "380",
  JM: "388", JO: "400", JP: "392",
  KE: "404", KG: "417", KH: "116", KM: "174", KP: "408", KR: "410",
  KW: "414", KZ: "398",
  LA: "418", LB: "422", LK: "144", LR: "430", LS: "426", LT: "440",
  LU: "442", LV: "428", LY: "434",
  MA: "504", MD: "498", ME: "499", MG: "450", MK: "807", ML: "466",
  MM: "104", MN: "496", MO: "446", MR: "478", MT: "470", MU: "480",
  MV: "462", MW: "454", MX: "484", MY: "458", MZ: "508",
  NA: "516", NE: "562", NG: "566", NI: "558", NL: "528", NO: "578",
  NP: "524", NZ: "554",
  OM: "512",
  PA: "591", PE: "604", PG: "598", PH: "608", PK: "586", PL: "616",
  PT: "620",
  QA: "634",
  RO: "642", RS: "688", RU: "643", RW: "646",
  SA: "682", SC: "690", SD: "729", SE: "752", SG: "702", SI: "705",
  SK: "703", SL: "694", SN: "686", SO: "706", SR: "740", SS: "728",
  SV: "222", SY: "760", SZ: "748",
  TD: "148", TG: "768", TH: "764", TJ: "762", TL: "626", TM: "795",
  TN: "788", TR: "792", TT: "780", TW: "158", TZ: "834",
  UA: "804", UG: "800", US: "840", UY: "858", UZ: "860",
  VE: "862", VN: "704",
  YE: "887",
  ZA: "710", ZM: "894", ZW: "716",
};

/* Reverse map: numeric → CoverageCountry */
function buildNumericMap(
  countries: CoverageCountry[]
): Map<string, CoverageCountry> {
  const map = new Map<string, CoverageCountry>();
  for (const c of countries) {
    const numeric = ISO2_TO_NUMERIC[c.country_code.toUpperCase()];
    if (numeric) map.set(numeric, c);
  }
  return map;
}

interface Tooltip {
  x: number;
  y: number;
  data: CoverageCountry;
}

/** Drag threshold in px — below this it's a tap, above it's a scroll */
const DRAG_THRESHOLD = 8;

export default function CoverageMap() {
  const { locale } = useI18n();
  const router = useRouter();
  const [countries, setCountries] = useState<CoverageCountry[]>([]);
  const [numericMap, setNumericMap] = useState<Map<string, CoverageCountry>>(new Map());
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);       // desktop hover
  const [selected, setSelected] = useState<CoverageCountry | null>(null); // mobile tap
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const isDrag = useRef(false);

  useEffect(() => {
    getCoverageCountries().then((data) => {
      setCountries(data);
      setNumericMap(buildNumericMap(data));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Color palette — clear contrast in both modes
  const colors = isDark
    ? { bg: "#18181b", card: "#1c1c1f", border: "#3f3f46", covered: "#C8102E", coveredHover: "#e8213e", coveredSelected: "#f25c72", uncovered: "#3f3f46", ocean: "#18181b", stroke: "#09090b", text: "#a1a1aa", accent: "#C8102E" }
    : { bg: "#f4f4f5", card: "#ffffff", border: "#d4d4d8", covered: "#C8102E", coveredHover: "#9B0D23", coveredSelected: "#f25c72", uncovered: "#d1d5db", ocean: "#f0f0f0", stroke: "#ffffff", text: "#71717a", accent: "#C8102E" };

  /* ── Touch handlers: distinguish tap from scroll ── */
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
    isDrag.current = false;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = Math.abs(e.touches[0].clientX - touchStart.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStart.current.y);
    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) isDrag.current = true;
  };

  /* ── Geography click handler ── */
  const handleGeoClick = (country: CoverageCountry) => {
    if (isDrag.current) return; // was a scroll — ignore
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) {
      // Mobile: tap selects; tapping same country again navigates
      if (selected?.country_code === country.country_code) {
        router.push(`/packages/${country.country_code.toLowerCase()}`);
      } else {
        setSelected(country);
      }
    } else {
      // Desktop: click navigates directly
      router.push(`/packages/${country.country_code.toLowerCase()}`);
    }
  };

  const handleMouseMove = (e: React.MouseEvent, country: CoverageCountry) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, data: country });
  };

  const totalCovered = countries.length;

  const labels =
    locale === "en"
      ? {
          heading: "eSIM Coverage",
          sub: "Active in",
          countries: "countries",
          from: "From",
          packages: "packages",
          buy: "View packages",
          loading: "Loading map…",
        }
      : {
          heading: "Mbulimi eSIM",
          sub: "Aktiv në",
          countries: "vende",
          from: "Nga",
          packages: "paketa",
          buy: "Shiko paketat",
          loading: "Po ngarkohet harta…",
        };

  return (
    <section className="py-20 overflow-hidden" style={{ background: colors.bg }}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            {labels.heading}
          </h2>
          {!loading && (
            <p className="mt-2 text-lg" style={{ color: colors.text }}>
              {labels.sub}{" "}
              <span className="font-bold" style={{ color: colors.accent }}>
                {totalCovered}
              </span>{" "}
              {labels.countries}
            </p>
          )}
        </div>

        {/* Map container */}
        <div
          ref={containerRef}
          className="relative rounded-2xl overflow-hidden"
          style={{ aspectRatio: "2 / 1", background: colors.ocean, border: `1px solid ${colors.border}` }}
          onMouseLeave={() => setTooltip(null)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm" style={{ color: colors.text }}>
              {labels.loading}
            </div>
          ) : (
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 130, center: [15, 20] }}
              style={{ width: "100%", height: "100%" }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const covered = numericMap.get(String(geo.id));
                    const isSelected = covered && selected?.country_code === covered.country_code;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={
                          covered
                            ? isSelected
                              ? colors.coveredSelected
                              : colors.covered
                            : colors.uncovered
                        }
                        stroke={colors.stroke}
                        strokeWidth={0.5}
                        style={{
                          default: { outline: "none" },
                          hover: {
                            outline: "none",
                            fill: covered ? colors.coveredHover : colors.uncovered,
                            cursor: covered ? "pointer" : "default",
                          },
                          pressed: { outline: "none" },
                        }}
                        onMouseMove={covered ? (e) => handleMouseMove(e, covered) : undefined}
                        onMouseLeave={() => setTooltip(null)}
                        onClick={covered ? () => handleGeoClick(covered) : undefined}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          )}

          {/* Desktop tooltip (hover only) */}
          {tooltip && (
            <div
              className="pointer-events-none absolute z-20 rounded-xl shadow-lg px-4 py-3 text-sm hidden md:block"
              style={{
                left: Math.min(tooltip.x + 12, (containerRef.current?.offsetWidth ?? 300) - 190),
                top: Math.max(tooltip.y - 80, 8),
                minWidth: 170,
                background: colors.card,
                border: `1px solid ${colors.border}`,
                color: isDark ? "#f4f4f5" : "#18181b",
              }}
            >
              <div className="font-semibold flex items-center gap-2">
                <span>{tooltip.data.flag}</span>
                <span>{tooltip.data.name}</span>
              </div>
              <div className="mt-1" style={{ color: colors.text }}>
                {labels.from}{" "}
                <span className="font-bold" style={{ color: colors.accent }}>
                  €{tooltip.data.min_price.toFixed(2)}
                </span>
              </div>
              <div style={{ color: colors.text }}>
                {tooltip.data.package_count} {labels.packages}
              </div>
              <div className="mt-2 text-xs font-medium" style={{ color: colors.accent }}>
                {labels.buy} →
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 text-sm" style={{ color: colors.text }}>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-sm" style={{ background: colors.covered }} />
            {locale === "en" ? "Covered" : "Mbuluar"}
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-sm" style={{ background: colors.uncovered }} />
            {locale === "en" ? "Not available" : "Nuk mbulohet"}
          </div>
        </div>
      </div>

      {/* ── Mobile bottom bar (tap to select, tap button to navigate) ── */}
      {selected && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
          style={{
            background: colors.card,
            borderTop: `1px solid ${colors.border}`,
            boxShadow: "0 -4px 24px rgba(0,0,0,0.18)",
          }}
        >
          <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3">
            {/* Flag + info */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold flex items-center gap-2 text-base truncate" style={{ color: isDark ? "#f4f4f5" : "#18181b" }}>
                <span className="text-xl">{selected.flag}</span>
                <span className="truncate">{selected.name}</span>
              </div>
              <div className="text-sm mt-0.5" style={{ color: colors.text }}>
                {labels.from}{" "}
                <span className="font-bold" style={{ color: colors.accent }}>
                  €{selected.min_price.toFixed(2)}
                </span>
                {" · "}
                {selected.package_count} {labels.packages}
              </div>
            </div>

            {/* Navigate button */}
            <button
              onClick={() => router.push(`/packages/${selected.country_code.toLowerCase()}`)}
              className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white"
              style={{ background: colors.accent }}
            >
              {labels.buy} →
            </button>

            {/* Close */}
            <button
              onClick={() => setSelected(null)}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-lg"
              style={{ color: colors.text }}
              aria-label="Mbyll"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
