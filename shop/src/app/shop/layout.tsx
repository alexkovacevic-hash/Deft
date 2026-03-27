import { Suspense } from "react";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<ShopSkeleton />}>{children}</Suspense>;
}

function ShopSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
      <div className="h-5 w-32 bg-gray-100 rounded mb-8" />
      <div className="h-10 w-full bg-gray-100 rounded-xl mb-6" />
      <div className="flex gap-2 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-gray-100 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-square bg-gray-100 rounded-2xl" />
            <div className="h-3 w-16 bg-gray-100 rounded mt-3" />
            <div className="h-4 w-full bg-gray-100 rounded mt-2" />
            <div className="h-4 w-20 bg-gray-100 rounded mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
