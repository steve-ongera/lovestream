"""
core/urls.py – URL patterns for the core application.
All routes are prefixed with /api/ by the main urls.py.
"""
from django.urls import path
from . import views

urlpatterns = [
    # ── Auth / Profile ──────────────────────────────────────────────────────
    path("auth/register/",        views.RegisterView.as_view(),         name="register"),
    path("auth/profile/",         views.ProfileView.as_view(),          name="profile"),
    path("users/<slug:slug>/",    views.PublicProfileView.as_view(),    name="public-profile"),
    path("users/photos/",         views.UserPhotoListCreateView.as_view(), name="user-photos"),

    # ── Categories & Tags ───────────────────────────────────────────────────
    path("categories/",           views.CategoryListView.as_view(),     name="categories"),
    path("tags/",                 views.TagListView.as_view(),           name="tags"),

    # ── Videos ─────────────────────────────────────────────────────────────
    path("videos/",               views.VideoListView.as_view(),        name="video-list"),
    path("videos/create/",        views.VideoCreateView.as_view(),      name="video-create"),
    path("videos/<slug:slug>/",   views.VideoDetailView.as_view(),      name="video-detail"),
    path("videos/<slug:slug>/like/",     views.VideoLikeToggleView.as_view(),   name="video-like"),
    path("videos/<slug:slug>/comments/", views.CommentListCreateView.as_view(), name="video-comments"),

    # ── Live Streams ────────────────────────────────────────────────────────
    path("streams/",              views.LiveStreamListView.as_view(),   name="stream-list"),
    path("streams/create/",       views.LiveStreamCreateView.as_view(), name="stream-create"),
    path("streams/<slug:slug>/",  views.LiveStreamDetailView.as_view(), name="stream-detail"),
    path("streams/<slug:slug>/go-live/", views.LiveStreamGoLiveView.as_view(), name="stream-go-live"),
    path("streams/<slug:slug>/end/",     views.LiveStreamEndView.as_view(),    name="stream-end"),

    # ── Dating & Matching ───────────────────────────────────────────────────
    path("dating/suggestions/",          views.DatingSuggestionsView.as_view(),  name="dating-suggestions"),
    path("dating/matches/",              views.MatchListView.as_view(),           name="match-list"),
    path("dating/matches/send/",         views.MatchSendView.as_view(),           name="match-send"),
    path("dating/matches/<uuid:pk>/respond/", views.MatchRespondView.as_view(),  name="match-respond"),

    # ── Conversations / DMs ─────────────────────────────────────────────────
    path("messages/",                              views.ConversationListView.as_view(),    name="conversations"),
    path("messages/start/",                        views.ConversationCreateView.as_view(),  name="conversation-start"),
    path("messages/<uuid:conversation_id>/",       views.MessageListCreateView.as_view(),   name="messages"),

    # ── Payments ────────────────────────────────────────────────────────────
    path("payments/initiate/",    views.InitiatePaymentView.as_view(),       name="payment-initiate"),
    path("payments/callback/",    views.PaymentCallbackView.as_view(),       name="payment-callback"),
    path("payments/history/",     views.UserPaymentHistoryView.as_view(),    name="payment-history"),

    # ── Notifications ────────────────────────────────────────────────────────
    path("notifications/",             views.NotificationListView.as_view(),    name="notifications"),
    path("notifications/mark-read/",   views.NotificationMarkReadView.as_view(), name="notifications-read"),

    # ── Search ───────────────────────────────────────────────────────────────
    path("search/",               views.GlobalSearchView.as_view(),      name="global-search"),
]