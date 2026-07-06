"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { fetchAgents, createReview } from "@/lib/api";
import { STATIC_AGENTS } from "@/lib/agents-static";
import type { Agent } from "@/lib/types";
import { ParticleBackground } from "@/components/ParticleBackground";
import { UploadZone } from "@/components/UploadZone";
import { ReviewHistory } from "@/components/ReviewHistory";
import { ApiStatusBanner } from "@/components/ApiStatusBanner";

export default function HomePage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAgents()
      .then((data) => setAgents(data.agents))
      .catch(() => setAgents(STATIC_AGENTS));
  }, []);

  const handleSubmit = async (title: string, content: string) => {
    setLoading(true);
    try {
      const { review_id } = await createReview(title, content);
      router.push(`/review/${review_id}?title=${encodeURIComponent(title)}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "启动评审失败";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen">
      {/* Hero background */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/hero_background.png"
          alt=""
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-council-bg/60 via-council-bg/80 to-council-bg" />
      </div>

      <ParticleBackground />

      <div className="relative z-10 py-20 min-h-screen flex flex-col justify-center">
        <ApiStatusBanner />
        <UploadZone agents={agents.length ? agents : STATIC_AGENTS} onSubmit={handleSubmit} loading={loading} />
        <ReviewHistory />
      </div>

      <footer className="relative z-10 pb-8 text-center text-[10px] text-white/20 tracking-widest">
        VIRTUAL LEARNING COUNCIL · V1.0
      </footer>
    </main>
  );
}
