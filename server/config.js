
export const config = {
  
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/employee1',

    JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    

    PORT: process.env.PORT || 3001,
    NODE_ENV: process.env.NODE_ENV || 'development',
    

    MAX_FILE_SIZE: 5 * 1024 * 1024, 
    UPLOAD_PATH: 'uploads/',

    CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
};

