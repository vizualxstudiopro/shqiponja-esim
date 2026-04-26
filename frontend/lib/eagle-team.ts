export interface EagleAvatar {
  id: number;
  name: string;
  region: string;
  role: string;
  useCase: string;
  prompt: string;
}

export const EAGLE_TEAM: EagleAvatar[] = [
  {
    id: 1,
    name: "Bardhyli",
    region: "Malesi",
    role: "Urime & Festa",
    useCase: "Mesazhe festive",
    prompt:
      "3D clay-style Albanian highlander with mustache, plain white plis without text, red vest with black embroidery, warm smile, studio lighting, dark neutral background.",
  },
  {
    id: 2,
    name: "Bato",
    region: "Iliri",
    role: "Suport Teknik",
    useCase: "Harruat fjalekalimin",
    prompt:
      "3D clay-style Albanian guide character with simple white cap and traditional vest, holding a glowing key, friendly expression, studio lighting, dark neutral background.",
  },
  {
    id: 3,
    name: "Glauku",
    region: "Kukes",
    role: "Udherrefyes Blerjeje",
    useCase: "Blerja e paketave",
    prompt:
      "3D clay-style young Albanian character with white plis and modern-traditional vest, holding eSIM card or smartphone, energetic pose, studio lighting, dark neutral background.",
  },
  {
    id: 4,
    name: "Teuta",
    region: "Mirdite",
    role: "Prezantime",
    useCase: "Video guides dhe tutorials",
    prompt:
      "3D clay-style Albanian woman character inspired by xhubleta, elegant professional pose, premium studio lighting, dark neutral background.",
  },
  {
    id: 5,
    name: "Enkela",
    region: "Arbereshe",
    role: "Mireseardhja",
    useCase: "Onboarding dhe emaili i regjistrimit",
    prompt:
      "3D clay-style warm Albanian woman in Arbëresh-inspired attire, open arms welcoming pose, premium studio lighting, dark neutral background.",
  },
  {
    id: 6,
    name: "Agroni",
    region: "Laberi",
    role: "Live Chat",
    useCase: "Asistence ne kohe reale",
    prompt:
      "3D clay-style Albanian support character from Laberia with white cap, approachable and confident, studio lighting, dark neutral background.",
  },
];

export function getEagleAvatarById(id: number): EagleAvatar | undefined {
  return EAGLE_TEAM.find((avatar) => avatar.id === id);
}
