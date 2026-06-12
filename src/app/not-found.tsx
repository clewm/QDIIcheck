import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">页面不存在</p>
      <Link
        href="/"
        className="mt-6 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
      >
        返回首页
      </Link>
    </div>
  );
}
