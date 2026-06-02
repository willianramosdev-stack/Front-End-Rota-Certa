"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchJson } from "@/lib/api-base";

type Sugestao = {
  label: string;
  nome: string;
  uf: string;
};

type CidadeInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  required?: boolean;
};

export function CidadeInput({
  id,
  label,
  value,
  onChange,
  required,
}: CidadeInputProps) {
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (value.trim().length < 2) {
      setSugestoes([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchJson<Sugestao[]>(`/api/cidades?q=${encodeURIComponent(value)}`)
        .then((lista) => {
          if (Array.isArray(lista)) setSugestoes(lista);
        })
        .catch(() => setSugestoes([]));
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        placeholder="ex: alfenas-mg"
        autoComplete="off"
        required={required}
      />
      {aberto && sugestoes.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover text-sm shadow-md">
          {sugestoes.map((s) => (
            <li key={s.label}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-muted"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(s.label);
                  setAberto(false);
                }}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
