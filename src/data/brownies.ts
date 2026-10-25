export interface BrownieItem {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  price: string;
  image: string;
  badge?: string;
  cocoaPercentage: string;
  flavorNotes: string[];
}

export const SIGNATURE_BROWNIES: BrownieItem[] = [
  {
    id: 'classic-fudge',
    name: 'Artisan Double Fudge',
    subtitle: '70% Single-Origin Valrhona Cocoa',
    description: 'Our iconic signature square with a paper-thin crackly crust, rich dense fudgy center, and molten dark chocolate chunks.',
    price: '₹199 / piece',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=1200&auto=format&fit=crop',
    badge: 'Bestseller',
    cocoaPercentage: '72% Dark',
    flavorNotes: ['Madagascar Vanilla', 'Roasted Cocoa', 'Flaky Sea Salt'],
  },
  {
    id: 'salted-caramel',
    name: 'Salted Caramel Pecan Swirl',
    subtitle: 'Slow-Cooked Amber Caramel',
    description: 'Buttery caramel ribbon folded into dark chocolate batter, crowned with toasted buttered pecans and Brittany fleur de sel.',
    price: '₹229 / piece',
    image: 'https://images.unsplash.com/photo-1515037893149-de7f840978e2?q=80&w=1200&auto=format&fit=crop',
    badge: 'Chef Favorite',
    cocoaPercentage: '65% Dark',
    flavorNotes: ['Burnt Sugar', 'Buttery Pecan', 'Fleur de Sel'],
  },
  {
    id: 'raspberry-ganache',
    name: 'Wild Raspberry Ganache',
    subtitle: 'Fresh Berry Coulis & Cocoa',
    description: 'Tart mountain raspberry preserve layered inside a velvety dark chocolate ganache brownie for a luxurious fruity contrast.',
    price: '₹249 / piece',
    image: 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?q=80&w=1200&auto=format&fit=crop',
    badge: 'Seasonal',
    cocoaPercentage: '68% Dark',
    flavorNotes: ['Wild Raspberry', 'Bright Acid', 'Silky Ganache'],
  },
  {
    id: 'espresso-truffle',
    name: 'Midnight Espresso Truffle',
    subtitle: 'Infused with Ethiopian Arabica',
    description: 'Deep, bittersweet roasted espresso bean extract infused into dense cocoa batter, finished with dark espresso dusting.',
    price: '₹229 / piece',
    image: 'https://images.unsplash.com/photo-1589218436045-ee320057f443?q=80&w=1200&auto=format&fit=crop',
    badge: 'Intense',
    cocoaPercentage: '80% Cocoa',
    flavorNotes: ['Dark Roast', 'Smoked Cocoa', 'Cacao Nibs'],
  },
  {
    id: 'hazelnut-praline',
    name: 'Piedmont Hazelnut Praline',
    subtitle: 'Slow-Roasted Hazelnut Crisp',
    description: 'Crunchy caramelized hazelnut crunch blended with milk chocolate chunks and our signature dark brownie foundation.',
    price: '₹259 / piece',
    image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?q=80&w=1200&auto=format&fit=crop',
    badge: 'Award Winner',
    cocoaPercentage: '60% Blend',
    flavorNotes: ['Roasted Hazelnut', 'Caramel Crunch', 'Creamy Milk Chocolate'],
  },
  {
    id: 'pistachio-rose',
    name: 'Bronte Pistachio & Persian Rose',
    subtitle: 'Sicilian Pistachio Paste & Edible Petals',
    description: 'Stone-ground emerald Bronte pistachio folded through white chocolate fudge and topped with sun-dried Persian rose petals.',
    price: '₹269 / piece',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=1200&auto=format&fit=crop',
    badge: 'Limited Batch',
    cocoaPercentage: '58% White & Dark',
    flavorNotes: ['Pistachio Cream', 'Floral Rose', 'Cardamom Essence'],
  },
  {
    id: 'tahini-sea-salt',
    name: 'Roasted Sesame Tahini Swirl',
    subtitle: 'Artisan Toasted Sesame & Dark Chocolate',
    description: 'Nutty stone-milled sesame tahini marble blended through rich 74% cocoa brownie batter with crunchy toasted black sesame.',
    price: '₹239 / piece',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1200&auto=format&fit=crop',
    badge: 'Artisan',
    cocoaPercentage: '74% Dark',
    flavorNotes: ['Nutty Tahini', 'Smoked Sesame', 'Maldon Salt'],
  },
  {
    id: 'bourbon-walnut',
    name: 'Aged Bourbon & Smoked Walnut',
    subtitle: 'Oak-Barrel Bourbon Reduction',
    description: 'Kentucky oak-barrel bourbon reduced with raw demerara sugar, slow-folded with slow-roasted Californian walnuts.',
    price: '₹259 / piece',
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=1200&auto=format&fit=crop',
    badge: 'Connoisseur',
    cocoaPercentage: '75% Dark',
    flavorNotes: ['Warm Bourbon', 'Toasted Walnut', 'Caramelized Oak'],
  },
  {
    id: 'orange-blossom-dark',
    name: 'Seville Orange Blossom & Dark Cacao',
    subtitle: 'Candied Citrus Peel & 75% Cocoa',
    description: 'Slow-simmered Seville orange peel ribbons and aromatic orange blossom water paired with bittersweet single-plantation dark cacao.',
    price: '₹249 / piece',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200&auto=format&fit=crop',
    badge: 'Citrus Edition',
    cocoaPercentage: '75% Dark',
    flavorNotes: ['Zesty Orange', 'Bitter Cocoa', 'Aromatic Blossom'],
  },
  {
    id: 'matcha-white-swirl',
    name: 'Ceremonial Uji Matcha Swirl',
    subtitle: 'First-Harvest Kyoto Green Tea',
    description: 'First-harvest stone-ground Kyoto matcha layered in jade ribbons with Belgian cocoa butter white chocolate and dark fudge.',
    price: '₹269 / piece',
    image: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?q=80&w=1200&auto=format&fit=crop',
    badge: 'Exotic Swirl',
    cocoaPercentage: '64% Hybrid',
    flavorNotes: ['Uji Matcha', 'Sweet Cream', 'Velvety Cocoa'],
  },
];

