-- ============================================================
-- A/L Mass Class Tuition Management System - Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS tuition_db;
USE tuition_db;

-- ============================================================
-- 1. USERS TABLE (Authentication)
-- ============================================================
CREATE TABLE users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    email       VARCHAR(100) UNIQUE NOT NULL,
    role        ENUM('ADMIN','ASSISTANT') NOT NULL DEFAULT 'ASSISTANT',
    full_name   VARCHAR(100) NOT NULL,
    phone       VARCHAR(15),
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. SUBJECTS TABLE
-- ============================================================
CREATE TABLE subjects (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    code        VARCHAR(20)  UNIQUE NOT NULL,
    description TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. BATCHES TABLE
-- ============================================================
CREATE TABLE batches (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    batch_name  VARCHAR(100) NOT NULL,
    subject_id  INT,
    year        INT NOT NULL,
    medium      ENUM('SINHALA','TAMIL','ENGLISH') DEFAULT 'SINHALA',
    max_students INT DEFAULT 50,
    fee_amount  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
);

-- ============================================================
-- 4. STUDENTS TABLE
-- ============================================================
CREATE TABLE students (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    student_id      VARCHAR(20) UNIQUE NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    date_of_birth   DATE,
    gender          ENUM('MALE','FEMALE') NOT NULL,
    phone           VARCHAR(15) NOT NULL,
    email           VARCHAR(100),
    address         TEXT,
    school          VARCHAR(150),
    al_year         INT,
    parent_name     VARCHAR(100),
    parent_phone    VARCHAR(15),
    profile_photo   VARCHAR(255),
    intake_source   VARCHAR(100),  -- for marketing tracking
    is_active       BOOLEAN DEFAULT TRUE,
    registered_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 5. STUDENT-BATCH ENROLLMENT
-- ============================================================
CREATE TABLE enrollments (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    student_id    INT NOT NULL,
    batch_id      INT NOT NULL,
    enrolled_date DATE NOT NULL,
    status        ENUM('ACTIVE','INACTIVE','COMPLETED') DEFAULT 'ACTIVE',
    UNIQUE KEY unique_enrollment (student_id, batch_id),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id)   REFERENCES batches(id)  ON DELETE CASCADE
);

-- ============================================================
-- 6. ATTENDANCE TABLE
-- ============================================================
CREATE TABLE attendance (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    student_id  INT NOT NULL,
    batch_id    INT NOT NULL,
    date        DATE NOT NULL,
    status      ENUM('PRESENT','ABSENT','LATE','EXCUSED') NOT NULL,
    notes       TEXT,
    marked_by   INT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id)   REFERENCES batches(id)  ON DELETE CASCADE,
    FOREIGN KEY (marked_by)  REFERENCES users(id)    ON DELETE SET NULL
);

-- ============================================================
-- 7. EXAM RESULTS TABLE
-- ============================================================
CREATE TABLE results (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    student_id      INT NOT NULL,
    batch_id        INT NOT NULL,
    exam_name       VARCHAR(100) NOT NULL,
    exam_type       ENUM('MONTHLY_TEST','TERM_TEST','MOCK_EXAM','FINAL') NOT NULL,
    marks_obtained  DECIMAL(6,2),
    total_marks     DECIMAL(6,2),
    grade           VARCHAR(5),
    exam_date       DATE,
    remarks         TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id)   REFERENCES batches(id)  ON DELETE CASCADE
);

-- ============================================================
-- 8. PAYMENTS TABLE (Income Management)
-- ============================================================
CREATE TABLE payments (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    student_id      INT NOT NULL,
    batch_id        INT NOT NULL,
    payment_month   VARCHAR(20) NOT NULL,   -- e.g., "2026-01"
    payment_year    INT NOT NULL,
    amount_due      DECIMAL(10,2) NOT NULL,
    amount_paid     DECIMAL(10,2) DEFAULT 0.00,
    paid_date       DATE,
    status          ENUM('PAID','PENDING','PARTIAL','OVERDUE') DEFAULT 'PENDING',
    payment_method  ENUM('CASH','BANK_TRANSFER','ONLINE') DEFAULT 'CASH',
    receipt_no      VARCHAR(50),
    notes           TEXT,
    recorded_by     INT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id)   REFERENCES batches(id)  ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id)   ON DELETE SET NULL
);

-- ============================================================
-- 9. SCHEDULE TABLE
-- ============================================================
CREATE TABLE schedules (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    batch_id        INT NOT NULL,
    title           VARCHAR(150) NOT NULL,
    class_type      ENUM('PHYSICAL','ONLINE') DEFAULT 'PHYSICAL',
    class_date      DATE NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    location        VARCHAR(200),
    online_link     VARCHAR(500),
    status          ENUM('SCHEDULED','COMPLETED','CANCELLED','POSTPONED') DEFAULT 'SCHEDULED',
    notes           TEXT,
    created_by      INT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id)   REFERENCES batches(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)   ON DELETE SET NULL
);

