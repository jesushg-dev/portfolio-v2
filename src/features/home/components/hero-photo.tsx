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
    <div className="relative mx-auto aspect-square w-[min(23.75rem,82%)] before:pointer-events-none before:absolute before:-inset-[14%] before:rounded-full before:bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_38%,transparent),transparent_68%)] before:blur-2xl">
      {/* Conic Gradient Ring */}
      <div className="hero-portrait-ring absolute inset-0 rounded-full bg-[conic-gradient(from_210deg,var(--primary),color-mix(in_srgb,var(--brand2)_35%,transparent),var(--primary))] p-[0.3125rem] shadow-[0_1.875rem_5rem_rgba(0,0,0,0.35)]">
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
