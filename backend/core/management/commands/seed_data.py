# common/management/commands/seed_data.py
"""
Full-database seed command for the dating/video platform.
Covers: User, UserPhoto, Category, Tag, Video, VideoView, VideoLike,
        Comment, LiveStream, Match, Conversation, Message,
        Payment, VideoAccess, StreamAccess, Notification

Media files are randomly picked from the local backup directory:
    Windows path : D:\\static\\admin\\Backup
    Linux/WSL    : /mnt/d/static/admin/Backup   (adjust if needed)

Run:
    python manage.py seed_data
    python manage.py seed_data --clear   # wipe then re-seed
    python manage.py seed_data --media-root "D:/static/admin/Backup"
"""

import os
import uuid
import random
import decimal
import shutil
from pathlib import Path
from datetime import timedelta, date

from django.core.management.base import BaseCommand
from django.core.files import File
from django.utils import timezone
from django.utils.text import slugify
from django.contrib.auth import get_user_model
from django.conf import settings

# ── adjust this import path to match your actual app label ──────────────────
from core.models import (
    UserPhoto, Category, Tag, Video, VideoView, VideoLike,
    Comment, LiveStream, Match, Conversation, Message,
    Payment, VideoAccess, StreamAccess, Notification,
)

User = get_user_model()

# ────────────────────────────────────────────────────────────────────────────
# File-picker helpers
# ────────────────────────────────────────────────────────────────────────────

# Extensions we treat as images / videos
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".avi", ".mkv", ".mov", ".webm", ".flv", ".wmv"}

# Default backup root – override with --media-root flag or env var BACKUP_ROOT
DEFAULT_BACKUP_ROOT = os.environ.get(
    "BACKUP_ROOT",
    # Works on Windows native, Docker/WSL paths – adjust as needed
    r"D:\static\admin\Backup",
)


def _collect_files(root: str, extensions: set) -> list[Path]:
    """Recursively collect all files under *root* that match *extensions*."""
    root_path = Path(root)
    if not root_path.exists():
        return []
    return [
        p for p in root_path.rglob("*")
        if p.is_file() and p.suffix.lower() in extensions
    ]


def _pick(file_list: list[Path]) -> Path | None:
    """Return a random file from *file_list*, or None if empty."""
    return random.choice(file_list) if file_list else None


def _django_file(path: Path) -> File | None:
    """Open a filesystem path as a Django File object."""
    if path is None:
        return None
    try:
        return File(open(path, "rb"), name=path.name)
    except OSError:
        return None


# ────────────────────────────────────────────────────────────────────────────
# Raw fixture data
# ────────────────────────────────────────────────────────────────────────────

