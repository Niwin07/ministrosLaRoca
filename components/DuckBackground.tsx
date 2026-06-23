export function DuckBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: -15,
        backgroundImage: "url('/duck-tile.svg')",
        backgroundSize: "190px 190px",
        backgroundRepeat: "repeat",
        opacity: 0.22,
      }}
    />
  );
}
