"use client";

import { AlertTriangle, Info, Quote, ShieldAlert } from "lucide-react";

import type { Block } from "@soyl/contracts";

/**
 * Rendering an envelope's blocks.
 *
 * `UPDATE.md` §6.3: *"the frontend validates every block before rendering."*
 * That is the reason `isRenderable` exists rather than trusting the type — a
 * `Block` is only a compile-time promise, and the value arrives over HTTP from
 * a pipeline whose last step was a language model. A renderer that improvises
 * on a shape it does not recognise is how one bad envelope takes down the page
 * that was supposed to show the answer.
 *
 * An unrecognised block is skipped silently. It is already recorded in
 * `diagnostics`, and a visible "unsupported block" placeholder would make our
 * schema versioning the user's problem.
 */

function isRenderable(block: Block): boolean {
  switch (block?.type) {
    case "text.markdown":
      return typeof block.payload?.markdown === "string";
    case "alert.callout":
      return typeof block.payload?.markdown === "string";
    case "list.checklist":
      return Array.isArray(block.payload?.items);
    case "doc.citation":
      return (
        typeof block.payload?.quote === "string" &&
        typeof block.payload?.document_title === "string"
      );
    default:
      return false;
  }
}

/**
 * The smallest markdown that is worth having, and no more.
 *
 * Bold, inline code and paragraphs cover essentially everything the
 * synthesiser produces, and the prompt asks for short prose rather than
 * documents. A full markdown library would add a parser, a sanitiser and a
 * supply-chain dependency to render text we generate ourselves.
 *
 * Everything is escaped first, so a document containing `<script>` renders as
 * the characters someone typed into a PDF. This is guest-facing content
 * originating in an uploaded file, which is exactly the input not to trust.
 */
function inline(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, '<code class="rounded bg-charcoal/10 px-1 py-0.5 text-[0.9em]">$1</code>');
}

function Markdown({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim());

  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, index) => (
        <p
          key={index}
          className="text-[15px] leading-relaxed text-charcoal/85"
          dangerouslySetInnerHTML={{ __html: inline(paragraph.trim()) }}
        />
      ))}
    </div>
  );
}

const ALERT_STYLES = {
  info: {
    wrapper: "border-mint/40 bg-mint/10",
    icon: Info,
    iconClass: "text-charcoal/60",
  },
  warning: {
    wrapper: "border-amber-300/60 bg-amber-50",
    icon: AlertTriangle,
    iconClass: "text-amber-600",
  },
  critical: {
    wrapper: "border-red-300/60 bg-red-50",
    icon: ShieldAlert,
    iconClass: "text-red-600",
  },
} as const;

export function AnswerBlocks({ blocks }: { blocks: Block[] }) {
  const renderable = (blocks ?? []).filter(isRenderable);

  return (
    <div className="space-y-4">
      {renderable.map((block) => {
        if (block.type === "text.markdown") {
          return (
            <div key={block.id}>
              {block.title ? (
                <h3 className="mb-2 text-sm font-semibold text-charcoal">{block.title}</h3>
              ) : null}
              <Markdown text={block.payload.markdown} />
            </div>
          );
        }

        if (block.type === "alert.callout") {
          const style = ALERT_STYLES[block.payload.level] ?? ALERT_STYLES.info;
          const Icon = style.icon;
          return (
            <div
              key={block.id}
              className={`flex gap-3 rounded-2xl border p-4 ${style.wrapper}`}
              role={block.payload.level === "info" ? undefined : "alert"}
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.iconClass}`} aria-hidden />
              <div className="min-w-0">
                {block.title ? (
                  <p className="mb-1 text-sm font-semibold text-charcoal">{block.title}</p>
                ) : null}
                <Markdown text={block.payload.markdown} />
              </div>
            </div>
          );
        }

        if (block.type === "list.checklist") {
          return (
            <div key={block.id}>
              {block.title ? (
                <h3 className="mb-2 text-sm font-semibold text-charcoal">{block.title}</h3>
              ) : null}
              {/* Ordered, because a checklist from an SOP is a sequence and
                  the number is part of the instruction. */}
              <ol className="space-y-2">
                {block.payload.items.map((item, index) => (
                  <li key={index} className="flex gap-3 text-[15px] leading-relaxed">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint/30 text-[11px] font-semibold text-charcoal">
                      {index + 1}
                    </span>
                    <span className="text-charcoal/85">{item.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          );
        }

        return (
          <figure
            key={block.id}
            className="rounded-2xl border border-charcoal/10 bg-charcoal/[0.03] p-4"
          >
            <Quote className="mb-2 h-4 w-4 text-charcoal/40" aria-hidden />
            <blockquote className="text-[15px] leading-relaxed text-charcoal/85">
              {block.payload.quote}
            </blockquote>
            <figcaption className="mt-3 border-t border-charcoal/10 pt-2 text-xs text-charcoal/55">
              {block.payload.document_title}
              {block.payload.heading_path.length ? (
                <span> · {block.payload.heading_path.join(" › ")}</span>
              ) : null}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
