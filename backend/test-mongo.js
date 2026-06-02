const mongoose = require('mongoose');

const uri = "mongodb+srv://life_os26:jeemains%402608@cluster0.bpfcen4.mongodb.net/life-os?retryWrites=true&w=majority&appName=Cluster0";

async function testConnection() {
  console.log("Attempting to connect with SRV...");
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("✅ Connection successful!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Connection failed with SRV:");
    console.error(err.message);
    
    console.log("\nAttempting to connect with standard URI...");
    const fallbackUri = "mongodb://life_os26:jeemains%402608@ac-wm7kmb0-shard-00-00.bpfcen4.mongodb.net:27017,ac-wm7kmb0-shard-00-01.bpfcen4.mongodb.net:27017,ac-wm7kmb0-shard-00-02.bpfcen4.mongodb.net:27017/life-os?ssl=true&authSource=admin&replicaSet=atlas-ellwsz-shard-0&retryWrites=true&w=majority&appName=Cluster0";
    try {
      await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 5000 });
      console.log("✅ Connection successful with standard URI!");
      process.exit(0);
    } catch (fallbackErr) {
      console.error("❌ Connection failed with standard URI too:");
      console.error(fallbackErr.message);
      process.exit(1);
    }
  }
}

testConnection();
