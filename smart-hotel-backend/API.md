cd smart-hotel-backend
.venv/scripts/activate
python manage.py runserver

# Smart Hotel API — Postman Reference

**Base URL**: `http://localhost:8000/api/v1`  
**Auth header**: `Authorization: Bearer <access_token>`  
**Content-Type**: `application/json` (trừ upload: `multipart/form-data`)

---

## Response envelope

### Thành công (single object)

```json
{
  "success": true,
  "data": { }
}
```

### Thành công (list có phân trang)

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "page_size": 20,
    "total_pages": 5,
    "total_count": 98
  }
}
```

### Lỗi

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": {
      "email": ["Email đã tồn tại"]
    }
  }
}
```

---

## 1. Authentication

### 1.1 Đăng ký (Customer)

`POST /auth/register/`  
**Auth**: Không  
**Body**:

```json
{
  "email": "customer@example.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "full_name": "Nguyen Van A",
  "phone": "0901234567"
}
```

**Response 201**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "customer@example.com",
    "full_name": "Nguyen Van A",
    "phone": "0901234567",
    "role": "customer",
    "created_at": "2026-05-21T08:00:00Z"
  }
}
```

---

### 1.2 Đăng nhập

`POST /auth/login/`  
**Auth**: Không  
**Body**:

```json
{
  "email": "receptionist@hotel.com",
  "password": "SecurePass123!"
}
```

**Response 200**:

```json
{
  "success": true,
  "data": {
    "access": "eyJhbGciOiJIUzI1NiIs...",
    "refresh": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "receptionist@hotel.com",
      "full_name": "Le Tan A",
      "role": "receptionist",
      "avatar": null
    }
  }
}
```

---

### 1.3 Refresh token

`POST /auth/token/refresh/`  
**Auth**: Không  
**Body**:

```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response 200**:

```json
{
  "success": true,
  "data": {
    "access": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 1.4 Đăng xuất

`POST /auth/logout/`  
**Auth**: Bearer  
**Body**:

```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response 204**: No body

---

### 1.5 Quên mật khẩu

`POST /auth/password/forgot/`  
**Auth**: Không  
**Body**:

```json
{
  "email": "customer@example.com"
}
```

**Response 200**:

```json
{
  "success": true,
  "data": {
    "message": "Nếu email tồn tại, link đặt lại mật khẩu đã được gửi"
  }
}
```

---

### 1.6 Đặt lại mật khẩu

`POST /auth/password/reset/`  
**Auth**: Không  
**Body**:

```json
{
  "token": "reset-token-from-email",
  "new_password": "NewSecurePass123!",
  "new_password_confirm": "NewSecurePass123!"
}
```

**Response 200**:

```json
{
  "success": true,
  "data": {
    "message": "Đổi mật khẩu thành công"
  }
}
```

---

### 1.7 Đổi mật khẩu

`POST /auth/password/change/`  
**Auth**: Bearer  
**Body**:

```json
{
  "old_password": "SecurePass123!",
  "new_password": "NewSecurePass456!",
  "new_password_confirm": "NewSecurePass456!"
}
```

**Response 200**:

```json
{
  "success": true,
  "data": {
    "message": "Đổi mật khẩu thành công"
  }
}
```

---

### 1.8 Profile hiện tại

`GET /auth/me/`  
**Auth**: Bearer  

