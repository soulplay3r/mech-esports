import ReactMarkdown from "react-markdown";

/** Renders Claude's Markdown. react-markdown does not render raw HTML, so output is safe. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-2.5 text-sm leading-relaxed text-foreground/90 [&_code]:rounded [&_code]:bg-secondary [&_code]:px-1 [&_code]:font-mono [&_code]:text-accent [&_h1]:font-display [&_h1]:text-xl [&_h1]:font-bold [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:font-display [&_h3]:text-base [&_h3]:font-bold [&_h3]:uppercase [&_h3]:tracking-wide [&_h3]:text-accent [&_li]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-surface-2 [&_pre]:p-3 [&_strong]:text-foreground [&_table]:w-full [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:px-2 [&_th]:py-1 [&_ul]:list-disc [&_ul]:space-y-1">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
