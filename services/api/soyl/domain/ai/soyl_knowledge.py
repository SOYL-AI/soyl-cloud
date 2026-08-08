"""Static product knowledge for the conversational advisor.

This information is kept as constants so the AI can reliably recommend
specific SOYL products based on the conversation context. It is not RAG,
as it does not need a tenant or a database.
"""

from __future__ import annotations


PRODUCTS = [
    {
        "name": "Butler AI",
        "status": "live",
        "tagline": "The AI concierge your guests actually use.",
        "what_it_does": "Guests scan a QR code, speak or type in any language, and Butler AI handles concierge requests, room service orders, and service tickets — routed directly to the right department. No app download, no staff training.",
        "best_for": [
            "Hotels wanting to reduce front desk call volume",
            "Properties serving international guests",
            "Hotels struggling with slow guest response times",
        ],
        "key_features": [
            "50+ language voice & text",
            "Smart department routing (F&B, housekeeping, maintenance)",
            "Guest intent extraction for upsells",
            "Zero guest app downloads — QR scan only",
        ],
        "pricing": "Contact for pricing — 1-month free trial available",
    },
    {
        "name": "Hotel Advisor (Document AI)",
        "status": "live",
        "tagline": "Your SOPs can answer questions. Right now they just sit there.",
        "what_it_does": "Upload your SOPs, contracts, brand standards, and policies. Staff ask questions in plain language. Every answer cites the exact passage it came from — and when nothing covers a question, it says so instead of guessing.",
        "best_for": [
            "Hotels with extensive SOPs that staff struggle to search",
            "Multi-property groups needing consistent policy answers",
            "Properties with high staff turnover and training overhead",
        ],
        "key_features": [
            "PDF/DOCX upload and automatic indexing",
            "Cited answers with source passages",
            "Honest refusal when documents don't cover a question",
            "Multi-property document separation",
        ],
        "pricing": "Free to try — no account needed for the public advisor",
    },
    {
        "name": "PMS Lite",
        "status": "live",
        "tagline": "The simplest PMS your staff will love.",
        "what_it_does": "A clean, modern property management system that handles reservations, check-in/out, room status, and housekeeping coordination. Designed to be learned in minutes, not weeks.",
        "best_for": [
            "Independent hotels tired of complex/expensive PMS",
            "Properties currently using spreadsheets or paper",
            "Hotels wanting an affordable Opera/Cloudbeds alternative",
        ],
        "key_features": [
            "Unlimited rooms",
            "No training required",
            "Housekeeping coordination",
            "Guest communication",
        ],
        "pricing": "Flat ₹9,999/month — unlimited rooms",
    },
    {
        "name": "ARIP",
        "status": "coming_soon",
        "tagline": "Your hotel's autonomous digital workforce.",
        "what_it_does": "A team of specialized AI agents that autonomously execute dynamic pricing, launch targeted marketing campaigns, optimize distribution across OTAs, and grow RevPAR — running 24/7 without manual intervention.",
        "best_for": [
            "Hotels wanting automated dynamic pricing",
            "Properties struggling with OTA commission optimization",
            "Revenue managers wanting AI-driven demand forecasting",
        ],
        "key_features": [
            "Autonomous pricing agents",
            "Marketing campaign automation",
            "OTA distribution optimization",
            "Explainable AI decision logs",
        ],
        "pricing": "Pilot waitlist open — contact for early access",
    },
    {
        "name": "SOYL Dine",
        "status": "coming_soon",
        "tagline": "QR ordering and kitchen workflows for hotel restaurants.",
        "what_it_does": "Guests scan a QR code at the table to browse the menu, order, and pay — while kitchen staff see orders in real-time with preparation tracking.",
        "best_for": [
            "Hotels with in-house restaurants",
            "Properties wanting to reduce F&B service friction",
            "Restaurants looking for contactless ordering",
        ],
        "key_features": [
            "QR-based table ordering",
            "Real-time kitchen display",
            "Menu management",
            "Payment integration",
        ],
        "pricing": "Coming soon — join waitlist",
    },
]


def format_product_knowledge() -> str:
    """Format the product knowledge into a readable text block.
    
    This is used to inject product information into the LLM system prompt.
    """
    lines = ["# SOYL Product Knowledge\n"]
    for product in PRODUCTS:
        lines.append(f"## {product['name']} (Status: {product['status']})")
        lines.append(f"**Tagline**: {product['tagline']}")
        lines.append(f"**What it does**: {product['what_it_does']}")
        lines.append("**Best for**:")
        for bf in product["best_for"]:
            lines.append(f"  - {bf}")
        lines.append("**Key Features**:")
        for kf in product["key_features"]:
            lines.append(f"  - {kf}")
        lines.append(f"**Pricing**: {product['pricing']}\n")
    return "\n".join(lines)
