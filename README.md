# RailYatri Express — IRCTC NextGen Booking Simulation

A modern, high-fidelity frontend-only **IRCTC Train Reservation Simulation** web application built with **React 18**, **TypeScript** (strict mode, zero `any`), **Vite**, and **Tailwind CSS**.

---

## 🚀 Quick Start

### 1. Installation & Running Dev Server

```bash
# Navigate to project directory
cd ~/Desktop/openskale

# Install dependencies
npm install

# Start development server
npm run dev
```

### 2. Type-Checking & Production Build

```bash
# Verify TypeScript strict compilation & bundle production build
npm run build

# Preview production build locally
npm run preview
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Pre-loaded Features |
|---|---|---|---|
| **Passenger User** | `user@demo.com` | `User@123` | Pre-saved passenger list (satya, Pooja, Aarav), Saved Visa card & UPI ID, booking history |
| **Admin Controller** | `admin@demo.com` | `Admin@123` | Access to `/admin` route: train schedule CRUD, revenue metrics, view all bookings |

> 💡 **Tip:** On the Login page, you can click the **1-Click Demo Account** buttons to instantly autofill and log in.

---

## 🚄 Key Features & System Architecture

### 1. Train Search & Live Seat Availability
- **28 Indian Railway Stations** (NDLS, BCT, CSMT, HWH, MAS, SBC, SC, HYB, PUNE, ADI, JP, LKO, CNB, BSB, PNBE, etc.) with searchable autocomplete by station code, city, and station name.
- **22+ Express Trains** (Rajdhani, Shatabdi, Duronto, Vande Bharat, Superfast, Express) with multi-stop schedules, halt durations, distance km, and day progression.
- **Live Seat Availability Engine**:
  - Dynamically calculates seats per class (`1A`, `2A`, `3A`, `CC`, `SL`, `2S`) and quota (`GN` General, `TQ` Tatkal, `LD` Ladies, `SS` Senior Citizen).
  - Automatically transitions between `AVAILABLE n`, `RAC n`, and `WL n`.
  - Persists bookings and cancellations in local storage so seat counts dynamically decrease upon booking and restore upon cancellation.
- **Interactive Filters & Sorting**:
  - Filter by train category (Rajdhani, Vande Bharat, etc.)
  - Filter by departure slots (Early morning, Morning, Afternoon, Night)
  - Toggle "Available Seats Only"
  - Sort by departure time, fastest duration, or lowest fare.

### 2. Stepper Booking Workflow
- **Step 1: Passenger Details (1–6 Passengers)**:
  - Form validation with Zod.
  - Quick-select from the user's **Master List** of saved passengers.
  - Option to check "Save passenger to Master List" for one-click future booking.
  - Senior citizen (Age 60+) lower berth priority indicator.
  - Child travel rules (<5 yrs travels free without berth).
  - Free **Auto-Upgrade Policy** checkbox.
- **Step 2: Journey Review & Fare Summary**:
  - Itemized fare breakdown: Base Fare + Reservation Fee + Superfast Charge + Tatkal Surcharge + 5% GST on AC classes.
- **Step 3: Mock Payment Gateway**:
  - **10-Second Session Countdown Timer** with expiration warnings.
  - **Payment Tabs**: Saved Cards/UPI, Credit/Debit Card (Luhn algorithm validation, brand detection for Visa/Mastercard/RuPay/Amex, MM/YY expiry), UPI ID/Dynamic QR Code, Net Banking.
  - **Dev Mode Failure Toggle**: Test transaction failure and retry states. Rare 5% random failure simulation.
  - Realistic 3-stage bank authorization loader.
  - Confetti celebration upon successful transaction.
- **Step 4: Digital Confirmation & E-Ticket (ERS)**:
  - 10-digit Indian Railways PNR number.
  - Unique Transaction ID.
  - Coach and berth allocation (e.g., `B2-37 LOWER`, `RAC-4`, `WL-12`).
  - Scannable verification QR Code generated via `qrcode.react`.
  - Print / Save as PDF using `window.print()` and `@media print` Tailwind styles.

### 3. My Bookings & PNR Inquiry
- Categorized tabs: **Upcoming Journeys**, **Completed Journeys**, **Cancelled Tickets**.
- Direct 10-digit PNR lookup modal.
- **Partial or Full Cancellation**:
  - Select individual or all passengers to cancel.
  - Realtime railway clerkage calculation based on hours remaining until departure:
    - `> 48 hours`: Flat clerkage fee by class (₹240 for 1A, ₹200 for 2A, ₹180 for 3A/CC, ₹120 for SL, ₹60 for 2S/WL).
    - `12 to 48 hours`: 25% fare deduction.
    - `4 to 12 hours`: 50% fare deduction.
    - `< 4 hours`: No refund admissible.
  - Immediately restores seat availability in the system.

### 4. Admin Management Portal (`/admin`)
- Operations KPI Dashboard: Active Trains, Total Bookings, Gross Ticketing Revenue, Cancellations.
- **Add & Edit Train Routes**:
  - 5-digit train number, name, category, running days (Sun-Sat).
  - Multi-station route builder with arrival/departure times, distance, and halt minutes.
  - Class configuration with custom seat capacity and base fares.
  - Newly created trains **instantly appear** in the user search engine and booking flow!
- Comprehensive Passenger Bookings Table with digital ERS slip inspector.

### 5. Passenger Profile & Master List
- View/edit profile details (name, mobile, DOB, gender, address, initials avatar).
- Change account password.
- Passenger Master List CRUD.
- Saved Payment Methods CRUD (Card & UPI with default selection; CVV never stored).
- **Reset Demo Data Button**: 1-click restore to original factory demo state.

---

## 📁 Folder Structure

```
openskale/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminBookingsTable.tsx
│   │   │   ├── AdminStats.tsx
│   │   │   ├── TrainFormModal.tsx
│   │   │   └── TrainListTable.tsx
│   │   ├── booking/
│   │   │   ├── BookingReview.tsx
│   │   │   ├── CancellationModal.tsx
│   │   │   ├── ETicketView.tsx
│   │   │   ├── PassengerForm.tsx
│   │   │   └── PaymentGateway.tsx
│   │   ├── layout/
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navbar.tsx
│   │   ├── search/
│   │   │   ├── TrainResultCard.tsx
│   │   │   └── TrainSearchWidget.tsx
│   │   └── ui/
│   │       ├── Autocomplete.tsx
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Checkbox.tsx
│   │       ├── Dropdown.tsx
│   │       ├── EmptyState.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       ├── Select.tsx
│   │       ├── Skeleton.tsx
│   │       ├── Spinner.tsx
│   │       ├── Stepper.tsx
│   │       ├── Table.tsx
│   │       ├── Tabs.tsx
│   │       └── Tooltip.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── BookingContext.tsx
│   ├── hooks/
│   │   ├── useAsync.ts
│   │   ├── useDebounce.ts
│   │   └── useLocalStorage.ts
│   ├── pages/
│   │   ├── AdminPage.tsx
│   │   ├── BookingPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── MyBookingsPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── SearchResultsPage.tsx
│   │   └── SignupPage.tsx
│   ├── routes/
│   │   ├── AdminRoute.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── router.tsx
│   ├── schemas/
│   │   └── index.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── bookingService.ts
│   │   ├── paymentService.ts
│   │   ├── seed.ts
│   │   ├── storage.ts
│   │   └── trainService.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── cn.ts
│   │   ├── fare.ts
│   │   ├── formatters.ts
│   │   ├── pnr.ts
│   │   └── validators.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── tailwind.config.ts
├── tsconfig.app.json
├── tsconfig.json
├── vite.config.ts
├── package.json
└── README.md
```

---

## 🛠️ Technology Stack
- **Framework:** React 18 + Vite (TypeScript strictly typed, no `any`, `.ts`/`.tsx` only)
- **Styling:** Tailwind CSS v3 with custom IRCTC-inspired theme (Royal Blue, Saffron Accent, Inter font, custom shadows)
- **Routing:** React Router v6 (with typed `ProtectedRoute` and `AdminRoute`)
- **State & Storage:** Context API + Typed asynchronous Storage layer (`localStorage` with simulated 400–1200ms API delays)
- **Validation:** Zod schemas (`z.infer`) with React Hook Form integration
- **Icons & Extras:** `lucide-react`, `qrcode.react`, `canvas-confetti`, `react-hot-toast`
