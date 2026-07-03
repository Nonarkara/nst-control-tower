import { useEffect } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { ExecutiveSummarySection } from "./whitepaper/ExecutiveSummarySection";
import { ProblemStatementSection } from "./whitepaper/ProblemStatementSection";
import { ArchitectureSection } from "./whitepaper/ArchitectureSection";
import { FloodIntelligenceSection } from "./whitepaper/FloodIntelligenceSection";
import { PredictiveIntelligenceSection } from "./whitepaper/PredictiveIntelligenceSection";
import { EarthObservationSection } from "./whitepaper/EarthObservationSection";
import { HowToUseSection } from "./whitepaper/HowToUseSection";
import { LensReferenceSection } from "./whitepaper/LensReferenceSection";
import { CityProfileSection } from "./whitepaper/CityProfileSection";
import { PartnersCreditsSection } from "./whitepaper/PartnersCreditsSection";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Whitepaper — bilingual (Thai + English) platform overview, architecture,
 * data sources, and usage guide for NST-CTM-01.
 * Triggered from the TopBar "WP" button.
 *
 * Body content lives in per-section components under ./whitepaper/ — this
 * file is purely the modal shell + section order.
 */
export function Whitepaper({ open, onClose }: Props) {
  const containerRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="manual-backdrop" onClick={onClose}>
      <div
        ref={containerRef}
        className="manual whitepaper"
        role="dialog"
        aria-modal="true"
        aria-label="Nakhon Si Thammarat City Control Tower — Whitepaper"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="manual-head">
          <div className="col">
            <span className="eyebrow mono">Whitepaper · NST-CTM-01 · v0.1</span>
            <h2 className="manual-title">
              Nakhon Si Thammarat City Control Tower
              <span className="whitepaper-thai serif"> · ศูนย์ควบคุมเมืองนครศรีธรรมราช</span>
            </h2>
            <span className="caption" style={{ color: "var(--text-2)" }}>
              Platform Overview &amp; Research Paper · ภาพรวมแพลตฟอร์มและงานวิจัย
            </span>
          </div>
          <button onClick={onClose} className="mono manual-close" aria-label="Close whitepaper">
            [ESC] CLOSE
          </button>
        </header>

        <div className="manual-body">
          <ExecutiveSummarySection />
          <ProblemStatementSection />
          <ArchitectureSection />
          <FloodIntelligenceSection />
          <PredictiveIntelligenceSection />
          <EarthObservationSection />
          <HowToUseSection />
          <LensReferenceSection />
          <CityProfileSection />
          <PartnersCreditsSection />

          <footer className="manual-foot caption">
            NST-CTM-01 v0.1 · เทศบาลนครนครศรีธรรมราช · Nakhon Si Thammarat City Municipality
            <span className="serif"> · สำหรับเจ้าหน้าที่เทศบาล</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