USERS_DATA = [
    {
        "username": "alice_wanjiru",
        "email": "alice@example.com",
        "first_name": "Alice",
        "last_name": "Wanjiru",
        "password": "Pass1234!",
        "gender": "F",
        "date_of_birth": "1996-03-14",
        "bio": "Adventurous soul who loves hiking and cooking. Looking for genuine connections.",
        "height_cm": 165,
        "skin_texture": "brown",
        "body_type": "Athletic",
        "country": "Kenya",
        "city": "Nairobi",
        "latitude": "-1.286389",
        "longitude": "36.817223",
        "relationship_goal": "match",
        "interested_in": "M",
        "min_age_preference": 25,
        "max_age_preference": 40,
        "is_premium": True,
        "is_superuser": True,
        "is_staff": True,
    },
    {
        "username": "brian_otieno",
        "email": "brian@example.com",
        "first_name": "Brian",
        "last_name": "Otieno",
        "password": "Pass1234!",
        "gender": "M",
        "date_of_birth": "1993-07-22",
        "bio": "Tech enthusiast and weekend footballer. Passionate about music and travel.",
        "height_cm": 178,
        "skin_texture": "dark",
        "body_type": "Muscular",
        "country": "Kenya",
        "city": "Mombasa",
        "latitude": "-4.043477",
        "longitude": "39.668206",
        "relationship_goal": "date",
        "interested_in": "F",
        "min_age_preference": 22,
        "max_age_preference": 35,
        "is_premium": False,
    },
    {
        "username": "carol_kamau",
        "email": "carol@example.com",
        "first_name": "Carol",
        "last_name": "Kamau",
        "password": "Pass1234!",
        "gender": "F",
        "date_of_birth": "1999-11-05",
        "bio": "Artist and yoga instructor. I believe in soulful conversations over coffee.",
        "height_cm": 160,
        "skin_texture": "medium",
        "body_type": "Slim",
        "country": "Kenya",
        "city": "Kisumu",
        "latitude": "-0.091702",
        "longitude": "34.767956",
        "relationship_goal": "marriage",
        "interested_in": "M",
        "min_age_preference": 28,
        "max_age_preference": 45,
        "is_premium": True,
    },
    {
        "username": "david_mwangi",
        "email": "david@example.com",
        "first_name": "David",
        "last_name": "Mwangi",
        "password": "Pass1234!",
        "gender": "M",
        "date_of_birth": "1990-01-30",
        "bio": "Entrepreneur and fitness coach. Building empires by day, stargazing by night.",
        "height_cm": 182,
        "skin_texture": "olive",
        "body_type": "Athletic",
        "country": "Kenya",
        "city": "Nakuru",
        "latitude": "-0.303099",
        "longitude": "36.080026",
        "relationship_goal": "casual",
        "interested_in": "F",
        "min_age_preference": 20,
        "max_age_preference": 38,
        "is_premium": False,
    },
    {
        "username": "emily_njeri",
        "email": "emily@example.com",
        "first_name": "Emily",
        "last_name": "Njeri",
        "password": "Pass1234!",
        "gender": "F",
        "date_of_birth": "2001-06-18",
        "bio": "Bookworm and aspiring journalist. Love poetry slams and street food.",
        "height_cm": 158,
        "skin_texture": "light",
        "body_type": "Curvy",
        "country": "Kenya",
        "city": "Eldoret",
        "latitude": "0.520360",
        "longitude": "35.269779",
        "relationship_goal": "match",
        "interested_in": "M",
        "min_age_preference": 22,
        "max_age_preference": 35,
        "is_premium": False,
    },
]

CATEGORIES_DATA = [
    {
        "name": "Dating Tips",
        "slug": "dating-tips",
        "description": "Expert advice on modern dating, relationships and romance.",
        "icon": "bi-heart-fill",
        "meta_title": "Dating Tips & Relationship Advice",
        "meta_description": "Explore the best dating tips to level up your love life.",
    },
    {
        "name": "Lifestyle",
        "slug": "lifestyle",
        "description": "Fashion, fitness, travel and everyday living.",
        "icon": "bi-stars",
        "meta_title": "Lifestyle Videos & Content",
        "meta_description": "Your daily dose of lifestyle inspiration.",
    },
    {
        "name": "Fitness & Health",
        "slug": "fitness-health",
        "description": "Workouts, nutrition and mental wellness content.",
        "icon": "bi-activity",
        "meta_title": "Fitness & Health Videos",
        "meta_description": "Stay fit and healthy with our expert-curated fitness content.",
    },
    {
        "name": "Entertainment",
        "slug": "entertainment",
        "description": "Music, comedy, vlogs and pop culture.",
        "icon": "bi-play-circle-fill",
        "meta_title": "Entertainment Videos",
        "meta_description": "Watch the hottest entertainment videos online.",
    },
    {
        "name": "Travel & Adventure",
        "slug": "travel-adventure",
        "description": "Explore destinations, travel hacks and adventure stories.",
        "icon": "bi-geo-alt-fill",
        "meta_title": "Travel & Adventure Videos",
        "meta_description": "Fuel your wanderlust with amazing travel content.",
    },
]

TAGS_DATA = [
    "romance", "first-date", "relationship-goals", "nairobi", "kenya",
    "fitness", "workout", "travel", "adventure", "lifestyle",
    "comedy", "vlog", "music", "dance", "food",
    "fashion", "beauty", "wellness", "motivation", "premium",
]

