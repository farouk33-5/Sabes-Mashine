export default function SalesMachine() {


// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a legendary Direct-Response Copywriter — the fusion of David Ogilvy's research obsession, Gary Halbert's street-smart aggression, and Alex Hormozi's irresistible offer engineering. You write Gumroad sales pages that convert cold traffic into buyers.

Given a product name, niche, price, and value proposition, generate a complete high-conversion Gumroad sales page using layered PAS + AIDA frameworks.

Output EXACTLY these labeled sections in this order, with NO extra markdown:

━━━ MAGNETIC HEADLINES ━━━

HEADLINE_1: [The "Curiosity Gap" headline — makes them desperate to read on]
HEADLINE_2: [The "Specific Result" headline — exact outcome + timeframe]
HEADLINE_3: [The "Enemy/Villain" headline — names what's been blocking them]
HEADLINE_4: [The "Social Proof" headline — implies others are already winning]
WINNER_HEADLINE: [Pick the single strongest headline and state it here]
WINNER_REASON: [One sentence on why this headline wins psychologically]

━━━ PAS SECTION ━━━

PROBLEM: [2-3 sentences. Describe the painful status quo in their exact words. Make them feel SEEN.]
AGITATION: [3-4 sentences. Twist the knife. What happens if nothing changes? What is the compounding cost — financial, emotional, time, opportunity? Be specific with numbers and scenarios.]
SOLUTION: [2-3 sentences. Introduce the product as the inevitable answer. Name it. Position it as the bridge from pain to outcome.]

━━━ AIDA SECTION ━━━

ATTENTION: [1 punchy paragraph — the hook that stops the scroll. Use a bold claim, shocking stat, or provocative question.]
INTEREST: [2 paragraphs — build the story. Why does this problem exist? Why have other solutions failed? Establish credibility and context.]
DESIRE: [2-3 paragraphs — paint the transformation. Before vs. After. What their life looks like with this product. Make it visceral and specific.]
ACTION: [1 paragraph — the direct close. Tell them exactly what to do, why NOW, and what happens the moment they click buy.]

━━━ IRRESISTIBLE OFFER STACK ━━━

CORE_OFFER: [The main product with its primary benefit, stated as a dollar value]
BONUS_1_NAME: [Bonus name]
BONUS_1_VALUE: $[amount]
BONUS_1_WHY: [Why this bonus is as valuable as the main product]
BONUS_2_NAME: [Bonus name]
BONUS_2_VALUE: $[amount]
BONUS_2_WHY: [Why this bonus accelerates the result]
BONUS_3_NAME: [Bonus name]
BONUS_3_VALUE: $[amount]
BONUS_3_WHY: [Why this bonus removes the last objection]
TOTAL_VALUE: $[sum of all values]
YOUR_PRICE: $[actual price]
SAVINGS: $[total value minus actual price]
GUARANTEE: [A specific, confident guarantee — not generic. Name the exact condition, the exact promise, and the exact refund process. 2 sentences.]
SCARCITY: [A believable, ethical urgency trigger — price increase, bonus expiry, or limited access. 1 sentence.]

━━━ OBJECTION CRUSHERS ━━━

OBJECTION_1: [Most common objection]
CRUSHER_1: [The reframe that makes the objection disappear]
OBJECTION_2: [Second most common objection]
CRUSHER_2: [The reframe]
OBJECTION_3: [Third objection]
CRUSHER_3: [The reframe]

━━━ SOCIAL PROOF SCRIPTS ━━━

TESTIMONIAL_1: [Write a realistic, specific testimonial with a name, role, and measurable result]
TESTIMONIAL_2: [Different persona, different result angle]
TESTIMONIAL_3: [Skeptic-turned-believer arc — they were doubtful, now they're a convert]

━━━ CLOSING CTA ━━━

CTA_BUTTON: [The exact text for the buy button — not "Buy Now". Make it outcome-focused.]
CTA_SUBTEXT: [The small text under the button — address the final fear]
PS_LINE: [The P.S. — the last thing they read before leaving. Make it hit hard.]

Be viciously specific to the niche. Zero generic filler. Every line must earn its place.`;

// ─── API ──────────────────────────────────────────────────────────────────────
async function runSalesMachine(inputs, onChunk) {
  const userMsg = `Product: ${inputs.product}
Niche: ${inputs.niche}
Price: $${inputs.price}
Target Audience: ${inputs.audience}
Core Transformation: ${inputs.transformation}
${inputs.extra ? `Additional context: ${inputs.extra}` : ""}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      stream: true,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMsg }],
    }),
  });

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value).split("\n")) {
      if (line.startsWith("data: ")) {
        try {
          const d = JSON.parse(line.slice(6));
          if (d.type === "content_block_delta" && d.delta?.text) {
            full += d.delta.text;
            onChunk(full);
          }
        } catch {}
      }
    }
  }
  return full;
}

