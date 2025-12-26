import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // Get database name from environment or use default
        const dbName = process.env.DB_NAME || 'studentManagementSystem';
        
        // Construct MongoDB URI with explicit database name
        let mongoURI;
        if (process.env.MONGODB_URI) {
            // If MONGODB_URI is provided, use it (but ensure it has database name)
            mongoURI = process.env.MONGODB_URI;
            if (!mongoURI.includes('/') || mongoURI.endsWith('/')) {
                // If no database specified, append it
                mongoURI = mongoURI.endsWith('/') 
                    ? mongoURI + dbName 
                    : mongoURI + '/' + dbName;
            }
        } else {
            // Default local connection
            mongoURI = `mongodb://localhost:27017/${dbName}`;
        }
        
        // Connection options
        const options = {
            dbName: dbName, // Explicitly set database name
            useNewUrlParser: true,
            useUnifiedTopology: true,
        };
        
        mongoose.connection.on('connected', () => {
            console.log('✅ MongoDB connected successfully');
            console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
            console.log(`🔗 Connection String: ${mongoURI.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials
        });
        
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
        });
        
        await mongoose.connect(mongoURI, options);
        
        // Verify connection and list collections
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log(`📚 Available collections (${collections.length}):`, 
            collections.length > 0 
                ? collections.map(c => c.name).join(', ') 
                : 'None (collections will be created when data is inserted)'
        );
        
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    }
};

export default connectDB;