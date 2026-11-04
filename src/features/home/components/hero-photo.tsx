import HeroPhotoImage from "./hero-photo-image";

interface HeroData {
  fullName: string;
  photoUrl: string;
  imageAlt: string;
}

interface HeroPhotoProps {
  heroData: HeroData;
}

export default function HeroPhoto({ heroData }: HeroPhotoProps) {
  const { fullName, photoUrl, imageAlt } = heroData;

  const nameParts = fullName.split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || fullName;
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
  const initials = `${firstName.charAt(0).toUpperCase()}${lastName ? lastName.charAt(0).toUpperCase() : ""}`;

  return (
    <div className="relative mx-auto w-full max-w-[20rem] sm:max-w-[24rem] lg:max-w-[26rem]">
      {/* Ambient Glow Backdrop from Prototype */}
      <div
        className="pointer-events-none absolute -inset-[14%] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_38%,transparent),transparent_68%)] blur-2xl"
        aria-hidden="true"
      />

      {/* Conic Gradient Ring */}
      <div className="relative aspect-square w-full rounded-full bg-[conic-gradient(from_210deg,var(--primary),color-mix(in_srgb,var(--primary)_35%,transparent),var(--primary))] p-[0.3125rem] shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <div className="bg-background relative h-full w-full overflow-hidden rounded-full">
          {photoUrl ? (
            <HeroPhotoImage photoUrl={photoUrl} imageAlt={imageAlt} />
          ) : (
            <span
              className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_30%,color-mix(in_srgb,var(--primary)_55%,#fff),var(--primary)_55%,#0b1226)] text-6xl font-light text-white select-none sm:text-7xl lg:text-8xl"
              aria-label={imageAlt}
            >
              {initials || "JH"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
