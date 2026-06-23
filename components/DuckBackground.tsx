export function DuckBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -15 }}>
      {/* Capa trasera: patitos chicos, diagonal negativa */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/duck-tile.svg')",
          backgroundSize: "65px 65px",
          backgroundPosition: "55px 55px",
          backgroundRepeat: "repeat",
          transform: "rotate(-10deg)",
          transformOrigin: "center",
          opacity: 0.10,
        }}
      />
      {/* Capa media: patitos medianos, rectos — ancla del patrón */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/duck-tile.svg')",
          backgroundSize: "100px 100px",
          backgroundPosition: "0 0",
          backgroundRepeat: "repeat",
          opacity: 0.16,
        }}
      />
      {/* Capa delantera: patitos grandes, diagonal positiva */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/duck-tile.svg')",
          backgroundSize: "150px 150px",
          backgroundPosition: "30px 80px",
          backgroundRepeat: "repeat",
          transform: "rotate(7deg)",
          transformOrigin: "center",
          opacity: 0.08,
        }}
      />
    </div>
  );
}
