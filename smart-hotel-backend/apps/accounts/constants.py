class UserRole:
    MANAGER = 'manager'
    RECEPTIONIST = 'receptionist'
    HOUSEKEEPING = 'housekeeping'
    CUSTOMER = 'customer'

    CHOICES = [
        (MANAGER, 'Manager'),
        (RECEPTIONIST, 'Receptionist'),
        (HOUSEKEEPING, 'Housekeeping'),
        (CUSTOMER, 'Customer'),
    ]

    STAFF = (MANAGER, RECEPTIONIST, HOUSEKEEPING)