**Response 200**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "customer@example.com",
    "full_name": "Nguyen Van A",
    "phone": "0901234567",
    "role": "customer",
    "avatar": "https://cdn.hotel.com/avatars/uuid.jpg",
    "email_verified": true,
    "created_at": "2026-05-21T08:00:00Z"
  }
}
```

---

### 1.9 Cập nhật profile

`PATCH /auth/me/`  
**Auth**: Bearer  
**Body** (partial):

```json
{
  "full_name": "Nguyen Van B",
  "phone": "0909999888"
}
```

**Response 200**: Giống 1.8

---

### 1.10 Upload avatar

`POST /auth/me/avatar/`  
**Auth**: Bearer  
**Content-Type**: `multipart/form-data`  
**Form**: `avatar` = file (jpg/png, max 5MB)

**Response 200**:

```json
{
  "success": true,
  "data": {
    "avatar": "https://cdn.hotel.com/avatars/uuid.jpg"
  }
}
```

---

## 2. Staff management (Manager)

### 2.1 Danh sách nhân viên

`GET /staff/`  
**Auth**: Manager  
**Query**: `?role=receptionist&page=1&page_size=20&search=nguyen`

**Response 200**:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "hk01@hotel.com",
      "full_name": "Nhan Vien Don",
      "role": "housekeeping",
      "phone": "0901111222",
      "employee_code": "HK-001",
      "department": "Housekeeping",
      "is_active": true
    }
  ],
  "meta": { "page": 1, "page_size": 20, "total_pages": 1, "total_count": 3 }
}
```

---

### 2.2 Tạo nhân viên

`POST /staff/`  
**Auth**: Manager  
**Body**:

```json
{
  "email": "hk02@hotel.com",
  "password": "TempPass123!",
  "full_name": "Tran Thi B",
  "phone": "0903333444",
  "role": "housekeeping",
  "employee_code": "HK-002",
  "department": "Housekeeping",
  "hire_date": "2026-01-15"
}
```

**Response 201**: Object nhân viên (không trả password)

---

### 2.3 Chi tiết / Cập nhật / Vô hiệu hóa

| Method | URL | Body |
|--------|-----|------|
| GET | `/staff/{id}/` | — |
| PATCH | `/staff/{id}/` | `{ "full_name", "phone", "department" }` |
| DELETE | `/staff/{id}/` | Soft delete → `is_active: false` |

---

## 3. Room Types

### 3.1 Danh sách loại phòng

`GET /room-types/`  
**Auth**: Bearer (Customer: chỉ active)  
**Query**: `?search=deluxe&page=1&ordering=-base_price`

**Response 200**:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Deluxe Double",
      "description": "Phòng đôi view biển",
      "max_occupancy": 2,
      "base_price": "2500000.00",
      "primary_image": "https://cdn.hotel.com/rooms/deluxe.jpg",
      "amenities": [
        { "id": "uuid", "name": "WiFi", "icon": "wifi" },
        { "id": "uuid", "name": "Breakfast", "icon": "food" }
      ],
      "is_active": true
    }
  ],
  "meta": { "page": 1, "page_size": 20, "total_pages": 1, "total_count": 4 }
}
```

---

### 3.2 Chi tiết loại phòng

`GET /room-types/{id}/`  
**Auth**: Bearer  

**Response 200**: Object đầy đủ + `images[]` + `prices[]`

---

### 3.3 Tạo loại phòng

`POST /room-types/`  
**Auth**: Manager  
**Body**:

```json
{
  "name": "Suite Premium",
  "description": "Phòng suite cao cấp",
  "max_occupancy": 4,
  "base_price": "5500000.00",
  "amenity_ids": ["uuid-amenity-1", "uuid-amenity-2"]
}
```

**Response 201**: Object room type

---

### 3.4 Cập nhật / Xóa

| Method | URL | Auth |
|--------|-----|------|
| PATCH | `/room-types/{id}/` | Manager |
| DELETE | `/room-types/{id}/` | Manager |

---

### 3.5 Upload ảnh loại phòng

`POST /room-types/{id}/images/`  
**Auth**: Manager  
**Form**: `image` (file), `is_primary` (bool), `sort_order` (int)

**Response 201**:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "image": "https://cdn.hotel.com/room-types/uuid.jpg",
    "is_primary": true,
    "sort_order": 0
  }
}
```

---

### 3.6 Quản lý giá theo mùa

`POST /room-types/{id}/prices/`  
**Auth**: Manager  
**Body**:

```json
{
  "price": "3000000.00",
  "valid_from": "2026-06-01",
  "valid_to": "2026-08-31"
}
```

`GET /room-types/{id}/prices/` — danh sách giá

---

## 4. Rooms

### 4.1 Danh sách phòng

