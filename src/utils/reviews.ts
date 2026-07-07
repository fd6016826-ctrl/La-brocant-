export interface UserReview {
  id: string;
  orderId?: string;
  senderEmail: string;
  senderName: string;
  targetEmail: string;
  rating: number; // 1 to 5
  text: string;
  date: string;
}

// Helper to format current date as dd/mm/yyyy
export function getFormattedDate(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

const DEFAULT_GLOBAL_REVIEWS: UserReview[] = [
  {
    id: "seed-rev-1",
    senderEmail: "jean.testeur@gmail.com",
    senderName: "Jean Testeur",
    targetEmail: "sophie.b69@gmail.com",
    rating: 5,
    text: "Acheteur très courtois et ponctuel. Je recommande vivement pour vos ventes !",
    date: "09/06/2026"
  },
  {
    id: "seed-rev-2",
    senderEmail: "sophie.b69@gmail.com",
    senderName: "Sophie B.",
    targetEmail: "jean.testeur@gmail.com",
    rating: 5,
    text: "Excellente communication, l'objet livré était dans un état impeccable, transaction en mains propres agréable.",
    date: "02/06/2026"
  },
  {
    id: "seed-rev-3",
    senderEmail: "marc.dupuis@gmail.com",
    senderName: "Marc Dupuis",
    targetEmail: "sophie.b69@gmail.com",
    rating: 4,
    text: "Rien à redire, négociation dans le respect mutuel. 5/5 stars !",
    date: "24/05/2026"
  },
  {
    id: "seed-rev-4",
    senderEmail: "julie.g@gmail.com",
    senderName: "Julie G.",
    targetEmail: "selena.fleamarket@yahoo.fr",
    rating: 5,
    text: "Super échange, la transaction s'est faite en bas de chez moi en mains propres. L'objet est conforme à la description. Merci !",
    date: "14/06/2026"
  },
  {
    id: "seed-rev-5",
    senderEmail: "remi.k@gmail.com",
    senderName: "Rémi K.",
    targetEmail: "selena.fleamarket@yahoo.fr",
    rating: 4,
    text: "Très poli et ponctuel. Il m'a aidé à transporter l'article à mon coffre de voiture. Je recommande vivement !",
    date: "10/06/2026"
  }
];

export function getAllReviews(): UserReview[] {
  try {
    const stored = localStorage.getItem("brocante_all_reviews");
    if (stored) {
      return JSON.parse(stored);
    }
    // Seed default reviews if not present
    localStorage.setItem("brocante_all_reviews", JSON.stringify(DEFAULT_GLOBAL_REVIEWS));
    return DEFAULT_GLOBAL_REVIEWS;
  } catch {
    return DEFAULT_GLOBAL_REVIEWS;
  }
}

export function saveAllReviews(reviews: UserReview[]) {
  try {
    localStorage.setItem("brocante_all_reviews", JSON.stringify(reviews));
  } catch (e) {
    console.error("Failed to save reviews to localStorage", e);
  }
}

export function getReviewsForUser(email: string): UserReview[] {
  const normalizedEmail = email.toLowerCase().trim();
  const all = getAllReviews();
  return all.filter((r) => r.targetEmail.toLowerCase().trim() === normalizedEmail);
}

export function getRatingForUser(email: string): { rating: string; count: number } {
  const normalizedEmail = email.toLowerCase().trim();
  const userReviews = getReviewsForUser(normalizedEmail);
  
  // Base mathematical calculation to stay aligned with seeded rating structure if there are no/few reviews
  const baseCount = ((normalizedEmail.length * 3) % 19) + 5;
  const baseRating = (normalizedEmail.length * 7) % 5 / 10 + 4.4;

  if (userReviews.length === 0) {
    return {
      rating: baseRating.toFixed(1),
      count: baseCount
    };
  }

  // If there are user-submitted reviews, average them with a weighted contribution from base
  const totalUserRating = userReviews.reduce((sum, r) => sum + r.rating, 0);
  const averageUserRating = totalUserRating / userReviews.length;
  
  // Blend base mathematical rating and real user reviews for realistic display depth
  const blendedRating = (baseRating * 3 + totalUserRating) / (3 + userReviews.length);
  const blendedCount = baseCount + userReviews.length;

  return {
    rating: blendedRating.toFixed(1),
    count: blendedCount
  };
}

export function addReview(review: Omit<UserReview, "id" | "date"> & { orderId?: string }): UserReview {
  const all = getAllReviews();
  const newReview: UserReview = {
    ...review,
    id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: getFormattedDate()
  };
  
  all.unshift(newReview);
  saveAllReviews(all);
  
  // Also sync with 'brocante_user_reviews_left' for legacy compatibility inside AccountManagementModal if needed
  try {
    const legacyStored = localStorage.getItem("brocante_user_reviews_left");
    const legacyReviews = legacyStored ? JSON.parse(legacyStored) : [];
    legacyReviews.unshift({
      id: newReview.id,
      targetEmail: newReview.targetEmail,
      targetName: newReview.senderName, // legacy fields
      rating: newReview.rating,
      text: newReview.text,
      date: newReview.date
    });
    localStorage.setItem("brocante_user_reviews_left", JSON.stringify(legacyReviews));
  } catch (e) {
    console.error(e);
  }

  return newReview;
}
