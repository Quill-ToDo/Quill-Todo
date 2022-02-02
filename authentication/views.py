from django.shortcuts import render
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import CustomTokenObtainPairSerializer, CustomUserSerializer
from django.http import HttpResponse
from django.conf import settings
import os
import logging

# Create your views here.
def serve_front_end(request):
    """
    Serves the compiled frontend entry point (only works if you have run `npm
    run build`).
    """
    try:
        with open(os.path.join(settings.REACT_APP_DIR, 'build', 'loginIndex.html')) as f:
            return HttpResponse(f.read())
    except FileNotFoundError:
        logging.exception('Production build of app not found')
        return HttpResponse(
            """
            This URL is only used when you have built the production
            version of the app. Visit http://localhost:3000/ instead, or
            run `npm run build` to test the production version.
            """,
            status=501,
        )

class ObtainTokenPairWithCustomView(TokenObtainPairView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = CustomTokenObtainPairSerializer
    
class CustomUserCreate(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request, format='json'):
        serializer = CustomUserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            if user:
                json = serializer.data
                return Response(json, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class HelloWorldView(APIView):
    
    def get(self, request):
        return Response(data={"hello":"world"}, status=status.HTTP_200_OK)
