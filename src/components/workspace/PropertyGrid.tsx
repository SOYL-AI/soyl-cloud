"use client";

import { motion } from "framer-motion";
import { Building2, Plus } from "lucide-react";

export type PropertyRow = {
  id: string;
  name: string;
  rooms_total: number;
  timezone: string;
};

/**
 * The property cards.
 *
 * Staggered so the grid assembles rather than appearing, which reads as
 * responsive on a slow connection and costs nothing on a fast one. Capped at a
 * short total: with twenty properties, a 0.1s stagger would take two seconds
 * to finish and the last card would arrive after you had stopped looking.
 */
export function PropertyGrid({ properties }: { properties: PropertyRow[] }) {
  if (properties.length === 0) {
    return <EmptyProperties />;
  }

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property, index) => (
        <motion.li
          key={property.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            ease: "easeOut",
            delay: Math.min(index * 0.05, 0.3),
          }}
          className="group rounded-[24px] border border-[var(--color-soyl-gray-200)] bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--color-soyl-mint)] hover:shadow-lg hover:shadow-[var(--color-soyl-mint)]/10"
        >
          <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-soyl-mint-light)] text-[var(--color-soyl-mint-dark)] transition-colors group-hover:bg-[var(--color-soyl-mint)] group-hover:text-white">
            <Building2 size={20} />
          </span>

          <h3 className="truncate font-bold text-[var(--color-soyl-charcoal)]">
            {property.name}
          </h3>
          <p className="mt-1 text-sm text-[var(--color-soyl-gray-600)]">
            {property.rooms_total > 0 ? `${property.rooms_total} rooms` : "Rooms not set"}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-soyl-gray-400)]">{property.timezone}</p>
        </motion.li>
      ))}
    </ul>
  );
}

function EmptyProperties() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="rounded-[28px] border border-dashed border-[var(--color-soyl-gray-200)] bg-white p-12 text-center"
    >
      <span className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-soyl-gray-100)] text-[var(--color-soyl-gray-400)]">
        <Plus size={26} />
      </span>
      <h3 className="text-lg font-bold text-[var(--color-soyl-charcoal)]">No properties yet</h3>
      <p className="mx-auto mt-2 max-w-sm text-[var(--color-soyl-gray-600)]">
        Add your first property to start uploading documents for it.
      </p>
    </motion.div>
  );
}
