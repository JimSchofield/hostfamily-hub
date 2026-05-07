import "dotenv/config";
import { storage } from "../server/storage";
import { hashPassword } from "../server/auth";

async function seed() {
  const coordinatorEmail = process.env.SEED_COORDINATOR_EMAIL ?? "coordinator@hostfamilyhub.com";
  const coordinatorPassword = process.env.SEED_COORDINATOR_PASSWORD;

  if (!coordinatorPassword) {
    console.error(
      "SEED_COORDINATOR_PASSWORD is not set. Refusing to seed with a hardcoded default. " +
      "Set SEED_COORDINATOR_PASSWORD (and optionally SEED_COORDINATOR_EMAIL) in your env and re-run.",
    );
    process.exit(1);
  }

  const existingCoordinator = await storage.getUserByEmail(coordinatorEmail);
  if (!existingCoordinator) {
    const hashed = await hashPassword(coordinatorPassword);
    await storage.createUser({
      name: "Coordinator",
      email: coordinatorEmail,
      password: hashed,
      role: "coordinator",
      status: "approved",
    });
    console.log(`Seeded coordinator: ${coordinatorEmail}`);
  } else {
    console.log("Coordinator already exists, skipping.");
  }

  const existingPosts = await storage.getPublicPosts();
  if (existingPosts.length === 0) {
    await storage.createPost({
      type: "story",
      authorName: "The Harrison Family",
      userId: null,
      content: "We had a wonderful weekend showing our student around the local farmers market. She was amazed by all the fresh produce and tried her first apple cider donut!",
      isPublic: true,
    });
    await storage.createPost({
      type: "picture",
      authorName: "The Nguyen Family",
      userId: null,
      content: "Hiking trip with our amazing student last weekend! The fall colors were absolutely breathtaking.",
      imageUrl: "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1000&auto=format&fit=crop",
      isPublic: true,
    });
    await storage.createPost({
      type: "question",
      authorName: "Emily R.",
      userId: null,
      content: "What are some good dietary-friendly recipes for our student who is vegetarian? She loves trying new things but we want to make sure we are meeting her nutritional needs.",
      isPublic: false,
    });
    await storage.createPost({
      type: "prayer",
      authorName: "The Torres Family",
      userId: null,
      content: "Please pray for our student who is feeling a bit homesick this week. She misses her family especially during the holidays approaching.",
      isPublic: false,
    });
    console.log("Seeded sample posts.");
  } else {
    console.log("Posts already exist, skipping post seed.");
  }

  console.log("Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
