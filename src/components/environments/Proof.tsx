import { RichText } from '../reader/RichText';

interface ProofProps {
  content: string;
}

export function Proof({ content }: ProofProps) {
  return (
    <div className="env-box env-proof">
      <div className="env-label text-atlas-secondary">Proof</div>
      <div className="text-atlas-text">
        <RichText text={content} />
      </div>
      <div className="qed">∎</div>
      <div className="clear-both"></div>
    </div>
  );
}
