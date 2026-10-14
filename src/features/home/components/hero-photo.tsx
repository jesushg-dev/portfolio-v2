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
      {/* Spinning dashed orbital ring matching hero design */}
      <span
        className="a-spin border-primary/30 pointer-events-none absolute -inset-5 rounded-full border border-dashed select-none sm:-inset-6"
        aria-hidden="true"
      />

      {/* Main Avatar Container */}
      <div className="bg-primary/20 relative aspect-square rounded-full p-2 shadow-[0_24px_70px_-12px_rgba(30,64,175,.35)] sm:p-2.5">
        <div className="bg-primary/10 relative h-full w-full overflow-hidden rounded-full">
          {photoUrl ? (
            <HeroPhotoImage photoUrl={photoUrl} imageAlt={imageAlt} />
          ) : (
            <span className="font-display text-primary flex h-full w-full items-center justify-center text-6xl font-bold sm:text-7xl">
              {initials}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