`GET /rooms/`  
**Auth**: Bearer  
**Query**: `?status=available&floor=3&room_type_id=uuid&page=1`

**Response 200**:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "room_number": "301",
      "floor": 3,
      "room_type": {
        "id": "uuid",
        "name": "Deluxe Double"
      },
      "status": "available",
      "notes": null,
      "is_active": true
    }
  ],
  "meta": { "page": 1, "page_size": 20, "total_pages": 2, "total_count": 25 }
}
```

---

### 4.2 Chi tiết phòng

`GET /rooms/{id}/`  
**Auth**: Bearer  

---

### 4.3 Tạo phòng

`POST /rooms/`  
**Auth**: Manager  
**Body**:

```json
{
  "room_number": "502",
  "floor": 5,
  "room_type_id": "uuid-room-type",
  "status": "available",
  "notes": "Gần thang máy"
}
```

---

### 4.4 Cập nhật trạng thái phòng

`PATCH /rooms/{id}/status/`  
**Auth**: Receptionist, Manager, Housekeeping (giới hạn)  
**Body**:

```json
{
  "status": "cleaning",
  "notes": "Khách đã checkout"
}
```

**Response 200**: Object room đã cập nhật

**Giá trị status**: `available` | `reserved` | `occupied` | `cleaning` | `maintenance`

---

### 4.5 Cập nhật / Xóa phòng

| Method | URL | Auth |
|--------|-----|------|
| PATCH | `/rooms/{id}/` | Manager |
| DELETE | `/rooms/{id}/` | Manager |

---

## 5. Amenities

### 5.1 CRUD tiện nghi

| Method | URL | Auth | Body (POST/PATCH) |
|--------|-----|------|-------------------|
| GET | `/amenities/` | Bearer | — |
| POST | `/amenities/` | Manager | `{ "name": "Pool", "icon": "pool" }` |
| PATCH | `/amenities/{id}/` | Manager | partial |
| DELETE | `/amenities/{id}/` | Manager | — |

---

## 6. Availability & Bookings

### 6.1 Kiểm tra phòng trống

`GET /rooms/availability/`  
**Auth**: Bearer (Customer+)  
**Query** (bắt buộc):

```
check_in=2026-06-01
check_out=2026-06-05
adults=2
children=0
room_type_id=uuid (optional)
```

**Response 200**:

```json
{
  "success": true,
  "data": {
    "check_in": "2026-06-01",
    "check_out": "2026-06-05",
    "nights": 4,
    "room_types": [
      {
        "room_type_id": "uuid",
        "name": "Deluxe Double",
        "available_count": 5,
        "price_per_night": "2500000.00",
        "total_price": "10000000.00"
      }
    ]
  }
}
```

---

### 6.2 Tạo booking (Customer online)

`POST /bookings/`  
**Auth**: Customer  
**Body**:

```json
{
  "check_in_date": "2026-06-01",
  "check_out_date": "2026-06-05",
  "adults": 2,
  "children": 0,
  "rooms": [
    {
      "room_type_id": "uuid",
      "quantity": 1
    }
  ],
  "special_request": "Giường đôi, tầng cao"
}
```

**Response 201**:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "booking_code": "BK-20260601-0001",
    "status": "pending",
    "customer": {
      "id": "uuid",
      "full_name": "Nguyen Van A",
      "email": "customer@example.com"
    },
    "check_in_date": "2026-06-01",
    "check_out_date": "2026-06-05",
    "adults": 2,
    "children": 0,
    "nights": 4,
    "rooms": [
      {
        "id": "uuid",
        "room_id": "uuid",
        "room_number": "301",
        "room_type_name": "Deluxe Double",
        "price_per_night": "2500000.00",
        "nights": 4,
        "subtotal": "10000000.00"
      }
    ],
    "total_amount": "10000000.00",
    "special_request": "Giường đôi, tầng cao",
    "created_at": "2026-05-21T10:00:00Z"
  }
}
```

---

### 6.3 Tạo booking walk-in (Lễ tân)

`POST /bookings/walk-in/`  
**Auth**: Receptionist, Manager  
**Body**:

