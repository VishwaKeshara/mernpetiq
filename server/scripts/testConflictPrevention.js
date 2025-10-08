// Test script to demonstrate appointment conflict prevention
// This script shows how the conflict checking logic works

const testConflictChecking = () => {
    // Utility function to check if two appointment time slots conflict
    const checkTimeConflict = (time1, time2) => {
        const convertToMinutes = (timeStr) => {
            const [hours, minutes] = timeStr.split(":").map(Number);
            return hours * 60 + minutes;
        };

        const start1 = convertToMinutes(time1);
        const end1 = start1 + 60; // 1 hour duration
        const start2 = convertToMinutes(time2);
        const end2 = start2 + 60; // 1 hour duration

        // Check if time slots overlap
        return start1 < end2 && start2 < end1;
    };

    console.log("=== APPOINTMENT CONFLICT PREVENTION TEST ===\n");

    // Test cases
    const testCases = [
        {
            description: "Same exact time",
            time1: "10:00",
            time2: "10:00",
            expectedConflict: true
        },
        {
            description: "30 minutes apart (should conflict)",
            time1: "10:00",
            time2: "10:30",
            expectedConflict: true
        },
        {
            description: "1 hour apart (no conflict)",
            time1: "10:00",
            time2: "11:00",
            expectedConflict: false
        },
        {
            description: "Second appointment starts when first ends",
            time1: "10:00",
            time2: "11:00",
            expectedConflict: false
        },
        {
            description: "Overlapping by 15 minutes",
            time1: "10:00",
            time2: "10:45",
            expectedConflict: true
        },
        {
            description: "Earlier appointment overlaps",
            time1: "10:30",
            time2: "10:00",
            expectedConflict: true
        },
        {
            description: "2 hours apart (no conflict)",
            time1: "09:00",
            time2: "11:00",
            expectedConflict: false
        }
    ];

    let passed = 0;
    let failed = 0;

    testCases.forEach((testCase, index) => {
        const result = checkTimeConflict(testCase.time1, testCase.time2);
        const isCorrect = result === testCase.expectedConflict;
        
        console.log(`Test ${index + 1}: ${testCase.description}`);
        console.log(`  Time 1: ${testCase.time1} (${testCase.time1}-${getEndTime(testCase.time1)})`);
        console.log(`  Time 2: ${testCase.time2} (${testCase.time2}-${getEndTime(testCase.time2)})`);
        console.log(`  Expected conflict: ${testCase.expectedConflict}`);
        console.log(`  Actual result: ${result}`);
        console.log(`  Status: ${isCorrect ? '✅ PASS' : '❌ FAIL'}\n`);
        
        if (isCorrect) {
            passed++;
        } else {
            failed++;
        }
    });

    console.log("=== TEST RESULTS ===");
    console.log(`Total tests: ${testCases.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    
    if (failed === 0) {
        console.log("🎉 All tests passed! Conflict prevention is working correctly.");
    } else {
        console.log("⚠️ Some tests failed. Please review the logic.");
    }

    function getEndTime(startTime) {
        const [hours, minutes] = startTime.split(":").map(Number);
        const endHours = hours + 1;
        return `${endHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    }
};

// Run the test
testConflictChecking();

console.log("\n=== EXAMPLE SCENARIO ===");
console.log("Dr. Tharaka Fernando has the following appointments on 2025-10-08:");
console.log("- 10:00 AM - 11:00 AM: Checkup for Max (Dog)");
console.log("- 02:00 PM - 03:00 PM: Vaccination for Luna (Cat)");
console.log("- 04:30 PM - 05:30 PM: Surgery for Buddy (Dog)");
console.log("\nTrying to book new appointments:");

const existingAppointments = [
    { time: "10:00", description: "Checkup for Max" },
    { time: "14:00", description: "Vaccination for Luna" },
    { time: "16:30", description: "Surgery for Buddy" }
];

const newBookingAttempts = [
    { time: "10:30", description: "Emergency for Charlie" },
    { time: "11:00", description: "Grooming for Bella" },
    { time: "13:00", description: "Blood test for Rocky" },
    { time: "14:30", description: "X-ray for Milo" },
    { time: "16:00", description: "Checkup for Daisy" }
];

newBookingAttempts.forEach(newAppointment => {
    const hasConflict = existingAppointments.some(existing => {
        const convertToMinutes = (timeStr) => {
            const [hours, minutes] = timeStr.split(":").map(Number);
            return hours * 60 + minutes;
        };
        const start1 = convertToMinutes(existing.time);
        const end1 = start1 + 60;
        const start2 = convertToMinutes(newAppointment.time);
        const end2 = start2 + 60;
        return start1 < end2 && start2 < end1;
    });

    console.log(`\n- ${newAppointment.time}: ${newAppointment.description}`);
    console.log(`  Status: ${hasConflict ? '❌ REJECTED - Conflicts with existing appointment' : '✅ ACCEPTED - No conflicts'}`);
});