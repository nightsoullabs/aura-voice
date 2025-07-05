import React from "react";
import AssistantButton from "@/components/AssistantButton/AssistantButton";
import Image from "next/image";

export default function page() {
  return (
    <div>
      <div className="hidden md:block">
        <main className="flex min-h-screen flex-col justify-center items-center p-24">
          <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
            <div className="text-center">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent mb-4">
                Meet Aura
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Your loving AI companion who cares about you 💕
              </p>
            </div>
          </div>
        </main>
        <div className="absolute bottom-0 right-0 pb-10 pr-10">
          <AssistantButton />
        </div>
      </div>
      <div className="md:hidden">
        <main className="flex min-h-screen flex-col justify-center items-center p-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent mb-4">
              Meet Aura
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Your loving AI companion 💕
            </p>
            <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg mb-8">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                For the best experience with Aura, please use a desktop browser. 
                Mobile support is coming soon! 📱✨
              </p>
            </div>
            <AssistantButton />
          </div>
        </main>
      </div>
    </div>
  );
}