create trigger funnels_set_updated_at
before update on public.funnels
for each row
execute function public.set_updated_at();

create trigger variants_set_updated_at
before update on public.variants
for each row
execute function public.set_updated_at();
