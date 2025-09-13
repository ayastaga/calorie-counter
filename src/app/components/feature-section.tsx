import {
  BatteryCharging,
  GitPullRequest,
  Layers,
  RadioTower,
  SquareKanban,
  WandSparkles,
} from "lucide-react";

interface Reason {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface Feature43Props {
  heading?: string;
  reasons?: Reason[];
}

const FeatureSection = ({
  heading = "What our app does",
  reasons = [
    {
      title: "Quality",
      description:
        "We provide you with the quality you not only need but deserve; our program uses the latest technologies and algorithsm to not only accurately calculate the number of calories, but also provide suggestions on how to burn them off ",
      icon: <GitPullRequest className="size-6" />,
    },
    {
      title: "Experience",
      description:
        "Behind this project is a team; a team with years of experience in nutrition and personal fitness so you can rest assured that your experience with us will be seamless.",
      icon: <SquareKanban className="size-6" />,
    },
    {
      title: "Support",
      description:
        "We proide you with the support you need; whether it is through the analytics and statistics behind through the app, or our team through our feedback system, which is quickly able to give you the assistance you need.",
      icon: <RadioTower className="size-6" />,
    },
  ],
}: Feature43Props) => {
  return (
    <section className="pb-32">
      <div className="container">
        <div className="mb-8 md:mb-20">
          <h2 className="mb-2 text-center text-3xl font-semibold lg:text-5xl">
            {heading}
          </h2>
        </div>
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason, i) => (
            <div key={i} className="flex flex-col">
              <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-accent">
                {reason.icon}
              </div>
              <h3 className="mb-2 text-xl font-semibold">{reason.title}</h3>
              <p className="text-muted-foreground">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { FeatureSection };
