create type "public"."funnel_status" as enum ('draft', 'published');


  create table "public"."funnels" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text not null default ''::text,
    "status" funnel_status not null default 'draft'::funnel_status,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."responses" (
    "id" uuid not null default gen_random_uuid(),
    "session_id" uuid not null,
    "screen_id" text not null,
    "screen_index" integer not null,
    "answer" jsonb,
    "dwell_ms" integer not null default 0,
    "submitted_at" timestamp with time zone not null default now()
      );



  create table "public"."sessions" (
    "id" uuid not null default gen_random_uuid(),
    "funnel_id" uuid not null,
    "variant_id" uuid not null,
    "source" text,
    "started_at" timestamp with time zone not null default now(),
    "completed_at" timestamp with time zone,
    "abandoned_at" timestamp with time zone,
    "total_dwell_ms" integer not null default 0,
    "cta_clicked" boolean not null default false
      );



  create table "public"."variants" (
    "id" uuid not null default gen_random_uuid(),
    "funnel_id" uuid not null,
    "name" text not null,
    "spec" jsonb not null default '[]'::jsonb,
    "routing_rules" jsonb not null default jsonb_build_object('sources', '[]'::jsonb, 'dwell_threshold_ms', NULL::unknown, 'is_default', false),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


CREATE UNIQUE INDEX funnels_pkey ON public.funnels USING btree (id);

CREATE INDEX funnels_status_idx ON public.funnels USING btree (status);

CREATE INDEX funnels_updated_at_idx ON public.funnels USING btree (updated_at DESC);

CREATE UNIQUE INDEX responses_pkey ON public.responses USING btree (id);

CREATE INDEX responses_screen_idx ON public.responses USING btree (session_id, screen_index);

CREATE INDEX responses_session_id_idx ON public.responses USING btree (session_id);

CREATE INDEX sessions_funnel_id_idx ON public.sessions USING btree (funnel_id);

CREATE UNIQUE INDEX sessions_pkey ON public.sessions USING btree (id);

CREATE INDEX sessions_source_idx ON public.sessions USING btree (source);

CREATE INDEX sessions_started_at_idx ON public.sessions USING btree (started_at DESC);

CREATE INDEX sessions_variant_id_idx ON public.sessions USING btree (variant_id);

CREATE INDEX variants_funnel_id_idx ON public.variants USING btree (funnel_id);

CREATE UNIQUE INDEX variants_pkey ON public.variants USING btree (id);

alter table "public"."funnels" add constraint "funnels_pkey" PRIMARY KEY using index "funnels_pkey";

alter table "public"."responses" add constraint "responses_pkey" PRIMARY KEY using index "responses_pkey";

alter table "public"."sessions" add constraint "sessions_pkey" PRIMARY KEY using index "sessions_pkey";

alter table "public"."variants" add constraint "variants_pkey" PRIMARY KEY using index "variants_pkey";

alter table "public"."responses" add constraint "responses_session_id_fkey" FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE not valid;

alter table "public"."responses" validate constraint "responses_session_id_fkey";

alter table "public"."sessions" add constraint "sessions_funnel_id_fkey" FOREIGN KEY (funnel_id) REFERENCES funnels(id) ON DELETE CASCADE not valid;

alter table "public"."sessions" validate constraint "sessions_funnel_id_fkey";

alter table "public"."sessions" add constraint "sessions_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE CASCADE not valid;

alter table "public"."sessions" validate constraint "sessions_variant_id_fkey";

alter table "public"."variants" add constraint "variants_funnel_id_fkey" FOREIGN KEY (funnel_id) REFERENCES funnels(id) ON DELETE CASCADE not valid;

alter table "public"."variants" validate constraint "variants_funnel_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

grant delete on table "public"."funnels" to "anon";

grant insert on table "public"."funnels" to "anon";

grant references on table "public"."funnels" to "anon";

grant select on table "public"."funnels" to "anon";

grant trigger on table "public"."funnels" to "anon";

grant truncate on table "public"."funnels" to "anon";

grant update on table "public"."funnels" to "anon";

grant delete on table "public"."funnels" to "authenticated";

grant insert on table "public"."funnels" to "authenticated";

grant references on table "public"."funnels" to "authenticated";

grant select on table "public"."funnels" to "authenticated";

grant trigger on table "public"."funnels" to "authenticated";

grant truncate on table "public"."funnels" to "authenticated";

grant update on table "public"."funnels" to "authenticated";

grant delete on table "public"."funnels" to "service_role";

grant insert on table "public"."funnels" to "service_role";

grant references on table "public"."funnels" to "service_role";

grant select on table "public"."funnels" to "service_role";

grant trigger on table "public"."funnels" to "service_role";

grant truncate on table "public"."funnels" to "service_role";

grant update on table "public"."funnels" to "service_role";

grant delete on table "public"."responses" to "anon";

grant insert on table "public"."responses" to "anon";

grant references on table "public"."responses" to "anon";

grant select on table "public"."responses" to "anon";

grant trigger on table "public"."responses" to "anon";

grant truncate on table "public"."responses" to "anon";

grant update on table "public"."responses" to "anon";

grant delete on table "public"."responses" to "authenticated";

grant insert on table "public"."responses" to "authenticated";

grant references on table "public"."responses" to "authenticated";

grant select on table "public"."responses" to "authenticated";

grant trigger on table "public"."responses" to "authenticated";

grant truncate on table "public"."responses" to "authenticated";

grant update on table "public"."responses" to "authenticated";

grant delete on table "public"."responses" to "service_role";

grant insert on table "public"."responses" to "service_role";

grant references on table "public"."responses" to "service_role";

grant select on table "public"."responses" to "service_role";

grant trigger on table "public"."responses" to "service_role";

grant truncate on table "public"."responses" to "service_role";

grant update on table "public"."responses" to "service_role";

grant delete on table "public"."sessions" to "anon";

grant insert on table "public"."sessions" to "anon";

grant references on table "public"."sessions" to "anon";

grant select on table "public"."sessions" to "anon";

grant trigger on table "public"."sessions" to "anon";

grant truncate on table "public"."sessions" to "anon";

grant update on table "public"."sessions" to "anon";

grant delete on table "public"."sessions" to "authenticated";

grant insert on table "public"."sessions" to "authenticated";

grant references on table "public"."sessions" to "authenticated";

grant select on table "public"."sessions" to "authenticated";

grant trigger on table "public"."sessions" to "authenticated";

grant truncate on table "public"."sessions" to "authenticated";

grant update on table "public"."sessions" to "authenticated";

grant delete on table "public"."sessions" to "service_role";

grant insert on table "public"."sessions" to "service_role";

grant references on table "public"."sessions" to "service_role";

grant select on table "public"."sessions" to "service_role";

grant trigger on table "public"."sessions" to "service_role";

grant truncate on table "public"."sessions" to "service_role";

grant update on table "public"."sessions" to "service_role";

grant delete on table "public"."variants" to "anon";

grant insert on table "public"."variants" to "anon";

grant references on table "public"."variants" to "anon";

grant select on table "public"."variants" to "anon";

grant trigger on table "public"."variants" to "anon";

grant truncate on table "public"."variants" to "anon";

grant update on table "public"."variants" to "anon";

grant delete on table "public"."variants" to "authenticated";

grant insert on table "public"."variants" to "authenticated";

grant references on table "public"."variants" to "authenticated";

grant select on table "public"."variants" to "authenticated";

grant trigger on table "public"."variants" to "authenticated";

grant truncate on table "public"."variants" to "authenticated";

grant update on table "public"."variants" to "authenticated";

grant delete on table "public"."variants" to "service_role";

grant insert on table "public"."variants" to "service_role";

grant references on table "public"."variants" to "service_role";

grant select on table "public"."variants" to "service_role";

grant trigger on table "public"."variants" to "service_role";

grant truncate on table "public"."variants" to "service_role";

grant update on table "public"."variants" to "service_role";

CREATE TRIGGER funnels_set_updated_at BEFORE UPDATE ON public.funnels FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER variants_set_updated_at BEFORE UPDATE ON public.variants FOR EACH ROW EXECUTE FUNCTION set_updated_at();


