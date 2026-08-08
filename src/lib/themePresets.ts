export interface ColorTheme {
  name: string;
  primaryColor: string;
  secondaryColor: string;
}

export const COLOR_THEMES: ColorTheme[] = [
  { name: 'Bleu Océan', primaryColor: '#0B5FFF', secondaryColor: '#DCE9FF' },
  { name: 'Vert Émeraude', primaryColor: '#059669', secondaryColor: '#D1FAE5' },
  { name: 'Rouge Grenat', primaryColor: '#B91C1C', secondaryColor: '#FEE2E2' },
  { name: 'Violet Royal', primaryColor: '#6D28D9', secondaryColor: '#EDE9FE' },
  { name: 'Orange Soleil', primaryColor: '#EA580C', secondaryColor: '#FFEDD5' },
  { name: 'Bleu Nuit', primaryColor: '#0F172A', secondaryColor: '#E2E8F0' },
  { name: 'Or & Noir', primaryColor: '#111827', secondaryColor: '#FDE68A' },
  { name: 'Rose Corail', primaryColor: '#DB2777', secondaryColor: '#FCE7F3' },
];
