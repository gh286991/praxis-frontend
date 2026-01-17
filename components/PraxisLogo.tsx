/**
 * PraxisLogo - Shared ASCII art logo component
 * Used across landing page, login page, and other promotional content
 */

interface PraxisLogoProps {
  className?: string;
  textColor?: string;
}

const ASCII_LOGO = `
██████╗ ██████╗  █████╗ ██╗  ██╗██╗███████╗
██╔══██╗██╔══██╗██╔══██╗╚██╗██╔╝██║██╔════╝
██████╔╝██████╔╝███████║ ╚███╔╝ ██║███████╗
██╔═══╝ ██╔══██╗██╔══██║ ██╔██╗ ██║╚════██║
██║     ██║  ██║██║  ██║██╔╝ ██╗██║███████║
╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚══════╝
`;

export function PraxisLogo({ className = "text-cyan-400", textColor }: PraxisLogoProps) {
  return (
    <pre className={`leading-tight select-none font-bold ${textColor || className}`}>
      {ASCII_LOGO}
    </pre>
  );
}
