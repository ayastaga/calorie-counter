import { Wifi, Zap } from "lucide-react";
import { ArrowUpRight, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Hero115Props {
  icon?: React.ReactNode;
  heading: string;
  description: string;
  button: {
    text: string;
    icon?: React.ReactNode;
    url: string;
  };
  trustText?: string;
  imageSrc?: string;
  imageAlt?: string;
}

export function HeroSection(
  {
  icon = <UtensilsCrossed className="size-6" />,
  heading = "Track your calories; it's now simpler than ever",
  description = "Just take a photo, and let our app do the work for you.",
  button = {
    text: "Get healthy",
    icon: <ArrowUpRight className="ml-2 size-4" />,
    url: "/auth/login?returnTo=/dashboard",
  },
  trustText = "Trusted by 25.000+ Businesses Worldwide",
  imageSrc = "https://i.pinimg.com/736x/a5/90/3c/a5903ca92975289f5c043f2a1538bdfd.jpg",
  imageAlt = "placeholder",}
) {
  return (
    <section className="overflow-hidden pt-16 pb-32">
      <div className="container">
        <div className="flex flex-col gap-5">
          <div className="relative flex flex-col gap-5">
            <div
              style={{
                transform: "translate(-50%, -50%)",
              }}
              className="absolute top-1/2 left-1/2 -z-10 mx-auto size-[800px] rounded-full border [mask-image:linear-gradient(to_top,transparent,transparent,white,white,white,transparent,transparent)] p-16 md:size-[1300px] md:p-32"
            >
              <div className="size-full rounded-full border p-16 md:p-32">
                <div className="size-full rounded-full border"></div>
              </div>
            </div>
            <span className="mx-auto flex size-16 items-center justify-center rounded-full border md:size-20">
              {icon}
            </span>
            <h2 className="mx-auto max-w-5xl text-center text-3xl font-medium text-balance md:text-6xl">
              {heading}
            </h2>
            <p className="mx-auto max-w-3xl text-center text-muted-foreground md:text-lg">
              {description}
            </p>
            <div className="flex flex-col items-center justify-center gap-3 pt-3 pb-12">
              <Button size="lg" asChild>
                <a href={button.url}>
                  {button.text} {button.icon}
                </a>
              </Button>
              {trustText && (
                <div className="text-xs text-muted-foreground">{trustText}</div>
              )}
            </div>
          </div>
          <img
            src={imageSrc}
            alt={imageAlt}
            className="mx-auto h-full max-h-[524px] w-full max-w-5xl rounded-2xl object-cover"
          />
        </div>
      </div>
    </section>
  );
}