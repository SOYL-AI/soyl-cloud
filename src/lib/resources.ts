/**
 * The resources library.
 *
 * `UPDATE.md` §10 calls this "the SEO engine" and is specific about what it
 * must not be: *"Do not do: keyword stuffing, AI-generated bulk content,
 * doorway pages, or anything you would be embarrassed to explain. It does not
 * work and it damages a young domain."*
 *
 * So the test each article has to pass is simple — **would a general manager
 * bookmark this?** Each one solves a problem a hotel actually has, is specific
 * enough to act on, and stands up without mentioning us. Product links appear
 * where they are genuinely the next step, with descriptive anchors, and
 * nowhere else.
 *
 * These are distinct from `/blog`, which is product and category writing.
 * Resources are operational reference: the things somebody prints out.
 */

export type ResourceBlock =
  | { kind: "para"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "ordered"; items: string[] }
  /** A pull-out worth acting on. Rendered as a callout. */
  | { kind: "note"; text: string }
  /** A table. `rows` must match `headers` in length. */
  | { kind: "table"; headers: string[]; rows: string[][] };

export type Resource = {
  slug: string;
  title: string;
  /** The meta description. One sentence, what the reader gets. */
  description: string;
  category: "Operations" | "Revenue" | "Templates";
  readTime: string;
  published: string;
  updated: string;
  /** The opening, before the first heading. */
  intro: string;
  blocks: ResourceBlock[];
  related: { label: string; href: string }[];
};

