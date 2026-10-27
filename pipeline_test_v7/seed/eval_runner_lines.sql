-- pipeline_test_v6: 평가 계정(eval-runner@ubot.test)에 회선 1개와 이용 기록을 넣는다.
-- 대상 DB는 ubot_feat277_eval_20261023을 복제한 ubot_feat277_eval_lines_20261023뿐이다. 원본·v5 DB는 건드리지 않는다.
-- 기준일 2026-10-23. usage_records.billing_month는 사용한 달, billing_records.billing_month는 청구서가 나온 달이다.
-- 일부러 넣지 않은 것: 결합·로밍·로밍 차단 부가서비스(UNAVAILABLE_NOTICE 항목과 충돌하지 않게), 미납(전부 납부 완료).

BEGIN;

-- 회원 가입일을 회선 개통일과 맞춘다(기존 2026-10-20은 회선 없는 계정 기준).
UPDATE users SET created_at = TIMESTAMP '2024-03-15 10:00'
WHERE email = 'eval-runner@ubot.test';

-- 회선: Ubot 밸런스 59 75GB업(월 68,000원, 데이터 99,000MB, 음성·문자 무제한)
INSERT INTO subscriptions (user_id, plan_id, phone_number, status, activated_at,
    sim_type, sim_identifier, sim_status, sim_activated_at)
SELECT u.user_id, p.plan_id, '010-3141-5926', 'ACTIVE', TIMESTAMP '2024-03-15 11:00',
       'USIM', '8982051234500005926', 'ACTIVE', TIMESTAMP '2024-03-15 11:00'
FROM users u, plans p
WHERE u.email = 'eval-runner@ubot.test' AND p.plan_code = 'UBOT_BALANCE_08';

-- 사용량: 2026-05 ~ 2026-10. 10월은 10-22까지 집계, 미확정.
INSERT INTO usage_records (subscription_id, billing_month, data_used_mb, voice_used_minutes, sms_used_count,
    allowance_snapshot, aggregated_through_date, finalized_at, full_month_active)
SELECT s.subscription_id, v.month, v.data_mb, v.voice, v.sms,
       '{"dataAmountMb":99000,"dataUnlimited":false,"voiceUnlimited":true,"smsUnlimited":true}'::jsonb,
       CASE WHEN v.month = DATE '2026-10-01' THEN DATE '2026-10-22'
            ELSE (v.month + INTERVAL '1 month - 1 day')::DATE END,
       CASE WHEN v.month = DATE '2026-10-01' THEN NULL
            ELSE (v.month + INTERVAL '1 month')::TIMESTAMP + INTERVAL '3 hours' END,
       CASE WHEN v.month = DATE '2026-10-01' THEN NULL ELSE TRUE END
FROM subscriptions s,
     (VALUES (DATE '2026-05-01', 52310, 212, 14),
             (DATE '2026-06-01', 48770, 198, 9),
             (DATE '2026-07-01', 61240, 240, 17),
             (DATE '2026-08-01', 57980, 226, 11),
             (DATE '2026-09-01', 55120, 219, 13),
             (DATE '2026-10-01', 41230, 154, 8)) AS v(month, data_mb, voice, sms)
WHERE s.phone_number = '010-3141-5926';

-- 청구서: 2026-05 ~ 2026-10. 52,540원 = 월정액 68,000 + 부가서비스 1,540 - 선택약정 17,000.
-- 납부 기한은 매달 21일, 같은 날 자동이체로 납부 완료.
INSERT INTO billing_records (subscription_id, billing_month, base_fee, addon_fee, roaming_fee, extra_fee,
    discount_amount, total_amount, due_date, payment_status, paid_amount, payment_method, paid_at)
SELECT s.subscription_id, v.month, 68000, 1540, 0, 0, 17000, 52540,
       (v.month + INTERVAL '20 days')::DATE, 'PAID', 52540, 'AUTO_TRANSFER',
       (v.month + INTERVAL '20 days')::TIMESTAMP + INTERVAL '9 hours'
FROM subscriptions s,
     (VALUES (DATE '2026-05-01'), (DATE '2026-06-01'), (DATE '2026-07-01'),
             (DATE '2026-08-01'), (DATE '2026-09-01'), (DATE '2026-10-01')) AS v(month)
WHERE s.phone_number = '010-3141-5926';

-- 약정·할부: 선택약정 2025-03-15 ~ 2027-03-14(월 17,000원 할인), 단말 할부 24개월 중 19개월 납부.
INSERT INTO subscription_contracts (subscription_id, contract_type, started_at, expires_at, discount_amount, status,
    device_name, device_total_amount, installment_months, paid_installment_months, monthly_installment_amount,
    remaining_installment_amount, installment_started_at, installment_expires_at, installment_status)
SELECT subscription_id, 'SELECTIVE_CONTRACT', DATE '2025-03-15', DATE '2027-03-14', 17000, 'ACTIVE',
       'Galaxy S25', 1155000, 24, 19, 48125, 240625, DATE '2025-03-15', DATE '2027-03-14', 'ACTIVE'
FROM subscriptions WHERE phone_number = '010-3141-5926';

-- 부가서비스: 이용 중 2개(컬러링 990원, 부재중 알림 550원)
INSERT INTO subscription_addons (subscription_id, addon_service_id, subscribed_at, status,
    service_name_snapshot, monthly_fee_snapshot)
SELECT s.subscription_id, a.addon_service_id, v.subscribed_at, 'ACTIVE', a.name, a.monthly_fee
FROM subscriptions s
     JOIN (VALUES ('UBOT_ADDON_RING', TIMESTAMP '2024-03-15 11:00'),
                  ('UBOT_ADDON_MISSED', TIMESTAMP '2025-06-01 20:00')) AS v(code, subscribed_at) ON TRUE
     JOIN addon_services a ON a.code = v.code
WHERE s.phone_number = '010-3141-5926';

COMMIT;
