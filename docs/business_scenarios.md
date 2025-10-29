# Business Scenarios for ITI Books E-commerce Backend

This document outlines key business scenarios for the ITI Books E-commerce Backend application, an online bookstore platform built with Node.js. Each scenario describes user interactions, system responses, and expected outcomes, covering the main features of the application.

## 1. User Registration and Authentication

### Scenario 1.1: New User Registration via Email
- **Actor**: New Customer
- **Preconditions**: User has no existing account
- **Steps**:
  1. User provides email, password, and optional profile information
  2. System validates input and checks for existing email
  3. System creates user account with hashed password
  4. System sends verification email with token
  5. User clicks verification link in email
  6. System activates account
- **Postconditions**: User account is active and user can log in
- **Alternative Flows**: Email already exists (error returned)

### Scenario 1.2: User Login with Email/Password
- **Actor**: Registered User
- **Preconditions**: User has verified account
- **Steps**:
  1. User submits email and password
  2. System validates credentials against database
  3. System generates JWT token for session
  4. User receives token for API authentication
- **Postconditions**: User is authenticated and can access protected endpoints
- **Alternative Flows**: Invalid credentials (error returned)

### Scenario 1.3: Password Reset
- **Actor**: Registered User
- **Preconditions**: User has access to registered email
- **Steps**:
  1. User requests password reset with email
  2. System generates reset token and sends email
  3. User clicks reset link and provides new password
  4. System updates password hash in database
- **Postconditions**: User can login with new password
- **Alternative Flows**: Invalid or expired token (error returned)

### Scenario 1.4: Google OAuth Authentication
- **Actor**: Customer with Google Account
- **Preconditions**: Google OAuth configured
- **Steps**:
  1. User initiates Google login
  2. System redirects to Google OAuth
  3. User authorizes application
  4. Google redirects back with authorization code
  5. System exchanges code for user profile
  6. System creates/updates user account
  7. System generates JWT token
- **Postconditions**: User is authenticated via Google
- **Alternative Flows**: OAuth failure (error returned)

## 2. Book Management and Discovery

### Scenario 2.1: Admin Adds New Book
- **Actor**: Administrator
- **Preconditions**: Admin is authenticated with admin role
- **Steps**:
  1. Admin provides book details (title, author, price, etc.)
  2. Admin uploads book cover image and PDF (optional)
  3. System validates input and uploads files to S3
  4. System saves book to database
- **Postconditions**: Book is available in catalog
- **Alternative Flows**: Validation errors (error returned)

### Scenario 2.2: User Browses Books
- **Actor**: Customer
- **Preconditions**: None (public endpoint)
- **Steps**:
  1. User requests books with optional filters (category, price range, etc.)
  2. System queries database with filters
  3. System returns paginated book list
- **Postconditions**: User sees available books
- **Alternative Flows**: No books match filters (empty result)

### Scenario 2.3: Full-Text Search for Books
- **Actor**: Customer
- **Preconditions**: Search index is populated
- **Steps**:
  1. User enters search query
  2. System performs full-text search across title, author, description
  3. System returns ranked search results
- **Postconditions**: User finds relevant books
- **Alternative Flows**: No matches found (suggestions returned)

### Scenario 2.4: Book Features Management
- **Actor**: Administrator
- **Preconditions**: Admin authenticated
- **Steps**:
  1. Admin sets books as featured or book of the day
  2. Scheduled job rotates book of the day daily
  3. System exposes featured books via API
- **Postconditions**: Featured books are highlighted
- **Alternative Flows**: No books selected (default behavior)

## 3. Shopping Cart Management

### Scenario 3.1: Add Item to Cart
- **Actor**: Authenticated Customer
- **Preconditions**: User is logged in, book exists
- **Steps**:
  1. User selects book and quantity
  2. System validates book availability and stock
  3. System adds/updates item in user's cart (database + Redis cache)
- **Postconditions**: Item is in cart, total updated
- **Alternative Flows**: Insufficient stock (error returned)

### Scenario 3.2: View Cart
- **Actor**: Authenticated Customer
- **Preconditions**: User has items in cart
- **Steps**:
  1. User requests cart contents
  2. System retrieves cart from database/Redis
  3. System calculates totals and shipping
- **Postconditions**: User sees cart details and totals
- **Alternative Flows**: Empty cart (empty response)

### Scenario 3.3: Update Cart Item
- **Actor**: Authenticated Customer
- **Preconditions**: Item exists in cart
- **Steps**:
  1. User modifies quantity or removes item
  2. System validates new quantity against stock
  3. System updates cart in database and cache
- **Postconditions**: Cart reflects changes
- **Alternative Flows**: Quantity exceeds stock (error)

### Scenario 3.4: Abandoned Cart Reminder
- **Actor**: System (Automated Job)
- **Preconditions**: Cart has items, not checked out
- **Steps**:
  1. Cron job identifies abandoned carts (e.g., >24 hours old)
  2. System sends reminder email to user
  3. Email includes cart contents and checkout link
