// Shop details. Fill these in when the shop confirms them.
export const SHOP = {
  name: 'Leikoi Kromatics',
  // WhatsApp number with country code and no plus sign, e.g. '919876543210'.
  // While empty, the order buttons open WhatsApp and let the visitor pick the chat.
  whatsapp: '',
  // Instagram handle without the @. While empty, the button opens instagram.com.
  instagram: '',
  place: 'Imphal, Manipur',
}

export const asset = (p) => import.meta.env.BASE_URL + p

export function waLink(text) {
  const base = SHOP.whatsapp ? `https://wa.me/${SHOP.whatsapp}` : 'https://wa.me/'
  return `${base}?text=${encodeURIComponent(text)}`
}

export function igLink() {
  return SHOP.instagram ? `https://www.instagram.com/${SHOP.instagram}/` : 'https://www.instagram.com/'
}