export const RESOURCES: Resource[] = [
  {
    slug: "hotel-cancellation-policy",
    title: "Writing a cancellation policy that holds up",
    description:
      "The clauses that decide whether a cancellation charge sticks, the measurement point most policies get wrong, and how corporate terms differ from leisure.",
    category: "Operations",
    readTime: "7 min read",
    published: "2026-07-29",
    updated: "2026-07-29",
    intro:
      "Most cancellation disputes are not about the amount. They are about when the clock started, and whether the guest was told. A policy that is precise about both survives a chargeback; one that is vague about either costs you the money and the relationship.",
    blocks: [
      { kind: "heading", text: "Say what the deadline is, not how long it is" },
      {
        kind: "para",
        text: "“Cancel up to 48 hours before arrival” sounds unambiguous and is not. Forty-eight hours before what — midnight? The 14:00 arrival time? The moment the booking was made? Three reasonable people will read it three ways, and the one who reads it in their favour is the one who calls you.",
      },
      {
        kind: "para",
        text: "Pick a reference point and write it into the clause. “Without charge up to 48 hours before 14:00 on the arrival date” leaves nothing to interpret. Then have your desk quote the resulting date and time when the booking is taken, rather than repeating the policy back.",
      },
      {
        kind: "note",
        text: "This is the single most common source of dispute, and it is free to fix. A guest who cancels at 15:00 two days out is inside a window measured from 14:00 and outside one measured from midnight — and neither of you will remember which you meant.",
      },
      { kind: "heading", text: "Corporate and leisure are different products" },
      {
        kind: "para",
        text: "A leisure guest books once and compares your terms against three other hotels at the point of booking. A corporate account books forty times a month and compares your terms against their own travel policy. They need different clauses, and running one policy for both means either losing leisure bookings to a stricter competitor or absorbing corporate no-shows you should have charged for.",
      },
      {
        kind: "table",
        headers: ["", "Leisure", "Corporate contracted"],
        rows: [
          ["Typical window", "18:00 the day before", "48 hours before arrival"],
          ["Charge inside window", "One night plus tax", "One night plus tax, to the company account"],
          ["Who is told", "The guest", "The guest and the company's nominated contact"],
          ["Where the terms live", "The rate plan", "The signed contract, which overrides the rate plan"],
        ],
      },
      {
        kind: "para",
        text: "That last row matters more than it looks. When a corporate contract specifies a different window from your standard, the contract wins — and your desk needs to be able to see that at the moment they quote a deadline, not discover it during the dispute.",
      },
      { kind: "heading", text: "Non-refundable rates need a compassion clause" },
      {
        kind: "para",
        text: "Advance purchase rates work because they are genuinely non-refundable. Erode that with discretionary exceptions and you have a flexible rate you are underselling.",
      },
      {
        kind: "para",
        text: "But there are circumstances where enforcing it costs you more than the room: a death or serious illness in the immediate family, a natural disaster, a flight cancelled by the carrier. Write those into the policy explicitly, name who can authorise the waiver, and make it clear the waiver does not require documentation before it is granted. A written exception is not a loophole — it is the difference between a considered policy and a duty manager improvising under pressure.",
      },
      { kind: "heading", text: "Charge, then tell them — within days, not at month end" },
      {
        kind: "para",
        text: "A no-show charge a company first sees on an invoice thirty days later is a charge you will spend an hour defending and will often write off anyway. Notify the nominated contact on the day it is raised.",
      },
      {
        kind: "para",
        text: "Some properties go further and write a rule into the policy: a charge not notified within seven days is written off rather than pursued. That looks like giving away revenue. In practice it converts a category of argument into a category of goodwill, and it forces the discipline that stops the charges accumulating unseen in the first place.",
      },
      { kind: "heading", text: "The clauses to check yours has" },
      {
        kind: "ordered",
        items: [
          "A stated measurement point, not just a duration.",
          "Separate leisure and corporate windows, and a line saying a signed contract prevails.",
          "What happens to a booking the property cancels — which should never be charged, and should include relocation at your cost.",
          "Named compassionate exceptions, and who authorises them.",
          "A notification obligation with a deadline on your side, not only the guest's.",
          "The group and block terms: release date, attrition allowance, and whether attrition is calculated on room nights or peak-night rooms.",
        ],
      },
      {
        kind: "note",
        text: "That last distinction catches people out. Attrition calculated on total room nights treats a group that shortens its stay the same as one that reduces its room count. Calculated on the peak night, it does not — and a group that books five nights and stays three has consumed nothing.",
      },
      { kind: "heading", text: "Then make it findable" },
      {
        kind: "para",
        text: "A policy nobody can locate at 23:00 is a policy your night manager will guess at. The test is not whether it is written down — it is whether the person who needs it can get the exact clause in under a minute, from wherever they are standing.",
      },
    ],
    related: [
      { label: "ask your own policies a question and get the clause back", href: "/advisor" },
      { label: "the SOPs every hotel should have written down", href: "/resources/hotel-sop-checklist" },
    ],
  },

  {
    slug: "hotel-sop-checklist",
    title: "The SOPs every hotel should have written down",
    description:
      "A working checklist of the procedures worth documenting, what each one must contain to be useful, and the sign that yours are out of date.",
    category: "Templates",
    readTime: "9 min read",
    published: "2026-07-29",
    updated: "2026-07-29",
    intro:
      "Most hotels have more procedures written down than anyone can find, and fewer than they need. The gap is rarely the obvious ones — everybody has a fire plan. It is the procedures that only matter twice a year, which is exactly when nobody remembers where they are.",
    blocks: [
      { kind: "heading", text: "What makes an SOP useful rather than filed" },
      {
        kind: "para",
        text: "A procedure earns its place if somebody can act on it under pressure without asking a question. That means four things, and a document missing any of them will be read once and then ignored.",
      },
      {
        kind: "list",
        items: [
          "A threshold, not an adjective. “Respond promptly” is unenforceable; “attend within fifteen minutes” can be measured and argued about.",
          "A named role, not a department. “Escalate to the duty manager” tells a night porter what to do; “escalate to management” does not.",
          "The failure case. What to do when the first step does not work is the part people actually need at 02:00.",
          "A date and a version. A procedure with no date is one nobody can tell is stale.",
        ],
      },
      { kind: "heading", text: "Front office" },
      {
        kind: "list",
        items: [
          "Reservation intake — what a booking record must contain before it counts as held.",
          "Identity and registration, including Form C submission for foreign nationals and the deadline for it.",
          "Arrival and departure timings, and what early arrival or late departure costs.",
          "Cancellation and no-show, leisure and corporate separately.",
          "Group and block bookings — release date, attrition, deposit.",
          "Overbooking and relocation: who gets moved, in what order, and what you pay for.",
          "Payment, deposits and card authorisation, including what you tell the guest a hold is.",
          "Complaint handling at the desk, with the waiver limit each role holds.",
        ],
      },
      {
        kind: "note",
        text: "The relocation procedure is the one worth writing before you need it. Deciding who to walk while three people are standing at your desk is how a property ends up moving the wrong guest — a family with children, or a corporate account you spent a year winning.",
      },
      { kind: "heading", text: "Housekeeping" },
      {
        kind: "list",
        items: [
          "Departure room servicing, with the target turnaround and who signs it off.",
          "Occupied room servicing, including what staff do not touch.",
          "Privacy requests — and specifically, what happens after 24 hours of an unbroken do-not-disturb.",
          "Linen handling, including separation of anything stained with blood or bodily fluid.",
          "Lost and found: retention periods by item value, and what is never disposed of.",
          "Chemical handling, with the combinations that must never be used in the same room.",
          "Pest sighting reporting, and which rooms come out of sale on a confirmed bedbug report.",
        ],
      },
      {
        kind: "para",
        text: "The privacy-request procedure is a welfare procedure wearing an operational hat. A sign that has not moved in a day means either a guest who wants to be left alone or a guest who cannot answer the door, and the only way to tell is to have written down when somebody goes in.",
      },
      { kind: "heading", text: "Food and beverage" },
      {
        kind: "list",
        items: [
          "Buffet holding times and temperatures, and what happens to an item that falls out of range.",
          "Allergen declaration — who answers a guest's question, and the phrase staff may never use.",
          "Banquet event orders, including how a change inside seven days is handled.",
          "Banquet cancellation, as a sliding scale by notice period.",
          "Bar licensing hours, the legal drinking age in your state, and refusal of service.",
          "Food safety: delivery acceptance temperatures, batch sampling, and date labelling.",
        ],
      },
      {
        kind: "note",
        text: "On allergens, the sentence to ban explicitly is “it should be fine”. Write into the procedure that where the declaration does not answer the question, the chef answers it directly to the guest. Staff will not invent that rule under pressure.",
      },
      { kind: "heading", text: "Engineering and safety" },
      {
        kind: "list",
        items: [
          "Guest fault reporting, with response targets by severity and the rule that an unresolved fault takes the room out of sale.",
          "Hot water: the temperature range at the tap, and that a report at midnight is attended at midnight.",
          "Lift entrapment — above all, that nobody attempts a manual release without the contractor's certification.",
          "Hot work permits, including restoring any detection zone that was isolated.",
          "Fire alarm response, and that the fire service is called on every unconfirmed activation.",
          "Evacuation, with assembly points and an alternate for each.",
          "Extinguisher selection, particularly that water never goes near burning oil.",
          "Medical emergency, and the rule that staff administer no medication of any kind.",
        ],
      },
      { kind: "heading", text: "How to tell yours are out of date" },
      {
        kind: "ordered",
        items: [
          "Ask three staff on different shifts the same operational question. If you get three answers, the document is not the source of truth — memory is.",
          "Look for a rate, a threshold or a supplier name that has changed since the document was written. One stale number makes a reader distrust the whole file.",
          "Check whether the escalation path names people who still work there.",
          "Count how long it takes you personally to find one specific clause. If it is more than a minute, nobody else is finding it at all.",
        ],
      },
      {
        kind: "para",
        text: "That last test is the one that matters most, and it is not a documentation problem. The answer usually exists and is simply unreachable at the moment somebody needs it.",
      },
    ],
    related: [
      { label: "make your SOPs answer questions instead of sitting in a folder", href: "/advisor" },
      { label: "writing a cancellation policy that holds up", href: "/resources/hotel-cancellation-policy" },
    ],
  },

  {
    slug: "revpar-adr-occupancy-basics",
    title: "ADR, occupancy and RevPAR, without the jargon",
    description:
      "What the three numbers actually measure, why RevPAR moves when neither of the others seems to, and the questions to ask when it drops.",
    category: "Revenue",
    readTime: "8 min read",
    published: "2026-07-29",
    updated: "2026-07-29",
    intro:
      "Three numbers run most hotel revenue conversations, and two of them can look fine while the business gets worse. This is what each one measures, how they relate, and what to look at when the third moves.",
    blocks: [
      { kind: "heading", text: "The three numbers" },
      {
        kind: "table",
        headers: ["Metric", "What it measures", "How it is calculated"],
        rows: [
          ["Occupancy", "How full you were", "Rooms sold ÷ rooms available"],
          ["ADR", "What you charged for the rooms you sold", "Room revenue ÷ rooms sold"],
          ["RevPAR", "What you earned per room you had", "Room revenue ÷ rooms available"],
        ],
      },
      {
        kind: "para",
        text: "The distinction that matters is the denominator. ADR divides by rooms you sold; RevPAR divides by rooms you had. A hotel that sells four rooms at a very high rate has a superb ADR and a poor RevPAR, and only one of those describes the business.",
      },
      {
        kind: "note",
        text: "RevPAR equals occupancy multiplied by ADR. That identity is worth internalising, because it means RevPAR can only move for one of two reasons — and separating them is the whole diagnostic.",
      },
      { kind: "heading", text: "When RevPAR falls, ask which half moved" },
      {
        kind: "para",
        text: "A RevPAR decline is either a rate problem or a volume problem, and they have opposite fixes. Discounting into a volume problem sometimes works. Discounting into a rate problem makes it worse and takes months to unwind, because the channels remember.",
      },
      {
        kind: "ordered",
        items: [
          "Compare occupancy against the same period last year. If it held, the loss is rate.",
          "Compare ADR the same way. If it held, the loss is volume.",
          "If both fell, look at whether a segment disappeared — one corporate account or one tour operator can account for the whole gap.",
          "If neither fell but RevPAR did, check rooms available. Rooms out of order shrink the denominator, which flatters occupancy and ADR while RevPAR tells the truth.",
        ],
      },
      {
        kind: "para",
        text: "That fourth case is the one people miss. Twelve rooms out for refurbishment will make your occupancy look like the best month you have had.",
      },
      { kind: "heading", text: "Why ADR alone is a poor target" },
      {
        kind: "para",
        text: "ADR rewards refusing business. A revenue manager held to ADR can improve it by declining every discounted booking, and will hand you a record ADR and an empty hotel.",
      },
      {
        kind: "para",
        text: "It also ignores everything the guest spends after check-in. A room sold at a lower rate to a guest who eats in the restaurant and books the spa can be worth more than a higher-rated room-only booking. If your F&B is a real business rather than a breakfast obligation, ADR is measuring a fraction of the decision.",
      },
      { kind: "heading", text: "Total revenue per available room" },
      {
        kind: "para",
        text: "TRevPAR divides total revenue — rooms, food, beverage, spa, meeting space — by rooms available. It is harder to calculate and harder to compare with other properties, and for a hotel with meaningful non-room revenue it is the more honest number.",
      },
      {
        kind: "para",
        text: "The practical use is not benchmarking against anyone else. It is comparing a segment against itself: the group that fills your banquet space at a low room rate may be your most profitable business, and a rooms-only view will show you the opposite.",
      },
      { kind: "heading", text: "Comparing against the right thing" },
      {
        kind: "list",
        items: [
          "Same period last year, not last month. Hotel demand is seasonal and day-of-week patterned, so month-on-month mostly measures the calendar.",
          "Same day of week. A Tuesday compared against a Saturday tells you nothing.",
          "Adjust for anything that moved — a festival that shifted date, a conference that came or went, a competitor that opened or closed.",
          "Watch the pace, not just the outcome: how much of next month is already on the books compared with the same point last year.",
        ],
      },
      {
        kind: "note",
        text: "Pace is the only one of these that is forward-looking. Everything else explains a month you can no longer change.",
      },
      { kind: "heading", text: "What this does not tell you" },
      {
        kind: "para",
        text: "None of these three is a profit measure. A RevPAR gain bought with a channel that charges twenty per cent commission can lose money against a lower rate booked direct. Before treating a RevPAR movement as good news, check what it cost to acquire — which means knowing your commission terms and where the booking came from.",
      },
    ],
    related: [
      { label: "writing a cancellation policy that holds up", href: "/resources/hotel-cancellation-policy" },
      { label: "the SOPs every hotel should have written down", href: "/resources/hotel-sop-checklist" },
    ],
  },
];

export function getResource(slug: string): Resource | undefined {
  return RESOURCES.find((resource) => resource.slug === slug);
}
