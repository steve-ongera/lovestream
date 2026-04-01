from django.db.models import Q, F
from django.utils import timezone
from django.shortcuts import get_object_or_404

from rest_framework import generics, status, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

from .models import (
    User, UserPhoto, Category, Tag, Video, VideoView, VideoLike,
    Comment, LiveStream, Match, Conversation, Message,
    Payment, VideoAccess, StreamAccess, Notification,
)
from .serializers import (
    UserSerializer, RegisterSerializer, UserMiniSerializer, UserPhotoSerializer,
    CategorySerializer, TagSerializer,
    VideoListSerializer, VideoDetailSerializer, VideoWriteSerializer,
    CommentSerializer,
    LiveStreamListSerializer, LiveStreamDetailSerializer, LiveStreamWriteSerializer,
    MatchSerializer, MatchWriteSerializer,
    ConversationSerializer, MessageSerializer,
    PaymentSerializer, InitiatePaymentSerializer,
    NotificationSerializer, DatingSuggestionSerializer,
)


# ─── Pagination ──────────────────────────────────────────────────────────────
class StandardPagination(PageNumberPagination):
    page_size            = 12
    page_size_query_param = "page_size"
    max_page_size        = 48


# ─── Auth ────────────────────────────────────────────────────────────────────
class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/"""
    serializer_class   = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class ProfileView(generics.RetrieveUpdateAPIView):
    """GET / PATCH /api/auth/profile/"""
    serializer_class   = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class PublicProfileView(generics.RetrieveAPIView):
    """GET /api/users/<slug>/"""
    serializer_class   = UserSerializer
    permission_classes = [permissions.AllowAny]
    queryset           = User.objects.filter(is_active=True)
    lookup_field       = "slug"


class UserPhotoListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/users/photos/"""
    serializer_class   = UserPhotoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserPhoto.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ─── Categories & Tags ───────────────────────────────────────────────────────
class CategoryListView(generics.ListAPIView):
    """GET /api/categories/"""
    queryset           = Category.objects.all()
    serializer_class   = CategorySerializer
    permission_classes = [permissions.AllowAny]


class TagListView(generics.ListAPIView):
    """GET /api/tags/"""
    queryset           = Tag.objects.all()
    serializer_class   = TagSerializer
    permission_classes = [permissions.AllowAny]


# ─── Videos ──────────────────────────────────────────────────────────────────
class VideoListView(generics.ListAPIView):
    """
    GET /api/videos/
    Supports:  ?category=slug  ?access_type=free|paid  ?search=query
               ?featured=true  ?ordering=-views_count|-created_at|price
    """
    serializer_class   = VideoListSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class   = StandardPagination
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ["title", "description", "tags__name"]
    ordering_fields    = ["views_count", "likes_count", "created_at", "price"]
    ordering           = ["-created_at"]

    def get_queryset(self):
        qs = Video.objects.filter(is_published=True).select_related(
            "uploader", "category"
        ).prefetch_related("tags")

        cat = self.request.query_params.get("category")
        if cat:
            qs = qs.filter(category__slug=cat)

        access = self.request.query_params.get("access_type")
        if access in ("free", "paid"):
            qs = qs.filter(access_type=access)

        featured = self.request.query_params.get("featured")
        if featured == "true":
            qs = qs.filter(is_featured=True)

        return qs


