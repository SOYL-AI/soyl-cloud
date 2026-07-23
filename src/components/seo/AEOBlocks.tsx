import React from "react";

export function SummaryBlock({
  entityName,
  category,
  coreFunction,
  benefits,
}: {
  entityName: string;
  category: string;
  coreFunction: string;
  benefits: string;
}) {
  return (
    <div className="mb-10 text-lg md:text-xl text-[var(--color-soyl-gray-600)] leading-relaxed max-w-3xl font-medium">
      <p>
        <strong>{entityName}</strong> is a <strong>{category}</strong> that {coreFunction}. By integrating seamlessly into daily operations, it ensures {benefits}.
      </p>
    </div>
  );
}

export function DefinitionList({
  title,
  items,
}: {
  title?: string;
  items: { term: string; definition: string }[];
}) {
  return (
    <div className="my-8">
      {title && <h3 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mb-4">{title}</h3>}
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item, index) => (
          <div key={index} className="bg-[var(--color-soyl-gray-50)] p-6 rounded-2xl border border-[var(--color-soyl-gray-200)]">
            <dt className="text-lg font-bold text-[var(--color-soyl-charcoal)] mb-2">{item.term}</dt>
            <dd className="text-[var(--color-soyl-gray-600)] leading-relaxed">{item.definition}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function FactTable({
  title,
  headers,
  rows,
}: {
  title?: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="my-8 overflow-x-auto">
      {title && <h3 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mb-4">{title}</h3>}
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="border-b-2 border-[var(--color-soyl-gray-200)]">
            {headers.map((header, index) => (
              <th key={index} className="p-4 font-bold text-[var(--color-soyl-charcoal)] bg-[var(--color-soyl-gray-50)]">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-soyl-gray-200)]">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-[var(--color-soyl-gray-50)] transition-colors">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="p-4 text-[var(--color-soyl-gray-600)] align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
