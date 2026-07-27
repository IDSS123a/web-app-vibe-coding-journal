-- Sprint 08: payment event log (P-1, P-16)
-- Idempotency: paypal_event_id UNIQUE means a replayed/duplicate webhook
-- delivery (PayPal's documented at-least-once behavior) is a no-op, not
-- a double-activation. Audit trail: raw_payload preserved for any future
-- dispute/investigation, not just the fields we currently act on.
create table payment_events (
  id uuid primary key default gen_random_uuid(),
  paypal_event_id text not null unique,
  event_type text not null,
  user_id uuid references user_profiles(id),
  tier text check (tier in ('basic', 'premium')),
  amount_usd numeric(10,2),
  -- 'processed': activated a subscription successfully.
  -- 'ambiguous': P-1/P-16 -- failed, timed out, or unexpected shape;
  --   flagged for manual admin review, never silently guessed either way.
  -- 'ignored': a real, understood PayPal event type this project doesn't
  --   act on (e.g. a refund notification before refunds are in scope).
  status text not null check (status in ('processed', 'ambiguous', 'ignored')),
  raw_payload jsonb not null,
  created_at timestamp with time zone not null default now()
);

create index idx_payment_events_user_id on payment_events(user_id);
create index idx_payment_events_status on payment_events(status);
