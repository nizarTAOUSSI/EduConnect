

import os
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / '.env')

def env_bool(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {'1', 'true', 'yes', 'on'}

def env_list(name, default=''):
    value = os.getenv(name, default)
    return [item.strip() for item in value.split(',') if item.strip()]

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv(
    'SECRET_KEY',
    'django-insecure-a3)cj)_j(@(ue&zq*$8h=_jf09#uky!b8fw2f4l+gmz5h^6m6b',
)
DEBUG = env_bool('DEBUG', default=True)
ALLOWED_HOSTS = env_list(
    'ALLOWED_HOSTS',
    default='127.0.0.1,localhost,.railway.app',
)
_csrf_trusted_origins_default = [
    'https://*.up.railway.app',
    'https://*.railway.app',
]
CSRF_TRUSTED_ORIGINS = sorted(
    set(_csrf_trusted_origins_default + env_list('CSRF_TRUSTED_ORIGINS', default=''))
)
_cors_allowed_origins_default = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
CORS_ALLOWED_ORIGINS = sorted(
    set(_cors_allowed_origins_default + env_list('CORS_ALLOWED_ORIGINS', default=''))
)
CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^https://.*\.up\.railway\.app$',
    r'^https://.*\.railway\.app$',
]
CORS_ALLOW_CREDENTIALS = True

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'corsheaders',
    'rest_framework',
    'django_filters',
    'drf_spectacular',

    'accounts',
    'academics',
    'grades',
    'reports',
    'communication',
]

AUTH_USER_MODEL = 'accounts.Utilisateur'

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

database_url = os.getenv('MYSQL_URL') or os.getenv('DATABASE_URL')

if database_url:
    DATABASES = {
        'default': dj_database_url.parse(
            database_url,
            conn_max_age=600,
        )
    }
elif os.getenv('MYSQLHOST') and os.getenv('MYSQLDATABASE'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.getenv('MYSQLDATABASE'),
            'USER': os.getenv('MYSQLUSER', ''),
            'PASSWORD': os.getenv('MYSQLPASSWORD', ''),
            'HOST': os.getenv('MYSQLHOST'),
            'PORT': os.getenv('MYSQLPORT', '3306'),
            'OPTIONS': {
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            },
            'CONN_MAX_AGE': 600,
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.getenv('DB_NAME', 'educonnect'),
            'USER': os.getenv('DB_USER', 'nizar'),
            'PASSWORD': os.getenv('DB_PASSWORD', 'nizar2003'),
            'HOST': os.getenv('DB_HOST', '127.0.0.1'),
            'PORT': os.getenv('DB_PORT', '3306'),
            'OPTIONS': {
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            },
            'CONN_MAX_AGE': 600,
        }
    }

DATABASES['default'].setdefault('OPTIONS', {})
DATABASES['default']['OPTIONS'].setdefault(
    'init_command',
    "SET sql_mode='STRICT_TRANS_TABLES'",
)

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Casablanca'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

if DEBUG:
    REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES'].append(
        'rest_framework.authentication.SessionAuthentication'
    )

SPECTACULAR_SETTINGS = {
    'TITLE': 'EduConnect API',
    'DESCRIPTION': (
        'API de gestion des notes scolaires — accounts, academics, '
        'grades, reports, communication.'
    ),
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'CONTACT': {'name': 'Équipe EduConnect'},
    'LICENSE': {'name': 'MIT'},
    'SECURITY': [{'jwtAuth': []}],
    'COMPONENTS': {
        'securitySchemes': {
            'jwtAuth': {
                'type': 'http',
                'scheme': 'bearer',
                'bearerFormat': 'JWT',
            }
        }
    },
}