export function MarkdownText({ content }: { content: string }) {
  return (
    <div className="space-y-4 leading-7 text-slate-700">
      {content
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => {
          if (line.startsWith("# ")) {
            return null;
          }

          if (line.startsWith("## ")) {
            return (
              <h3
                className="pt-4 text-xl font-semibold text-slate-950"
                key={`${line}-${index}`}
              >
                {line.replace(/^## /, "")}
              </h3>
            );
          }

          if (line.startsWith("### ")) {
            return (
              <h4
                className="pt-3 text-lg font-semibold text-slate-950"
                key={`${line}-${index}`}
              >
                {line.replace(/^### /, "")}
              </h4>
            );
          }

          if (line.startsWith("- ")) {
            return (
              <p className="pl-4" key={`${line}-${index}`}>
                • {line.replace(/^- /, "")}
              </p>
            );
          }

          return <p key={`${line}-${index}`}>{line}</p>;
        })}
    </div>
  );
}