```json
{
  "customer_id": "uuid-customer",
  "check_in_date": "2026-06-01",
  "check_out_date": "2026-06-03",
  "adults": 2,
  "children": 0,
  "room_ids": ["uuid-room-301", "uuid-room-302"],
  "special_request": "Late check-in",
  "status": "confirmed"
}
```

**Response 201**: Giống 6.2, `status` có thể `confirmed` ngay

---

### 6.4 Danh sách booking

`GET /bookings/`  
**Auth**: Role-based  
**Query**: `?status=confirmed&check_in_date=2026-06-01&customer_id=uuid&search=BK-2026&page=1&ordering=-created_at`

**Customer**: chỉ thấy booking của mình  
**Receptionist/Manager**: tất cả

---

### 6.5 Chi tiết booking

`GET /bookings/{id}/`  
**Auth**: Owner hoặc Staff  

**Response 200**: Object đầy đủ + `payments[]` + `service_orders[]`

---

### 6.6 Xác nhận booking

`POST /bookings/{id}/confirm/`  
**Auth**: Receptionist, Manager  
**Body**: `{}` hoặc `{ "note": "Đã xác nhận qua điện thoại" }`

**Response 200**: `status: "confirmed"`

---

### 6.7 Hủy booking

`POST /bookings/{id}/cancel/`  
**Auth**: Receptionist, Manager, Customer (pending only)  
**Body**:

```json
{
  "reason": "Thay đổi lịch trình"
}
```

**Response 200**: `status: "cancelled"`

---

### 6.8 Check-in

`POST /bookings/{id}/check-in/`  
**Auth**: Receptionist, Manager  
**Body** (optional):

```json
{
  "room_ids": ["uuid-room-301"],
  "note": "Khách đến sớm 1h"
}
```

**Response 200**:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "checked_in",
    "checked_in_at": "2026-06-01T12:00:00Z",
    "rooms": [{ "room_number": "301", "status": "occupied" }]
  }
}
```

---

### 6.9 Check-out

`POST /bookings/{id}/check-out/`  
**Auth**: Receptionist, Manager  
**Body** (optional):

```json
{
  "note": "Không phát sinh thêm"
}
```

**Response 200**:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "checked_out",
    "checked_out_at": "2026-06-05T11:00:00Z",
    "rooms": [{ "room_number": "301", "status": "cleaning" }],
    "housekeeping_task_id": "uuid-task"
  }
}
```

---

### 6.10 Lịch sử trạng thái booking

`GET /bookings/{id}/status-history/`  
**Auth**: Staff / Owner booking  

**Response 200**:

```json
{
  "success": true,
  "data": [
    {
      "from_status": "pending",
      "to_status": "confirmed",
      "changed_by": { "full_name": "Le Tan A" },
      "changed_at": "2026-05-21T10:30:00Z"
    }
  ]
}
```

---

## 7. Payments

### 7.1 Tạo thanh toán

`POST /payments/`  
**Auth**: Customer, Receptionist, Manager  
**Body**:

```json
{
  "booking_id": "uuid-booking",
  "amount": "10000000.00",
  "method": "vnpay"
}
```

**method**: `cash` | `card` | `bank_transfer` | `momo` | `vnpay`

**Response 201** (online):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "booking_id": "uuid",
    "amount": "10000000.00",
    "method": "vnpay",
    "status": "pending",
    "payment_url": "https://sandbox.vnpayment.vn/...",
    "created_at": "2026-05-21T10:35:00Z"
  }
}
```

**Response 201** (cash — receptionist):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed",
    "paid_at": "2026-05-21T10:35:00Z"
  }
}
```

---

### 7.2 VNPay — Tạo URL thanh toán

`POST /payments/` với `method: "vnpay"`. Response `payment_url` là link redirect sang VNPay sandbox.

**Body tùy chọn**:

```json
{
  "booking_id": "uuid-booking",
  "amount": "10000000.00",
  "method": "vnpay",
  "bank_code": "NCB",
  "locale": "vn"
}
```

