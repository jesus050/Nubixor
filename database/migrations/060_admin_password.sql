-- Migration 060: Inject temporary admin password
UPDATE users 
SET password_hash = 'scrypt$16384$8$1$d981533cd4c0833d889a89765ac1a1f4$558a9442421422ef259c953dab7ecb70f0e9e497ef6d51f4a22debf5a3d5775de27012ef71bcc8570702a52ee8b034983e22f24c8870368378978f469052e047', 
    password_changed_at = now(), 
    failed_login_attempts = 0, 
    locked_until = NULL, 
    status = 'ACTIVE' 
WHERE email = 'admin@megasuite.local';
