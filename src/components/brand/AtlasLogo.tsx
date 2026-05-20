import Image from "next/image";

export function AtlasLogo({
  size = 40,
  withWordmark = false,
}: {
  size?: number;
  withWordmark?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/icons/logo-mark.png"
        alt="Atlas Training"
        width={size}
        height={size}
        priority
        className="object-contain"
        style={{ width: size, height: size }}
      />
      {withWordmark && (
        <div className="leading-tight">
          <div className="text-xl font-bold tracking-wide">ATLAS</div>
          <div className="text-[10px] tracking-[0.35em] text-atlas-muted">
            TRAINING
          </div>
        </div>
      )}
    </div>
  );
}
