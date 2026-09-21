-- Registration now requires accepting the Terms of Use and the Privacy Policy (PDL-079, 2026-09-21). The moment is recorded so
-- there is evidence of when the agreement was accepted. Accounts created before this date have no value here.
alter table user_profiles add column terms_accepted_at timestamptz;
