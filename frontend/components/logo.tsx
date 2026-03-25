import Image from "next/image";

export default function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <>
      <Image
        src="/logo-light.svg"
        alt="Shqiponja eSIM"
        width={size}
        height={size}
        className={`dark:hidden ${className}`}
      />
      <Image
        src="/logo-dark.svg"
        alt="Shqiponja eSIM"
        width={size}
        height={size}
        className={`hidden dark:block ${className}`}
      />
    </>
  );
}
