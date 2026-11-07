/**
 * Tras la carga inicial (NaraProvider), las transiciones de sección usan
 * RouteLoadingProvider.start(). Un loading.tsx aquí provocaba parpadeos
 * (p. ej. al escribir en Nueva persona / soft navigations).
 */
export default function ShellLoading() {
  return null;
}
