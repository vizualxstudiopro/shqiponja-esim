import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
  variant?: "full" | "icon";
  priority?: boolean;
}

export default function Logo({ size = 40, className = "", variant = "full", priority = false }: LogoProps) {
  const lightSrc = variant === "icon" ? "/navbar-icon-light.png" : "/logo-light.svg";
  const darkSrc = variant === "icon" ? "/navbar-icon-dark.png" : "/logo-dark.svg";

  return (
    <>
      <Image
        src={lightSrc}
        alt="Shqiponja eSIM"
        width={size}
        height={size}
        priority={priority}
        className={`dark:hidden ${className}`}
      />
      <Image
        src={darkSrc}
        alt="Shqiponja eSIM"
        width={size}
        height={size}
        priority={priority}
        className={`hidden dark:block ${className}`}
      />
    </>
  );
}
