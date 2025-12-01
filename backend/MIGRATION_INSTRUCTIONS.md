# Database Migration Instructions

## Add REVIEW_RECEIVED Notification Type

A new notification type `REVIEW_RECEIVED` has been added to the schema.

### Run Migration:

```bash
cd backend
npx prisma migrate dev --name add-review-notification-type
```

Or if you want to just push the changes without creating a migration:

```bash
cd backend
npx prisma db push
```

### What This Does:
- Adds `REVIEW_RECEIVED` to the `NotificationType` enum
- Allows the system to send review notifications to producers

### After Migration:
When a buyer submits a review, the producer will receive a notification like:
- "⭐⭐⭐⭐⭐ New 5-star review on your product 'Coffee Beans': 'Great quality!'"
