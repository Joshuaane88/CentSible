import { Coin } from "./coin";

export default function Loader() {
  return (
    <div className="loader" role="status" aria-live="polite">
      <div className="loader-stage">
        <Coin size={112} variant="flip" />
        <div className="coin-shadow" />
      </div>
      <p>Counting your cents...</p>
    </div>
  );
}
