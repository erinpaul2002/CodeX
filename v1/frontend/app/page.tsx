'use client';

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-3xl font-bold">Welcome to CodeX</h1>
      <p className="text-lg">Your online coding editor with terminal support.</p>
      <div className="flex flex-col gap-4">
        <a href="/editor" className="inline-block px-4 py-2 bg-blue-500 text-white rounded-md">
          Get Started
        </a>
        <a href="/docs" className="inline-block px-4 py-2 border border-gray-300 rounded-md">
          Read the Docs
        </a>
      </div>
    </div>
  );
}