`vnp_Amount` gửi sang VNPay = `amount × 100` (VND, không có dấu thập phân).

---

### 7.3 VNPay IPN (bắt buộc đăng ký trên Merchant Admin)

`GET /payments/vnpay/ipn/`  
**Auth**: Không (VNPay server gọi)  
**Query**: Toàn bộ params VNPay trả về (`vnp_TxnRef`, `vnp_Amount`, `vnp_SecureHash`, …)

**Response 200** (JSON thuần, không envelope):

```json
{ "RspCode": "00", "Message": "Confirm Success" }
```

| RspCode | Ý nghĩa |
|---------|---------|
| 00 | Xác nhận thành công |
| 01 | Không tìm thấy đơn |
| 02 | Đơn đã xác nhận trước đó |
| 04 | Sai số tiền |
| 97 | Sai checksum |

Đăng ký IPN URL trên https://sandbox.vnpayment.vn/merchantv2/ → **Cấu hình** → IPN URL = `VNPAY_IPN_URL` (cần URL public; dev dùng ngrok).

---

### 7.4 VNPay Return URL

`GET /payments/vnpay/return/`  
Trình duyệt redirect sau khi khách thanh toán. Cấu hình `VNPAY_RETURN_URL` trùng URL này.

**Response 200** (envelope):

```json
{
  "success": true,
  "data": {
    "payment": { "id": "uuid", "status": "completed", "vnp_transaction_no": "..." },
    "vnp_response_code": "00",
    "vnp_transaction_status": "00",
    "vnp_transaction_no": "14232524",
    "success": true
  }
}
```

---

### 7.5 Webhook thủ công (dev / MoMo)

`POST /payments/webhook/vnpay/`  
**Body**: `{ "transaction_ref": "TXN-..." }`

---


### 7.3 Danh sách thanh toán

`GET /payments/`  
**Auth**: Staff / Customer (own)  
**Query**: `?booking_id=uuid&status=completed&page=1`

---

### 7.7 Chi tiết thanh toán

`GET /payments/{id}/`  
**Auth**: Staff / Owner booking  

---

### 7.8 Hoàn tiền

`POST /payments/{id}/refund/`  
**Auth**: Manager  
**Body**:

```json
{
  "amount": "5000000.00",
  "reason": "Hủy một phần dịch vụ"
}
```

---

## 8. Invoices

### 8.1 Danh sách hóa đơn

`GET /invoices/`  
**Query**: `?booking_id=uuid&page=1`

### 8.2 Chi tiết hóa đơn

`GET /invoices/{id}/`  

**Response 200**:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "invoice_number": "INV-2026-00001",
    "booking": {
      "booking_code": "BK-20260601-0001"
    },
    "subtotal": "10000000.00",
    "tax": "1000000.00",
    "discount": "0.00",
    "total": "11000000.00",
    "issued_at": "2026-05-21T10:40:00Z",
    "pdf_url": "https://cdn.hotel.com/invoices/uuid.pdf",
    "line_items": [
      { "description": "Deluxe Double x 4 đêm", "amount": "10000000.00" },
      { "description": "Spa package", "amount": "500000.00" }
    ]
  }
}
```

### 8.3 Tạo hóa đơn từ booking

`POST /invoices/`  
**Auth**: Receptionist, Manager  
**Body**:

```json
{
  "booking_id": "uuid-booking"
}
```

---

## 9. Hotel Services

### 9.1 Danh mục dịch vụ

`GET /service-categories/`  
**Auth**: Bearer  

### 9.2 Danh sách dịch vụ

`GET /services/`  
**Query**: `?category_id=uuid&is_active=true`

**Response 200**:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Spa 60 phút",
      "category": { "id": "uuid", "name": "Spa" },
      "description": "Massage toàn thân",
      "price": "800000.00",
      "unit": "per_person",
      "is_active": true
    }
  ]
}
```

### 9.3 CRUD dịch vụ (Manager)

| Method | URL | Body |
|--------|-----|------|
| POST | `/services/` | `{ "category_id", "name", "description", "price", "unit" }` |
| PATCH | `/services/{id}/` | partial |
| DELETE | `/services/{id}/` | soft delete |