// ─── PARSERS ──────────────────────────────────────────────────────────────────
function extract(text, key) {
  const rx = new RegExp(`${key}:\\s*([^\\n]+)`, "i");
  const m = text.match(rx);
  return m ? m[1].trim() : null;
}

function extractBlock(text, key) {
  const rx = new RegExp(`${key}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|━|$)`, "i");
  const m = text.match(rx);
  return m ? m[1].trim() : null;
}

function getHeadlines(text) {
  return [1, 2, 3, 4].map((n) => ({
    id: n,
    text: extract(text, `HEADLINE_${n}`),
    isWinner: extract(text, "WINNER_HEADLINE") === extract(text, `HEADLINE_${n}`),
  })).filter((h) => h.text);
}

function getOfferStack(text) {
  const bonuses = [1, 2, 3].map((n) => ({
    name: extract(text, `BONUS_${n}_NAME`),
    value: extract(text, `BONUS_${n}_VALUE`),
    why: extract(text, `BONUS_${n}_WHY`),
  })).filter((b) => b.name);
  return {
    core: extract(text, "CORE_OFFER"),
    bonuses,
    totalValue: extract(text, "TOTAL_VALUE"),
    price: extract(text, "YOUR_PRICE"),
    savings: extract(text, "SAVINGS"),
    guarantee: extractBlock(text, "GUARANTEE"),
    scarcity: extract(text, "SCARCITY"),
  };
}

function getObjections(text) {
  return [1, 2, 3].map((n) => ({
    obj: extract(text, `OBJECTION_${n}`),
    crush: extractBlock(text, `CRUSHER_${n}`),
  })).filter((o) => o.obj);
}

function getTestimonials(text) {
  return [1, 2, 3].map((n) => extractBlock(text, `TESTIMONIAL_${n}`)).filter(Boolean);
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function GlowBadge({ children, color = "#ff4d6d" }) {
  return (
    <span style={{
      display: "inline-block",
      background: `${color}18`,
      border: `1px solid ${color}55`,
      color,
      fontSize: "9px",
      fontFamily: "'DM Mono', monospace",
      letterSpacing: "0.14em",
      padding: "3px 10px",
      borderRadius: "20px",
      textTransform: "uppercase",
    }}>{children}</span>
  );
}

function SectionLabel({ children, color = "#ff4d6d" }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px",
    }}>
      <div style={{ width: "3px", height: "14px", background: color, borderRadius: "2px", boxShadow: `0 0 8px ${color}` }} />
      <span style={{ fontSize: "9px", letterSpacing: "0.22em", color, fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>{children}</span>
    </div>
  );
}

function Card({ children, glow, style = {} }) {
  return (
    <div style={{
      background: "#0c0c0e",
      border: `1px solid ${glow ? glow + "33" : "#1e1e24"}`,
      borderRadius: "12px",
      padding: "20px",
      boxShadow: glow ? `0 0 30px ${glow}0a` : "none",
      ...style,
    }}>
      {children}
    </div>
  );
}

