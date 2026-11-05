import type { ReactElement } from "react";
import { CopyableCommand } from "../ui/CopyableCommand";
import { IntegrationsPane } from "./IntegrationsPane";
interface Props {
  title: string;
  isPaid: boolean;
  onUpgrade: () => void;
}
export function CliPane({ title }: Props): ReactElement {
  return (
    <IntegrationsPane
      title={title}
      description="Access local notes and transcripts through the desktop app's local CLI bridge."
    >
      <p className="text-sm text-muted-foreground">
        Use local mode for this personal build. No cloud login or subscription is used.
      </p>
      <CopyableCommand command="openwhispr --local notes list" />
    </IntegrationsPane>
  );
}