VIDEOS_DATA = [
    {
        "title": "5 First Date Tips That Actually Work",
        "description": "Nervous about your first date? These proven tips will help you make a lasting impression and keep the conversation flowing naturally.",
        "access_type": "free",
        "price": "0.00",
        "duration_seconds": 480,
        "is_featured": True,
        "meta_keywords": "first date tips, dating advice, romance",
    },
    {
        "title": "Nairobi Hidden Gems – Date Spots You Must Visit",
        "description": "Discover the most romantic and underrated spots in Nairobi perfect for a memorable date night. From rooftop bars to lakeside cafes.",
        "access_type": "free",
        "price": "0.00",
        "duration_seconds": 720,
        "is_featured": True,
        "meta_keywords": "Nairobi date spots, romantic places Kenya",
    },
    {
        "title": "Morning Yoga Routine for Two – Couple Fitness",
        "description": "Start your mornings together with this relaxing 20-minute couples yoga routine. Great for flexibility and bonding.",
        "access_type": "paid",
        "price": "150.00",
        "duration_seconds": 1200,
        "is_featured": False,
        "meta_keywords": "couples yoga, morning routine, fitness",
    },
    {
        "title": "How to Know If Someone Likes You – Body Language Guide",
        "description": "Learn to read the subtle body language signals that reveal true attraction. A comprehensive guide for modern daters.",
        "access_type": "free",
        "price": "0.00",
        "duration_seconds": 600,
        "is_featured": False,
        "meta_keywords": "body language, attraction signs, dating",
    },
    {
        "title": "Kenyan Street Food Tour – Best Bites Across Nairobi",
        "description": "Join us on an epic street food tour across Nairobi's best neighborhoods. A perfect date idea for food lovers!",
        "access_type": "free",
        "price": "0.00",
        "duration_seconds": 900,
        "is_featured": True,
        "meta_keywords": "street food Nairobi, Kenya food tour",
    },
    {
        "title": "Premium: Advanced Dating Psychology",
        "description": "Deep dive into the psychology of attraction and commitment. Exclusive premium content for serious daters.",
        "access_type": "paid",
        "price": "300.00",
        "duration_seconds": 2400,
        "is_featured": False,
        "meta_keywords": "dating psychology, attraction, premium",
    },
]

LIVESTREAMS_DATA = [
    {
        "title": "Live Q&A: Ask Me Anything About Dating",
        "description": "Interactive live session answering your burning dating questions. Tune in and chat live!",
        "status": "offline",
        "access_price": "0.00",
    },
    {
        "title": "Exclusive: Evening Yoga & Wellness Live",
        "description": "Join our premium live yoga and wellness session. Relaxing, rejuvenating and exclusive.",
        "status": "live",
        "access_price": "200.00",
    },
    {
        "title": "Nairobi Nightlife Tour – Live Stream",
        "description": "We're going live from the hottest spots in Nairobi tonight. Come vibe with us!",
        "status": "ended",
        "access_price": "0.00",
    },
]

COMMENTS_DATA = [
    "This is so helpful, thank you!",
    "I tried this and it actually worked 😍",
    "Great content, keep it up!",
    "Loving this platform, so much value here.",
    "Can you make more videos like this?",
    "This changed my perspective completely.",
    "Sharing this with all my friends!",
    "Nairobi content always hits different 🔥",
    "The tips at 3:20 were gold!",
    "Premium content is absolutely worth it.",
]


# ────────────────────────────────────────────────────────────────────────────
# Management command
# ────────────────────────────────────────────────────────────────────────────

