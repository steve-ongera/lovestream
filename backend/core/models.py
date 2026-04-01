from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.text import slugify
from django.utils import timezone
import uuid

# ─── Choices ────────────────────────────────────────────────────────────────
GENDER_CHOICES = [("M","Male"),("F","Female"),("O","Other")]
SKIN_CHOICES   = [("fair","Fair"),("light","Light"),("medium","Medium"),
                  ("olive","Olive"),("brown","Brown"),("dark","Dark")]
GOAL_CHOICES   = [("date","Dating"),("match","Match"),("marriage","Marriage"),("casual","Casual")]
ACCESS_CHOICES = [("free","Free"),("paid","Paid")]
STREAM_CHOICES = [("offline","Offline"),("live","Live"),("ended","Ended")]
PAY_STATUS     = [("pending","Pending"),("success","Success"),("failed","Failed")]
PAY_METHOD     = [("mpesa","M-Pesa"),("paypal","PayPal"),("card","Card")]


# ─── User ─────────────────────────────────────────────────────────────────
class User(AbstractUser):
    """
    Extended user model with dating profile, physical attributes,
    location, preferences and SEO slugs.
    """
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug            = models.SlugField(unique=True, max_length=160, blank=True,
                                       help_text="SEO-friendly URL identifier")
    gender          = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    date_of_birth   = models.DateField(null=True, blank=True)
    bio             = models.TextField(blank=True)
    profile_photo   = models.ImageField(upload_to="profiles/photos/", blank=True, null=True)
    cover_photo     = models.ImageField(upload_to="profiles/covers/", blank=True, null=True)

    # Physical attributes used for smart matching
    height_cm       = models.PositiveSmallIntegerField(null=True, blank=True)
    skin_texture    = models.CharField(max_length=10, choices=SKIN_CHOICES, blank=True)
    body_type       = models.CharField(max_length=50, blank=True)

    # Location
    country         = models.CharField(max_length=80, blank=True)
    city            = models.CharField(max_length=80, blank=True)
    latitude        = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude       = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # Dating preferences
    relationship_goal  = models.CharField(max_length=10, choices=GOAL_CHOICES, blank=True)
    interested_in      = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    min_age_preference = models.PositiveSmallIntegerField(default=18)
    max_age_preference = models.PositiveSmallIntegerField(default=99)

    is_premium  = models.BooleanField(default=False)
    is_online   = models.BooleanField(default=False)
    last_seen   = models.DateTimeField(null=True, blank=True)

    # SEO meta
    meta_title       = models.CharField(max_length=160, blank=True)
    meta_description = models.TextField(max_length=300, blank=True)

    class Meta:
        db_table = "core_user"
        indexes  = [
            models.Index(fields=["slug"]),
            models.Index(fields=["gender", "city"]),
            models.Index(fields=["is_premium"]),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.username}-{str(self.id)[:8]}")
        super().save(*args, **kwargs)

    @property
    def age(self):
        if self.date_of_birth:
            today = timezone.now().date()
            dob   = self.date_of_birth
            return today.year - dob.year - (
                (today.month, today.day) < (dob.month, dob.day)
            )
        return None

    def __str__(self):
        return self.username


class UserPhoto(models.Model):
    """Gallery photos shared by a user; also sent in DMs."""
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name="photos")
    image      = models.ImageField(upload_to="users/gallery/")
    caption    = models.CharField(max_length=255, blank=True)
    is_public  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


# ─── Category & Tag ─────────────────────────────────────────────────────────
class Category(models.Model):
    name             = models.CharField(max_length=100)
    slug             = models.SlugField(unique=True, max_length=120)
    description      = models.TextField(blank=True)
    icon             = models.CharField(max_length=60, blank=True, help_text="Bootstrap icon class")
    meta_title       = models.CharField(max_length=160, blank=True)
    meta_description = models.TextField(max_length=300, blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering            = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Tag(models.Model):
    name = models.CharField(max_length=80)
    slug = models.SlugField(unique=True, max_length=100)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


# ─── Video ───────────────────────────────────────────────────────────────────
class Video(models.Model):
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug            = models.SlugField(unique=True, max_length=200, blank=True,
                                       help_text="SEO slug auto-generated from title")
    uploader        = models.ForeignKey(User, on_delete=models.CASCADE, related_name="videos")
    title           = models.CharField(max_length=200)
    description     = models.TextField(blank=True)
    category        = models.ForeignKey(Category, on_delete=models.SET_NULL,
                                        null=True, related_name="videos")
    tags            = models.ManyToManyField(Tag, blank=True, related_name="videos")

    # Media files
    video_file      = models.FileField(upload_to="videos/files/", blank=True, null=True)
    video_url       = models.URLField(blank=True, help_text="External HLS/MP4 URL")
    thumbnail       = models.ImageField(upload_to="videos/thumbnails/", blank=True, null=True)
    duration_seconds = models.PositiveIntegerField(default=0)

    # Access & pricing
    access_type     = models.CharField(max_length=6, choices=ACCESS_CHOICES, default="free")
    price           = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)

    # Denormalised counters for performance
    views_count     = models.PositiveIntegerField(default=0)
    likes_count     = models.PositiveIntegerField(default=0)
    comments_count  = models.PositiveIntegerField(default=0)

    is_published    = models.BooleanField(default=True)
    is_featured     = models.BooleanField(default=False)

    # SEO
    meta_title       = models.CharField(max_length=160, blank=True)
    meta_description = models.TextField(max_length=300, blank=True)
    meta_keywords    = models.CharField(max_length=300, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes  = [
            models.Index(fields=["slug"]),
            models.Index(fields=["access_type", "is_published"]),
            models.Index(fields=["category", "is_published"]),
            models.Index(fields=["-views_count"]),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.title}-{str(self.id)[:8]}")
        if not self.meta_title:
            self.meta_title = self.title[:160]
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class VideoView(models.Model):
    video      = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="view_records")
    viewer     = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    viewed_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["video", "viewed_at"])]