---

### 9.4 Đặt dịch vụ

`POST /service-orders/`  
**Auth**: Customer, Receptionist  
**Body**:

```json
{
  "booking_id": "uuid-booking",
  "scheduled_at": "2026-06-02T15:00:00Z",
  "items": [
    {
      "service_id": "uuid-spa",
      "quantity": 2
    },
    {
      "service_id": "uuid-airport",
      "quantity": 1
    }
  ],
  "note": "Đón sân bay 14:00"
}
```

**Response 201**:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "booking_id": "uuid",
    "status": "pending",
    "total_amount": "2500000.00",
    "items": [
      {
        "service_name": "Spa 60 phút",
        "quantity": 2,
        "unit_price": "800000.00",
        "subtotal": "1600000.00"
      }
    ],
    "scheduled_at": "2026-06-02T15:00:00Z",
    "created_at": "2026-05-21T11:00:00Z"
  }
}
```

---

### 9.5 Danh sách / Chi tiết đơn dịch vụ

| Method | URL |
|--------|-----|
| GET | `/service-orders/` |
| GET | `/service-orders/{id}/` |
| POST | `/service-orders/{id}/confirm/` | Receptionist |
| POST | `/service-orders/{id}/cancel/` | Customer (pending), Staff |

---

### 9.6 Lịch sử dịch vụ theo booking

`GET /bookings/{id}/service-orders/`  
**Auth**: Owner / Staff  

---

## 10. Housekeeping

### 10.1 Danh sách task

`GET /housekeeping/tasks/`  
**Auth**: Housekeeping, Receptionist, Manager  
**Query**: `?status=pending&assigned_to=me&priority=high&floor=3`

**Housekeeping**: `assigned_to=me` hoặc pool `unassigned=true`

**Response 200**:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "room": {
        "id": "uuid",
        "room_number": "301",
        "floor": 3,
        "status": "cleaning"
      },
      "assigned_to": {
        "id": "uuid",
        "full_name": "Tran Thi B"
      },
      "status": "pending",
      "priority": "high",
      "task_type": "checkout_clean",
      "notes": "Khách checkout 11:00",
      "created_at": "2026-06-05T11:05:00Z"
    }
  ]
}
```

---

### 10.2 Tạo task (thủ công)

`POST /housekeeping/tasks/`  
**Auth**: Receptionist, Manager  
**Body**:

```json
{
  "room_id": "uuid-room",
  "assigned_to_id": "uuid-housekeeping",
  "priority": "normal",
  "task_type": "daily_clean",
  "notes": "Dọn định kỳ"
}
```

---

### 10.3 Giao task

`POST /housekeeping/tasks/{id}/assign/`  
**Auth**: Receptionist, Manager  
**Body**:

```json
{
  "assigned_to_id": "uuid-housekeeping"
}
```

---

### 10.4 Cập nhật trạng thái task

`PATCH /housekeeping/tasks/{id}/`  
**Auth**: Assignee, Receptionist, Manager  
**Body**:

```json
{
  "status": "in_progress"
}
```

**status**: `pending` | `in_progress` | `completed` | `cancelled`

Khi `completed` → room tự chuyển `available`

---

### 10.5 Lịch sử dọn phòng

`GET /housekeeping/tasks/{id}/logs/`  
`GET /housekeeping/history/?room_id=uuid&from=2026-06-01&to=2026-06-30`

---

## 11. Notifications

### 11.1 Danh sách thông báo

`GET /notifications/`  
**Auth**: Bearer  
**Query**: `?is_read=false&page=1`

