# CLAUDE.md

## Project Overview

ระบบเช็คชื่อครูและนักเรียนด้วย GPS Geofencing

Tech Stack:

* Nuxt 3
* Vue 3
* TypeScript
* Supabase
* Vercel
* GeographicLib
* HTML5 Geolocation API

---

## Main Features

### Teacher Check-in

* ครูกรอกเลขที่ครู
* โหลดข้อมูลจากตาราง teachers
* ตรวจสอบเวลาเช็คชื่อ
* ตรวจสอบ GPS
* ตรวจสอบระยะจากจุดหน้าเสาธง
* บันทึกลงตาราง checkins

### Student Check-in

* นักเรียนกรอกชื่อ ชั้น เลขที่
* ตรวจสอบ GPS
* ตรวจสอบเวลา
* ตรวจสอบระยะ
* บันทึกลงตาราง checkins

### Daily Summary

* Cron Job เรียก API ทุกวัน
* สรุปผลการเช็คชื่อ
* ส่งผ่าน LINE Messaging API

---

## Geofencing Rules

Target Location:

Latitude:
17.614378

Longitude:
103.649527

Allowed Radius:

30 meters

Maximum GPS Accuracy:

50 meters

Note: Target location is under a dome roof — GPS accuracy is typically 30–60m in this environment.

---

## GPS Requirements

Always prefer:

navigator.geolocation.watchPosition()

instead of:

navigator.geolocation.getCurrentPosition()

Reason:

watchPosition provides multiple GPS samples and allows selecting the best location.

---

## GPS Filtering

Reject GPS sample when:

accuracy > MAX_GPS_ACCURACY

Ignore cached position when:

positionAge > 10000 ms

Use best sample among all collected samples.

Priority:

1. Lowest accuracy
2. Lowest distance
3. Newest timestamp

---

## Distance Calculation

Use GeographicLib instead of Haversine.

Example:

const geo = Geodesic.WGS84;

const result = geo.Inverse(
lat,
lng,
TARGET_LAT,
TARGET_LNG
);

const distance = result.s12;

---

## Database

Table: teachers

Columns:

* teacher_number
* full_name
* position_name

---

Table: checkins

Columns:

* id
* user_type
* checkin_status
* full_name
* teacher_number
* teacher_position
* class_room
* student_number
* latitude
* longitude
* distance
* gps_accuracy
* device_id
* checkin_at

---

## Coding Standards

Use:

* Composition API
* script setup
* TypeScript

Avoid:

* Options API
* any type

Always:

* Handle Supabase errors
* Handle GPS errors
* Handle timeout
* Handle duplicate check-in

---

## Deployment

Hosting:

Vercel

Database:

Supabase

Environment Variables:

SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
LINE_CHANNEL_ACCESS_TOKEN

---

## Important Notes

This project is used in a real school environment.

GPS reliability is critical.

Always prioritize:

1. Accuracy
2. Reliability
3. User Experience

over code simplicity.