-- ============================================================
-- 10. MARKETING - CAMPAIGNS TABLE
-- ============================================================
CREATE TABLE campaigns (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    campaign_name   VARCHAR(150) NOT NULL,
    platform        ENUM('FACEBOOK','INSTAGRAM','YOUTUBE','TIKTOK','WHATSAPP','REFERRAL','POSTER','OTHER') NOT NULL,
    start_date      DATE,
    end_date        DATE,
    budget          DECIMAL(10,2) DEFAULT 0.00,
    description     TEXT,
    status          ENUM('ACTIVE','COMPLETED','PAUSED') DEFAULT 'ACTIVE',
    created_by      INT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- 11. MARKETING - INTAKE SOURCES TRACKING
-- ============================================================
CREATE TABLE intake_sources (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    source_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active   BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 12. RESOURCES TABLE (Learning Materials)
-- ============================================================
CREATE TABLE resources (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    resource_type   ENUM('PDF','PPT','DOC','VIDEO','MODEL_PAPER','OTHER') NOT NULL,
    file_path       VARCHAR(500),
    file_name       VARCHAR(200),
    file_size       BIGINT,
    version         VARCHAR(20) DEFAULT '1.0',
    is_restricted   BOOLEAN DEFAULT FALSE, -- restrict pending payment students
    uploaded_by     INT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- 13. RESOURCE-BATCH ASSIGNMENT
-- ============================================================
CREATE TABLE resource_batches (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    resource_id INT NOT NULL,
    batch_id    INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_resource_batch (resource_id, batch_id),
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id)    REFERENCES batches(id)   ON DELETE CASCADE
);

-- ============================================================
-- 14. STAFF TABLE (HR Management)
-- ============================================================
CREATE TABLE staff (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNIQUE,
    staff_id        VARCHAR(20) UNIQUE NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    role            ENUM('ADMIN','ASSISTANT','COORDINATOR') NOT NULL,
    phone           VARCHAR(15) NOT NULL,
    email           VARCHAR(100),
    address         TEXT,
    nic             VARCHAR(20) UNIQUE,
    date_of_birth   DATE,
    joined_date     DATE NOT NULL,
    basic_salary    DECIMAL(10,2) DEFAULT 0.00,
    commission_rate DECIMAL(5,2)  DEFAULT 0.00, -- percentage
    is_active       BOOLEAN DEFAULT TRUE,
    profile_photo   VARCHAR(255),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- 15. STAFF ATTENDANCE
-- ============================================================
CREATE TABLE staff_attendance (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    staff_id    INT NOT NULL,
    date        DATE NOT NULL,
    check_in    TIME,
    check_out   TIME,
    status      ENUM('PRESENT','ABSENT','HALF_DAY','LEAVE') NOT NULL,
    notes       TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

-- ============================================================
-- 16. PAYROLL TABLE
-- ============================================================
CREATE TABLE payroll (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    staff_id        INT NOT NULL,
    pay_month       VARCHAR(20) NOT NULL,   -- e.g., "2026-01"
    pay_year        INT NOT NULL,
    basic_salary    DECIMAL(10,2) NOT NULL,
    commission      DECIMAL(10,2) DEFAULT 0.00,
    bonuses         DECIMAL(10,2) DEFAULT 0.00,
    deductions      DECIMAL(10,2) DEFAULT 0.00,
    net_salary      DECIMAL(10,2) NOT NULL,
    paid_date       DATE,
    payment_method  ENUM('CASH','BANK_TRANSFER') DEFAULT 'BANK_TRANSFER',
    status          ENUM('PAID','PENDING') DEFAULT 'PENDING',
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

-- ============================================================
-- 17. STAFF TASKS
-- ============================================================
CREATE TABLE staff_tasks (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    assigned_to     INT NOT NULL,
    assigned_by     INT,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    priority        ENUM('LOW','MEDIUM','HIGH','URGENT') DEFAULT 'MEDIUM',
    due_date        DATE,
    status          ENUM('PENDING','IN_PROGRESS','COMPLETED','CANCELLED') DEFAULT 'PENDING',
    completed_at    TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES staff(id)  ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id)  ON DELETE SET NULL
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default Admin User (password: Admin@123 - bcrypt hashed)
INSERT INTO users (username, password, email, role, full_name, phone) VALUES
('admin', '$2b$10$B4nA0dyuNCgShxSlIjlGauRQan8.DzI0t8i.7f9i2uek5UUk8H4Mu', 'admin@tuition.lk', 'ADMIN', 'System Administrator', '0771234567');

-- Intake Sources
INSERT INTO intake_sources (source_name, description) VALUES
('Facebook', 'Facebook Page / Ads'),
('Instagram', 'Instagram Posts / Reels'),
('YouTube', 'YouTube Channel'),
('WhatsApp', 'WhatsApp Groups'),
('Friend Referral', 'Referred by existing student'),
('School Notice', 'School notice board'),
('Poster/Banner', 'Physical poster or banner'),
('TikTok', 'TikTok Videos'),
('Other', 'Other sources');

-- Sample Subjects
INSERT INTO subjects (name, code, description) VALUES
('Combined Mathematics', 'CMAT', 'A/L Combined Mathematics'),
('Physics', 'PHY', 'A/L Physics'),
('Chemistry', 'CHEM', 'A/L Chemistry'),
('Biology', 'BIO', 'A/L Biology'),
('Economics', 'ECON', 'A/L Economics'),
('Accounting', 'ACCT', 'A/L Accounting'),
('Business Studies', 'BUS', 'A/L Business Studies');
