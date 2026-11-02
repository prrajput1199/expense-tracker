import { FormEvent, useState } from "react";
import type { Category } from "../types";

interface Props {
  categories: Category[];
  onAdd: (name: string, color: string) => Promise<boolean>;
  onDelete: (c: Category) => Promise<boolean>;
}

export default function CategoryManager({ categories, onAdd, onDelete }: Props) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#0F766E");

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!name.trim()) return;
    if (await onAdd(name.trim(), color)) setName("");
  };

  return (
    <section className="panel">
      <h2>Categories</h2>
      <ul className="chips">
        {categories.map((c) => (
          <li key={c.id}>
            <span className="swatch" style={{ background: c.color }} />
            {c.name}
            <button
              className="chip-x"
              onClick={() => onDelete(c)}
              aria-label={`Delete category ${c.name}`}
              title="Delete category"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <form className="cat-form" onSubmit={submit}>
        <input
          value={name}
          maxLength={50}
          placeholder="New category"
          aria-label="New category name"
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="color"
          value={color}
          aria-label="Category colour"
          onChange={(e) => setColor(e.target.value)}
        />
        <button className="secondary" type="submit">
          Add
        </button>
      </form>
    </section>
  );
}
