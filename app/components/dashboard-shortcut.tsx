import Link from "next/link";
import Icons from "./icons";

export default function DashboardShortcut() {
  return (
    <Link
      className="dashboard-shortcut"
      href="/"
      aria-label="بازگشت به داشبورد"
      title="بازگشت به داشبورد"
    >
      <Icons name="dashboard" />
    </Link>
  );
}
