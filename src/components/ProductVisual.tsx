import { PrintedObject } from "@/components/PrintedObject";
import { ShapeProfile } from "@/lib/types";

export function ProductVisual({
  imageUrl,
  profile,
  color,
  className = "",
}: {
  imageUrl?: string;
  profile: ShapeProfile;
  color: string;
  className?: string;
}) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt="" className={`object-cover ${className}`} />;
  }
  return <PrintedObject profile={profile} color={color} className={className} />;
}
