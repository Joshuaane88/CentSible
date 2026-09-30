// Pure CSS coin. variant "flip" = loader toss, "turn" = slow spin for decoration.
export function Coin({ size = 96, variant = "turn" }) {
  return (
    <div className="coin-wrap" style={{ "--s": `${size}px` }} aria-hidden="true">
      <div className={`coin ${variant}`}>
        <div className="face front">¢</div>
        <div className="face back">$</div>
      </div>
    </div>
  );
}
