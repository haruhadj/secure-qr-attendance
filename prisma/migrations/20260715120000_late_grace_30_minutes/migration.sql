-- Upgrade the former application default without overwriting an administrator's
-- custom grace period.
UPDATE "SystemSetting"
SET "value" = '30'
WHERE "key" = 'late_grace_minutes'
  AND "value" = '15';

-- The automatic absence feature is opt-in so existing deployments are not
-- changed without an administrator explicitly enabling it.
UPDATE "SystemSetting"
SET "value" = 'false'
WHERE "key" = 'auto_absent_enabled'
  AND "value" = 'true';
