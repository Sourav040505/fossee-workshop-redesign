/**
 * Copyright (c) 2026 Sourav
 * Project: FOSSEE Workshop Portal Rebuild
 * Description: High-performance dashboard with Django Ninja & React Vite.
 */
from ninja import NinjaAPI, Schema
from django.contrib.auth.models import User
from .models import Workshop, WorkshopType, Profile
from django.shortcuts import get_object_or_404
import datetime

api = NinjaAPI()

class WorkshopIn(Schema):
    topic: str
    date: str

@api.get("/workshops")
def list_workshops(request):
    return [{"id": w.id, "title": w.workshop_type.name, "date": str(w.date)} 
            for w in Workshop.objects.all().order_by('-id')]

@api.post("/workshops")
def create_workshop(request, data: WorkshopIn):
    ws_type, _ = WorkshopType.objects.get_or_create(
        name=data.topic, 
        defaults={'duration': 1, 'description': 'Managed via Master UI'}
    )
    user = User.objects.first()
    Workshop.objects.create(
        coordinator=user, instructor=user, workshop_type=ws_type,
        date=data.date, status=0, tnc_accepted=True
    )
    return {"success": True}

@api.put("/workshops/{ws_id}")
def update_workshop(request, ws_id: int, data: WorkshopIn):
    ws = get_object_or_404(Workshop, id=ws_id)
    ws_type, _ = WorkshopType.objects.get_or_create(
        name=data.topic,
        defaults={'duration': 1, 'description': 'Managed via Master UI'}
    )
    ws.workshop_type = ws_type
    ws.date = data.date
    ws.save()
    return {"success": True}

@api.delete("/workshops/{ws_id}")
def delete_workshop(request, ws_id: int):
    get_object_or_404(Workshop, id=ws_id).delete()
    return {"success": True}

@api.get("/users")
def list_users(request):
    return [{"id": u.id, "username": u.username} for u in User.objects.all()]

@api.post("/users/{u_id}/reset")
def reset_password(request, u_id: int, data: dict):
    user = get_object_or_404(User, id=u_id)
    user.set_password(data.get('new_password'))
    user.save()
    return {"success": True}

@api.get("/profile")
def get_profile(request):
    user = User.objects.first()
    prof, _ = Profile.objects.get_or_create(user=user, defaults={'institute': 'FOSSEE'})
    return {"institute": prof.institute}

@api.post("/profile/update")
def update_profile(request, data: dict):
    user = User.objects.first()
    prof = Profile.objects.get(user=user)
    prof.institute = data.get('institute')
    prof.save()
    return {"success": True}
