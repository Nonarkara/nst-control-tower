import type { ReactNode } from "react";
import type { LensId } from "../map/presets";
import { CollapsibleSection } from "./CollapsibleSection";
import { sectionDefaultOpen, sectionVisible, type RailSectionKey } from "../lib/railSections";

interface Props {
  sectionKey: RailSectionKey;
  lens: LensId;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

/** A collapsible rail section that exists only in the lenses that need it
 *  (see lib/railSections.ts) and opens by default only where it leads. */
export function RailSection({ sectionKey, lens, title, actions, children }: Props) {
  if (!sectionVisible(sectionKey, lens)) return null;
  return (
    <CollapsibleSection
      storageKey={sectionKey}
      title={title}
      divided
      defaultOpen={sectionDefaultOpen(sectionKey, lens)}
      actions={actions}
    >
      {children}
    </CollapsibleSection>
  );
}
