-- Crear tabla para preferencias de notificación
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT false,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  location_alerts BOOLEAN NOT NULL DEFAULT false,
  delivery_radius INTEGER NOT NULL DEFAULT 500,
  quiet_hours_start TIME NOT NULL DEFAULT '22:00',
  quiet_hours_end TIME NOT NULL DEFAULT '08:00',
  notification_types JSONB NOT NULL DEFAULT '{}',
  phone_number TEXT,
  whatsapp_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Crear tabla para suscripciones push
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para alertas geográficas
CREATE TABLE public.location_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'approaching', 'arrived', 'delayed'
  location_name TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  radius INTEGER NOT NULL DEFAULT 100,
  triggered_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para log de notificaciones enviadas
CREATE TABLE public.notification_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  channel TEXT NOT NULL, -- 'push', 'email', 'sms', 'whatsapp'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  external_id TEXT, -- ID del servicio externo
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification preferences"
ON public.notification_preferences
FOR ALL
USING (auth.uid() = user_id);

-- RLS para push_subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push subscriptions"
ON public.push_subscriptions
FOR ALL
USING (auth.uid() = user_id);

-- RLS para location_alerts
ALTER TABLE public.location_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own location alerts"
ON public.location_alerts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create location alerts"
ON public.location_alerts
FOR INSERT
WITH CHECK (true);

-- RLS para notification_log
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification log"
ON public.notification_log
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create notification logs"
ON public.notification_log
FOR INSERT
WITH CHECK (true);

-- Trigger para actualizar updated_at en notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para actualizar updated_at en push_subscriptions
CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();