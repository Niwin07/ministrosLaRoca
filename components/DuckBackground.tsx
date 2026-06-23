export function DuckBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: -15,
        backgroundImage: "url('/duck-tile.svg'), url('/duck-tile.svg')",
        backgroundSize: "140px 140px, 140px 140px",
        backgroundPosition: "0 0, 70px 70px",
        backgroundRepeat: "repeat",
        opacity: 0.14,
      }}
    />
  );
}
