update public.perfis
set email_verified = true,
    email_verification_token_hash = null,
    email_verification_expires_at = null
where email_verified = false;
