from rest_framework import serializers
from .models import (
    User, UserPhoto, Category, Tag, Video, VideoLike, Comment,
    LiveStream, Match, Conversation, Message, Payment,
    VideoAccess, StreamAccess, Notification,
)


# ─── User ─────────────────────────────────────────────────────────────────
class UserMiniSerializer(serializers.ModelSerializer):
    """Lightweight serializer – used in nested relations."""
    age = serializers.ReadOnlyField()

    class Meta:
        model  = User
        fields = [
            "id", "slug", "username", "first_name", "last_name",
            "profile_photo", "city", "country", "age",
            "gender", "skin_texture", "height_cm", "is_premium", "is_online",
        ]


class UserSerializer(serializers.ModelSerializer):
    age = serializers.ReadOnlyField()

    class Meta:
        model  = User
        fields = [
            "id", "slug", "username", "email",
            "first_name", "last_name",
            "gender", "date_of_birth", "age",
            "bio", "profile_photo", "cover_photo",
            "height_cm", "skin_texture", "body_type",
            "country", "city", "latitude", "longitude",
            "relationship_goal", "interested_in",
            "min_age_preference", "max_age_preference",
            "is_premium", "is_online", "last_seen",
            "meta_title", "meta_description",
            "date_joined",
        ]
        read_only_fields = ["id", "slug", "date_joined", "is_premium"]


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model  = User
        fields = ["username", "email", "password", "password2",
                  "gender", "date_of_birth", "city", "country"]

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UserPhoto
        fields = ["id", "image", "caption", "is_public", "created_at"]
        read_only_fields = ["id", "created_at"]


# ─── Category & Tag ──────────────────────────────────────────────────────────
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = ["id", "name", "slug", "description", "icon",
                  "meta_title", "meta_description", "created_at"]
        read_only_fields = ["id", "slug", "created_at"]


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Tag
        fields = ["id", "name", "slug"]
        read_only_fields = ["id", "slug"]


# ─── Video ───────────────────────────────────────────────────────────────────
class VideoListSerializer(serializers.ModelSerializer):
    """Compact serializer for video feeds / search results."""
    uploader = UserMiniSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    is_liked = serializers.SerializerMethodField()
    has_access = serializers.SerializerMethodField()

    class Meta:
        model  = Video
        fields = [
            "id", "slug", "title", "thumbnail", "duration_seconds",
            "access_type", "price", "views_count", "likes_count",
            "comments_count", "is_featured", "uploader", "category",
            "is_liked", "has_access", "created_at",
        ]

    def get_is_liked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return VideoLike.objects.filter(video=obj, user=request.user).exists()
        return False

    def get_has_access(self, obj):
        if obj.access_type == "free":
            return True
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return VideoAccess.objects.filter(video=obj, user=request.user).exists()
        return False


class VideoDetailSerializer(VideoListSerializer):
    """Full serializer with description, tags, SEO fields."""
    tags = TagSerializer(many=True, read_only=True)

    class Meta(VideoListSerializer.Meta):
        fields = VideoListSerializer.Meta.fields + [
            "description", "video_file", "video_url", "tags",
            "meta_title", "meta_description", "meta_keywords",
            "is_published", "updated_at",
        ]


class VideoWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Video
        fields = [
            "title", "description", "category", "tags",
            "video_file", "video_url", "thumbnail", "duration_seconds",
            "access_type", "price", "is_published", "is_featured",
            "meta_title", "meta_description", "meta_keywords",
        ]

    def create(self, validated_data):
        tags = validated_data.pop("tags", [])
        video = Video.objects.create(
            uploader=self.context["request"].user, **validated_data
        )
        video.tags.set(tags)
        return video


class CommentSerializer(serializers.ModelSerializer):
    author  = UserMiniSerializer(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model  = Comment
        fields = ["id", "author", "parent", "body", "likes_count",
                  "replies", "created_at", "updated_at"]
        read_only_fields = ["id", "author", "likes_count", "created_at", "updated_at"]

    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.all(), many=True,
                                     context=self.context).data
        return []


