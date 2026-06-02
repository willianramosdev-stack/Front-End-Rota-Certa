export function TextoResposta({ texto }: { texto: string }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {texto.split("\n").map((linha, i) => {
        if (!linha.trim()) return <br key={i} />;

        const partes = linha.split(/\*\*(.*?)\*\*/g);

        return (
          <p key={i}>
            {partes.map((parte, j) =>
              j % 2 === 1 ? (
                <strong key={j} className="font-semibold text-foreground">
                  {parte}
                </strong>
              ) : (
                <span key={j}>{parte}</span>
              )
            )}
          </p>
        );
      })}
    </div>
  );
}