class VideoDetailView(generics.RetrieveAPIView):
    """GET /api/videos/<slug>/"""
    serializer_class   = VideoDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field       = "slug"

    def get_queryset(self):
        return Video.objects.filter(is_published=True).select_related(
            "uploader", "category"
        ).prefetch_related("tags")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Record view
        VideoView.objects.create(
            video=instance,
            viewer=request.user if request.user.is_authenticated else None,
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        Video.objects.filter(pk=instance.pk).update(views_count=F("views_count") + 1)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class VideoCreateView(generics.CreateAPIView):
    """POST /api/videos/create/"""
    serializer_class   = VideoWriteSerializer
    permission_classes = [permissions.IsAuthenticated]


class VideoLikeToggleView(APIView):
    """POST /api/videos/<slug>/like/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        video = get_object_or_404(Video, slug=slug, is_published=True)
        like, created = VideoLike.objects.get_or_create(video=video, user=request.user)
        if not created:
            like.delete()
            Video.objects.filter(pk=video.pk).update(likes_count=F("likes_count") - 1)
            return Response({"liked": False})
        Video.objects.filter(pk=video.pk).update(likes_count=F("likes_count") + 1)
        return Response({"liked": True})


# ─── Comments ────────────────────────────────────────────────────────────────
class CommentListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/videos/<slug>/comments/"""
    serializer_class   = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class   = StandardPagination

    def get_queryset(self):
        slug = self.kwargs["slug"]
        return Comment.objects.filter(
            video__slug=slug, parent__isnull=True
        ).select_related("author").prefetch_related("replies__author")

    def perform_create(self, serializer):
        slug  = self.kwargs["slug"]
        video = get_object_or_404(Video, slug=slug)
        serializer.save(author=self.request.user, video=video)
        Video.objects.filter(pk=video.pk).update(comments_count=F("comments_count") + 1)


# ─── Live Streams ─────────────────────────────────────────────────────────────
class LiveStreamListView(generics.ListAPIView):
    """GET /api/streams/   ?status=live|offline"""
    serializer_class   = LiveStreamListSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class   = StandardPagination

    def get_queryset(self):
        qs     = LiveStream.objects.select_related("host")
        status = self.request.query_params.get("status")
        if status in ("live", "offline", "ended"):
            qs = qs.filter(status=status)
        return qs


class LiveStreamDetailView(generics.RetrieveAPIView):
    """GET /api/streams/<slug>/"""
    serializer_class   = LiveStreamDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field       = "slug"
    queryset           = LiveStream.objects.select_related("host")


class LiveStreamCreateView(generics.CreateAPIView):
    """POST /api/streams/create/"""
    serializer_class   = LiveStreamWriteSerializer
    permission_classes = [permissions.IsAuthenticated]


class LiveStreamGoLiveView(APIView):
    """POST /api/streams/<slug>/go-live/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        stream = get_object_or_404(LiveStream, slug=slug, host=request.user)
        stream.status     = "live"
        stream.started_at = timezone.now()
        stream.save(update_fields=["status", "started_at"])
        return Response({"status": "live", "stream_key": stream.stream_key})


class LiveStreamEndView(APIView):
    """POST /api/streams/<slug>/end/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        stream = get_object_or_404(LiveStream, slug=slug, host=request.user)
        stream.status   = "ended"
        stream.ended_at = timezone.now()
        stream.save(update_fields=["status", "ended_at"])
        return Response({"status": "ended"})


# ─── Dating / Matching ───────────────────────────────────────────────────────
class DatingSuggestionsView(generics.ListAPIView):
    """
    GET /api/dating/suggestions/
    Returns users that match the logged-in user's preferences
    (age, gender, skin, height, city, goal).
    """
    serializer_class   = DatingSuggestionSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class   = StandardPagination

    def get_queryset(self):
        me = self.request.user

        # Base: exclude self, filter by interested_in gender
        qs = User.objects.exclude(pk=me.pk).filter(is_active=True)

        if me.interested_in:
            qs = qs.filter(gender=me.interested_in)

        # Age range (approximate via birth year)
        from datetime import date
        current_year = date.today().year
        max_birth_year = current_year - me.min_age_preference
        min_birth_year = current_year - me.max_age_preference
        qs = qs.filter(
            date_of_birth__year__gte=min_birth_year,
            date_of_birth__year__lte=max_birth_year,
        )

        # Same city gives higher priority (annotate later if needed)
        if me.city:
            qs = qs.order_by(
                Q(city=me.city) | Q(country=me.country),
                "-is_online",
            )

        # Filter by physical attributes if supplied via query params
        skin = self.request.query_params.get("skin_texture")
        if skin:
            qs = qs.filter(skin_texture=skin)

        min_h = self.request.query_params.get("min_height")
        max_h = self.request.query_params.get("max_height")
        if min_h:
            qs = qs.filter(height_cm__gte=min_h)
        if max_h:
            qs = qs.filter(height_cm__lte=max_h)

        goal = self.request.query_params.get("relationship_goal")
        if goal:
            qs = qs.filter(relationship_goal=goal)

        return qs


class MatchListView(generics.ListAPIView):
    """GET /api/dating/matches/"""
    serializer_class   = MatchSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        me = self.request.user
        return Match.objects.filter(
            Q(sender=me) | Q(receiver=me)
        ).select_related("sender", "receiver")


class MatchSendView(generics.CreateAPIView):
    """POST /api/dating/matches/"""
    serializer_class   = MatchWriteSerializer
    permission_classes = [permissions.IsAuthenticated]


class MatchRespondView(APIView):
    """PATCH /api/dating/matches/<id>/respond/"""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        match  = get_object_or_404(Match, pk=pk, receiver=request.user)
        action = request.data.get("action")  # "accept" | "reject"
        if action == "accept":
            match.status = "accepted"
        elif action == "reject":
            match.status = "rejected"
        else:
            return Response({"error": "action must be accept or reject"},
                            status=status.HTTP_400_BAD_REQUEST)
        match.save(update_fields=["status", "updated_at"])
        return Response(MatchSerializer(match).data)


# ─── Conversations / Messages ─────────────────────────────────────────────
class ConversationListView(generics.ListAPIView):
    """GET /api/messages/"""
    serializer_class   = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(
            participants=self.request.user
        ).prefetch_related("participants", "messages")


class ConversationCreateView(APIView):
    """POST /api/messages/start/  {participant_id: uuid}"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        other_id = request.data.get("participant_id")
        other    = get_object_or_404(User, pk=other_id)
        # Find existing conversation or create new one
        conv = Conversation.objects.filter(
            participants=request.user
        ).filter(participants=other).first()
        if not conv:
            conv = Conversation.objects.create()
            conv.participants.set([request.user, other])
        return Response(ConversationSerializer(conv, context={"request": request}).data,
                        status=status.HTTP_201_CREATED)


class MessageListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/messages/<conversation_id>/"""
    serializer_class   = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class   = StandardPagination

    def get_queryset(self):
        conv_id = self.kwargs["conversation_id"]
        conv    = get_object_or_404(
            Conversation, pk=conv_id, participants=self.request.user
        )
        # Mark messages as read
        conv.messages.exclude(sender=self.request.user).update(is_read=True)
        return conv.messages.select_related("sender")

    def perform_create(self, serializer):
        conv_id = self.kwargs["conversation_id"]
        conv    = get_object_or_404(
            Conversation, pk=conv_id, participants=self.request.user
        )
        serializer.save(sender=self.request.user, conversation=conv)


# ─── Payments ────────────────────────────────────────────────────────────────
class InitiatePaymentView(APIView):
    """POST /api/payments/initiate/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        payment = Payment.objects.create(
            user               = request.user,
            amount             = data["amount"],
            currency           = data.get("currency", "KES"),
            method             = data["method"],
            is_premium_upgrade = data.get("is_premium_upgrade", False),
        )

        if data.get("video_id"):
            from .models import Video as Vid
            payment.video = get_object_or_404(Vid, pk=data["video_id"])
            payment.save(update_fields=["video"])

        if data.get("live_stream_id"):
            payment.live_stream = get_object_or_404(LiveStream, pk=data["live_stream_id"])
            payment.save(update_fields=["live_stream"])

        # TODO: integrate gateway SDKs (Daraja, PayPal, Stripe) and return redirect URL
        return Response({
            "payment_id": payment.pk,
            "status": payment.status,
            "message": f"Payment initiated via {payment.method}. Complete on your gateway.",
        }, status=status.HTTP_201_CREATED)


class PaymentCallbackView(APIView):
    """POST /api/payments/callback/  – Webhook from gateways."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Identify payment by gateway reference from request body
        ref    = request.data.get("gateway_reference") or request.data.get("MerchantRequestID")
        result = request.data.get("ResultCode", -1)

        try:
            payment = Payment.objects.get(gateway_reference=ref)
        except Payment.DoesNotExist:
            return Response({"error": "Payment not found"}, status=404)

        if str(result) == "0":
            payment.status = "success"
            payment.save(update_fields=["status"])
            # Grant access
            if payment.video:
                VideoAccess.objects.get_or_create(
                    user=payment.user, video=payment.video,
                    defaults={"payment": payment}
                )
            if payment.live_stream:
                StreamAccess.objects.get_or_create(
                    user=payment.user, stream=payment.live_stream,
                    defaults={"payment": payment}
                )
            if payment.is_premium_upgrade:
                User.objects.filter(pk=payment.user.pk).update(is_premium=True)
        else:
            payment.status = "failed"
            payment.save(update_fields=["status"])

        return Response({"received": True})


class UserPaymentHistoryView(generics.ListAPIView):
    """GET /api/payments/history/"""
    serializer_class   = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)


