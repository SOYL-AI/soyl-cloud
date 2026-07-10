export type FeatureStatus = true | false | "partial" | "Contact Vendor" | string;

export interface Feature {
  name: string;
  butler: FeatureStatus;
  competitor: FeatureStatus;
}

export interface FeatureCategory {
  category: string;
  features: Feature[];
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface BestFor {
  type: "Enterprise Hotels" | "Boutique Hotels" | "Independent Hotels";
  recommendation: string;
}

export interface Strength {
  icon: string;
  title: string;
  description: string;
}

export interface Competitor {
  slug: string;
  name: string;
  shortDescription: string;
  website: string;
  focusAreas: string[];
  verdict: {
    competitorStrength: string;
    butlerStrength: string;
  };
  features: FeatureCategory[];
  bestFor: BestFor[];
  faqs: FAQ[];
}

export const BUTLER_STRENGTHS: Strength[] = [
  { icon: "Mic", title: "Voice-first AI", description: "Natural, multi-lingual voice conversations that understand hospitality context." },
  { icon: "Globe", title: "Instant Multilingual", description: "Break language barriers instantly across both voice and text channels." },
  { icon: "QrCode", title: "Guest QR Experience", description: "No app downloads needed. Guests scan a QR code to access all services." },
  { icon: "Zap", title: "Fast Deployment", description: "Get up and running in days, not months. Minimal staff training required." },
  { icon: "ArrowRight", title: "AI-Powered Routing", description: "Requests automatically route to the right department (Housekeeping, Maintenance, etc.)." },
  { icon: "LayoutDashboard", title: "Integrated Platform", description: "A unified system covering guest experience, operations, and property management." },
  { icon: "Smartphone", title: "Premium UI", description: "Beautiful, modern interfaces that reflect your property's premium brand." },
  { icon: "Database", title: "Cloud Architecture", description: "Reliable, fast, and secure infrastructure designed for modern hospitality." }
];

export const competitors: Competitor[] = [
  {
    slug: "hijiffy",
    name: "HiJiffy",
    shortDescription: "A specialized conversational AI platform focused on hotel guest communication across WhatsApp and web chat.",
    website: "https://hijiffy.com",
    focusAreas: ["Guest Messaging", "Web Chat", "WhatsApp Integration"],
    verdict: {
      competitorStrength: "If your priority is an established enterprise deployment specifically focused on text-based web chat and WhatsApp automation across thousands of hotels, HiJiffy is an excellent option.",
      butlerStrength: "If your priority is fast deployment, true multilingual voice AI, QR-based in-room concierge, and a modern guest engagement platform that feels premium, Butler AI is designed specifically for those needs."
    },
    features: [
      {
        category: "Communication Channels",
        features: [
          { name: "Guest Messaging", butler: true, competitor: true },
          { name: "Voice AI", butler: true, competitor: "partial" },
          { name: "Text AI", butler: true, competitor: true },
          { name: "Multilingual Support", butler: true, competitor: true },
          { name: "QR Code Concierge", butler: true, competitor: "partial" }
        ]
      },
      {
        category: "Operations & Management",
        features: [
          { name: "PMS Integrations", butler: true, competitor: true },
          { name: "Housekeeping Routing", butler: true, competitor: "partial" },
          { name: "Maintenance Requests", butler: true, competitor: "partial" },
          { name: "Food Ordering", butler: true, competitor: "Contact Vendor" },
          { name: "Analytics", butler: true, competitor: true },
          { name: "Upselling", butler: true, competitor: true }
        ]
      },
      {
        category: "Technology & Deployment",
        features: [
          { name: "CRM", butler: true, competitor: true },
          { name: "Knowledge Base", butler: true, competitor: true },
          { name: "Custom Branding", butler: true, competitor: true },
          { name: "Deployment Time", butler: "Days", competitor: "Weeks" },
          { name: "Setup Complexity", butler: "Low", competitor: "Medium" }
        ]
      },
      {
        category: "Platform Architecture",
        features: [
          { name: "API Availability", butler: true, competitor: true },
          { name: "Security", butler: "Enterprise-grade", competitor: "Enterprise-grade" },
          { name: "Cloud Infrastructure", butler: true, competitor: true },
          { name: "Availability", butler: "99.9%", competitor: "Contact Vendor" },
          { name: "Mobile Experience", butler: "Native-like PWA", competitor: "Responsive" }
        ]
      },
      {
        category: "Target Market",
        features: [
          { name: "Enterprise Support", butler: true, competitor: true },
          { name: "Independent Hotels", butler: true, competitor: "partial" },
          { name: "Chain Hotels", butler: true, competitor: true },
          { name: "Pricing Model", butler: "Per Room / Flat", competitor: "Contact Vendor" }
        ]
      }
    ],
    bestFor: [
      {
        type: "Enterprise Hotels",
        recommendation: "HiJiffy is well-suited for large chains requiring deep WhatsApp integrations and complex multi-property routing."
      },
      {
        type: "Boutique Hotels",
        recommendation: "Butler AI offers a more premium, white-labeled QR experience that boutique hotels prefer for high-touch guest service."
      },
      {
        type: "Independent Hotels",
        recommendation: "Butler AI's fast deployment and intuitive interface make it ideal for independent properties without large IT teams."
      }
    ],
    faqs: [
      { question: "Is Butler AI better than HiJiffy?", answer: "The 'best' solution depends on your needs. Butler AI excels in Voice AI and fast deployment with a premium UI, while HiJiffy has a strong footprint in text-based WhatsApp automation for large chains." },
      { question: "Does Butler AI support voice commands?", answer: "Yes, Butler AI is built with voice-first capabilities, allowing guests to speak naturally in multiple languages to request services." },
      { question: "Can Butler AI integrate with my PMS?", answer: "Yes, Butler AI integrates with major PMS providers to automate requests, guest identification, and billing." },
      { question: "Which hotel AI concierge is best for independent hotels?", answer: "Independent hotels often prefer Butler AI for its straightforward pricing, rapid setup, and all-in-one feature set without enterprise complexity." },
      { question: "Do guests need to download an app?", answer: "No, Butler AI uses a seamless web app and QR code system, removing friction for guests." }
    ]
  },
  {
    slug: "canary",
    name: "Canary Technologies",
    shortDescription: "A comprehensive guest management system specializing in contactless check-in, digital tipping, and upselling.",
    website: "https://www.canarytechnologies.com",
    focusAreas: ["Contactless Check-in", "Digital Tipping", "Guest Messaging"],
    verdict: {
      competitorStrength: "If your core focus is digitizing the check-in/check-out flow, handling digital authorizations, and managing staff tipping, Canary is an industry leader.",
      butlerStrength: "If you want advanced conversational AI, instant voice-based guest requests, and a unified operational dashboard designed around real-time intelligence, Butler AI is the stronger choice."
    },
    features: [
      {
        category: "Guest Experience",
        features: [
          { name: "Guest Messaging", butler: true, competitor: true },
          { name: "Voice AI", butler: true, competitor: false },
          { name: "Text AI", butler: true, competitor: "partial" },
          { name: "Contactless Check-in", butler: "partial", competitor: true },
          { name: "QR Code Concierge", butler: true, competitor: true }
        ]
      },
      {
        category: "Operations",
        features: [
          { name: "PMS Integrations", butler: true, competitor: true },
          { name: "Housekeeping Routing", butler: true, competitor: "Contact Vendor" },
          { name: "Maintenance Requests", butler: true, competitor: "Contact Vendor" },
          { name: "Digital Tipping", butler: false, competitor: true },
          { name: "Upselling", butler: true, competitor: true }
        ]
      },
      {
        category: "Technology",
        features: [
          { name: "API Availability", butler: true, competitor: true },
          { name: "Custom Branding", butler: true, competitor: true },
          { name: "Deployment Time", butler: "Days", competitor: "Weeks" },
          { name: "Pricing Model", butler: "Transparent", competitor: "Contact Vendor" }
        ]
      }
    ],
    bestFor: [
      {
        type: "Enterprise Hotels",
        recommendation: "Canary provides robust compliance and enterprise-level check-in flows for large operations."
      },
      {
        type: "Boutique Hotels",
        recommendation: "Butler AI provides a more conversational, personalized in-room experience via Voice AI."
      },
      {
        type: "Independent Hotels",
        recommendation: "Both platforms serve independents well; choose based on whether you need check-in automation (Canary) or AI request management (Butler AI)."
      }
    ],
    faqs: [
      { question: "How does Butler AI compare to Canary Technologies?", answer: "Canary focuses heavily on the transactional guest journey (check-in, tipping, authorizations). Butler AI focuses on the experiential journey—conversational AI, voice requests, and operational routing." },
      { question: "Do both platforms integrate with PMS?", answer: "Yes, both Butler AI and Canary offer deep integrations with major Property Management Systems." },
      { question: "Does Canary have Voice AI?", answer: "At this time, Canary focuses primarily on text and web-based interactions, whereas Butler AI offers robust Voice AI capabilities." },
      { question: "What hotels is Butler AI designed for?", answer: "Butler AI is designed for modern hotels, boutique properties, and resorts that want to automate guest service requests while maintaining a high-touch feel." },
      { question: "Can I use both?", answer: "Yes, some hotels use Canary for check-in and Butler AI for in-room concierge and request routing." }
    ]
  },
  {
    slug: "duve",
    name: "Duve",
    shortDescription: "A holistic guest experience platform offering personalized digital journeys, check-in, and smart upselling.",
    website: "https://duve.com",
    focusAreas: ["Guest Journey", "Digital Check-in", "Upselling"],
    verdict: {
      competitorStrength: "If you need highly customized, segmented guest journeys and sophisticated pre-arrival check-in flows, Duve offers a powerful engine.",
      butlerStrength: "If you want frictionless in-stay voice AI, intelligent request routing for staff, and a sleek, modern UI, Butler AI excels."
    },
    features: [
      {
        category: "Core Capabilities",
        features: [
          { name: "Guest Messaging", butler: true, competitor: true },
          { name: "Voice AI", butler: true, competitor: false },
          { name: "Text AI", butler: true, competitor: true },
          { name: "Multilingual Support", butler: true, competitor: true },
          { name: "Digital Check-in", butler: "partial", competitor: true }
        ]
      },
      {
        category: "Operations",
        features: [
          { name: "PMS Integrations", butler: true, competitor: true },
          { name: "Housekeeping Routing", butler: true, competitor: "Contact Vendor" },
          { name: "Maintenance Requests", butler: true, competitor: "Contact Vendor" },
          { name: "Food Ordering", butler: true, competitor: "partial" },
          { name: "Upselling", butler: true, competitor: true }
        ]
      },
      {
        category: "System",
        features: [
          { name: "API Availability", butler: true, competitor: true },
          { name: "Custom Branding", butler: true, competitor: true },
          { name: "Setup Complexity", butler: "Low", competitor: "Medium" }
        ]
      }
    ],
    bestFor: [
      {
        type: "Enterprise Hotels",
        recommendation: "Duve's extensive guest segmentation and journey mapping are great for complex, multi-property portfolios."
      },
      {
        type: "Boutique Hotels",
        recommendation: "Butler AI provides a highly modern, frictionless in-room QR and Voice experience that delights guests instantly."
      },
      {
        type: "Independent Hotels",
        recommendation: "Butler AI's fast time-to-value and integrated request routing makes daily operations significantly easier for small teams."
      }
    ],
    faqs: [
      { question: "What is the difference between Duve and Butler AI?", answer: "Duve is primarily a guest journey and check-in platform. Butler AI is an AI-first concierge focused on automating in-stay requests and staff operations." },
      { question: "Do they both offer AI chatbots?", answer: "Yes, both offer AI text chat, but Butler AI also provides advanced multilingual Voice AI." },
      { question: "Is Butler AI easier to set up?", answer: "Butler AI is designed for rapid deployment, often taking just days to configure and launch compared to more complex journey-mapping tools." },
      { question: "Do guests need an app for either?", answer: "Neither platform requires guests to download a native mobile app." },
      { question: "How does pricing compare?", answer: "Butler AI offers transparent, flat per-room pricing. For Duve's pricing, you must contact their sales team." }
    ]
  },
  {
    slug: "quicktext",
    name: "Quicktext",
    shortDescription: "An AI hospitality chatbot focused on driving direct bookings and answering guest queries across messaging channels.",
    website: "https://www.quicktext.im",
    focusAreas: ["Direct Bookings", "Omnichannel Chat", "AI Chatbot"],
    verdict: {
      competitorStrength: "If your primary goal is capturing direct bookings on your website and you need integration with booking engines, Quicktext is strongly optimized for this.",
      butlerStrength: "If you are looking for an in-stay operational tool to handle guest service requests, voice interactions, and internal staff routing, Butler AI is the better fit."
    },
    features: [
      {
        category: "Features",
        features: [
          { name: "Guest Messaging", butler: true, competitor: true },
          { name: "Voice AI", butler: true, competitor: false },
          { name: "Text AI", butler: true, competitor: true },
          { name: "Direct Booking Focus", butler: "partial", competitor: true },
          { name: "QR Code Concierge", butler: true, competitor: "partial" }
        ]
      },
      {
        category: "Operations",
        features: [
          { name: "PMS Integrations", butler: true, competitor: true },
          { name: "Housekeeping Routing", butler: true, competitor: false },
          { name: "Maintenance Requests", butler: true, competitor: false },
          { name: "Analytics", butler: true, competitor: true }
        ]
      }
    ],
    bestFor: [
      {
        type: "Enterprise Hotels",
        recommendation: "Quicktext is excellent for hotel groups wanting to centralize omnichannel chat and boost direct web conversions."
      },
      {
        type: "Boutique Hotels",
        recommendation: "Butler AI elevates the in-stay experience with beautifully designed digital concierges and voice."
      },
      {
        type: "Independent Hotels",
        recommendation: "If you need operational help (housekeeping/maintenance routing), Butler AI is superior. If you just need a website chatbot, consider Quicktext."
      }
    ],
    faqs: [
      { question: "Is Quicktext or Butler AI better for operations?", answer: "Butler AI is significantly better for operations, offering direct routing for housekeeping, maintenance, and room service." },
      { question: "Does Quicktext handle Voice AI?", answer: "No, Quicktext is primarily a text-based omnichannel chatbot." },
      { question: "Which is better for direct bookings?", answer: "Quicktext is highly optimized for the pre-stay booking phase and integrates deeply with booking engines." },
      { question: "Can Butler AI answer FAQs?", answer: "Yes, Butler AI uses advanced AI to answer hotel FAQs accurately based on your knowledge base." },
      { question: "What channels do they support?", answer: "Both support web chat and major messaging platforms, though Quicktext specializes heavily in omnichannel distribution." }
    ]
  },
  {
    slug: "asksuite",
    name: "Asksuite",
    shortDescription: "An omnichannel customer service platform for hotels, primarily focused on reservation teams and direct sales.",
    website: "https://asksuite.com",
    focusAreas: ["Reservation Chatbots", "Omnichannel", "Direct Sales"],
    verdict: {
      competitorStrength: "If you want to empower your reservation agents with a specialized omnichannel inbox to close more direct sales, Asksuite is top-tier.",
      butlerStrength: "If your goal is to automate the on-property experience, manage staff tasks, and offer guests modern voice and QR interfaces, Butler AI is the right choice."
    },
    features: [
      {
        category: "Features",
        features: [
          { name: "Guest Messaging", butler: true, competitor: true },
          { name: "Voice AI", butler: true, competitor: false },
          { name: "Text AI", butler: true, competitor: true },
          { name: "Sales Focus", butler: "partial", competitor: true },
          { name: "In-stay Operations", butler: true, competitor: "partial" }
        ]
      },
      {
        category: "Operations",
        features: [
          { name: "PMS Integrations", butler: true, competitor: true },
          { name: "Housekeeping Routing", butler: true, competitor: false },
          { name: "Maintenance Requests", butler: true, competitor: false }
        ]
      }
    ],
    bestFor: [
      {
        type: "Enterprise Hotels",
        recommendation: "Asksuite is great for large reservation call centers needing to manage multiple messaging channels."
      },
      {
        type: "Boutique Hotels",
        recommendation: "Butler AI provides a superior on-property experience that aligns with high-end boutique service."
      },
      {
        type: "Independent Hotels",
        recommendation: "Butler AI helps small teams manage daily operations, whereas Asksuite helps small teams capture bookings."
      }
    ],
    faqs: [
      { question: "What is the difference between Asksuite and Butler AI?", answer: "Asksuite is primarily a pre-stay sales and reservation chatbot. Butler AI is an in-stay digital concierge and operations platform." },
      { question: "Does Asksuite do voice?", answer: "Asksuite focuses on text-based messaging (WhatsApp, Web, Social)." },
      { question: "Which platform is better for on-property requests?", answer: "Butler AI is explicitly designed for on-property requests, routing tasks directly to hotel staff departments." },
      { question: "Can Butler AI help with bookings?", answer: "While Butler AI can answer questions and direct users to booking engines, it is optimized for the in-stay experience." },
      { question: "How fast is deployment?", answer: "Butler AI can be deployed in days with minimal setup." }
    ]
  },
  {
    slug: "bookboost",
    name: "Bookboost",
    shortDescription: "A unified guest messaging and CRM platform designed to centralize guest data and communications.",
    website: "https://bookboost.io",
    focusAreas: ["CRM", "Unified Inbox", "Guest Messaging"],
    verdict: {
      competitorStrength: "If you need a robust hospitality CRM combined with a unified messaging inbox for marketing campaigns, Bookboost is a strong contender.",
      butlerStrength: "If you are focused on AI automation, voice capabilities, and operational task routing without needing a heavy CRM, Butler AI is more agile."
    },
    features: [
      {
        category: "Features",
        features: [
          { name: "Guest Messaging", butler: true, competitor: true },
          { name: "Voice AI", butler: true, competitor: false },
          { name: "CRM Capabilities", butler: "partial", competitor: true },
          { name: "Housekeeping Routing", butler: true, competitor: "Contact Vendor" }
        ]
      }
    ],
    bestFor: [
      { type: "Enterprise Hotels", recommendation: "Bookboost's CRM capabilities are excellent for managing guest profiles across groups." },
      { type: "Boutique Hotels", recommendation: "Butler AI offers a more modern, frictionless guest interface." },
      { type: "Independent Hotels", recommendation: "Butler AI is generally easier to set up for independent properties without complex CRM needs." }
    ],
    faqs: [
      { question: "Is Bookboost a CRM?", answer: "Yes, Bookboost acts as both a unified messaging platform and a CRM." },
      { question: "Does Butler AI have a CRM?", answer: "Butler AI maintains guest profiles and history but is primarily an AI concierge rather than a full marketing CRM." }
    ]
  },
  {
    slug: "guestchat",
    name: "GuestChat",
    shortDescription: "A straightforward chatbot solution for hotel websites to answer FAQs and drive bookings.",
    website: "https://guestchat.com",
    focusAreas: ["Website Chat", "FAQs", "Bookings"],
    verdict: {
      competitorStrength: "If you want a simple, widget-based chatbot for your website at a low cost, GuestChat is a viable entry-level option.",
      butlerStrength: "If you want an enterprise-grade AI that handles in-stay operations, voice requests, and complex routing, Butler AI is a vastly superior platform."
    },
    features: [
      {
        category: "Features",
        features: [
          { name: "Guest Messaging", butler: true, competitor: true },
          { name: "Voice AI", butler: true, competitor: false },
          { name: "Housekeeping Routing", butler: true, competitor: false },
          { name: "Premium UI", butler: true, competitor: false }
        ]
      }
    ],
    bestFor: [
      { type: "Enterprise Hotels", recommendation: "Butler AI provides the scale and operational integrations large hotels require." },
      { type: "Boutique Hotels", recommendation: "Butler AI's premium design aligns much better with boutique aesthetics." },
      { type: "Independent Hotels", recommendation: "GuestChat is fine for a basic website widget, but Butler AI transforms actual hotel operations." }
    ],
    faqs: [
      { question: "Is GuestChat or Butler AI more advanced?", answer: "Butler AI is a significantly more advanced platform, utilizing modern GenAI and voice capabilities compared to simple FAQ bots." }
    ]
  },
  {
    slug: "smartcon-solutions",
    name: "Smartcon Solutions",
    shortDescription: "Providers of smart room technology and integrated hospitality systems.",
    website: "#",
    focusAreas: ["Smart Rooms", "IoT Integration", "Hospitality Systems"],
    verdict: {
      competitorStrength: "If you are looking for physical IoT hardware integrations and smart room controls, Smartcon is a hardware-focused provider.",
      butlerStrength: "If you want a cloud-native, software-first AI platform that requires zero hardware installation, Butler AI is the modern approach."
    },
    features: [
      {
        category: "Features",
        features: [
          { name: "Guest Messaging", butler: true, competitor: "Contact Vendor" },
          { name: "Voice AI", butler: true, competitor: "Contact Vendor" },
          { name: "Hardware Required", butler: false, competitor: true },
          { name: "Cloud Infrastructure", butler: true, competitor: "partial" }
        ]
      }
    ],
    bestFor: [
      { type: "Enterprise Hotels", recommendation: "Smartcon is suited for physical retrofits of smart room technology." },
      { type: "Boutique Hotels", recommendation: "Butler AI requires no hardware, making it instantly deployable." },
      { type: "Independent Hotels", recommendation: "Butler AI's software-only approach avoids heavy capital expenditure." }
    ],
    faqs: [
      { question: "Do I need to buy hardware for Butler AI?", answer: "No, Butler AI is a 100% cloud-based software solution accessed via web and QR codes." }
    ]
  },
  {
    slug: "hotelfriend",
    name: "HotelFriend",
    shortDescription: "A cloud-based property management software and guest app provider.",
    website: "https://hotelfriend.com",
    focusAreas: ["PMS", "Guest App", "POS"],
    verdict: {
      competitorStrength: "If you are looking for a traditional all-in-one PMS that includes a downloadable guest app, HotelFriend provides a broad suite.",
      butlerStrength: "If you prefer best-in-class AI, app-less QR interactions, and modern conversational interfaces that integrate with your existing PMS, Butler AI is superior."
    },
    features: [
      {
        category: "Features",
        features: [
          { name: "Guest Messaging", butler: true, competitor: true },
          { name: "Voice AI", butler: true, competitor: false },
          { name: "App Download Required", butler: false, competitor: true },
          { name: "AI Focus", butler: true, competitor: false }
        ]
      }
    ],
    bestFor: [
      { type: "Enterprise Hotels", recommendation: "Butler AI integrates seamlessly into existing enterprise tech stacks." },
      { type: "Boutique Hotels", recommendation: "Guests prefer Butler AI's frictionless web experience over downloading a specific hotel app." },
      { type: "Independent Hotels", recommendation: "Both offer solutions, but Butler AI focuses heavily on automating the guest service aspect." }
    ],
    faqs: [
      { question: "Does Butler AI require an app download?", answer: "No, guests simply scan a QR code to interact with Butler AI via their browser." }
    ]
  },
  {
    slug: "akia",
    name: "Akia",
    shortDescription: "A text messaging platform utilizing mini-apps for hotel guest engagement.",
    website: "https://www.akia.com",
    focusAreas: ["SMS Messaging", "Mini-apps", "Guest Engagement"],
    verdict: {
      competitorStrength: "If your strategy revolves heavily around outbound SMS text messaging and applets for specific workflows, Akia is a strong text-based tool.",
      butlerStrength: "If you want true conversational Voice AI, a unified digital concierge interface, and deep automated task routing, Butler AI offers a richer experience."
    },
    features: [
      {
        category: "Features",
        features: [
          { name: "Guest Messaging", butler: true, competitor: true },
          { name: "Voice AI", butler: true, competitor: false },
          { name: "SMS Focus", butler: "partial", competitor: true },
          { name: "Housekeeping Routing", butler: true, competitor: "partial" }
        ]
      }
    ],
    bestFor: [
      { type: "Enterprise Hotels", recommendation: "Both platforms scale well, but Butler AI's voice capabilities offer a more premium touch." },
      { type: "Boutique Hotels", recommendation: "Butler AI's unified UI feels more cohesive than disjointed text message links." },
      { type: "Independent Hotels", recommendation: "Butler AI handles inbound requests automatically, saving independent staff significant time." }
    ],
    faqs: [
      { question: "How does Butler AI differ from Akia?", answer: "Akia is heavily focused on SMS messaging and sending links. Butler AI provides a complete AI-driven web concierge with voice and text." }
    ]
  },
  {
    slug: "revinate-ivy",
    name: "Revinate Ivy",
    shortDescription: "An SMS-based AI text concierge that integrates with Revinate's broader marketing suite.",
    website: "https://www.revinate.com/ivy",
    focusAreas: ["SMS Concierge", "Marketing Integration", "Text AI"],
    verdict: {
      competitorStrength: "If you already use Revinate's marketing platform and want a tightly integrated SMS chatbot, Ivy makes sense.",
      butlerStrength: "If you want a standalone, premium AI concierge with voice capabilities, QR access, and a more modern interface than plain SMS, choose Butler AI."
    },
    features: [
      {
        category: "Features",
        features: [
          { name: "Guest Messaging", butler: true, competitor: true },
          { name: "Voice AI", butler: true, competitor: false },
          { name: "Marketing CRM", butler: "partial", competitor: true },
          { name: "Premium UI", butler: true, competitor: false }
        ]
      }
    ],
    bestFor: [
      { type: "Enterprise Hotels", recommendation: "Ivy is great if the enterprise is already locked into the Revinate ecosystem." },
      { type: "Boutique Hotels", recommendation: "Butler AI offers a much richer visual and voice experience than standard SMS." },
      { type: "Independent Hotels", recommendation: "Butler AI is easier to adopt standalone without needing a massive marketing CRM." }
    ],
    faqs: [
      { question: "Is Ivy SMS only?", answer: "Ivy is primarily an SMS-based text messaging bot, whereas Butler AI offers rich web interfaces and voice." }
    ]
  },
  {
    slug: "monscierge",
    name: "Monscierge",
    shortDescription: "A hospitality platform providing digital signage, mobile apps, and Apple TV integrations.",
    website: "https://monscierge.com",
    focusAreas: ["Apple TV", "Digital Signage", "Guest Apps"],
    verdict: {
      competitorStrength: "If your strategy requires in-room Apple TV integrations and physical digital signage in the lobby, Monscierge specializes in this.",
      butlerStrength: "If you want a lightweight, AI-driven, bring-your-own-device (BYOD) solution that requires no hardware, Butler AI is the modern choice."
    },
    features: [
      {
        category: "Features",
        features: [
          { name: "Guest Messaging", butler: true, competitor: true },
          { name: "Voice AI", butler: true, competitor: "Contact Vendor" },
          { name: "Hardware Integration", butler: false, competitor: true },
          { name: "Cloud AI Focus", butler: true, competitor: "partial" }
        ]
      }
    ],
    bestFor: [
      { type: "Enterprise Hotels", recommendation: "Monscierge is good for large hardware rollouts." },
      { type: "Boutique Hotels", recommendation: "Butler AI avoids hardware clutter, utilizing the guest's own smartphone." },
      { type: "Independent Hotels", recommendation: "Butler AI requires zero hardware investment, making it highly cost-effective." }
    ],
    faqs: [
      { question: "Does Butler AI require in-room tablets?", answer: "No, Butler AI is designed for the guest's own smartphone, eliminating hardware costs and maintenance." }
    ]
  },
  {
    slug: "crave-interactive",
    name: "Crave Interactive",
    shortDescription: "A provider of in-room tablets and digital guest directories for hotels.",
    website: "https://craveinteractive.com",
    focusAreas: ["In-room Tablets", "Digital Directories", "F&B Ordering"],
    verdict: {
      competitorStrength: "If you specifically want to install physical tablets in every hotel room for F&B ordering, Crave is a market leader.",
      butlerStrength: "If you want to eliminate hardware maintenance, reduce capital expenditure, and use AI to handle requests via the guest's own device, Butler AI is the future-proof choice."
    },
    features: [
      {
        category: "Features",
        features: [
          { name: "Guest Messaging", butler: true, competitor: true },
          { name: "Voice AI", butler: true, competitor: false },
          { name: "In-room Tablets", butler: false, competitor: true },
          { name: "F&B Ordering", butler: true, competitor: true }
        ]
      }
    ],
    bestFor: [
      { type: "Enterprise Hotels", recommendation: "Crave offers robust tablet management for luxury resorts willing to invest in hardware." },
      { type: "Boutique Hotels", recommendation: "Butler AI provides a seamless QR experience without the footprint of a tablet." },
      { type: "Independent Hotels", recommendation: "Butler AI saves independents thousands in upfront hardware costs." }
    ],
    faqs: [
      { question: "Are QR codes better than in-room tablets?", answer: "QR codes are zero-maintenance, hygienic, and guests prefer using their own familiar devices. Tablets require charging, updates, and eventual replacement." }
    ]
  },
  {
    slug: "iris",
    name: "IRIS",
    shortDescription: "A digital F&B ordering and guest directory platform for the hospitality industry.",
    website: "https://www.iris.net",
    focusAreas: ["Mobile Dining", "F&B Ordering", "Guest Directory"],
    verdict: {
      competitorStrength: "If you operate massive resorts where complex mobile food and beverage ordering is the absolute primary requirement, IRIS is highly specialized in F&B.",
      butlerStrength: "If you want a complete AI concierge that handles F&B alongside maintenance, housekeeping, voice requests, and staff routing, Butler AI offers a more holistic AI platform."
    },
    features: [
      {
        category: "Features",
        features: [
          { name: "Guest Messaging", butler: true, competitor: "partial" },
          { name: "Voice AI", butler: true, competitor: false },
          { name: "F&B Ordering", butler: true, competitor: true },
          { name: "AI Request Routing", butler: true, competitor: false }
        ]
      }
    ],
    bestFor: [
      { type: "Enterprise Hotels", recommendation: "IRIS is excellent for F&B-heavy resorts." },
      { type: "Boutique Hotels", recommendation: "Butler AI provides a more conversational, personalized concierge experience." },
      { type: "Independent Hotels", recommendation: "Butler AI handles all hotel operations, not just dining." }
    ],
    faqs: [
      { question: "Does Butler AI handle room service?", answer: "Yes, guests can order food and amenities through Butler AI's interface." }
    ]
  },
  {
    slug: "guestu",
    name: "GuestU",
    shortDescription: "A provider of white-label mobile apps and web apps for hotels.",
    website: "https://www.guestu.com",
    focusAreas: ["Mobile Apps", "Web Apps", "Digital Concierge"],
    verdict: {
      competitorStrength: "If your brand mandate requires having your own downloadable app in the App Store, GuestU provides solid white-label app development.",
      butlerStrength: "If you recognize that guests rarely download hotel apps and prefer instant web-based QR access powered by smart AI, Butler AI drives much higher guest adoption."
    },
    features: [
      {
        category: "Features",
        features: [
          { name: "Guest Messaging", butler: true, competitor: true },
          { name: "Voice AI", butler: true, competitor: false },
          { name: "Native App Store", butler: false, competitor: true },
          { name: "AI Focus", butler: true, competitor: "partial" }
        ]
      }
    ],
    bestFor: [
      { type: "Enterprise Hotels", recommendation: "Large chains sometimes still require native apps, which GuestU provides." },
      { type: "Boutique Hotels", recommendation: "Butler AI's zero-download approach ensures 5x higher guest usage." },
      { type: "Independent Hotels", recommendation: "Butler AI is much faster to deploy and requires no app store approvals." }
    ],
    faqs: [
      { question: "Why doesn't Butler AI use a native app?", answer: "Industry data shows less than 10% of guests download hotel apps. Butler AI uses progressive web apps (PWA) via QR code to ensure nearly 100% accessibility." }
    ]
  }
];
