import mongoose from 'mongoose';
import Mission from './models/MissionModel.js';
import { TYPEPOSTURES } from './utils/constants.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Function to fix mission types
async function fixMissionTypes() {
  try {
    // Connect to MongoDB
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    // 1. Get all missions (including deleted ones)
    const missions = await Mission.find({});
    console.log(`Found ${missions.length} missions total`);

    // 2. Log all current mission types in database
    const currentTypes = [...new Set(missions.map(m => m.missionType))];
    console.log('Current mission types in database:', currentTypes);
    
    // 3. Log expected types from constants
    const expectedTypes = Object.values(TYPEPOSTURES);
    console.log('Expected mission types from constants:', expectedTypes);

    // 4. Check for missions with missing missionType
    const missionsWithoutType = missions.filter(m => !m.missionType);
    console.log(`Found ${missionsWithoutType.length} missions without a missionType`);

    // 5. Update missions with missing or incorrect types
    let updatedCount = 0;
    for (const mission of missions) {
      // If mission has no type or the type isn't in the expected list
      if (!mission.missionType || !expectedTypes.includes(mission.missionType)) {
        // For this example, we'll assign a default type if missing
        // In a real scenario, you might want to choose the type based on some logic
        const newType = expectedTypes[0]; // Using the first type as default
        
        console.log(`Updating mission ID: ${mission._id}`);
        console.log(`  Name: ${mission.name}`);
        console.log(`  Current type: ${mission.missionType || 'MISSING'}`);
        console.log(`  New type: ${newType}`);
        
        // Update the mission
        mission.missionType = newType;
        await mission.save();
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} missions with correct mission types`);
    
    // 6. Check if all missions now have valid types
    const updatedMissions = await Mission.find({});
    const updatedTypes = [...new Set(updatedMissions.map(m => m.missionType))];
    console.log('Updated mission types in database:', updatedTypes);
    
    // Verify all missions have a valid type
    const stillInvalid = updatedMissions.filter(m => !expectedTypes.includes(m.missionType));
    console.log(`Missions still with invalid types: ${stillInvalid.length}`);
    
    if (stillInvalid.length > 0) {
      console.log('Sample missions with invalid types:');
      stillInvalid.slice(0, 3).forEach(m => {
        console.log(`  ID: ${m._id}, Name: ${m.name}, Type: ${m.missionType}`);
      });
    }
    
    console.log('Migration completed');
  } catch (error) {
    console.error('Error fixing mission types:', error);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
fixMissionTypes(); 