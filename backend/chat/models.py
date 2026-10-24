"""
backend/chat/models.py
Django ORM Models for PostgreSQL persistence in the VenXR Assistant.
"""

import uuid
from django.db import models

class Thread(models.Model):
    """
    Persisted conversation thread.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, default="New Conversation")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.title} ({self.id})"

class Message(models.Model):
    """
    Individual turn in a conversation thread.
    """
    ROLE_CHOICES = [
        ("user", "User"),
        ("assistant", "Assistant"),
        ("system", "System"),
    ]

    STATUS_CHOICES = [
        ("sending", "Sending"),
        ("streaming", "Streaming"),
        ("complete", "Complete"),
        ("failed", "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="complete")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

class FileAttachment(models.Model):
    """
    Uploaded file metadata ("Any file in").
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name="attachments")
    name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    file_size_bytes = models.BigIntegerField()
    storage_path = models.CharField(max_length=500)
    uploaded_at = models.DateTimeField(auto_now_add=True)
