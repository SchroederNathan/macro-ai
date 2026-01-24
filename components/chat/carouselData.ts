export type CarouselItem = {
  id: string
  emoji: string
  text: string
}

export const carouselRows: CarouselItem[][] = [
  // Row 1 - Meals
  [
    { id: '1-1', emoji: '🌮', text: 'For dinner, I had 2 shrimp tacos' },
    { id: '1-2', emoji: '🍗', text: 'For dinner, I had grilled chicken' },
    { id: '1-3', emoji: '🥤', text: 'I had a protein shake' },
    { id: '1-4', emoji: '🍝', text: 'I ate spaghetti with meatballs' },
    { id: '1-5', emoji: '🥗', text: 'I had a caesar salad for lunch' },
    { id: '1-6', emoji: '🍛', text: 'I had chicken curry with rice' },
  ],
  // Row 2 - Snacks & Breakfast (scrolls opposite direction)
  [
    { id: '2-1', emoji: '🥜', text: 'I snacked on a handful of almonds' },
    { id: '2-2', emoji: '🍳', text: 'For breakfast, I had 2 scrambled eggs' },
    { id: '2-3', emoji: '🍌', text: 'I ate a banana as a snack' },
    { id: '2-4', emoji: '🥣', text: 'I had oatmeal with berries' },
    { id: '2-5', emoji: '🧀', text: 'I had cheese and crackers' },
    { id: '2-6', emoji: '🥑', text: 'I had avocado toast' },
  ],
  // Row 3 - More items
  [
    { id: '3-1', emoji: '🍣', text: 'I had a sushi roll for lunch' },
    { id: '3-2', emoji: '🥪', text: 'I ate a turkey sandwich' },
    { id: '3-3', emoji: '☕', text: 'I had a latte with oat milk' },
    { id: '3-4', emoji: '🍕', text: 'I had 2 slices of pepperoni pizza' },
    { id: '3-5', emoji: '🥩', text: 'I had a steak for dinner' },
    { id: '3-6', emoji: '🍜', text: 'I ate chicken pho' },
  ],
]
