# Smart Hotel Management System — Backend

Hệ thống quản lý khách sạn thông minh — thiết kế API Django REST Framework.

## Tài liệu

| File | Nội dung |
|------|----------|
| [API.md](./API.md) | Toàn bộ endpoint, request/response cho Postman |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Kiến trúc, cấu trúc thư mục, patterns |
| [docs/DATABASE.md](./docs/DATABASE.md) | Schema, quan hệ, indexes |
| [docs/PERMISSIONS.md](./docs/PERMISSIONS.md) | Ma trận phân quyền RBAC |
| [docs/IMPLEMENTATION.md](./docs/IMPLEMENTATION.md) | Thứ tự implement, flow hệ thống |

## Tech stack

- Django + DRF
- PostgreSQL
- Redis + Celery
- OAuth2 + JWT
- drf-spectacular (Swagger)

## Trạng thái

| Phase | Trạng thái |
|-------|------------|
| 0 — Foundation | Done |
| 1 — Rooms | Done |
| 2 — Bookings | Done |
| 3 — Payments + Invoices | Done |
| 4 — Hotel Services | Done |
| 5 — Housekeeping | Done |
| 6 — Notifications | Done |
| 7 — Analytics | Done |

## Quick start

```bash
cd smart-hotel-backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements/dev.txt
copy .env.example .env
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

Tài khoản demo (sau `seed_demo`):

| Email | Password | Role |
|-------|----------|------|
| admin@hotel.com | Admin@123 | Super Admin |
| manager@hotel.com | Admin@123 | Manager |
| reception@hotel.com | Admin@123 | Receptionist |
| customer@hotel.com | Admin@123 | Customer |
| housekeeping@hotel.com | Admin@123 | Housekeeping |

Swagger: http://127.0.0.1:8000/api/docs/ (~60 endpoints, 14 tags)

Swagger: http://localhost:8000/api/docs/

## VNPay (sandbox)

1. Copy `.env.example` → `.env`, điền `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` (từ Merchant VNPay TEST).
2. `VNPAY_RETURN_URL` / `VNPAY_IPN_URL` trỏ về backend (`BACKEND_BASE_URL` + `/api/v1/payments/vnpay/...`).
3. Đăng ký **IPN URL** trên [Merchant Admin sandbox](https://sandbox.vnpayment.vn/merchantv2/) (IPN cần host public — dùng ngrok khi dev local).
4. `POST /api/v1/payments/` với `method: "vnpay"` → mở `payment_url` trong trình duyệt.
5. Thẻ test NCB: `9704198526191432198`, OTP `123456` (theo tài liệu VNPay).

Tài liệu: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