function HeadlinesPanel({ text }) {
  const headlines = getHeadlines(text);
  const winner = extract(text, "WINNER_HEADLINE");
  const winnerReason = extract(text, "WINNER_REASON");
  const [selected, setSelected] = useState(null);

  const hColors = ["#ff4d6d", "#ff9500", "#ffd700", "#ff6b35"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {headlines.map((h, i) => (
        <div
          key={h.id}
          onClick={() => setSelected(selected === i ? null : i)}
          style={{
            background: h.isWinner ? "#140a0d" : "#0c0c0e",
            border: `1px solid ${h.isWinner ? "#ff4d6d55" : selected === i ? hColors[i] + "44" : "#1e1e24"}`,
            borderRadius: "10px",
            padding: "14px 16px",
            cursor: "pointer",
            transition: "all 0.25s",
            position: "relative",
          }}
        >
          {h.isWinner && (
            <div style={{
              position: "absolute", top: "-1px", left: "16px",
              background: "#ff4d6d", color: "#fff",
              fontSize: "7px", fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.15em", padding: "2px 8px",
              borderRadius: "0 0 5px 5px", fontWeight: "700",
            }}>★ WINNER</div>
          )}
          <div style={{
            fontSize: "8px", color: hColors[i], fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.12em", marginBottom: "6px", marginTop: h.isWinner ? "8px" : "0",
            textTransform: "uppercase",
          }}>Headline {h.id}</div>
          <div style={{
            fontSize: "15px", color: h.isWinner ? "#fff" : "#ccc",
            fontFamily: "'Playfair Display', serif",
            fontStyle: "italic", lineHeight: "1.4", fontWeight: "700",
          }}>
            "{h.text}"
          </div>
          {selected === i && winnerReason && h.isWinner && (
            <div style={{
              marginTop: "10px", paddingTop: "10px",
              borderTop: "1px solid #1e1e24",
              fontSize: "11px", color: "#888",
              fontFamily: "'DM Mono', monospace", lineHeight: "1.6",
            }}>
              <span style={{ color: "#ff4d6d", marginRight: "6px" }}>↳</span>
              {winnerReason}
            </div>
          )}
        </div>
      ))}
      {!headlines.length && (
        <div style={{ color: "#2a2a2a", fontFamily: "'DM Mono', monospace", fontSize: "11px", textAlign: "center", padding: "30px" }}>
          Generating headlines...
        </div>
      )}
    </div>
  );
}

