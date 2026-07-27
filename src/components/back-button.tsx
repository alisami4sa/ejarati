import Link from "next/link";

export function BackButton({
  href,
  label = "رجوع",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link href={href} className="back-btn" aria-label={label}>
      <span className="back-btn-arrow" aria-hidden="true">
        →
      </span>
      <span>{label}</span>
    </Link>
  );
}