class VideoLike(models.Model):
    video      = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="likes")
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name="liked_videos")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("video", "user")


class Comment(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    video      = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="comments")
    author     = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    parent     = models.ForeignKey("self", null=True, blank=True,
                                   on_delete=models.CASCADE, related_name="replies")
    body       = models.TextField()
    likes_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]


# ─── Live Streaming ──────────────────────────────────────────────────────────
class LiveStream(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug         = models.SlugField(unique=True, max_length=200, blank=True)
    host         = models.ForeignKey(User, on_delete=models.CASCADE, related_name="streams")
    title        = models.CharField(max_length=200)
    description  = models.TextField(blank=True)
    thumbnail    = models.ImageField(upload_to="streams/thumbnails/", blank=True, null=True)
    stream_key   = models.CharField(max_length=100, unique=True, blank=True)
    stream_url   = models.URLField(blank=True)
    status       = models.CharField(max_length=8, choices=STREAM_CHOICES, default="offline")
    access_price = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    viewers_count = models.PositiveIntegerField(default=0)

    # SEO
    meta_title       = models.CharField(max_length=160, blank=True)
    meta_description = models.TextField(max_length=300, blank=True)

    started_at = models.DateTimeField(null=True, blank=True)
    ended_at   = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes  = [models.Index(fields=["status", "created_at"])]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.title}-{str(self.id)[:8]}")
        if not self.stream_key:
            self.stream_key = uuid.uuid4().hex
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


# ─── Dating / Match ──────────────────────────────────────────────────────────
class Match(models.Model):
    MATCH_STATUS = [("pending","Pending"),("accepted","Accepted"),("rejected","Rejected")]
    id       = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender   = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_matches")
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_matches")
    status   = models.CharField(max_length=10, choices=MATCH_STATUS, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("sender", "receiver")
        indexes = [
            models.Index(fields=["sender", "status"]),
            models.Index(fields=["receiver", "status"]),
        ]


# ─── Direct Messages ─────────────────────────────────────────────────────────
class Conversation(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participants = models.ManyToManyField(User, related_name="conversations")
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class Message(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender       = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    body         = models.TextField(blank=True)
    photo        = models.ImageField(upload_to="messages/photos/", blank=True, null=True)
    is_read      = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


# ─── Payments ────────────────────────────────────────────────────────────────
class Payment(models.Model):
    id                 = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user               = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payments")
    amount             = models.DecimalField(max_digits=10, decimal_places=2)
    currency           = models.CharField(max_length=10, default="KES")
    method             = models.CharField(max_length=10, choices=PAY_METHOD)
    status             = models.CharField(max_length=10, choices=PAY_STATUS, default="pending")
    video              = models.ForeignKey(Video, null=True, blank=True, on_delete=models.SET_NULL)
    live_stream        = models.ForeignKey(LiveStream, null=True, blank=True, on_delete=models.SET_NULL)
    is_premium_upgrade = models.BooleanField(default=False)
    gateway_reference  = models.CharField(max_length=200, blank=True)
    mpesa_receipt      = models.CharField(max_length=100, blank=True)
    paypal_order_id    = models.CharField(max_length=200, blank=True)
    created_at         = models.DateTimeField(auto_now_add=True)
    updated_at         = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes  = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["method", "status"]),
        ]

    def __str__(self):
        return f"{self.user} – {self.amount} {self.currency} [{self.status}]"


class VideoAccess(models.Model):
    """Records which users paid to unlock a premium video."""
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name="unlocked_videos")
    video      = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="access_grants")
    payment    = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True)
    granted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "video")


class StreamAccess(models.Model):
    """Records paid access to a live stream."""
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name="stream_access")
    stream     = models.ForeignKey(LiveStream, on_delete=models.CASCADE, related_name="access_grants")
    payment    = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True)
    granted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "stream")


class Notification(models.Model):
    NOTIF_TYPES = [
        ("match","New Match"), ("message","New Message"), ("like","Video Like"),
        ("comment","Comment"), ("payment","Payment"), ("stream_live","Stream Live"),
    ]
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient  = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    actor      = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL,
                                   related_name="triggered_notifications")
    notif_type = models.CharField(max_length=20, choices=NOTIF_TYPES)
    message    = models.TextField()
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]