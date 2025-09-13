export default function Footer() {
  const bottomLinks = [
    { text: "Terms and Conditions", url: "/terms-and-conditions" },
    { text: "Privacy Policy", url: "/privacy-policy" },
  ];

  return (
    <footer className="absolute bottom-0  w-full pb-4 justify-center justify-items-center">
      <div className="text-muted-foreground flex flex-col justify-between gap-4 text-sm font-medium md:flex-row md:items-center">
        <ul className="flex gap-4">
          <li>
            <a href="/feedback" className="underline hover:text-blue-700">
              Send us feedback
            </a>
          </li>
          {bottomLinks.map((link, linkIdx) => (
            <li key={linkIdx} className="hover:text-primary underline">
              <a href={link.url}>{link.text}</a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
