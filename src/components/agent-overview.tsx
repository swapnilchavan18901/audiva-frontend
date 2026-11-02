import Link from "next/link";
import { ArrowUpRight, AudioLines, BookOpen, Mic, Phone, Users } from "lucide-react";
import { Wave } from "./ui";

export function AgentOverview({ clinic, count }: { clinic: boolean; count: number }) {
  const shortcuts = clinic
    ? [
        { href: "/patients", icon: Users, title: "Patient register", text: "Review appointments and completed visits." },
        { href: "/clinic-phone", icon: Phone, title: "Phone calls", text: "View phone settings and call history." },
        { href: "/clinic-preview", icon: Mic, title: "Try a conversation", text: "Hear your assistant in action." },
      ]
    : [
        { href: "/templates", icon: BookOpen, title: "Find your starting point", text: "Explore templates for your business." },
        { href: "/integration", icon: AudioLines, title: "Connect your website", text: "Bring your agents to your customers." },
        { href: "/voice-preview", icon: Mic, title: "Try a conversation", text: "Hear your agent in action." },
      ];
  return (
    <section className="agent-overview" aria-label="Workspace overview">
      <div className="overview-banner">
        <div className="overview-copy">
          <span className="overview-kicker"><AudioLines size={14} /> A LITTLE LESS BUSYWORK</span>
          <h2>{clinic ? "More care. Less on hold." : "A voice for your business."}</h2>
          <p>{clinic
            ? "Let your assistants handle the conversation, so your team can focus on the people behind it."
            : "Turn your business knowledge into helpful conversations. Set up an agent, give it context, and make it yours."}</p>
          <Link href={clinic ? "/clinic-preview" : "/voice-preview"}>
            Open voice preview <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="overview-visual" aria-hidden="true">
          <div className="signal-orbit"><AudioLines size={28} /></div>
          <Wave />
          <span>Built for a more human conversation</span>
        </div>
        <div className="overview-count"><span>{String(count).padStart(2, "0")}</span> {clinic ? (count === 1 ? "assistant" : "assistants") : (count === 1 ? "agent" : "agents")} in your workspace</div>
      </div>
      <div className="workflow-shortcuts">
        {shortcuts.map(({ href, icon: Icon, title, text }) => (
          <Link href={href} key={href} className="workflow-shortcut">
            <span className="shortcut-icon"><Icon size={19} /></span>
            <div><h3>{title}</h3><p>{text}</p></div>
            <ArrowUpRight size={16} className="shortcut-arrow" />
          </Link>
        ))}
      </div>
    </section>
  );
}