# ─── Notifications ───────────────────────────────────────────────────────────
class NotificationListView(generics.ListAPIView):
    """GET /api/notifications/"""
    serializer_class   = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class   = StandardPagination

    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user
        ).select_related("actor")


class NotificationMarkReadView(APIView):
    """POST /api/notifications/mark-read/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({"marked": True})


# ─── Search ──────────────────────────────────────────────────────────────────
class GlobalSearchView(APIView):
    """GET /api/search/?q=query   Returns videos + users + streams."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        if not q:
            return Response({"videos": [], "users": [], "streams": []})

        videos = Video.objects.filter(
            is_published=True
        ).filter(
            Q(title__icontains=q) | Q(description__icontains=q) | Q(tags__name__icontains=q)
        ).distinct()[:6]

        users = User.objects.filter(
            is_active=True
        ).filter(
            Q(username__icontains=q) | Q(first_name__icontains=q) |
            Q(last_name__icontains=q) | Q(city__icontains=q)
        )[:6]

        streams = LiveStream.objects.filter(
            status="live"
        ).filter(
            Q(title__icontains=q) | Q(description__icontains=q)
        )[:6]

        return Response({
            "videos":  VideoListSerializer(videos, many=True, context={"request": request}).data,
            "users":   UserMiniSerializer(users, many=True, context={"request": request}).data,
            "streams": LiveStreamListSerializer(streams, many=True, context={"request": request}).data,
        })