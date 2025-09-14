import { env } from "@/env";

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Calorie Counter",
  description: "Upload any image and count the number of calories present!",
  url:
    env.NEXT_PUBLIC_SITE_URL ||
    (env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://sylphia-calorie-counter.vercel.app/"),
  links: {
    github: "https://github.com/ayastaga",
    docs: "https://diceui.com/docs/components/",
  },
};