**Response 200**:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "booking_confirmed",
      "title": "Đặt phòng thành công",
      "body": "Booking BK-20260601-0001 đã được xác nhận",
      "is_read": false,
      "sent_at": "2026-05-21T10:30:00Z",
      "metadata": { "booking_id": "uuid" }
    }
  ]
}
```

---

### 11.2 Đánh dấu đã đọc

`POST /notifications/{id}/read/`  
`POST /notifications/read-all/`

---

## 12. Analytics & Reports (Manager)

### 12.1 Doanh thu

`GET /analytics/revenue/`  
**Auth**: Manager  
**Query**: `?period=month&year=2026&month=5`  
**period**: `day` | `month` | `quarter` | `year`

**Response 200**:

```json
{
  "success": true,
  "data": {
    "period": "month",
    "year": 2026,
    "month": 5,
    "total_revenue": "450000000.00",
    "room_revenue": "380000000.00",
    "service_revenue": "70000000.00",
    "payment_breakdown": {
      "cash": "120000000.00",
      "vnpay": "200000000.00",
      "momo": "130000000.00"
    },
    "daily": [
      { "date": "2026-05-01", "revenue": "15000000.00" }
    ]
  }
}
```

---

### 12.2 Tỷ lệ lấp phòng (Occupancy)

`GET /analytics/occupancy/`  
**Query**: `?from=2026-05-01&to=2026-05-31`

**Response 200**:

```json
{
  "success": true,
  "data": {
    "from": "2026-05-01",
    "to": "2026-05-31",
    "total_rooms": 50,
    "occupancy_rate": 0.72,
    "occupied_room_nights": 1080,
    "available_room_nights": 1550
  }
}
```

---

### 12.3 Thống kê booking

`GET /analytics/bookings/`  
**Query**: `?period=quarter&year=2026&quarter=2`

**Response 200**:

```json
{
  "success": true,
  "data": {
    "total_bookings": 320,
    "by_status": {
      "pending": 12,
      "confirmed": 45,
      "checked_in": 28,
      "checked_out": 220,
      "cancelled": 15
    },
    "cancellation_rate": 0.047
  }
}
```

---

### 12.4 Thống kê dịch vụ

`GET /analytics/services/`  
**Query**: `?period=month&year=2026&month=5`

**Response 200**:

```json
{
  "success": true,
  "data": {
    "top_services": [
      { "service_name": "Spa 60 phút", "order_count": 85, "revenue": "68000000.00" },
      { "service_name": "Đưa đón sân bay", "order_count": 40, "revenue": "20000000.00" }
    ],
    "total_service_revenue": "70000000.00"
  }
}
```

---

### 12.5 Dashboard tổng hợp

`GET /analytics/dashboard/`  
**Auth**: Manager  
**Query**: `?date=2026-05-21`

**Response 200**:

```json
{
  "success": true,
  "data": {
    "today_check_ins": 8,
    "today_check_outs": 6,
    "rooms_available": 32,
    "rooms_occupied": 15,
    "rooms_cleaning": 3,
    "pending_bookings": 4,
    "today_revenue": "25000000.00",
    "pending_housekeeping_tasks": 5
  }
}
```

---

## 13. Customers (Receptionist / Manager)

### 13.1 Danh sách khách

`GET /customers/`  
**Auth**: Receptionist, Manager  
**Query**: `?search=nguyen&page=1`

### 13.2 Chi tiết khách + lịch sử booking

`GET /customers/{id}/`  
`GET /customers/{id}/bookings/`

---

## 14. Health

### 14.1 Health check

`GET /health/`  
**Auth**: Không  

**Response 200**:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "ok",
    "redis": "ok"
  }
}
```

---

## 15. HTTP Status codes

| Code | Khi nào |
|------|---------|
| 200 | GET, PATCH thành công |
| 201 | POST tạo mới |
| 204 | DELETE, logout |
| 400 | Validation / business error |
| 401 | Chưa đăng nhập / token hết hạn |
| 403 | Không đủ quyền |
| 404 | Không tìm thấy |
| 409 | Conflict (phòng đã được đặt) |
| 422 | Unprocessable (availability) |
| 500 | Server error |

---

## 16. Postman collection — biến môi trường

| Variable | Ví dụ |
|----------|-------|
| `base_url` | `http://localhost:8000/api/v1` |
| `access_token` | (set sau login) |
| `refresh_token` | (set sau login) |
| `booking_id` | (set sau tạo booking) |
| `room_id` | |
| `customer_id` | |

