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

  return (
    <div className="relative flex flex-1 justify-center lg:justify-end">
      <div className="from-primary to-primary-700 ring-primary/30 relative flex h-64 w-64 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br shadow-[0_0_50px_-10px_var(--primary)] ring-8 md:h-80 md:w-80">
        {photoUrl ? (
          <HeroPhotoImage photoUrl={photoUrl} imageAlt={imageAlt} />
        ) : (
          <span className="font-display text-primary-foreground/90 text-6xl font-bold md:text-7xl">
            {firstName.charAt(0).toUpperCase()}
            {lastName ? lastName.charAt(0).toUpperCase() : ""}
          </span>
        )}
      </div>
    </div>
  );
}