export interface BakingClassInfo {
  id: string;
  title: string;
  level: string;
  duration: string;
  price: string;
  description: string;
  dates: string[];
}

export const BAKING_CLASSES: BakingClassInfo[] = [
  {
    id: 'brownie-mastery',
    title: 'Artisan Brownie Mastery',
    level: 'Beginner to Intermediate',
    duration: '3.5 Hours',
    price: '₹2,499',
    description: 'Learn the exact science of crackly crusts, rich fudgy textures, cocoa blooming, and temperature mastery with head baker Elena.',
    dates: [
      'Saturday, Nov 1st • 10:00 AM',
      'Sunday, Nov 9th • 2:00 PM',
      'Saturday, Nov 15th • 10:00 AM',
      'Sunday, Nov 23rd • 2:00 PM',
    ],
  },
  {
    id: 'artisan-caramels-swirls',
    title: 'Artisan Caramels & Sea Salt Swirls',
    level: 'All Levels',
    duration: '3 Hours',
    price: '₹2,199',
    description: 'Craft smooth homemade sea salt caramels, ribbon swirls, ganache injections, and gourmet chocolate temperings.',
    dates: [
      'Sunday, Nov 2nd • 11:00 AM',
      'Saturday, Nov 8th • 3:00 PM',
      'Sunday, Nov 16th • 11:00 AM',
      'Saturday, Nov 22nd • 3:00 PM',
    ],
  },
  {
    id: 'teen-baking-camp',
    title: 'Junior & Teen Baker Masterclass',
    level: 'Kids & Teens (Ages 10-18)',
    duration: '2.5 Hours',
    price: '₹1,899',
    description: 'A fun, hands-on masterclass covering kitchen safety, batter whipping, cookie-brownie hybrids, and decorating flair.',
    dates: [
      'Saturday, Nov 1st • 3:30 PM',
      'Saturday, Nov 8th • 10:30 AM',
      'Sunday, Nov 15th • 3:30 PM',
      'Saturday, Nov 29th • 10:30 AM',
    ],
  },
];

