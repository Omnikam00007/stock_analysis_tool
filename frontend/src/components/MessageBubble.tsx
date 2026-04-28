/* ─── MessageBubble ───────────────────────────────────────
   Renders a single chat message (user or assistant).
   ─────────────────────────────────────────────────────── */

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  return (
    <div className="message-wrapper">
      <div className={`message-sender ${role === "user" ? "user-sender" : ""}`}>
        <span className="dot" />
        {role === "user" ? "You" : "StockPilot"}
      </div>
      <div className={`message-bubble ${role}`}>
        {content.split("\n").map((line, i) => (
          <p key={i}>{line || "\u00A0"}</p>
        ))}
      </div>
    </div>
  );
}