# ─── Live Stream ─────────────────────────────────────────────────────────────
class LiveStreamListSerializer(serializers.ModelSerializer):
    host = UserMiniSerializer(read_only=True)
    has_access = serializers.SerializerMethodField()

    class Meta:
        model  = LiveStream
        fields = [
            "id", "slug", "title", "thumbnail", "status",
            "access_price", "viewers_count", "host",
            "has_access", "started_at", "created_at",
        ]

    def get_has_access(self, obj):
        if obj.access_price == 0:
            return True
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return StreamAccess.objects.filter(stream=obj, user=request.user).exists()
        return False


class LiveStreamDetailSerializer(LiveStreamListSerializer):
    class Meta(LiveStreamListSerializer.Meta):
        fields = LiveStreamListSerializer.Meta.fields + [
            "description", "stream_url", "meta_title", "meta_description",
            "ended_at",
        ]


class LiveStreamWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = LiveStream
        fields = ["title", "description", "thumbnail", "access_price",
                  "meta_title", "meta_description"]

    def create(self, validated_data):
        return LiveStream.objects.create(
            host=self.context["request"].user, **validated_data
        )


# ─── Dating / Match ──────────────────────────────────────────────────────────
class MatchSerializer(serializers.ModelSerializer):
    sender   = UserMiniSerializer(read_only=True)
    receiver = UserMiniSerializer(read_only=True)

    class Meta:
        model  = Match
        fields = ["id", "sender", "receiver", "status", "created_at", "updated_at"]
        read_only_fields = ["id", "sender", "created_at", "updated_at"]


class MatchWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Match
        fields = ["receiver"]

    def create(self, validated_data):
        return Match.objects.create(
            sender=self.context["request"].user, **validated_data
        )


# ─── Messages / Conversations ─────────────────────────────────────────────
class MessageSerializer(serializers.ModelSerializer):
    sender = UserMiniSerializer(read_only=True)

    class Meta:
        model  = Message
        fields = ["id", "sender", "body", "photo", "is_read", "created_at"]
        read_only_fields = ["id", "sender", "is_read", "created_at"]


class ConversationSerializer(serializers.ModelSerializer):
    participants   = UserMiniSerializer(many=True, read_only=True)
    latest_message = serializers.SerializerMethodField()
    unread_count   = serializers.SerializerMethodField()

    class Meta:
        model  = Conversation
        fields = ["id", "participants", "latest_message", "unread_count", "created_at"]

    def get_latest_message(self, obj):
        msg = obj.messages.last()
        return MessageSerializer(msg).data if msg else None

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.messages.filter(is_read=False).exclude(
                sender=request.user
            ).count()
        return 0


# ─── Payment ─────────────────────────────────────────────────────────────────
class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Payment
        fields = [
            "id", "amount", "currency", "method", "status",
            "video", "live_stream", "is_premium_upgrade",
            "gateway_reference", "mpesa_receipt", "paypal_order_id",
            "created_at",
        ]
        read_only_fields = ["id", "status", "gateway_reference",
                            "mpesa_receipt", "paypal_order_id", "created_at"]


class InitiatePaymentSerializer(serializers.Serializer):
    """Payload to kick off a payment."""
    method             = serializers.ChoiceField(choices=["mpesa", "paypal", "card"])
    amount             = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency           = serializers.CharField(max_length=10, default="KES")
    video_id           = serializers.UUIDField(required=False, allow_null=True)
    live_stream_id     = serializers.UUIDField(required=False, allow_null=True)
    is_premium_upgrade = serializers.BooleanField(default=False)
    phone_number       = serializers.CharField(max_length=15, required=False)   # M-Pesa


# ─── Notification ────────────────────────────────────────────────────────────
class NotificationSerializer(serializers.ModelSerializer):
    actor = UserMiniSerializer(read_only=True)

    class Meta:
        model  = Notification
        fields = ["id", "actor", "notif_type", "message", "is_read", "created_at"]
        read_only_fields = ["id", "actor", "notif_type", "message", "created_at"]


# ─── Dating Suggestions (computed) ───────────────────────────────────────────
class DatingSuggestionSerializer(UserMiniSerializer):
    """UserMiniSerializer plus match_score helper field."""
    match_score = serializers.FloatField(read_only=True, default=0.0)

    class Meta(UserMiniSerializer.Meta):
        fields = UserMiniSerializer.Meta.fields + [
            "relationship_goal", "body_type", "match_score",
        ]