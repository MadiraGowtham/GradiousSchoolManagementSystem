import mongoose from 'mongoose';
import Users from '../models/Users.js';
import Profile from '../models/Profile.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import Announcement from '../models/Announcement.js';
import Marks from '../models/Marks.js';
import Subject from '../models/Subject.js';
import Exam from '../models/Exam.js';
import { seedData } from './seedData.js';

/**
 * Initialize collections by creating indexes and optionally sample data
 * This ensures collections are visible in MongoDB Compass immediately
 */
export const initCollections = async () => {
    try {
        const db = mongoose.connection.db;
        
        console.log('🔧 Initializing collections...');
        
        // Create collections explicitly (MongoDB creates them when first document is inserted,
        // but this ensures they exist and are visible in Compass)
        const collections = [
            'users',
            'profiles',
            'students',
            'teachers',
            'classes',
            'announcements',
            'marks',
            'subjects',
            'exams'
        ];
        
        for (const collectionName of collections) {
            try {
                // Check if collection exists
                const collections = await db.listCollections({ name: collectionName }).toArray();
                
                if (collections.length === 0) {
                    // Create empty collection
                    await db.createCollection(collectionName);
                    console.log(`✅ Created collection: ${collectionName}`);
                } else {
                    console.log(`ℹ️  Collection already exists: ${collectionName}`);
                }
            } catch (error) {
                console.error(`❌ Error creating collection ${collectionName}:`, error.message);
            }
        }
        
        // Create indexes for better performance
        console.log('📑 Creating indexes...');
        
        try {
            // Users indexes
            await Users.collection.createIndex({ Email: 1 }, { unique: true });
            await Users.collection.createIndex({ UserID: 1 }, { unique: true });
            await Users.collection.createIndex({ UserType: 1 });
            console.log('✅ Users indexes created');
        } catch (error) {
            console.log('ℹ️  Users indexes may already exist');
        }
        
        try {
            // Profile indexes
            await Profile.collection.createIndex({ UserID: 1 }, { unique: true });
            await Profile.collection.createIndex({ REG: 1 });
            console.log('✅ Profile indexes created');
        } catch (error) {
            console.log('ℹ️  Profile indexes may already exist');
        }
        
        try {
            // Student indexes
            await Student.collection.createIndex({ REG: 1 }, { unique: true });
            await Student.collection.createIndex({ UserID: 1 });
            await Student.collection.createIndex({ ClassEnrolled: 1 });
            console.log('✅ Student indexes created');
        } catch (error) {
            console.log('ℹ️  Student indexes may already exist');
        }
        
        try {
            // Teacher indexes
            await Teacher.collection.createIndex({ REG: 1 }, { unique: true });
            await Teacher.collection.createIndex({ UserID: 1 });
            console.log('✅ Teacher indexes created');
        } catch (error) {
            console.log('ℹ️  Teacher indexes may already exist');
        }
        
        try {
            // Marks indexes
            await Marks.collection.createIndex({ REG: 1, Subject: 1, Exam: 1 }, { unique: true });
            await Marks.collection.createIndex({ REG: 1 });
            await Marks.collection.createIndex({ Exam: 1 });
            console.log('✅ Marks indexes created');
        } catch (error) {
            console.log('ℹ️  Marks indexes may already exist');
        }
        
        try {
            // Class indexes
            await Class.collection.createIndex({ Class: 1 }, { unique: true });
            console.log('✅ Class indexes created');
        } catch (error) {
            console.log('ℹ️  Class indexes may already exist');
        }
        
        try {
            // Subject indexes
            await Subject.collection.createIndex({ SubjectCode: 1 }, { unique: true });
            console.log('✅ Subject indexes created');
        } catch (error) {
            console.log('ℹ️  Subject indexes may already exist');
        }
        
        try {
            // Announcement indexes
            await Announcement.collection.createIndex({ LastUpdated: -1 });
            await Announcement.collection.createIndex({ Visibility: 1, Class: 1 });
            console.log('✅ Announcement indexes created');
        } catch (error) {
            console.log('ℹ️  Announcement indexes may already exist');
        }
        
        try {
            // Exam indexes
            await Exam.collection.createIndex({ ExamName: 1 }, { unique: true });
            console.log('✅ Exam indexes created');
        } catch (error) {
            console.log('ℹ️  Exam indexes may already exist');
        }
        
        // List all collections
        const allCollections = await db.listCollections().toArray();
        console.log(`\n📚 All collections in database (${allCollections.length}):`);
        allCollections.forEach(col => {
            console.log(`   - ${col.name}`);
        });
        
        console.log('\n✅ Collection initialization complete!');
        console.log('💡 You can now see all collections in MongoDB Compass\n');
        
        // Seed data if collections are empty
        await seedData();
        
    } catch (error) {
        console.error('❌ Error initializing collections:', error);
    }
};

