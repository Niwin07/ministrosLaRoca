/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: {
    // Caché del router en el navegador: volver a una pantalla visitada hace
    // menos de 30 s es instantáneo (no espera al servidor). Las acciones que
    // modifican datos (revalidatePath) la invalidan, así que lo propio se ve
    // al momento; lo que cambie otra persona aparece en la próxima visita.
    staleTimes: { dynamic: 30, static: 180 },
    // Importa sólo lo que se usa de estas librerías (bundles más chicos).
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
