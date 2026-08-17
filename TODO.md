# VeriMart Feature Implementation Tasks

## Backend
- [x] Add `bio` field to User model
- [x] Add `conversation_id` field to Transaction model
- [x] Add `updateProfile` endpoint (PATCH /updateProfile) in auth.controller.js + auth.routes.js
- [x] Auto-create conversation on purchase in TransactionController.createTransaction
- [x] Populate `conversation_id` in getMyTransaction/getTransactionById

## Frontend
- [x] Add `updateProfile` API function in api.ts
- [x] Add `ProfileEditModal` component
- [x] Add "Edit profile" button in DashboardLayout sidebar
- [x] Add "Purchased products" section for buyer dashboard
- [x] Fix `mapOrder` to map `conversation_id` correctly
- [x] Fix chat navigation so "Message" buttons in orders work