### Test flow gợi ý

1. `POST /auth/register/` → Customer  
2. `POST /auth/login/` → lưu token  
3. `GET /rooms/availability/`  
4. `POST /bookings/`  
5. `POST /payments/` (cash hoặc vnpay)  
6. `GET /bookings/{id}/`  
7. Login Receptionist → `POST /bookings/{id}/check-in/`  
8. `POST /bookings/{id}/check-out/`  
9. Login Housekeeping → `GET /housekeeping/tasks/` → `PATCH` completed  
10. Login Manager → `GET /analytics/dashboard/`

---

## 17. API endpoint summary

| # | Method | Endpoint | Role chính |
|---|--------|----------|------------|
| 1 | POST | `/auth/register/` | Public |
| 2 | POST | `/auth/login/` | Public |
| 3 | POST | `/auth/token/refresh/` | Public |
| 4 | POST | `/auth/logout/` | All |
| 5 | POST | `/auth/password/forgot/` | Public |
| 6 | POST | `/auth/password/reset/` | Public |
| 7 | POST | `/auth/password/change/` | All |
| 8 | GET/PATCH | `/auth/me/` | All |
| 9 | POST | `/auth/me/avatar/` | All |
| 10 | GET/POST | `/staff/` | Manager |
| 11 | GET/PATCH/DELETE | `/staff/{id}/` | Manager |
| 12 | GET/POST | `/room-types/` | All / Manager |
| 13 | GET/PATCH/DELETE | `/room-types/{id}/` | All / Manager |
| 14 | POST | `/room-types/{id}/images/` | Manager |
| 15 | GET/POST | `/room-types/{id}/prices/` | Manager |
| 16 | GET/POST | `/rooms/` | All / Manager |
| 17 | GET/PATCH/DELETE | `/rooms/{id}/` | All / Manager |
| 18 | PATCH | `/rooms/{id}/status/` | Staff |
| 19 | GET | `/rooms/availability/` | All |
| 20 | GET/POST | `/amenities/` | Manager |
| 21 | GET/POST | `/bookings/` | Customer+ |
| 22 | POST | `/bookings/walk-in/` | Receptionist |
| 23 | GET | `/bookings/{id}/` | Owner/Staff |
| 24 | POST | `/bookings/{id}/confirm/` | Receptionist |
| 25 | POST | `/bookings/{id}/cancel/` | Customer/Staff |
| 26 | POST | `/bookings/{id}/check-in/` | Receptionist |
| 27 | POST | `/bookings/{id}/check-out/` | Receptionist |
| 28 | GET | `/bookings/{id}/status-history/` | Owner/Staff |
| 29 | GET/POST | `/payments/` | Customer/Staff |
| 30 | GET | `/payments/vnpay/ipn/` | VNPay IPN |
| 31 | GET | `/payments/vnpay/return/` | VNPay Return |
| 32 | POST | `/payments/webhook/vnpay/` | Dev webhook |
| 33 | POST | `/payments/{id}/refund/` | Manager |
| 34 | GET/POST | `/invoices/` | Staff |
| 35 | GET | `/services/` | All |
| 36 | POST/PATCH | `/services/` | Manager |
| 37 | GET/POST | `/service-orders/` | Customer/Staff |
| 38 | GET/POST/PATCH | `/housekeeping/tasks/` | HK/Staff |
| 39 | POST | `/housekeeping/tasks/{id}/assign/` | Receptionist |
| 40 | GET | `/notifications/` | All |
| 41 | GET | `/analytics/revenue/` | Manager |
| 42 | GET | `/analytics/occupancy/` | Manager |
| 43 | GET | `/analytics/bookings/` | Manager |
| 44 | GET | `/analytics/services/` | Manager |
| 45 | GET | `/analytics/dashboard/` | Manager |
| 44 | GET | `/customers/` | Receptionist |
| 45 | GET | `/health/` | Public |

**Swagger UI**: `GET /api/docs/`  
**OpenAPI schema**: `GET /api/schema/`