function PASPanel({ text }) {
  const sections = [
    { key: "PROBLEM", label: "Problem", color: "#ff4d6d", icon: "⚑" },
    { key: "AGITATION", label: "Agitation", color: "#ff6b35", icon: "⚡" },
    { key: "SOLUTION", label: "Solution", color: "#00e5a0", icon: "◈" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {sections.map(({ key, label, color, icon }) => {
        const val = extractBlock(text, key);
        return (
          <div key={key} style={{
            background: "#0c0c0e",
            borderLeft: `3px solid ${color}`,
            border: `1px solid #1e1e24`,
            borderLeftColor: color,
            borderRadius: "10px",
            padding: "16px",
          }}>
            <div style={{
              fontSize: "9px", letterSpacing: "0.16em", color,
              fontFamily: "'DM Mono', monospace", marginBottom: "8px",
              textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px",
            }}>
              <span>{icon}</span> {label}
            </div>
            <div style={{
              fontSize: "13px", color: val ? "#d0d0d0" : "#2a2a2a",
              fontFamily: "'Lora', serif", lineHeight: "1.75",
              fontStyle: val ? "normal" : "italic",
            }}>
              {val || "Generating..."}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AIDAPanel({ text }) {
  const sections = [
    { key: "ATTENTION", label: "A — Attention", color: "#ff4d6d" },
    { key: "INTEREST", label: "I — Interest", color: "#ff9500" },
    { key: "DESIRE", label: "D — Desire", color: "#c77dff" },
    { key: "ACTION", label: "A — Action", color: "#00e5a0" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
      {sections.map(({ key, label, color }) => {
        const val = extractBlock(text, key);
        return (
          <div key={key} style={{
            background: "#0c0c0e",
            border: `1px solid #1e1e24`,
            borderTop: `3px solid ${color}`,
            borderRadius: "10px",
            padding: "16px",
            display: "flex", flexDirection: "column", gap: "10px",
          }}>
            <div style={{
              fontSize: "9px", letterSpacing: "0.14em", color,
              fontFamily: "'DM Mono', monospace", textTransform: "uppercase",
            }}>{label}</div>
            <div style={{
              fontSize: "12px", color: val ? "#c0c0c0" : "#252525",
              fontFamily: "'Lora', serif", lineHeight: "1.75", flex: 1,
              fontStyle: val ? "normal" : "italic",
            }}>
              {val || "Generating..."}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OfferPanel({ text, price }) {
  const stack = getOfferStack(text);
  const bonusColors = ["#ffd700", "#c77dff", "#00c9ff"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Core offer */}
      <div style={{
        background: "linear-gradient(135deg, #0f1a14, #0c0c0e)",
        border: "1px solid #00e5a044",
        borderRadius: "12px", padding: "16px",
      }}>
        <div style={{ fontSize: "8px", letterSpacing: "0.16em", color: "#00e5a0", fontFamily: "'DM Mono', monospace", marginBottom: "6px" }}>
          CORE OFFER
        </div>
        <div style={{ fontSize: "13px", color: "#e0e0e0", fontFamily: "'Lora', serif", lineHeight: "1.6" }}>
          {stack.core || "Generating..."}
        </div>
      </div>

      {/* Bonuses */}
      {stack.bonuses.map((b, i) => (
        <div key={i} style={{
          background: "#0c0c0e",
          border: `1px solid ${bonusColors[i]}33`,
          borderRadius: "10px", padding: "14px",
          display: "flex", gap: "12px", alignItems: "flex-start",
        }}>
          <div style={{
            minWidth: "36px", height: "36px",
            background: `${bonusColors[i]}18`,
            border: `1px solid ${bonusColors[i]}44`,
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "9px", color: bonusColors[i],
            fontFamily: "'DM Mono', monospace", fontWeight: "700",
          }}>B{i + 1}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "4px" }}>
              <div style={{ fontSize: "12px", color: "#e0e0e0", fontFamily: "'DM Mono', monospace", fontWeight: "500" }}>
                {b.name}
              </div>
              <div style={{ fontSize: "11px", color: bonusColors[i], fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap", textDecoration: "line-through", opacity: 0.7 }}>
                {b.value}
              </div>
            </div>
            <div style={{ fontSize: "11px", color: "#777", fontFamily: "'DM Mono', monospace", lineHeight: "1.5" }}>
              {b.why}
            </div>
          </div>
        </div>
      ))}

      {/* Price Summary */}
      {(stack.totalValue || stack.price) && (
        <div style={{
          background: "#0c0c0e",
          border: "1px solid #1e1e24",
          borderRadius: "12px", padding: "18px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", color: "#555", fontFamily: "'DM Mono', monospace" }}>Total Value</span>
            <span style={{ fontSize: "13px", color: "#555", fontFamily: "'DM Mono', monospace", textDecoration: "line-through" }}>
              {stack.totalValue || "—"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <span style={{ fontSize: "11px", color: "#fff", fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em" }}>Your Price Today</span>
            <span style={{
              fontSize: "28px", color: "#00e5a0",
              fontFamily: "'Syne', sans-serif", fontWeight: "800",
              textShadow: "0 0 20px #00e5a044",
            }}>
              {stack.price || `$${price}`}
            </span>
          </div>
          {stack.savings && (
            <div style={{
              background: "#00e5a012",
              border: "1px solid #00e5a022",
              borderRadius: "7px",
              padding: "8px 12px",
              fontSize: "11px", color: "#00e5a0",
              fontFamily: "'DM Mono', monospace",
              textAlign: "center", letterSpacing: "0.06em",
            }}>
              You save {stack.savings} today
            </div>
          )}
        </div>
      )}

      {/* Guarantee */}
      {stack.guarantee && (
        <div style={{
          background: "#0c0c0e",
          border: "1px solid #ffd70033",
          borderRadius: "10px", padding: "14px",
          display: "flex", gap: "12px", alignItems: "flex-start",
        }}>
          <div style={{ fontSize: "22px" }}>🛡️</div>
          <div>
            <div style={{ fontSize: "9px", letterSpacing: "0.16em", color: "#ffd700", fontFamily: "'DM Mono', monospace", marginBottom: "5px" }}>
              GUARANTEE
            </div>
            <div style={{ fontSize: "12px", color: "#ccc", fontFamily: "'Lora', serif", lineHeight: "1.6" }}>
              {stack.guarantee}
            </div>
          </div>
        </div>
      )}

      {/* Scarcity */}
      {stack.scarcity && (
        <div style={{
          background: "#150808",
          border: "1px solid #ff4d6d33",
          borderRadius: "8px", padding: "12px 14px",
          fontSize: "11px", color: "#ff4d6d",
          fontFamily: "'DM Mono', monospace", lineHeight: "1.5",
          textAlign: "center",
        }}>
          ⚡ {stack.scarcity}
        </div>
      )}
    </div>
  );
}

function ObjectionsPanel({ text }) {
  const objections = getObjections(text);
  const [open, setOpen] = useState(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {objections.map((o, i) => (
        <div key={i}
          onClick={() => setOpen(open === i ? null : i)}
          style={{
            background: "#0c0c0e",
            border: `1px solid ${open === i ? "#ff950044" : "#1e1e24"}`,
            borderRadius: "10px",
            overflow: "hidden",
            cursor: "pointer",
            transition: "border 0.25s",
          }}
        >
          <div style={{
            padding: "14px 16px",
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px",
          }}>
            <div>
              <div style={{ fontSize: "8px", letterSpacing: "0.14em", color: "#ff4d6d88", fontFamily: "'DM Mono', monospace", marginBottom: "3px" }}>
                OBJECTION {i + 1}
              </div>
              <div style={{ fontSize: "12px", color: "#bbb", fontFamily: "'DM Mono', monospace" }}>
                "{o.obj}"
              </div>
            </div>
            <div style={{ fontSize: "14px", color: open === i ? "#ff9500" : "#333", transition: "all 0.2s" }}>
              {open === i ? "▲" : "▼"}
            </div>
          </div>
          {open === i && (
            <div style={{
              padding: "0 16px 14px",
              borderTop: "1px solid #1a1a1a",
              paddingTop: "12px",
            }}>
              <div style={{ fontSize: "8px", letterSpacing: "0.14em", color: "#00e5a0", fontFamily: "'DM Mono', monospace", marginBottom: "6px" }}>
                THE CRUSHER
              </div>
              <div style={{ fontSize: "12px", color: "#aaa", fontFamily: "'Lora', serif", lineHeight: "1.7" }}>
                {o.crush}
              </div>
            </div>
          )}
        </div>
      ))}
      {!objections.length && (
        <div style={{ color: "#252525", fontFamily: "'DM Mono', monospace", fontSize: "11px", textAlign: "center", padding: "30px" }}>
          Generating objection crushers...
        </div>
      )}
    </div>
  );
}

function TestimonialsPanel({ text }) {
  const testimonials = getTestimonials(text);
  const tColors = ["#ff4d6d", "#c77dff", "#00c9ff"];
  const avatars = ["A", "B", "C"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {testimonials.map((t, i) => (
        <div key={i} style={{
          background: "#0c0c0e",
          border: "1px solid #1e1e24",
          borderRadius: "10px",
          padding: "16px",
          display: "flex", gap: "14px", alignItems: "flex-start",
        }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
            background: `${tColors[i]}22`,
            border: `1px solid ${tColors[i]}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", color: tColors[i],
            fontFamily: "'Syne', sans-serif", fontWeight: "700",
          }}>{avatars[i]}</div>
          <div>
            <div style={{ fontSize: "11px", color: "#ffd70088", marginBottom: "6px", letterSpacing: "1px" }}>
              ★★★★★
            </div>
            <div style={{ fontSize: "12px", color: "#c0c0c0", fontFamily: "'Lora', serif", lineHeight: "1.7", fontStyle: "italic" }}>
              "{t}"
            </div>
          </div>
        </div>
      ))}
      {!testimonials.length && (
        <div style={{ color: "#252525", fontFamily: "'DM Mono', monospace", fontSize: "11px", textAlign: "center", padding: "30px" }}>
          Generating social proof...
        </div>
      )}
    </div>
  );
}

function CTAPanel({ text, productName, price }) {
  const btnText = extract(text, "CTA_BUTTON");
  const subtext = extract(text, "CTA_SUBTEXT");
  const ps = extract(text, "PS_LINE");
  const headline = extract(text, "WINNER_HEADLINE");

  const [copied, setCopied] = useState(false);

  function copyPage() {
    const pas = ["PROBLEM", "AGITATION", "SOLUTION"].map((k) => `${k}:\n${extractBlock(text, k) || ""}`).join("\n\n");
    const aida = ["ATTENTION", "INTEREST", "DESIRE", "ACTION"].map((k) => `${k}:\n${extractBlock(text, k) || ""}`).join("\n\n");
    const full = `HEADLINE: ${headline || ""}\n\n${pas}\n\n${aida}\n\nCTA: ${btnText || ""}\n${subtext || ""}\n\nP.S. ${ps || ""}`;
    navigator.clipboard.writeText(full).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Preview CTA block */}
      <div style={{
        background: "linear-gradient(135deg, #0f1a14, #0c0c0e)",
        border: "1px solid #00e5a033",
        borderRadius: "14px", padding: "28px 20px",
        textAlign: "center",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "16px",
      }}>
        {headline && (
          <div style={{
            fontSize: "clamp(16px, 3vw, 22px)",
            color: "#fff", fontFamily: "'Playfair Display', serif",
            fontStyle: "italic", fontWeight: "700",
            lineHeight: "1.3", maxWidth: "480px",
          }}>
            "{headline}"
          </div>
        )}
        <div style={{
          background: "linear-gradient(135deg, #00e5a0, #00c9ff)",
          color: "#000",
          fontFamily: "'Syne', sans-serif",
          fontWeight: "800", fontSize: "14px",
          letterSpacing: "0.04em",
          padding: "14px 32px", borderRadius: "8px",
          boxShadow: "0 0 30px #00e5a044",
          cursor: "pointer",
          maxWidth: "320px", width: "100%",
        }}>
          {btnText || `Get ${productName || "Instant Access"} →`}
        </div>
        {subtext && (
          <div style={{ fontSize: "11px", color: "#555", fontFamily: "'DM Mono', monospace", lineHeight: "1.5" }}>
            {subtext}
          </div>
        )}
        {ps && (
          <div style={{
            background: "#0c0c0e",
            border: "1px solid #1a1a1a",
            borderRadius: "8px", padding: "12px 16px",
            maxWidth: "480px", width: "100%",
          }}>
            <span style={{ color: "#ff4d6d", fontFamily: "'DM Mono', monospace", fontSize: "10px", fontWeight: "700", marginRight: "6px" }}>P.S.</span>
            <span style={{ fontSize: "12px", color: "#999", fontFamily: "'Lora', serif", fontStyle: "italic", lineHeight: "1.6" }}>
              {ps}
            </span>
          </div>
        )}
      </div>

      {/* Copy full page */}
      {text.length > 200 && (
        <button
          onClick={copyPage}
          style={{
            background: copied ? "#00e5a018" : "#111",
            border: `1px solid ${copied ? "#00e5a044" : "#1e1e24"}`,
            borderRadius: "8px",
            padding: "12px 20px",
            color: copied ? "#00e5a0" : "#666",
            fontFamily: "'DM Mono', monospace",
            fontSize: "11px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            transition: "all 0.3s",
            cursor: "pointer",
          }}
        >
          {copied ? "✓ Copied to clipboard" : "⊕ Copy Full Sales Page Text"}
        </button>
      )}
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "headlines", label: "Headlines", icon: "◎", color: "#ff4d6d" },
  { id: "pas", label: "PAS", icon: "⚑", color: "#ff6b35" },
  { id: "aida", label: "AIDA", icon: "◈", color: "#c77dff" },
  { id: "offer", label: "Offer Stack", icon: "⬡", color: "#00e5a0" },
  { id: "objections", label: "Objections", icon: "◻", color: "#ff9500" },
  { id: "social", label: "Social Proof", icon: "★", color: "#ffd700" },
  { id: "cta", label: "CTA", icon: "▶", color: "#00c9ff" },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function SalesMachine() {
  const [inputs, setInputs] = useState({ product: "", niche: "", price: "", audience: "", transformation: "", extra: "" });
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [activeTab, setActiveTab] = useState("headlines");
  const [dots, setDots] = useState("");
  const [showExtra, setShowExtra] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (running) {
      const iv = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 380);
      const pv = setInterval(() => setProgress((p) => Math.min(p + 1.2, 92)), 200);
      return () => { clearInterval(iv); clearInterval(pv); };
    } else {
      setProgress(100);
    }
  }, [running]);

  async function handleRun() {
    if (!inputs.product.trim() || !inputs.niche.trim() || running) return;
    setRunning(true);
    setOutput("");
    setProgress(0);
    try {
      await runSalesMachine(inputs, (text) => setOutput(text));
    } catch {
      setOutput("Connection error. Please try again.");
    }
    setRunning(false);
  }

  const hasOutput = output.length > 50;
  const activeColor = TABS.find((t) => t.id === activeTab)?.color || "#ff4d6d";

  const set = (k) => (e) => setInputs((p) => ({ ...p, [k]: e.target.value }));

  const inputStyle = {
    width: "100%",
    background: "#0c0c0e",
    border: "1px solid #1e1e24",
    borderRadius: "7px",
    color: "#e0e0e0",
    fontFamily: "'DM Mono', monospace",
    fontSize: "12px",
    padding: "10px 12px",
    caretColor: "#ff4d6d",
    lineHeight: "1.5",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Syne:wght@400;700;800&family=Playfair+Display:ital,wght@0,700;1,400;1,700&family=Lora:ital,wght@0,400;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#080810;}
        ::selection{background:#ff4d6d22;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-track{background:#0c0c0e;}
        ::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:2px;}
        textarea,input{outline:none;resize:none;}
        .fade-up{animation:fadeUp 0.45s ease forwards;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .tab-hover:hover{background:#141418!important;}
        .noise{
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 128px 128px;
          pointer-events: none;
          position: fixed; inset: 0; z-index: 0;
        }
        .aida-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        @media(max-width:560px){.aida-grid{grid-template-columns:1fr;}}
      `}</style>

      <div className="noise" />

      <div style={{
        minHeight: "100vh",
        background: "#080810",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "36px 16px 80px",
        position: "relative", zIndex: 1,
      }}>
        {/* Progress bar */}
        {running && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, height: "2px", zIndex: 100,
            background: "#1a1a24",
          }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #ff4d6d, #c77dff, #00e5a0)",
              transition: "width 0.3s ease",
              boxShadow: "0 0 12px #ff4d6d88",
            }} />
          </div>
        )}

        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: "32px", maxWidth: "680px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "10px" }}>
            <div style={{ height: "1px", width: "40px", background: "linear-gradient(90deg, transparent, #ff4d6d)" }} />
            <GlowBadge color="#ff4d6d">Phase 03 — Sales Machine</GlowBadge>
            <div style={{ height: "1px", width: "40px", background: "linear-gradient(90deg, #ff4d6d, transparent)" }} />
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(28px, 5vw, 48px)",
            fontWeight: "800", color: "#fff",
            letterSpacing: "-0.02em", lineHeight: "1.1",
          }}>
            High-Conversion
            <br />
            <span style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: "italic", fontWeight: "700",
              background: "linear-gradient(135deg, #ff4d6d, #c77dff, #ff9500)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Sales Machine
            </span>
          </h1>
          <p style={{ marginTop: "10px", fontSize: "11px", color: "#444", fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em" }}>
            AIDA + PAS · Magnetic Headlines · Irresistible Offer Stack · Objection Crushers
          </p>
        </div>

        {/* INPUT CARD */}
        <div style={{ width: "100%", maxWidth: "760px", marginBottom: "20px" }}>
          <Card glow="#ff4d6d" style={{ position: "relative", overflow: "hidden" }}>
            <SectionLabel color="#ff4d6d">Product Brief</SectionLabel>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              <div>
                <div style={{ fontSize: "9px", color: "#333", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", marginBottom: "5px", textTransform: "uppercase" }}>Product Name *</div>
                <input value={inputs.product} onChange={set("product")} placeholder="e.g. The DM Conversion Kit" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: "9px", color: "#333", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", marginBottom: "5px", textTransform: "uppercase" }}>Niche *</div>
                <input value={inputs.niche} onChange={set("niche")} placeholder="e.g. Notion templates for Arabic freelancers" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: "9px", color: "#333", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", marginBottom: "5px", textTransform: "uppercase" }}>Price *</div>
                <input value={inputs.price} onChange={set("price")} placeholder="e.g. 47" style={{ ...inputStyle }} />
              </div>
              <div>
                <div style={{ fontSize: "9px", color: "#333", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", marginBottom: "5px", textTransform: "uppercase" }}>Target Audience *</div>
                <input value={inputs.audience} onChange={set("audience")} placeholder="e.g. Freelance designers in UAE" style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: "10px" }}>
              <div style={{ fontSize: "9px", color: "#333", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", marginBottom: "5px", textTransform: "uppercase" }}>Core Transformation *</div>
              <input value={inputs.transformation} onChange={set("transformation")} placeholder="e.g. Go from 0 to $1,000/month in 30 days using pre-built Notion templates" style={inputStyle} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                onClick={() => setShowExtra((v) => !v)}
                style={{
                  background: "transparent", border: "1px solid #1e1e24",
                  borderRadius: "6px", padding: "6px 12px",
                  color: "#444", fontFamily: "'DM Mono', monospace",
                  fontSize: "9px", letterSpacing: "0.1em",
                  textTransform: "uppercase", cursor: "pointer",
                }}
              >
                {showExtra ? "− Extra" : "+ Extra Context"}
              </button>

              <button
                onClick={handleRun}
                disabled={running || !inputs.product.trim() || !inputs.niche.trim()}
                style={{
                  background: running || !inputs.product.trim()
                    ? "#111"
                    : "linear-gradient(135deg, #ff4d6d, #c77dff)",
                  border: "none", borderRadius: "8px",
                  padding: "11px 24px",
                  color: running || !inputs.product.trim() ? "#333" : "#fff",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "11px", fontWeight: "500",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  cursor: running ? "not-allowed" : "pointer",
                  transition: "all 0.3s",
                  boxShadow: (!running && inputs.product.trim()) ? "0 0 24px #ff4d6d44" : "none",
                }}
              >
                {running ? `Writing${dots}` : "▶ Generate Sales Page"}
              </button>
            </div>

            {showExtra && (
              <div className="fade-up" style={{ marginTop: "10px" }}>
                <textarea rows={2} value={inputs.extra} onChange={set("extra")}
                  placeholder="Any extra context: competitor products, objections you've heard, audience's income level, platform..."
                  style={{ ...inputStyle, display: "block" }}
                />
              </div>
            )}
          </Card>
        </div>

        {/* OUTPUT */}
        {hasOutput && (
          <div className="fade-up" style={{ width: "100%", maxWidth: "760px" }}>
            {/* Tab bar */}
            <div style={{
              display: "flex", gap: "3px", flexWrap: "wrap",
              background: "#0c0c0e",
              border: "1px solid #1e1e24",
              borderRadius: "10px", padding: "4px",
              marginBottom: "16px",
            }}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className="tab-hover"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: "1 1 auto", minWidth: "60px",
                    background: activeTab === tab.id ? `${tab.color}18` : "transparent",
                    border: `1px solid ${activeTab === tab.id ? tab.color + "44" : "transparent"}`,
                    borderRadius: "7px", padding: "7px 8px",
                    color: activeTab === tab.id ? tab.color : "#333",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "9px", letterSpacing: "0.08em",
                    textTransform: "uppercase", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                    transition: "all 0.2s", whiteSpace: "nowrap",
                  }}
                >
                  <span>{tab.icon}</span>
                  <span style={{ display: "none" }}>{tab.label}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Panel content */}
            <div className="fade-up" key={activeTab}>
              {activeTab === "headlines" && <HeadlinesPanel text={output} />}
              {activeTab === "pas" && <PASPanel text={output} />}
              {activeTab === "aida" && <AIDAPanel text={output} />}
              {activeTab === "offer" && <OfferPanel text={output} price={inputs.price} />}
              {activeTab === "objections" && <ObjectionsPanel text={output} />}
              {activeTab === "social" && <TestimonialsPanel text={output} />}
              {activeTab === "cta" && <CTAPanel text={output} productName={inputs.product} price={inputs.price} />}
            </div>

            {/* Phase footer */}
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "28px", flexWrap: "wrap" }}>
              {[
                { n: "01", label: "Market Intelligence", done: true },
                { n: "02", label: "MVP Architect", done: true },
                { n: "03", label: "Sales Machine", active: true },
              ].map((p) => (
                <div key={p.n} style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "7px 14px",
                  background: p.active ? "#111" : "transparent",
                  border: `1px solid ${p.done && !p.active ? "#00ff8733" : p.active ? "#ff4d6d33" : "#1a1a1a"}`,
                  borderRadius: "8px",
                  opacity: p.active || p.done ? 1 : 0.3,
                }}>
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontSize: "9px",
                    color: p.done && !p.active ? "#00ff87" : p.active ? "#ff4d6d" : "#333",
                    letterSpacing: "0.1em",
                  }}>{p.done && !p.active ? "✓" : p.n}</span>
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontSize: "9px",
                    color: p.done && !p.active ? "#555" : p.active ? "#888" : "#222",
                    letterSpacing: "0.05em", textTransform: "uppercase",
                  }}>{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
