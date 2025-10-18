// Debug script to analyze Firebase database for missing matches
// Run this in the browser console on your app to debug match issues

const debugMatches = async (userId) => {
  console.log('=== MATCH DEBUGGING FOR USER:', userId, '===');
  
  try {
    // 1. Check user document
    console.log('\n1. CHECKING USER DOCUMENT:');
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('❌ User document does not exist!');
      return;
    }
    
    const userData = userDoc.data();
    console.log('✅ User document exists');
    console.log('User data:', {
      name: userData.name,
      likedUsers: userData.likedUsers || [],
      passedUsers: userData.passedUsers || [],
      matches: userData.matches || []
    });
    
    // 2. Check matches array
    console.log('\n2. CHECKING MATCHES ARRAY:');
    const matchIds = userData.matches || [];
    console.log('Match IDs in user document:', matchIds);
    console.log('Number of matches:', matchIds.length);
    
    if (matchIds.length === 0) {
      console.log('⚠️ No matches found in user document');
      return;
    }
    
    // 3. Check each match document
    console.log('\n3. CHECKING MATCH DOCUMENTS:');
    for (const matchId of matchIds) {
      console.log(`\nChecking match: ${matchId}`);
      const matchRef = doc(db, 'matches', matchId);
      const matchDoc = await getDoc(matchRef);
      
      if (!matchDoc.exists()) {
        console.error(`❌ Match document ${matchId} does not exist!`);
        continue;
      }
      
      const matchData = matchDoc.data();
      console.log('✅ Match document exists');
      console.log('Match data:', {
        users: matchData.users,
        createdAt: matchData.createdAt
      });
      
      // Find the other user
      const otherUserId = matchData.users.find(id => id !== userId);
      if (!otherUserId) {
        console.error(`❌ Other user not found in match ${matchId}`);
        continue;
      }
      
      console.log('Other user ID:', otherUserId);
      
      // 4. Check other user's document
      console.log('\n4. CHECKING OTHER USER DOCUMENT:');
      const otherUserRef = doc(db, 'users', otherUserId);
      const otherUserDoc = await getDoc(otherUserRef);
      
      if (!otherUserDoc.exists()) {
        console.error(`❌ Other user document ${otherUserId} does not exist!`);
        continue;
      }
      
      const otherUserData = otherUserDoc.data();
      console.log('✅ Other user document exists');
      console.log('Other user data:', {
        name: otherUserData.name,
        matches: otherUserData.matches || []
      });
      
      // Check if other user has this match in their matches array
      const otherUserMatches = otherUserData.matches || [];
      if (!otherUserMatches.includes(matchId)) {
        console.error(`❌ Match ${matchId} not found in other user's matches array!`);
        console.log('Other user matches:', otherUserMatches);
      } else {
        console.log('✅ Match found in other user\'s matches array');
      }
    }
    
    // 5. Check for orphaned matches
    console.log('\n5. CHECKING FOR ORPHANED MATCHES:');
    const allMatchesRef = collection(db, 'matches');
    const allMatchesSnapshot = await getDocs(allMatchesRef);
    
    console.log('Total matches in database:', allMatchesSnapshot.size);
    
    const orphanedMatches = [];
    allMatchesSnapshot.docs.forEach(doc => {
      const matchData = doc.data();
      if (matchData.users.includes(userId)) {
        if (!matchIds.includes(doc.id)) {
          orphanedMatches.push({
            id: doc.id,
            users: matchData.users,
            createdAt: matchData.createdAt
          });
        }
      }
    });
    
    if (orphanedMatches.length > 0) {
      console.log('⚠️ Found orphaned matches (in database but not in user document):');
      orphanedMatches.forEach(match => {
        console.log('Orphaned match:', match);
      });
    } else {
      console.log('✅ No orphaned matches found');
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
};

// Usage: debugMatches('USER_ID_HERE')
console.log('Debug function loaded. Usage: debugMatches("USER_ID_HERE")');