- **Postconditions**: User receives reminder email
- **Alternative Flows**: User has already checked out (no email sent)

## 4. Order Processing and Payment

### Scenario 4.1: Checkout Process
- **Actor**: Authenticated Customer
- **Preconditions**: User has items in cart
- **Steps**:
  1. User initiates checkout
  2. System validates cart contents and calculates totals
  3. User provides shipping information
  4. System creates order record
  5. System initiates Paymob payment process
- **Postconditions**: Payment page opened, order pending
- **Alternative Flows**: Invalid cart (error returned)

### Scenario 4.2: Payment Processing
- **Actor**: Payment Gateway (Paymob)
- **Preconditions**: Order created, payment initiated
- **Steps**:
  1. User completes payment on Paymob
  2. Paymob sends webhook to system
  3. System validates payment signature (HMAC)
  4. System updates order status to paid
  5. System sends order confirmation email
- **Postconditions**: Order confirmed, user notified
- **Alternative Flows**: Payment failed (order cancelled)

### Scenario 4.3: Order Fulfillment
- **Actor**: Administrator
- **Preconditions**: Order is paid
- **Steps**:
  1. Admin marks order as fulfilled/shipped
  2. System updates order status
  3. System processes inventory deduction
- **Postconditions**: Order status updated, stock adjusted
- **Alternative Flows**: Insufficient stock (alert generated)

### Scenario 4.4: Order Reconciliation
- **Actor**: System (Automated Job)
- **Preconditions**: Pending orders exist in database
- **Steps**:
  1. Job runs periodically (e.g., every hour) to check pending orders
  2. System identifies orders that have been pending for more than 1 hour
  3. For each pending order, queries payment gateway status
  4. Updates order status based on payment gateway confirmation
  5. Sends notification email to user if payment was successful
  6. Sends reminder email to user if payment is still pending
- **Postconditions**: Pending orders status updated, users notified appropriately
- **Alternative Flows**: No pending orders older than 1 hour (no action taken)

## 5. Reviews and Ratings

### Scenario 5.1: Submit Book Review
- **Actor**: Customer with Completed Order
- **Preconditions**: User has purchased the book
- **Steps**:
  1. User provides rating (1-5) and review text
  2. System validates user has purchased book
  3. System saves review to database
- **Postconditions**: Review is published
- **Alternative Flows**: User hasn't purchased (error)

### Scenario 5.2: AI-Generated Review Response
- **Actor**: System (AI Service)
- **Preconditions**: Review submitted
- **Steps**:
  1. AI service analyzes review content
  2. Generates appropriate response
  3. System associates response with review
- **Postconditions**: Review has AI response
- **Alternative Flows**: AI unavailable (review saved without response)

## 6. Content Management

### Scenario 6.1: Audio Transcription
- **Actor**: Customer
- **Preconditions**: Audio file uploaded
- **Steps**:
  1. User uploads audio file
  2. System processes with Deepgram API
  3. System returns transcribed text
- **Postconditions**: Text transcription available
- **Alternative Flows**: Processing failure (error returned)

## 7. Reporting and Analytics

### Scenario 7.1: Generate Sales Report
- **Actor**: Administrator or System (Automated)
- **Preconditions**: Orders exist
- **Steps**:
  1. System aggregates order data by date range
  2. Calculates totals, trends, top products
  3. Generates report document
- **Postconditions**: Report available for download
- **Alternative Flows**: No data (empty report)

### Scenario 7.2: Complaint Handling
- **Actor**: Customer
- **Preconditions**: User has account
- **Steps**:
  1. User submits complaint with details
  2. System saves to database
  3. Admin reviews and responds
- **Postconditions**: Complaint tracked and addressed
- **Alternative Flows**: Invalid submission (error)

## 8. System Administration

### Scenario 8.1: User Management
- **Actor**: Administrator
- **Preconditions**: Admin authenticated
- **Steps**:
  1. Admin views user list with pagination
  2. Admin updates user roles or bans users
  3. System applies changes immediately
- **Postconditions**: User permissions updated
- **Alternative Flows**: Unauthorized access (error)

### Scenario 8.2: Stock Management Alerts
- **Actor**: System (Automated Job)
- **Preconditions**: Books have low stock
- **Steps**:
  1. Job checks inventory levels
  2. Identifies books below threshold
  3. Sends alert email to admins
- **Postconditions**: Admins notified of low stock
- **Alternative Flows**: Sufficient stock (no alerts)

## Assumptions and Constraints

- All external services (Paymob, Deepgram, S3, Redis, RabbitMQ) are operational
- Database is available and responsive
- Email service is configured and working
- Users have stable internet connection
- Administrators follow proper procedures

## Success Metrics

- Successful user registrations and logins
- Conversion rate from cart to purchase
- Payment success rate
- Average response times for API calls
- User satisfaction with features
- System uptime and reliability