class Command(BaseCommand):
    help = "Seed the database with realistic demo data for all models."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing data before seeding.",
        )
        parser.add_argument(
            "--media-root",
            type=str,
            default=DEFAULT_BACKUP_ROOT,
            help=(
                "Absolute path to the folder containing backup images/videos. "
                f"Default: {DEFAULT_BACKUP_ROOT}"
            ),
        )

    def handle(self, *args, **options):
        backup_root = options["media_root"]

        # ── Collect available files once, reuse everywhere ──────────────────
        self.stdout.write(f"  📂 Scanning backup folder: {backup_root}")
        self.images = _collect_files(backup_root, IMAGE_EXTENSIONS)
        self.videos_files = _collect_files(backup_root, VIDEO_EXTENSIONS)

        if not self.images:
            self.stdout.write(
                self.style.WARNING(
                    f"  ⚠  No images found in '{backup_root}'. "
                    "Image fields will be left blank."
                )
            )
        else:
            self.stdout.write(f"  ✔  Found {len(self.images)} image(s)")

        if not self.videos_files:
            self.stdout.write(
                self.style.WARNING(
                    f"  ⚠  No video files found in '{backup_root}'. "
                    "video_file fields will be left blank."
                )
            )
        else:
            self.stdout.write(f"  ✔  Found {len(self.videos_files)} video file(s)")

        # ── Optional wipe ───────────────────────────────────────────────────
        if options["clear"]:
            self._clear_all()

        self.stdout.write(self.style.MIGRATE_HEADING("\n🌱  Starting seed...\n"))

        users      = self._seed_users()
        categories = self._seed_categories()
        tags       = self._seed_tags()
        videos     = self._seed_videos(users, categories, tags)
        streams    = self._seed_livestreams(users)
        self._seed_user_photos(users)
        self._seed_video_interactions(users, videos)
        self._seed_comments(users, videos)
        self._seed_matches(users)
        convs      = self._seed_conversations(users)
        self._seed_messages(users, convs)
        payments   = self._seed_payments(users, videos, streams)
        self._seed_access_grants(users, videos, streams, payments)
        self._seed_notifications(users)

        self.stdout.write(self.style.SUCCESS("\n✅  Seeding complete!\n"))

    # ── Helpers ──────────────────────────────────────────────────────────────

    def _rand_image(self) -> File | None:
        """Return a random image as a Django File, or None."""
        return _django_file(_pick(self.images))

    def _rand_video(self) -> File | None:
        """Return a random video file as a Django File, or None."""
        return _django_file(_pick(self.videos_files))

    def _assign_image_field(self, instance, field_name: str) -> None:
        """
        Save a random image into *field_name* on *instance* and persist it.
        Skips silently if no images are available or the field is already set.
        """
        if not self.images:
            return
        current = getattr(instance, field_name)
        if current:          # already has a file – skip
            return
        f = self._rand_image()
        if f:
            getattr(instance, field_name).save(f.name, f, save=True)
            f.file.close()

    # ── Clear ────────────────────────────────────────────────────────────────

    def _clear_all(self):
        self.stdout.write(self.style.WARNING("  Clearing existing data…"))
        models_to_clear = [
            Notification, StreamAccess, VideoAccess, Payment,
            Message, Conversation, Match, Comment, VideoLike,
            VideoView, LiveStream, Video, Tag, Category,
            UserPhoto, User,
        ]
        for model in models_to_clear:
            count, _ = model.objects.all().delete()
            self.stdout.write(f"    Deleted {count:>4} rows from {model.__name__}")

    # ── Users ────────────────────────────────────────────────────────────────

    def _seed_users(self):
        self.stdout.write("  → Seeding Users…")
        created = []
        for data in USERS_DATA:
            user, new = User.objects.get_or_create(
                username=data["username"],
                defaults={
                    "email":              data["email"],
                    "first_name":         data["first_name"],
                    "last_name":          data["last_name"],
                    "gender":             data["gender"],
                    "bio":                data["bio"],
                    "height_cm":          data["height_cm"],
                    "skin_texture":       data["skin_texture"],
                    "body_type":          data["body_type"],
                    "country":            data["country"],
                    "city":               data["city"],
                    "latitude":           decimal.Decimal(data["latitude"]),
                    "longitude":          decimal.Decimal(data["longitude"]),
                    "relationship_goal":  data["relationship_goal"],
                    "interested_in":      data["interested_in"],
                    "min_age_preference": data["min_age_preference"],
                    "max_age_preference": data["max_age_preference"],
                    "is_premium":         data["is_premium"],
                    "is_online":          random.choice([True, False]),
                    "last_seen":          timezone.now() - timedelta(minutes=random.randint(1, 1440)),
                    "is_superuser":       data.get("is_superuser", False),
                    "is_staff":           data.get("is_staff", False),
                    "meta_title":         f"{data['first_name']} {data['last_name']} – Profile",
                    "meta_description":   data["bio"][:300],
                },
            )
            if new:
                user.set_password(data["password"])
                y, m, d = data["date_of_birth"].split("-")
                user.date_of_birth = date(int(y), int(m), int(d))
                user.save()

                # ── Assign random profile & cover photos ──────────────────
                self._assign_image_field(user, "profile_photo")
                self._assign_image_field(user, "cover_photo")

                self.stdout.write(f"    Created user: {user.username}")
            else:
                self.stdout.write(f"    Exists  user: {user.username}")
            created.append(user)
        return created

    # ── UserPhotos ───────────────────────────────────────────────────────────

    def _seed_user_photos(self, users):
        self.stdout.write("  → Seeding UserPhotos…")
        captions = [
            "At the beach 🌊", "Hiking day 🏔️", "Coffee time ☕",
            "Night out 🌙", "Fitness mode 💪",
        ]
        total = 0
        for user in users:
            for caption in captions[:3]:
                photo, new = UserPhoto.objects.get_or_create(
                    user=user,
                    caption=caption,
                    defaults={"is_public": True},
                )
                if new and self.images:
                    # Save a random image into the gallery photo
                    f = self._rand_image()
                    if f:
                        photo.image.save(f.name, f, save=True)
                        f.file.close()
                    total += 1
        self.stdout.write(f"    {total} new gallery photos saved.")

    # ── Categories ───────────────────────────────────────────────────────────

    def _seed_categories(self):
        self.stdout.write("  → Seeding Categories…")
        created = []
        for data in CATEGORIES_DATA:
            cat, new = Category.objects.get_or_create(
                slug=data["slug"],
                defaults={
                    "name":             data["name"],
                    "description":      data["description"],
                    "icon":             data["icon"],
                    "meta_title":       data["meta_title"],
                    "meta_description": data["meta_description"],
                },
            )
            created.append(cat)
            label = "Created" if new else "Exists "
            self.stdout.write(f"    {label} category: {cat.name}")
        return created

    # ── Tags ─────────────────────────────────────────────────────────────────

    def _seed_tags(self):
        self.stdout.write("  → Seeding Tags…")
        created = []
        for name in TAGS_DATA:
            tag, _ = Tag.objects.get_or_create(
                slug=slugify(name),
                defaults={"name": name},
            )
            created.append(tag)
        self.stdout.write(f"    {len(created)} tags ready.")
        return created

    # ── Videos ───────────────────────────────────────────────────────────────

    def _seed_videos(self, users, categories, tags):
        self.stdout.write("  → Seeding Videos…")
        created = []
        for i, data in enumerate(VIDEOS_DATA):
            uploader = users[i % len(users)]
            category = categories[i % len(categories)]
            vid_id   = uuid.uuid4()
            slug     = slugify(f"{data['title']}-{str(vid_id)[:8]}")

            video, new = Video.objects.get_or_create(
                slug=slug,
                defaults={
                    "id":               vid_id,
                    "uploader":         uploader,
                    "title":            data["title"],
                    "description":      data["description"],
                    "category":         category,
                    "access_type":      data["access_type"],
                    "price":            decimal.Decimal(data["price"]),
                    "duration_seconds": data["duration_seconds"],
                    "is_published":     True,
                    "is_featured":      data["is_featured"],
                    "views_count":      random.randint(100, 50000),
                    "likes_count":      random.randint(10, 5000),
                    "comments_count":   random.randint(1, 500),
                    "meta_title":       data["title"][:160],
                    "meta_description": data["description"][:300],
                    "meta_keywords":    data["meta_keywords"],
                },
            )
            if new:
                video.tags.set(random.sample(tags, k=random.randint(2, 5)))

                # ── Random thumbnail (image) ──────────────────────────────
                if self.images:
                    f = self._rand_image()
                    if f:
                        video.thumbnail.save(f.name, f, save=False)
                        f.file.close()

                # ── Random video file ─────────────────────────────────────
                if self.videos_files:
                    f = self._rand_video()
                    if f:
                        video.video_file.save(f.name, f, save=False)
                        f.file.close()

                video.save()
                self.stdout.write(f"    Created video: {video.title}")
            created.append(video)
        return created

    # ── LiveStreams ───────────────────────────────────────────────────────────

    def _seed_livestreams(self, users):
        self.stdout.write("  → Seeding LiveStreams…")
        created = []
        for i, data in enumerate(LIVESTREAMS_DATA):
            host  = users[i % len(users)]
            ls_id = uuid.uuid4()
            slug  = slugify(f"{data['title']}-{str(ls_id)[:8]}")

            stream, new = LiveStream.objects.get_or_create(
                slug=slug,
                defaults={
                    "id":               ls_id,
                    "host":             host,
                    "title":            data["title"],
                    "description":      data["description"],
                    "status":           data["status"],
                    "access_price":     decimal.Decimal(data["access_price"]),
                    "viewers_count":    random.randint(0, 800),
                    "stream_key":       uuid.uuid4().hex,
                    "stream_url":       f"https://stream.example.com/live/{ls_id.hex[:12]}",
                    "meta_title":       data["title"][:160],
                    "meta_description": data["description"][:300],
                    "started_at":       timezone.now() - timedelta(hours=random.randint(1, 24))
                                        if data["status"] in ("live", "ended") else None,
                    "ended_at":         timezone.now() - timedelta(minutes=random.randint(5, 120))
                                        if data["status"] == "ended" else None,
                },
            )
            if new:
                # ── Random stream thumbnail ───────────────────────────────
                if self.images:
                    f = self._rand_image()
                    if f:
                        stream.thumbnail.save(f.name, f, save=True)
                        f.file.close()
                self.stdout.write(f"    Created stream: {stream.title}")
            created.append(stream)
        return created

    # ── Video interactions ────────────────────────────────────────────────────

    def _seed_video_interactions(self, users, videos):
        self.stdout.write("  → Seeding VideoViews & VideoLikes…")
        for video in videos:
            for user in random.sample(users, k=random.randint(2, len(users))):
                VideoView.objects.get_or_create(video=video, viewer=user)
            for _ in range(random.randint(3, 10)):
                VideoView.objects.create(
                    video=video,
                    ip_address=(
                        f"197.{random.randint(1,254)}"
                        f".{random.randint(1,254)}"
                        f".{random.randint(1,254)}"
                    ),
                )
            for user in random.sample(users, k=random.randint(1, len(users))):
                VideoLike.objects.get_or_create(video=video, user=user)
        self.stdout.write("    Done.")

    # ── Comments ──────────────────────────────────────────────────────────────

    def _seed_comments(self, users, videos):
        self.stdout.write("  → Seeding Comments…")
        total = 0
        for video in videos:
            top_comments = []
            for _ in range(random.randint(2, 5)):
                c = Comment.objects.create(
                    video=video,
                    author=random.choice(users),
                    body=random.choice(COMMENTS_DATA),
                    likes_count=random.randint(0, 200),
                )
                top_comments.append(c)
                total += 1
            for parent in top_comments[:2]:
                Comment.objects.create(
                    video=video,
                    author=random.choice(users),
                    parent=parent,
                    body=random.choice(COMMENTS_DATA),
                    likes_count=random.randint(0, 50),
                )
                total += 1
        self.stdout.write(f"    {total} comments created.")

    # ── Matches ───────────────────────────────────────────────────────────────

    def _seed_matches(self, users):
        self.stdout.write("  → Seeding Matches…")
        statuses = ["pending", "accepted", "rejected"]
        total    = 0
        for i, sender in enumerate(users):
            for receiver in users[i + 1:]:
                _, new = Match.objects.get_or_create(
                    sender=sender,
                    receiver=receiver,
                    defaults={"status": random.choice(statuses)},
                )
                if new:
                    total += 1
        self.stdout.write(f"    {total} matches created.")

    # ── Conversations & Messages ──────────────────────────────────────────────

    def _seed_conversations(self, users):
        self.stdout.write("  → Seeding Conversations…")
        convs = []
        pairs = [
            (users[i], users[j])
            for i in range(len(users))
            for j in range(i + 1, len(users))
        ]
        for u1, u2 in pairs:
            conv = Conversation.objects.create()
            conv.participants.set([u1, u2])
            convs.append((conv, u1, u2))
        self.stdout.write(f"    {len(convs)} conversations created.")
        return convs

    def _seed_messages(self, users, convs):
        self.stdout.write("  → Seeding Messages…")
        sample_texts = [
            "Hey, how are you doing? 😊",
            "I loved your profile! We should talk more.",
            "Are you free this weekend?",
            "Your vibe is everything 🔥",
            "I watched your video – amazing content!",
            "Would you like to grab coffee sometime?",
            "What do you think about the dating tips video?",
            "I'm in Nairobi too, maybe we can meet!",
            "You seem really interesting, tell me more about yourself.",
            "This platform is great for meeting new people!",
        ]
        total = 0
        for conv, u1, u2 in convs:
            participants = [u1, u2]
            for _ in range(random.randint(3, 8)):
                sender = random.choice(participants)
                msg = Message.objects.create(
                    conversation=conv,
                    sender=sender,
                    body=random.choice(sample_texts),
                    is_read=random.choice([True, False]),
                    created_at=timezone.now() - timedelta(minutes=random.randint(1, 10000)),
                )
                # Occasionally attach a random image to the message
                if self.images and random.random() < 0.25:
                    f = self._rand_image()
                    if f:
                        msg.photo.save(f.name, f, save=True)
                        f.file.close()
                total += 1
        self.stdout.write(f"    {total} messages created.")

    # ── Payments ──────────────────────────────────────────────────────────────

    def _seed_payments(self, users, videos, streams):
        self.stdout.write("  → Seeding Payments…")
        paid_videos  = [v for v in videos  if v.access_type == "paid"]
        paid_streams = [s for s in streams if s.access_price > 0]
        methods      = ["mpesa", "paypal", "card"]
        statuses     = ["pending", "success", "failed"]
        payments     = []

        for user in users:
            for video in paid_videos:
                p = Payment.objects.create(
                    user=user,
                    amount=video.price,
                    currency="KES",
                    method=random.choice(methods),
                    status="success",
                    video=video,
                    gateway_reference=f"REF-{uuid.uuid4().hex[:12].upper()}",
                    mpesa_receipt=(
                        f"QGH{random.randint(100000, 999999)}XYZ"
                        if random.random() > 0.5 else ""
                    ),
                )
                payments.append(p)

            for stream in paid_streams:
                p = Payment.objects.create(
                    user=user,
                    amount=stream.access_price,
                    currency="KES",
                    method=random.choice(methods),
                    status=random.choice(statuses),
                    live_stream=stream,
                    gateway_reference=f"REF-{uuid.uuid4().hex[:12].upper()}",
                )
                payments.append(p)

            Payment.objects.create(
                user=user,
                amount=decimal.Decimal("999.00"),
                currency="KES",
                method="mpesa",
                status="success",
                is_premium_upgrade=True,
                gateway_reference=f"PREMIUM-{uuid.uuid4().hex[:8].upper()}",
                mpesa_receipt=f"PRM{random.randint(100000, 999999)}",
            )

        self.stdout.write(f"    {len(payments)} payments created.")
        return payments

    # ── Access Grants ─────────────────────────────────────────────────────────

    def _seed_access_grants(self, users, videos, streams, payments):
        self.stdout.write("  → Seeding VideoAccess & StreamAccess…")
        paid_videos  = [v for v in videos  if v.access_type == "paid"]
        paid_streams = [s for s in streams if s.access_price > 0]

        va_count = 0
        for user in users:
            for video in paid_videos:
                payment = Payment.objects.filter(
                    user=user, video=video, status="success"
                ).first()
                if payment:
                    _, new = VideoAccess.objects.get_or_create(
                        user=user, video=video,
                        defaults={"payment": payment},
                    )
                    if new:
                        va_count += 1

        sa_count = 0
        for user in users:
            for stream in paid_streams:
                payment = Payment.objects.filter(
                    user=user, live_stream=stream, status="success"
                ).first()
                if payment:
                    _, new = StreamAccess.objects.get_or_create(
                        user=user, stream=stream,
                        defaults={"payment": payment},
                    )
                    if new:
                        sa_count += 1

        self.stdout.write(
            f"    {va_count} VideoAccess, {sa_count} StreamAccess grants created."
        )

    # ── Notifications ─────────────────────────────────────────────────────────

    def _seed_notifications(self, users):
        self.stdout.write("  → Seeding Notifications…")
        notif_templates = [
            ("match",       "💘 {actor} just matched with you!"),
            ("message",     "💬 {actor} sent you a new message."),
            ("like",        "❤️ {actor} liked your video."),
            ("comment",     "🗨️ {actor} commented on your video."),
            ("payment",     "✅ Your payment was processed successfully."),
            ("stream_live", "🔴 {actor} just went live!"),
        ]
        total = 0
        for user in users:
            actors = [u for u in users if u != user]
            for notif_type, template in notif_templates:
                actor = random.choice(actors) if actors else None
                Notification.objects.create(
                    recipient=user,
                    actor=actor,
                    notif_type=notif_type,
                    message=template.format(
                        actor=actor.get_full_name() if actor else "Someone"
                    ),
                    is_read=random.choice([True, False]),
                    created_at=timezone.now() - timedelta(
                        minutes=random.randint(1, 7200)
                    ),
                )
                total += 1
        self.stdout.write(f"    {total} notifications created.")