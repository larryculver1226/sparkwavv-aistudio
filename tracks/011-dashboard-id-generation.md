# Track 011: Dashboard ID Generation Fix

**Status**: Completed
**Date**: 2026-04-07
**Objective**: Fix the issue where users who sign up themselves do not get a `sparkwavvId` (Dashboard ID), causing the ID to show as "N/A" in the Identity Platform Management table.

## 1. Problem Identification
When an admin creates a user via `/api/admin/create-user`, a `sparkwavvId` is generated using `generateSparkwavvId` and saved to the user's profile and dashboard.
However, when a user signs up themselves, their profile is created lazily in `/api/user/profile` upon their first login. This endpoint was creating a default profile but **was not generating a `sparkwavvId`** and **was not creating a default dashboard**.

## 2. Technical Plan

### Step 1: Fix Profile Creation Logic
- **File**: `server.ts` (Endpoint: `/api/user/profile`)
- **Action**: When creating a new profile for a user, generate a `sparkwavvId` using `generateSparkwavvId(db)` and include it in the new profile. Also, call `createDefaultDashboard` to ensure their dashboard is initialized with the correct ID.

### Step 2: Implement Self-Healing for Existing Users
- **File**: `server.ts` (Endpoint: `/api/user/profile`)
- **Action**: If a user profile is found but lacks a `sparkwavvId` (and they are a standard user), generate one, update their user document, and ensure their dashboard is also updated/created with the new ID.

## 3. Progress
- [x] Track Initialized & Problem Identified
- [x] Technical Plan Approved
- [x] Profile Creation Logic Fixed
- [x] Self-Healing Logic Implemented
- [x] Verification complete
