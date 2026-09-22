// Corre antes da hidratação para aplicar o tema guardado (ou a preferência do
// sistema) sem "flash" de tema errado. Tem de ser um script inline síncrono.
const THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("naloa-theme");
    var theme = stored === "dark" || stored === "light"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
