/* 
 * MANUAL DATABASE MIGRATION
 * Run this SQL in your MySQL client (HeidiSQL, MySQL Workbench, etc.)
 */

USE student_management_system;

CREATE TABLE IF NOT EXISTS `academic_rules` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `rules` TEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` INT DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default academic rules
INSERT INTO `academic_rules` (`rules`, `updated_by`) VALUES 
('1. Minimum 75% attendance required for semester eligibility.
2. Internal assessments count for 30% of final grade.
3. Re-examination allowed for one subject per semester.', 1);
