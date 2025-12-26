import Users from '../models/Users.js';
import Profile from '../models/Profile.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import Announcement from '../models/Announcement.js';
import Marks from '../models/Marks.js';
import Subject from '../models/Subject.js';
import bcrypt from 'bcryptjs';

/**
 * Seed database with sample data if collections are empty
 */
export const seedData = async () => {
    try {
        console.log('🌱 Checking for existing data...');
        
        // Check if data already exists
        const userCount = await Users.countDocuments();
        if (userCount > 0) {
            console.log('ℹ️  Database already contains data. Skipping seed.');
            return;
        }
        
        console.log('📝 Seeding database with sample data...');
        
        // Hash password for all users
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        // 1. Create Users
        const users = [
            {
                UserID: 'A001',
                Name: 'Admin User',
                Email: 'admin@school.com',
                Password: hashedPassword,
                UserType: 'Admin',
                CreatedAt: new Date(),
                UpdatedAt: new Date(),
                AccountStatus: 'Active'
            },
            {
                UserID: 'T001',
                Name: 'John Smith',
                Email: 'john.smith@school.com',
                Password: hashedPassword,
                UserType: 'Teacher',
                CreatedAt: new Date(),
                UpdatedAt: new Date(),
                AccountStatus: 'Active'
            },
            {
                UserID: 'T002',
                Name: 'Sarah Johnson',
                Email: 'sarah.johnson@school.com',
                Password: hashedPassword,
                UserType: 'Teacher',
                CreatedAt: new Date(),
                UpdatedAt: new Date(),
                AccountStatus: 'Active'
            },
            {
                UserID: 'S001',
                Name: 'Alice Brown',
                Email: 'alice.brown@school.com',
                Password: hashedPassword,
                UserType: 'Student',
                CreatedAt: new Date(),
                UpdatedAt: new Date(),
                AccountStatus: 'Active'
            },
            {
                UserID: 'S002',
                Name: 'Bob Wilson',
                Email: 'bob.wilson@school.com',
                Password: hashedPassword,
                UserType: 'Student',
                CreatedAt: new Date(),
                UpdatedAt: new Date(),
                AccountStatus: 'Active'
            },
            {
                UserID: 'S003',
                Name: 'Emma Davis',
                Email: 'emma.davis@school.com',
                Password: hashedPassword,
                UserType: 'Student',
                CreatedAt: new Date(),
                UpdatedAt: new Date(),
                AccountStatus: 'Active'
            }
        ];
        
        const createdUsers = await Users.insertMany(users);
        console.log(`✅ Created ${createdUsers.length} users`);
        
        // 2. Create Profiles
        const profiles = [
            {
                UserID: 'A001',
                REG: 'ADM001',
                Address: '123 Admin Street, City',
                Phone: '+1234567890',
                Bio: 'System Administrator',
                Gender: 'Male',
                Age: 35,
                ImageUrl: './Avatar.png',
                LastUpdated: new Date()
            },
            {
                UserID: 'T001',
                REG: 'TCH001',
                Address: '456 Teacher Avenue, City',
                Phone: '+1234567891',
                Bio: 'Mathematics Teacher with 10 years of experience',
                Gender: 'Male',
                Age: 42,
                ImageUrl: './Avatar.png',
                LastUpdated: new Date()
            },
            {
                UserID: 'T002',
                REG: 'TCH002',
                Address: '789 Educator Road, City',
                Phone: '+1234567892',
                Bio: 'Science Teacher specializing in Physics',
                Gender: 'Female',
                Age: 38,
                ImageUrl: './Avatar.png',
                LastUpdated: new Date()
            },
            {
                UserID: 'S001',
                REG: 'STU001',
                Address: '321 Student Lane, City',
                Phone: '+1234567893',
                Bio: 'Dedicated student passionate about learning',
                Gender: 'Female',
                Age: 16,
                ImageUrl: './Avatar.png',
                LastUpdated: new Date()
            },
            {
                UserID: 'S002',
                REG: 'STU002',
                Address: '654 Scholar Street, City',
                Phone: '+1234567894',
                Bio: 'Active participant in school activities',
                Gender: 'Male',
                Age: 17,
                ImageUrl: './Avatar.png',
                LastUpdated: new Date()
            },
            {
                UserID: 'S003',
                REG: 'STU003',
                Address: '987 Learning Boulevard, City',
                Phone: '+1234567895',
                Bio: 'Enthusiastic about mathematics and science',
                Gender: 'Female',
                Age: 16,
                ImageUrl: './Avatar.png',
                LastUpdated: new Date()
            }
        ];
        
        await Profile.insertMany(profiles);
        console.log(`✅ Created ${profiles.length} profiles`);
        
        // 3. Create Students
        const students = [
            {
                UserID: 'S001',
                REG: 'STU001',
                ClassEnrolled: 10,
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            },
            {
                UserID: 'S002',
                REG: 'STU002',
                ClassEnrolled: 10,
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            },
            {
                UserID: 'S003',
                REG: 'STU003',
                ClassEnrolled: 11,
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            }
        ];
        
        await Student.insertMany(students);
        console.log(`✅ Created ${students.length} students`);
        
        // 4. Create Teachers
        const teachers = [
            {
                UserID: 'T001',
                REG: 'TCH001',
                ClassAssigned: [10, 11],
                Subject: 'Mathematics',
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            },
            {
                UserID: 'T002',
                REG: 'TCH002',
                ClassAssigned: [10, 11],
                Subject: 'Physics',
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            }
        ];
        
        await Teacher.insertMany(teachers);
        console.log(`✅ Created ${teachers.length} teachers`);
        
        // 5. Create Subjects
        const subjects = [
            {
                SubjectName: 'Mathematics',
                SubjectCode: 'MATH01',
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            },
            {
                SubjectName: 'Physics',
                SubjectCode: 'PHY01',
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            },
            {
                SubjectName: 'Chemistry',
                SubjectCode: 'CHEM01',
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            },
            {
                SubjectName: 'English',
                SubjectCode: 'ENG01',
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            }
        ];
        
        await Subject.insertMany(subjects);
        console.log(`✅ Created ${subjects.length} subjects`);
        
        // 6. Create Classes with Timetables
        const classes = [
            {
                Class: 10,
                TimeTable: new Map([
                    ['Monday', [
                        { time: '09:00 - 10:00', subject: 'MATH01', teacher: 'T001' },
                        { time: '10:00 - 11:00', subject: 'PHY01', teacher: 'T002' },
                        { time: '11:30 - 12:30', subject: 'ENG01', teacher: 'T001' }
                    ]],
                    ['Tuesday', [
                        { time: '09:00 - 10:00', subject: 'CHEM01', teacher: 'T002' },
                        { time: '10:00 - 11:00', subject: 'MATH01', teacher: 'T001' }
                    ]],
                    ['Wednesday', [
                        { time: '09:00 - 10:00', subject: 'PHY01', teacher: 'T002' },
                        { time: '10:00 - 11:00', subject: 'MATH01', teacher: 'T001' }
                    ]]
                ]),
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            },
            {
                Class: 11,
                TimeTable: new Map([
                    ['Monday', [
                        { time: '09:00 - 10:00', subject: 'MATH01', teacher: 'T001' },
                        { time: '10:00 - 11:00', subject: 'PHY01', teacher: 'T002' }
                    ]],
                    ['Tuesday', [
                        { time: '09:00 - 10:00', subject: 'CHEM01', teacher: 'T002' },
                        { time: '10:00 - 11:00', subject: 'MATH01', teacher: 'T001' }
                    ]]
                ]),
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            }
        ];
        
        await Class.insertMany(classes);
        console.log(`✅ Created ${classes.length} classes with timetables`);
        
        // 7. Create Announcements
        const announcements = [
            {
                Title: 'Welcome to the New Academic Year',
                Description: 'We are excited to welcome all students and teachers to the new academic year. Let\'s make it a successful one!',
                LastUpdated: new Date(),
                Visibility: 'All',
                CreatedBy: 'A001'
            },
            {
                Title: 'Mathematics Exam Schedule',
                Description: 'The mathematics mid-term exam will be held on next Friday. Please prepare accordingly.',
                LastUpdated: new Date(),
                Visibility: 'Class',
                Class: 10,
                CreatedBy: 'T001'
            },
            {
                Title: 'Science Fair Registration',
                Description: 'Registration for the annual science fair is now open. All students from Class 10 and 11 are encouraged to participate.',
                LastUpdated: new Date(),
                Visibility: 'Student',
                Class: 10,
                CreatedBy: 'T002'
            }
        ];
        
        await Announcement.insertMany(announcements);
        console.log(`✅ Created ${announcements.length} announcements`);
        
        // 8. Create Marks
        const marks = [
            {
                REG: 'STU001',
                Subject: 'MATH01',
                MarksObtained: 85,
                Exam: 'Mid-Term',
                Remarks: 'Excellent performance',
                LastUpdated: new Date()
            },
            {
                REG: 'STU001',
                Subject: 'PHY01',
                MarksObtained: 78,
                Exam: 'Mid-Term',
                Remarks: 'Good work',
                LastUpdated: new Date()
            },
            {
                REG: 'STU002',
                Subject: 'MATH01',
                MarksObtained: 92,
                Exam: 'Mid-Term',
                Remarks: 'Outstanding!',
                LastUpdated: new Date()
            },
            {
                REG: 'STU002',
                Subject: 'PHY01',
                MarksObtained: 88,
                Exam: 'Mid-Term',
                Remarks: 'Very good',
                LastUpdated: new Date()
            },
            {
                REG: 'STU003',
                Subject: 'MATH01',
                MarksObtained: 90,
                Exam: 'Mid-Term',
                Remarks: 'Excellent',
                LastUpdated: new Date()
            },
            {
                REG: 'STU003',
                Subject: 'PHY01',
                MarksObtained: 82,
                Exam: 'Mid-Term',
                Remarks: 'Well done',
                LastUpdated: new Date()
            }
        ];
        
        await Marks.insertMany(marks);
        console.log(`✅ Created ${marks.length} marks records`);
        
        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📋 Sample Login Credentials:');
        console.log('   Admin: admin@school.com / password123');
        console.log('   Teacher: john.smith@school.com / password123');
        console.log('   Student: alice.brown@school.com / password123\n');
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
};

